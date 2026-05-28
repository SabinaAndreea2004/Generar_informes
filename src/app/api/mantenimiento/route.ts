import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildReportSubject } from "@/lib/mailer";
import { generateCorporateEmailHtml } from "@/lib/email-template";
import { getMonthYear } from "@/types";
import type { WPPlugin } from "@/types/mantenimiento";

function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  return url.replace(/\/$/, "");
}

function extractSlug(pluginField: string): string {
  return pluginField.split("/")[0] || pluginField;
}

// ---------------------------------------------------------------------------
// GET  —  Escanea plugins de un WordPress vía su REST API autenticada
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wpUrl = searchParams.get("wpUrl");
    const wpUsername = searchParams.get("wpUsername");
    const wpAppPassword = searchParams.get("wpAppPassword");

    if (!wpUrl) {
      return NextResponse.json(
        { success: false, error: "Se requiere la URL del WordPress" },
        { status: 400 },
      );
    }
    if (!wpUsername || !wpAppPassword) {
      return NextResponse.json(
        { success: false, error: "Se requieren las credenciales de WordPress (Application Password)" },
        { status: 400 },
      );
    }

    const cleanUrl = normalizeUrl(wpUrl);
    const auth = `Basic ${Buffer.from(`${wpUsername}:${wpAppPassword}`).toString("base64")}`;

    let response: Response;
    try {
      response = await fetch(`${cleanUrl}/wp-json/wp/v2/plugins?context=edit&per_page=100`, {
        method: "GET",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
      });
    } catch (fetchError) {
      const err = fetchError as Error;
      if (err.name === "AbortError") {
        return NextResponse.json(
          { success: false, error: "Tiempo de espera agotado", errorType: "timeout" },
          { status: 504 },
        );
      }
      return NextResponse.json(
        { success: false, error: "No se pudo conectar con el servidor", errorType: "connection" },
        { status: 502 },
      );
    }

    if (!response.ok) {
      const statusMap: Record<number, { error: string; errorType: string }> = {
        401: { error: "Credenciales inválidas. Verifica el usuario y Application Password.", errorType: "auth" },
        403: { error: "Permisos insuficientes en WordPress.", errorType: "auth" },
        404: { error: "API REST de WordPress no encontrada. Verifica la URL.", errorType: "not_wordpress" },
      };
      const mapped = statusMap[response.status];
      if (mapped) {
        return NextResponse.json({ success: false, ...mapped }, { status: response.status });
      }
      let msg = `Error del servidor WordPress: ${response.status}`;
      try {
        const body = await response.json();
        if (body.message) msg = body.message;
      } catch {}
      return NextResponse.json({ success: false, error: msg, errorType: "unknown" }, { status: response.status });
    }

    let rawData: Array<Record<string, unknown>>;
    try {
      rawData = await response.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Respuesta inválida del servidor WordPress", errorType: "parse" },
        { status: 500 },
      );
    }

    const plugins: WPPlugin[] = (rawData as Array<{
      plugin: string;
      name: string;
      version: string;
      status: "active" | "inactive";
      update?: { new_version: string; slug: string };
    }>)
      .sort((a, b) => {
        if (a.status === "active" && b.status !== "active") return -1;
        if (a.status !== "active" && b.status === "active") return 1;
        return a.name.localeCompare(b.name);
      })
      .map((p) => ({
        name: p.name,
        slug: extractSlug(p.plugin),
        status: p.status,
        version_actual: p.version,
        version_nueva: p.update?.new_version || null,
        requiere_actualizacion: !!p.update,
      }));

    return NextResponse.json({ success: true, plugins });
  } catch (error) {
    console.error("GET /api/mantenimiento error:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST  —  Guarda el mantenimiento mensual y envía el informe por email
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, month, year, wpVersion, plugins, notes } = body as {
      clientId: number;
      month: number;
      year: number;
      wpVersion?: string;
      plugins?: WPPlugin[];
      notes?: string;
    };

    if (!clientId || month === undefined || year === undefined) {
      return NextResponse.json(
        { success: false, error: "clientId, month y year son requeridos" },
        { status: 400 },
      );
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ success: false, error: "Cliente no encontrado" }, { status: 404 });
    }

    // Guardar / actualizar el registro mensual
    const pluginsJson = JSON.stringify(plugins || []);
    const now = new Date();

    const existing = await prisma.monthlyMaintenance.findUnique({
      where: { clientId_year_month: { clientId, year, month } },
    });

    let record;
    if (existing) {
      record = await prisma.monthlyMaintenance.update({
        where: { id: existing.id },
        data: {
          wpVersion: wpVersion ?? existing.wpVersion,
          plugins: pluginsJson,
          notes: notes !== undefined ? notes : existing.notes,
          closed: true,
          closedAt: now,
        },
      });
    } else {
      record = await prisma.monthlyMaintenance.create({
        data: {
          clientId,
          year,
          month,
          wpVersion: wpVersion || "",
          plugins: pluginsJson,
          notes: notes || "",
          closed: true,
          closedAt: now,
        },
      });
    }

    // Generar y enviar el email
    const monthYear = getMonthYear(month, year);
    const pluginList: WPPlugin[] = plugins || [];
    const updatedPlugins = pluginList.filter((p) => p.isUpdatedThisMonth && p.status === "active");
    const reviewedPlugins = pluginList.filter((p) => !p.isUpdatedThisMonth && p.status === "active");
    const inactivePlugins = pluginList.filter((p) => p.status === "inactive");

    const html = generateCorporateEmailHtml({
      clientName: client.nombre,
      clientUrl: client.url,
      monthYear,
      updatedPlugins,
      reviewedPlugins,
      inactivePlugins,
      totalActive: pluginList.filter((p) => p.status === "active").length,
      wpVersion: wpVersion || undefined,
      notes,
    });

    const emailResult = await sendEmail({
      to: client.correo,
      subject: buildReportSubject(client.nombre, monthYear),
      html,
    });

    return NextResponse.json({
      success: true,
      record,
      emailSent: emailResult.success,
      emailError: emailResult.error,
    });
  } catch (error) {
    console.error("POST /api/mantenimiento error:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

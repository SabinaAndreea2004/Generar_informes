import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = parseInt(clientId);
    if (year) where.year = parseInt(year);
    if (month !== null && month !== undefined && month !== "") where.month = parseInt(month);

    const records = await prisma.monthlyMaintenance.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Error fetching monthly:", error);
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, year, month, wpVersion, plugins, notes, closed } = body;

    if (!clientId || year === undefined || month === undefined) {
      return NextResponse.json({ error: "clientId, year y month son requeridos" }, { status: 400 });
    }

    const existing = await prisma.monthlyMaintenance.findUnique({
      where: { clientId_year_month: { clientId, year, month } },
    });

    let record;
    if (existing) {
      record = await prisma.monthlyMaintenance.update({
        where: { id: existing.id },
        data: {
          wpVersion: wpVersion ?? existing.wpVersion,
          plugins: plugins ? JSON.stringify(plugins) : existing.plugins,
          notes: notes !== undefined ? notes : existing.notes,
          closed: closed !== undefined ? closed : existing.closed,
          closedAt: closed ? (closed ? new Date() : null) : undefined,
        },
      });
    } else {
      record = await prisma.monthlyMaintenance.create({
        data: {
          clientId,
          year,
          month,
          wpVersion: wpVersion || "",
          plugins: JSON.stringify(plugins || []),
          notes: notes || "",
          closed: closed || false,
          closedAt: closed ? new Date() : null,
        },
      });
    }

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Error saving monthly:", error);
    return NextResponse.json({ error: "Error al guardar datos" }, { status: 500 });
  }
}

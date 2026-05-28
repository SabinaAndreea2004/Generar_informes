import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const search = searchParams.get("search") || "";
    const activo = searchParams.get("activo");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { nombre: { contains: search } },
        { correo: { contains: search } },
        { url: { contains: search } },
      ];
    }
    if (activo === "true") where.activo = true;
    else if (activo === "false") where.activo = false;

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({
      clients,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, correo, dni, url } = body;

    if (!nombre?.trim() || !url?.trim()) {
      return NextResponse.json({ error: "Nombre y URL son requeridos" }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        nombre: nombre.trim(),
        correo: (correo || "").trim(),
        dni: (dni || "").trim(),
        url: url.startsWith("http") ? url.trim() : `https://${url.trim()}`,
      },
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      const field = error.meta?.target?.[0] || "campo";
      return NextResponse.json({ error: `Ya existe un cliente con ese ${field}` }, { status: 409 });
    }
    console.error("Error creating client:", error);
    return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 });
  }
}

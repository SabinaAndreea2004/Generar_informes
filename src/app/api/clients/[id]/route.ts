import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: { id: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const client = await prisma.client.findUnique({
      where: { id },
      include: { monthlyMaintenance: { orderBy: [{ year: "desc" }, { month: "desc" }] } },
    });

    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json({ error: "Error al obtener cliente" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const body = await request.json();
    const { nombre, correo, dni, url, activo } = body;

    const data: Record<string, unknown> = {};
    if (nombre?.trim()) data.nombre = nombre.trim();
    if (correo !== undefined) data.correo = correo.trim();
    if (dni !== undefined) data.dni = dni.trim();
    if (url !== undefined) data.url = url.startsWith("http") ? url.trim() : `https://${url.trim()}`;
    if (activo !== undefined) data.activo = activo;

    const client = await prisma.client.update({
      where: { id },
      data,
    });

    return NextResponse.json({ client });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un cliente con ese valor" }, { status: 409 });
    }
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }
    console.error("Error updating client:", error);
    return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    await prisma.client.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }
    console.error("Error deleting client:", error);
    return NextResponse.json({ error: "Error al eliminar cliente" }, { status: 500 });
  }
}

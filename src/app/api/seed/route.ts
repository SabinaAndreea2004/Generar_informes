import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_CLIENTS = [
  { nombre: "Agencia Creativa Digital", correo: "contacto@agenciacreativa.com", dni: "B12345678", url: "https://agenciacreativa.com" },
  { nombre: "Tienda Online Fashion", correo: "info@fashionstore.es", dni: "A98765432", url: "https://fashionstore.es" },
  { nombre: "Restaurante El Gourmet", correo: "reservas@gourmet.com", dni: "C45678912", url: "https://restaurantegourmet.com", activo: false },
];

export async function POST() {
  try {
    const count = await prisma.client.count();

    if (count > 0) {
      return NextResponse.json({ message: "Ya existen clientes en la base de datos", count });
    }

    for (const client of DEFAULT_CLIENTS) {
      await prisma.client.create({ data: client });
    }

    return NextResponse.json({ message: "Clientes de ejemplo creados", count: DEFAULT_CLIENTS.length });
  } catch (error) {
    console.error("Error seeding data:", error);
    return NextResponse.json({ error: "Error al sembrar datos" }, { status: 500 });
  }
}

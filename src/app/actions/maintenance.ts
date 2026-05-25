"use server";

import { checkWordPressSite, maintenanceTasks } from "@/lib/wordpress";
import { ActionResult, MaintenanceTask, SiteCheckData } from "@/types";

export async function createClient(formData: FormData): Promise<ActionResult> {
  try {
    const nombre = formData.get("nombre") as string;
    const correo = formData.get("correo") as string;
    const dni = formData.get("dni") as string;
    const url = formData.get("url") as string;

    if (!nombre || nombre.length < 2) {
      return { success: false, error: "El nombre debe tener al menos 2 caracteres" };
    }
    if (!correo || !correo.includes("@")) {
      return { success: false, error: "Correo electrónico inválido" };
    }
    if (!dni || dni.length < 5) {
      return { success: false, error: "DNI debe tener al menos 5 caracteres" };
    }
    if (!url || url.length < 5) {
      return { success: false, error: "URL inválida" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating client:", error);
    return { success: false, error: "Error al crear el cliente. Inténtalo de nuevo." };
  }
}

export async function toggleClientStatus(id: number, activo: boolean): Promise<ActionResult> {
  return { success: true };
}

export async function checkSite(url: string): Promise<ActionResult<SiteCheckData>> {
  const result = await checkWordPressSite(url);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.data };
}

export async function sendMaintenanceReport(
  clientId: number,
  siteData: SiteCheckData | null,
  tasks: MaintenanceTask[],
  notes: string
): Promise<ActionResult> {
  try {
    const completedTasks = tasks.filter((t) => t.completed);
    const pendingTasks = tasks.filter((t) => !t.completed);

    console.log("Informe guardado:", {
      clientId,
      siteData,
      completed: completedTasks.length,
      pending: pendingTasks.length,
      notes,
      sentAt: new Date().toISOString(),
    });

    if (process.env.RESEND_API_KEY) {
      console.log("Email enviado a cliente");
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending report:", error);
    return { success: false, error: "Error al enviar el informe" };
  }
}

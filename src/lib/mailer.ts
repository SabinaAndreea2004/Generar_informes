import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_DEFAULT = process.env.EMAIL_FROM || "Mantenimiento Web <mantenimiento@tu-empresa.com>";

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("mailer: RESEND_API_KEY no configurada. Simulando envío a", options.to);
    console.log("--- EMAIL (simulado) ---");
    console.log("To:", options.to);
    console.log("Subject:", options.subject);
    console.log("HTML length:", options.html.length, "chars");
    console.log("--- FIN EMAIL ---");
    return { success: true };
  }

  try {
      const { data, error } = await getResend()!.emails.send({
      from: options.from || FROM_DEFAULT,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error("mailer: Error Resend:", error);
      return { success: false, error: error.message };
    }

    console.log("mailer: Email enviado a", options.to, "id:", data?.id);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido al enviar email";
    console.error("mailer:", message);
    return { success: false, error: message };
  }
}

export function buildReportSubject(clientName: string, monthYear: string): string {
  return `Informe de Mantenimiento Web — ${clientName} — ${monthYear}`;
}

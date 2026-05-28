import type { WPPlugin } from "@/types/mantenimiento";
import type { Client, MaintenancePlugin } from "@/types";

interface TemplateOptions {
  clientName: string;
  clientUrl: string;
  monthYear: string;
  updatedPlugins: WPPlugin[];
  reviewedPlugins: WPPlugin[];
  inactivePlugins: WPPlugin[];
  totalActive: number;
  wpVersion?: string;
  notes?: string;
}

function pluginRow(icon: string, name: string, version: string, statusText: string): string {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b">
        <span style="margin-right:8px">${icon}</span>
        <strong>${name}</strong>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;text-align:right">
        v${version}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:12px;text-align:right">
        <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-weight:600;${statusText}">
          ${statusText.includes('green') ? 'Protegido' : 'Supervisado'}
        </span>
      </td>
    </tr>`;
}

export function generateCorporateEmailHtml(options: TemplateOptions): string {
  const { clientName, clientUrl, monthYear, updatedPlugins, reviewedPlugins, inactivePlugins, totalActive, wpVersion, notes } = options;

  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const updatedRows = updatedPlugins
    .map((p) => pluginRow("✅", p.name, p.version_actual, "background:#dcfce7;color:#166534"))
    .join("");

  const reviewedRows = reviewedPlugins
    .map((p) => pluginRow("🔒", p.name, p.version_actual, "background:#f1f5f9;color:#475569"))
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Informe de Mantenimiento - ${monthYear}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:40px 32px;text-align:center">
              <div style="width:56px;height:56px;background:rgba(255,255,255,.1);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:26px">🛡️</div>
              <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0;letter-spacing:-.3px">Informe de Mantenimiento Web</h1>
              <p style="color:#94a3b8;font-size:13px;margin:6px 0 0">${clientName} — ${monthYear}</p>
              <div style="display:inline-block;background:rgba(255,255,255,.08);color:#cbd5e1;font-size:11px;font-weight:600;padding:4px 14px;border-radius:20px;margin-top:12px;letter-spacing:.5px">${today}</div>
            </td>
          </tr>

          <!-- GREETING -->
          <tr>
            <td style="padding:32px 32px 8px">
              <p style="font-size:15px;color:#1e293b;margin:0;line-height:1.6">
                Hola <strong style="color:#0f172a">${clientName}</strong>,
              </p>
              <p style="font-size:14px;color:#475569;margin:8px 0 0;line-height:1.6">
                Durante el período de <strong>${monthYear}</strong> hemos realizado las tareas de mantenimiento y actualización de su sitio web. A continuación le mostramos el detalle de los componentes gestionados.
              </p>
            </td>
          </tr>

          <!-- UPDATED PLUGINS -->
          <tr>
            <td style="padding:24px 32px 8px">
              <h2 style="font-size:15px;font-weight:700;color:#0f172a;margin:0;display:flex;align-items:center;gap:8px">
                <span style="font-size:18px">✅</span>
                Componentes Actualizados y Protegidos este mes
              </h2>
              <p style="font-size:13px;color:#64748b;margin:4px 0 0;line-height:1.5">
                Estos plugins han sido verificados y actualizados a su última versión estable durante este período.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px">
              ${updatedRows || '<p style="font-size:13px;color:#94a3b8;padding:12px 0;text-align:center">No se realizaron actualizaciones este mes.</p>'}
            </td>
          </tr>

          <!-- REVIEWED PLUGINS -->
          <tr>
            <td style="padding:24px 32px 8px">
              <h2 style="font-size:15px;font-weight:700;color:#0f172a;margin:0;display:flex;align-items:center;gap:8px">
                <span style="font-size:18px">🔒</span>
                Componentes Supervisados y Estables
              </h2>
              <p style="font-size:13px;color:#64748b;margin:4px 0 0;line-height:1.5">
                Estos plugins ya se encontraban en su versión más reciente y han sido supervisados sin necesidad de intervención.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px">
              ${reviewedRows || '<p style="font-size:13px;color:#94a3b8;padding:12px 0;text-align:center">No hay plugins supervisados este mes.</p>'}
            </td>
          </tr>

          ${inactivePlugins.length > 0 ? `
          <tr>
            <td style="padding:24px 32px 8px">
              <h2 style="font-size:15px;font-weight:700;color:#0f172a;margin:0;display:flex;align-items:center;gap:8px">
                <span style="font-size:18px">⏸️</span>
                Componentes Inactivos
              </h2>
              <p style="font-size:13px;color:#64748b;margin:4px 0 0;line-height:1.5">
                Estos plugins están instalados pero actualmente desactivados en su sitio.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${inactivePlugins.map((p) => `
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#94a3b8">⏸️ ${p.name} <span style="color:#cbd5e1">v${p.version_actual}</span></td>
                  </tr>`).join("")}
              </table>
            </td>
          </tr>` : ""}

          <!-- SUMMARY -->
          <tr>
            <td style="padding:24px 32px">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0">
                <tr>
                  <td style="padding:20px;text-align:center">
                    <div style="display:inline-block;padding:0 16px">
                      <p style="font-size:24px;font-weight:700;color:#0f172a;margin:0">${totalActive}</p>
                      <p style="font-size:11px;color:#64748b;margin:2px 0 0;text-transform:uppercase;letter-spacing:.5px">Plugins Activos</p>
                    </div>
                    <div style="display:inline-block;padding:0 16px;border-left:1px solid #e2e8f0">
                      <p style="font-size:24px;font-weight:700;color:#059669;margin:0">${updatedPlugins.length}</p>
                      <p style="font-size:11px;color:#64748b;margin:2px 0 0;text-transform:uppercase;letter-spacing:.5px">Actualizados</p>
                    </div>
                    <div style="display:inline-block;padding:0 16px;border-left:1px solid #e2e8f0">
                      <p style="font-size:24px;font-weight:700;color:#475569;margin:0">${reviewedPlugins.length}</p>
                      <p style="font-size:11px;color:#64748b;margin:2px 0 0;text-transform:uppercase;letter-spacing:.5px">Supervisados</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${wpVersion ? `
          <tr>
            <td style="padding:0 32px 24px;text-align:center">
              <span style="font-size:12px;color:#94a3b8">WordPress ${wpVersion}</span>
            </td>
          </tr>` : ""}

          ${notes ? `
          <tr>
            <td style="padding:0 32px 24px">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border-radius:8px;border:1px solid #fde68a">
                <tr>
                  <td style="padding:14px 18px">
                    <p style="font-size:12px;font-weight:600;color:#92400e;margin:0 0 4px">📋 Notas del técnico</p>
                    <p style="font-size:13px;color:#78350f;margin:0;line-height:1.5;white-space:pre-wrap">${notes}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ""}

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 32px;text-align:center">
              <p style="font-size:12px;color:#94a3b8;margin:0 0 4px">© ${new Date().getFullYear()} Agencia de Mantenimiento Web</p>
              <p style="font-size:12px;color:#94a3b8;margin:0">
                <a href="${clientUrl}" style="color:#3b82f6;text-decoration:none">${clientUrl}</a>
              </p>
              <p style="font-size:11px;color:#cbd5e1;margin:8px 0 0">
                Este informe es generado automáticamente. Si tiene alguna pregunta, no dude en contactarnos.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

// ---------------------------------------------------------------------------
// Legacy wrapper — mantiene compatibilidad con ReportPreviewModal
// ---------------------------------------------------------------------------
export function generateProfessionalEmailHtml(
  client: Client,
  monthYear: string,
  plugins: MaintenancePlugin[],
  wpVersion: string,
  notes: string,
): string {
  const mapped: WPPlugin[] = plugins.map((p) => ({
    name: p.name,
    slug: p.id,
    status: p.status,
    version_actual: p.version,
    version_nueva: p.newVersion || null,
    requiere_actualizacion: p.hasUpdate,
    isUpdatedThisMonth: p.isUpdatedThisMonth,
  }));

  const updatedPlugins = mapped.filter((p) => p.isUpdatedThisMonth && p.status === "active");
  const reviewedPlugins = mapped.filter((p) => (!p.isUpdatedThisMonth && p.status === "active") || (p.status === "inactive" && p.isUpdatedThisMonth));
  const inactivePlugins = mapped.filter((p) => p.status === "inactive" && !p.isUpdatedThisMonth);

  return generateCorporateEmailHtml({
    clientName: client.nombre,
    clientUrl: client.url,
    monthYear,
    updatedPlugins,
    reviewedPlugins,
    inactivePlugins,
    totalActive: mapped.filter((p) => p.status === "active").length,
    wpVersion: wpVersion || undefined,
    notes: notes || undefined,
  });
}

import { MaintenancePlugin } from "@/types";

export function generateMarketingEmailHtml(options: {
  clientName: string;
  clientUrl: string;
  clientEmail: string;
  monthYear: string;
  updatedPlugins: MaintenancePlugin[];
  reviewedPlugins: MaintenancePlugin[];
  inactivePlugins: MaintenancePlugin[];
  totalActive: number;
  wpVersion?: string;
  notes?: string;
}): string {
  const {
    clientName,
    clientUrl,
    monthYear,
    updatedPlugins,
    reviewedPlugins,
    inactivePlugins,
    totalActive,
    wpVersion,
    notes,
  } = options;

  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Informe de Mantenimiento - ${monthYear}</title>
<style>
  body{margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
  .wrapper{background:#f1f5f9;padding:40px 20px}
  .container{max-width:600px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px -15px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:36px 40px;text-align:center}
  .header h1{color:#fff;font-size:20px;font-weight:700;margin:0;letter-spacing:-.3px}
  .header p{color:#94a3b8;font-size:13px;margin:6px 0 0}
  .badge{display:inline-block;background:rgba(255,255,255,.1);color:#cbd5e1;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;margin-top:12px;letter-spacing:.5px;text-transform:uppercase}
  .section{padding:28px 40px}
  .section:last-of-type{padding-bottom:36px}
  .section-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#64748b;margin:0 0 16px;display:flex;align-items:center;gap:8px}
  .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
  .stat{border:1px solid #e2e8f0;border-radius:14px;padding:20px 12px;text-align:center}
  .stat-icon{font-size:24px;margin-bottom:6px}
  .stat-value{font-size:22px;font-weight:800;line-height:1.2}
  .stat-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.4px;color:#64748b;margin-top:4px}
  .stat-green{border-color:#bbf7d0;background:#f0fdf4}
  .stat-green .stat-value{color:#16a34a}
  .stat-blue{border-color:#bfdbfe;background:#eff6ff}
  .stat-blue .stat-value{color:#2563eb}
  .stat-amber{border-color:#fde68a;background:#fffbeb}
  .stat-amber .stat-value{color:#d97706}
  .checklist{padding:0;list-style:none;margin:0}
  .checklist li{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;line-height:1.5}
  .checklist li:last-child{border-bottom:none}
  .check{width:18px;height:18px;min-width:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;margin-top:1px}
  .check-green{background:#dcfce7;color:#16a34a}
  .check-blue{background:#dbeafe;color:#2563eb}
  .check-slate{background:#f1f5f9;color:#64748b}
  .tag-group{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
  .tag{background:#f1f5f9;color:#64748b;font-size:12px;padding:3px 10px;border-radius:12px}
  .notes-box{background:#f8fafc;border-left:3px solid #3b82f6;border-radius:0 10px 10px 0;padding:16px 20px;margin-top:8px}
  .notes-box p{font-size:14px;color:#334155;line-height:1.6;margin:0;white-space:pre-wrap}
  .footer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:28px 40px 36px;text-align:center}
  .footer p{font-size:12px;color:#64748b;margin:0 0 4px;line-height:1.5}
  hr{border:none;border-top:1px solid #e2e8f0;margin:24px 0}
  @media(max-width:600px){
    .container{border-radius:0}
    .section{padding:24px 20px}
    .header{padding:28px 20px}
    .stats{grid-template-columns:repeat(3,1fr);gap:8px}
    .stat{padding:16px 8px}
    .footer{padding:24px 20px}
  }
</style>
</head>
<body>
<div class="wrapper">
<div class="container">

  <!-- HEADER -->
  <div class="header">
    <div class="badge">Informe Mensual</div>
    <h1>Informe de Mantenimiento Web</h1>
    <p>${monthYear} &middot; ${clientName}</p>
  </div>

  <!-- CLIENT INFO -->
  <div class="section" style="padding-bottom:0">
    <p style="font-size:13px;color:#64748b;margin:0">
      Hola <strong style="color:#1e293b">${clientName}</strong>,
    </p>
    <p style="font-size:13px;color:#64748b;line-height:1.6;margin:8px 0 0">
      Te presentamos el informe correspondiente a <strong>${monthYear}</strong>.
      Hemos revisado y optimizado tu sitio web para garantizar su correcto funcionamiento, seguridad y rendimiento.
    </p>
  </div>

  <!-- BLOCK 1: STATUS CARDS -->
  <div class="section">
    <div class="section-title">Estado General de tu Sitio</div>
    <div class="stats">
      <div class="stat stat-green">
        <div class="stat-icon">🛡️</div>
        <div class="stat-value">Seguro</div>
        <div class="stat-label">Estado del Sitio</div>
      </div>
      <div class="stat stat-blue">
        <div class="stat-icon">💾</div>
        <div class="stat-value">Realizados</div>
        <div class="stat-label">Backups</div>
      </div>
      <div class="stat stat-amber">
        <div class="stat-icon">⚡</div>
        <div class="stat-value">Completada</div>
        <div class="stat-label">Optimización</div>
      </div>
    </div>
    ${wpVersion ? `<p style="font-size:12px;color:#94a3b8;text-align:center;margin:12px 0 0">WordPress v${wpVersion}</p>` : ""}
  </div>

  <!-- BLOCK 2: UPDATED PLUGINS -->
  <div class="section" style="padding-top:0">
    <div class="section-title">✅ Plugins Actualizados y Protegidos</div>
    ${updatedPlugins.length > 0 ? `
    <p style="font-size:13px;color:#64748b;margin:0 0 12px">Los siguientes plugins han sido actualizados a su última versión estable este mes:</p>
    <ul class="checklist">
      ${updatedPlugins.map((p) => `
      <li>
        <span class="check check-green">✓</span>
        <span><strong>${p.name}</strong> v${p.version}${p.newVersion ? ` → v${p.newVersion}` : ""}</span>
      </li>`).join("")}
    </ul>
    ` : `
    <p style="font-size:13px;color:#94a3b8;font-style:italic;margin:0">No se requirieron actualizaciones este mes.</p>
    `}
  </div>

  <!-- BLOCK 3: REVIEWED PLUGINS -->
  <div class="section" style="padding-top:0">
    <div class="section-title">🔍 Componentes Supervisados y Estables</div>
    ${reviewedPlugins.length > 0 ? `
    <p style="font-size:13px;color:#64748b;margin:0 0 12px">Estos componentes fueron revisados y se encuentran en su versión correcta, sin necesidad de intervención:</p>
    <ul class="checklist">
      ${reviewedPlugins.map((p) => `
      <li>
        <span class="check check-blue">✓</span>
        <span><strong>${p.name}</strong> v${p.version} — Al día</span>
      </li>`).join("")}
    </ul>
    ` : ""}
    ${inactivePlugins.length > 0 ? `
    <div class="tag-group" style="margin-top:16px">
      <span style="font-size:11px;color:#94a3b8;margin-right:4px">Inactivos:</span>
      ${inactivePlugins.map((p) => `<span class="tag">${p.name}</span>`).join("")}
    </div>` : ""}
  </div>

  <!-- NOTES -->
  ${notes ? `
  <div class="section" style="padding-top:0">
    <div class="section-title">📋 Notas del Técnico</div>
    <div class="notes-box"><p>${notes.replace(/\n/g, "<br>")}</p></div>
  </div>` : ""}

  <!-- DIVIDER -->
  <div class="section" style="padding:0 40px">
    <hr>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <p style="font-weight:700;color:#1e293b;font-size:14px">Agencia de Marketing Digital</p>
    <p>Informe generado el ${today}</p>
    <p style="color:#94a3b8">Este informe es confidencial y ha sido preparado especialmente para ${clientName}.</p>
    <p style="color:#94a3b8;font-size:11px;margin-top:12px">© ${new Date().getFullYear()} — Servicios de Mantenimiento Web Profesional</p>
  </div>

</div>
</div>
</body>
</html>`;
}

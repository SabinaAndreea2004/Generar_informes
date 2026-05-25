import { Client, MaintenancePlugin } from "@/types";

export function generateProfessionalEmailHtml(
  client: Client,
  monthYear: string,
  plugins: MaintenancePlugin[],
  wpVersion: string,
  notes?: string
): string {
  const updatedPlugins = plugins.filter((p) => p.isUpdatedThisMonth && p.status === 'active');
  const reviewedPlugins = plugins.filter((p) => !p.isUpdatedThisMonth && p.status === 'active');
  const inactivePlugins = plugins.filter((p) => p.status === 'inactive');
  const totalActive = plugins.filter((p) => p.status === 'active').length;
  const withUpdates = plugins.filter((p) => p.hasUpdate && p.status === 'active').length;
  const withoutUpdates = totalActive - withUpdates;
  const updatedCount = updatedPlugins.length;
  const pendingAfter = withUpdates - updatedCount;

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Informe de Mantenimiento - ${monthYear}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .two-col { grid-template-columns: 1fr !important; }
      .header-content { padding: 30px 20px !important; }
      .section { padding: 25px 20px !important; }
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; }
    a { text-decoration: none; }
    
    .email-wrapper {
      background-color: #f1f5f9;
      padding: 40px 20px;
    }
    
    .email-container {
      max-width: 650px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      padding: 40px;
      text-align: center;
      position: relative;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      opacity: 0.5;
    }
    
    .header-content {
      position: relative;
      z-index: 1;
    }
    
    .logo {
      width: 56px;
      height: 56px;
      margin: 0 auto 16px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .logo-icon {
      width: 28px;
      height: 28px;
      color: #ffffff;
    }
    
    .header-title {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 6px;
      letter-spacing: -0.3px;
    }
    
    .header-subtitle {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.85);
      margin: 0;
      font-weight: 500;
    }
    
    .section {
      padding: 32px 40px;
    }
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 0 20px;
    }
    
    .section-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .badge-green {
      background: #dcfce7;
      color: #166534;
    }
    
    .badge-blue {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .badge-yellow {
      background: #fef3c7;
      color: #92400e;
    }
    
    .badge-gray {
      background: #f1f5f9;
      color: #475569;
    }
    
    .client-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      border: 1px solid #e2e8f0;
    }
    
    .two-col {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .info-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
    }
    
    .info-value {
      font-size: 14px;
      font-weight: 500;
      color: #1e293b;
    }
    
    .info-value a {
      color: #2563eb;
      text-decoration: none;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    
    .stat-card {
      text-align: center;
      padding: 20px 12px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    
    .stat-number {
      font-size: 28px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 6px;
    }
    
    .stat-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
    }
    
    .stat-total { background: #f8fafc; }
    .stat-total .stat-number { color: #1e293b; }
    
    .stat-updated { background: #f0fdf4; border-color: #bbf7d0; }
    .stat-updated .stat-number { color: #16a34a; }
    
    .stat-ok { background: #eff6ff; border-color: #bfdbfe; }
    .stat-ok .stat-number { color: #2563eb; }
    
    .stat-warning { background: #fffbeb; border-color: #fde68a; }
    .stat-warning .stat-number { color: #d97706; }
    
    .plugin-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 14px;
    }
    
    .plugin-table thead th {
      background: #f1f5f9;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .plugin-table thead th:first-child {
      border-radius: 8px 0 0 0;
    }
    
    .plugin-table thead th:last-child {
      border-radius: 0 8px 0 0;
    }
    
    .plugin-table tbody td {
      padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    
    .plugin-table tbody tr:hover td {
      background: #f8fafc;
    }
    
    .plugin-table tbody tr:last-child td:first-child {
      border-radius: 0 0 0 8px;
    }
    
    .plugin-table tbody tr:last-child td:last-child {
      border-radius: 0 0 8px 0;
    }
    
    .plugin-name {
      font-weight: 600;
      color: #1e293b;
    }
    
    .plugin-author {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    
    .plugin-version {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 13px;
      color: #475569;
    }
    
    .version-update {
      display: block;
      font-size: 11px;
      color: #d97706;
      font-weight: 600;
      margin-top: 2px;
    }
    
    .plugin-status {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 11px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .status-active {
      background: #dcfce7;
      color: #166534;
    }
    
    .status-updated {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }
    
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    
    .dot-green { background: #22c55e; }
    .dot-blue { background: #3b82f6; }
    .dot-yellow { background: #f59e0b; }
    
    .notes-section {
      background: #f0f9ff;
      border-left: 3px solid #3b82f6;
      border-radius: 0 10px 10px 0;
      padding: 20px 24px;
      margin-top: 8px;
    }
    
    .notes-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e40af;
      margin: 0 0 8px;
    }
    
    .notes-text {
      font-size: 14px;
      color: #1e293b;
      line-height: 1.7;
      margin: 0;
      white-space: pre-wrap;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e2e8f0, transparent);
      margin: 8px 0;
    }
    
    .footer {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 28px 40px 36px;
      text-align: center;
      border-radius: 0 0 16px 16px;
    }
    
    .footer-brand {
      font-size: 13px;
      font-weight: 700;
      color: #1e40af;
      margin: 0 0 6px;
      letter-spacing: 0.3px;
    }
    
    .footer-text {
      font-size: 12px;
      color: #64748b;
      margin: 0 0 4px;
      line-height: 1.5;
    }
    
    .footer-small {
      font-size: 11px;
      color: #94a3b8;
      margin: 12px 0 0;
    }
    
    .inactive-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    
    .inactive-tag {
      background: #f1f5f9;
      color: #64748b;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .empty-state {
      text-align: center;
      padding: 24px;
      color: #94a3b8;
      font-size: 13px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div class="logo">
            <svg class="logo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
            </svg>
          </div>
          <h1 class="header-title">Informe de Mantenimiento Web</h1>
          <p class="header-subtitle">${monthYear}</p>
        </div>
      </div>
      
      <!-- Info del Cliente -->
      <div class="section">
        <div class="section-title">
          <span class="section-badge badge-blue">
            <span class="status-dot dot-blue"></span>
            Información del Cliente
          </span>
        </div>
        
        <div class="client-card">
          <div class="two-col">
            <div class="info-item">
              <span class="info-label">Cliente</span>
              <span class="info-value">${client.nombre}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Sitio Web</span>
              <span class="info-value"><a href="${client.url}" target="_blank">${client.url}</a></span>
            </div>
            <div class="info-item">
              <span class="info-label">Versión WordPress</span>
              <span class="info-value">${wpVersion}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email de Contacto</span>
              <span class="info-value">${client.correo || 'No especificado'}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Estadísticas -->
      <div class="section" style="padding-top: 0;">
        <div class="section-title">
          <span class="section-badge badge-green">
            <span class="status-dot dot-green"></span>
            Resumen del Mantenimiento
          </span>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card stat-total">
            <div class="stat-number">${totalActive}</div>
            <div class="stat-label">Plugins Activos</div>
          </div>
          <div class="stat-card stat-updated">
            <div class="stat-number">${updatedCount}</div>
            <div class="stat-label">Actualizados</div>
          </div>
          <div class="stat-card stat-ok">
            <div class="stat-number">${withoutUpdates}</div>
            <div class="stat-label">Al Día</div>
          </div>
          <div class="stat-card stat-warning">
            <div class="stat-number">${pendingAfter}</div>
            <div class="stat-label">Pendientes</div>
          </div>
        </div>
      </div>
      
      <!-- Plugins Actualizados -->
      ${updatedPlugins.length > 0 ? `
      <div class="section" style="padding-top: 0;">
        <div class="section-title">
          <span class="section-badge badge-green">
            <span class="status-dot dot-green"></span>
            Plugins Actualizados Este Mes
          </span>
        </div>
        
        <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <table class="plugin-table">
            <thead>
              <tr>
                <th style="width: 50%;">Plugin</th>
                <th style="width: 20%; text-align: center;">Versión</th>
                <th style="width: 30%; text-align: center;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${updatedPlugins.map((p) => `
              <tr>
                <td>
                  <div class="plugin-name">${p.name}</div>
                  ${p.author ? `<div class="plugin-author">${p.author}</div>` : ''}
                </td>
                <td style="text-align: center;">
                  <span class="plugin-version">v${p.version}</span>
                  ${p.newVersion ? `<span class="version-update">→ v${p.newVersion}</span>` : ''}
                </td>
                <td style="text-align: center;">
                  <span class="plugin-status status-updated">
                    <span class="status-dot dot-blue"></span>
                    ✓ Actualizado
                  </span>
                </td>
              </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}
      
      <!-- Plugins Revisados -->
      ${reviewedPlugins.length > 0 ? `
      <div class="section" style="padding-top: 0;">
        <div class="section-title">
          <span class="section-badge ${reviewedPlugins.some(p => p.hasUpdate) ? 'badge-yellow' : 'badge-blue'}">
            <span class="status-dot ${reviewedPlugins.some(p => p.hasUpdate) ? 'dot-yellow' : 'dot-blue'}"></span>
            Plugins Revisados
          </span>
        </div>
        
        <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <table class="plugin-table">
            <thead>
              <tr>
                <th style="width: 50%;">Plugin</th>
                <th style="width: 20%; text-align: center;">Versión</th>
                <th style="width: 30%; text-align: center;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${reviewedPlugins.map((p) => `
              <tr>
                <td>
                  <div class="plugin-name">${p.name}</div>
                  ${p.author ? `<div class="plugin-author">${p.author}</div>` : ''}
                </td>
                <td style="text-align: center;">
                  <span class="plugin-version">v${p.version}</span>
                  ${p.newVersion && p.hasUpdate ? `<span class="version-update">→ v${p.newVersion} (pendiente)</span>` : ''}
                </td>
                <td style="text-align: center;">
                  ${p.hasUpdate ? `
                  <span class="plugin-status status-pending">
                    <span class="status-dot dot-yellow"></span>
                    ⚠ Pendiente
                  </span>
                  ` : `
                  <span class="plugin-status status-active">
                    <span class="status-dot dot-green"></span>
                    ✓ Al día
                  </span>
                  `}
                </td>
              </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}
      
      <!-- Plugins Inactivos -->
      ${inactivePlugins.length > 0 ? `
      <div class="section" style="padding-top: 0;">
        <div class="section-title">
          <span class="section-badge badge-gray">
            Plugins Inactivos (${inactivePlugins.length})
          </span>
        </div>
        <div class="inactive-list">
          ${inactivePlugins.map((p) => `<span class="inactive-tag">${p.name}</span>`).join('')}
        </div>
      </div>
      ` : ''}
      
      <!-- Notas -->
      ${notes && notes.trim() ? `
      <div class="section" style="padding-top: 0;">
        <div class="section-title">
          <span class="section-badge badge-blue">
            <span class="status-dot dot-blue"></span>
            Notas Adicionales
          </span>
        </div>
        <div class="notes-section">
          <div class="notes-title">Observaciones del Técnico</div>
          <p class="notes-text">${notes.replace(/\n/g, '<br>')}</p>
        </div>
      </div>
      ` : ''}
      
      <!-- Footer -->
      <div class="footer">
        <p class="footer-brand">Mantenimiento Web Profesional</p>
        <p class="footer-text">Informe generado el ${today}</p>
        <p class="footer-text">Si tienes alguna duda, no dudes en contactarnos.</p>
        <div class="divider"></div>
        <p class="footer-small">
          © ${new Date().getFullYear()} Servicios de Mantenimiento Web.
          Este informe es confidencial y ha sido generado para ${client.nombre}.
        </p>
      </div>
      
    </div>
  </div>
</body>
</html>
  `;
}

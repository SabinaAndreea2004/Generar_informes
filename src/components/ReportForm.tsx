import { MaintenanceReport } from '../types/report';
import { Layout, Globe, Calendar, CheckSquare, Package, Zap } from 'lucide-react';

interface ReportFormProps {
  data: MaintenanceReport;
  onChange: (data: MaintenanceReport) => void;
}

export const ReportForm = ({ data, onChange }: ReportFormProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      onChange({
        ...data,
        tasks: {
          ...data.tasks,
          [name]: checked,
        },
      });
    } else {
      onChange({
        ...data,
        [name]: value,
      });
    }
  };

  const sectionStyle = {
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-card)',
  } as React.CSSProperties;

  const labelStyle = {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '8px',
    display: 'block',
    letterSpacing: '0.01em',
  } as React.CSSProperties;

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    transition: 'all 0.2s ease',
    outline: 'none',
  } as React.CSSProperties;

  const inputFocusStyle = {
    borderColor: 'var(--accent-primary)',
    boxShadow: '0 0 0 1px var(--accent-primary), 0 0 20px rgba(212, 168, 83, 0.1)',
  };

  const sectionTitleStyle = {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-playfair), serif',
    marginBottom: '20px',
  } as React.CSSProperties;

  const iconWrapperStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(212, 168, 83, 0.1)',
  } as React.CSSProperties;

  return (
    <div className="space-y-6" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
      <div style={sectionStyle} className="card-hover">
        <div className="flex items-center gap-3 mb-5">
          <div style={iconWrapperStyle}>
            <Layout className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h2 style={sectionTitleStyle}>Datos del Cliente</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Nombre del Cliente</label>
            <input
              type="text"
              name="clientName"
              value={data.clientName}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Ej: Acme Corp"
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>URL del Sitio Web</label>
            <div className="relative">
              <Globe className="absolute left-4 top-3.5 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                name="clientUrl"
                value={data.clientUrl}
                onChange={handleChange}
                style={{ ...inputStyle, paddingLeft: '44px' }}
                placeholder="www.ejemplo.com"
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={sectionStyle} className="card-hover">
        <div className="flex items-center gap-3 mb-5">
          <div style={iconWrapperStyle}>
            <Calendar className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h2 style={sectionTitleStyle}>Periodo del Informe</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Mes</label>
            <select
              name="reportMonth"
              value={data.reportMonth}
              onChange={handleChange}
              style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
            >
              {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                <option key={m} value={m} style={{ background: 'var(--bg-tertiary)' }}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Año</label>
            <input
              type="text"
              name="reportYear"
              value={data.reportYear}
              onChange={handleChange}
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>
      </div>

      <div style={sectionStyle} className="card-hover">
        <div className="flex items-center gap-3 mb-5">
          <div style={iconWrapperStyle}>
            <CheckSquare className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h2 style={sectionTitleStyle}>Resumen de Tareas</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'wpCore', label: 'WordPress Core' },
            { id: 'dbOptimization', label: 'Optimización BD' },
            { id: 'monthlyBackup', label: 'Copia de Seguridad' },
            { id: 'securityReview', label: 'Revisión Seguridad' }
          ].map(task => {
            const isChecked = data.tasks[task.id as keyof typeof data.tasks];
            return (
              <label 
                key={task.id} 
                className="flex items-center p-4 rounded-xl cursor-pointer transition-all"
                style={{ 
                  background: isChecked ? 'rgba(212, 168, 83, 0.08)' : 'var(--bg-tertiary)',
                  border: isChecked ? '1px solid var(--border-accent)' : '1px solid var(--border-color)',
                }}
              >
                <div 
                  className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                  style={{
                    background: isChecked ? 'var(--accent-primary)' : 'transparent',
                    border: isChecked ? '1px solid var(--accent-primary)' : '2px solid var(--text-muted)',
                  }}
                >
                  {isChecked && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="var(--bg-primary)" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  name={task.id}
                  checked={isChecked}
                  onChange={handleChange}
                  className="hidden"
                />
                <span className="ml-3 text-sm font-medium" style={{ color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{task.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div style={sectionStyle} className="card-hover">
        <div className="flex items-center gap-3 mb-5">
          <div style={iconWrapperStyle}>
            <Package className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h2 style={sectionTitleStyle}>Plugins Actualizados</h2>
        </div>
        <textarea
          name="updatedPlugins"
          value={data.updatedPlugins}
          onChange={handleChange}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', minHeight: '100px', lineHeight: '1.6' }}
          placeholder="Ej: WooCommerce (8.9.1 -> 9.0.0), Elementor (3.21.0 -> 3.22.0)..."
          onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      <div style={sectionStyle} className="card-hover">
        <div className="flex items-center gap-3 mb-5">
          <div style={iconWrapperStyle}>
            <Zap className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h2 style={sectionTitleStyle}>Rendimiento y SEO</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Velocidad de Carga (segundos)</label>
            <input
              type="text"
              name="performanceSpeed"
              value={data.performanceSpeed}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Ej: 1.2s"
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>Puntuación SEO (%)</label>
            <input
              type="number"
              name="performanceSeo"
              value={data.performanceSeo}
              onChange={handleChange}
              min="0"
              max="100"
              style={inputStyle}
              placeholder="Ej: 95"
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

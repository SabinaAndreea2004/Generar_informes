"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { MaintenancePlugin } from "@/types";
import { formatHealthImport } from "@/lib/wp-health-parser";

interface Props {
  onImport: (plugins: MaintenancePlugin[], wpVersion?: string) => void;
  onClose: () => void;
}

export default function ImportModal({ onImport, onClose }: Props) {
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const handleImport = () => {
    if (!importText.trim()) {
      setImportError("Por favor, pega el texto de Salud del Sitio");
      return;
    }
    const result = formatHealthImport(importText);
    if (!result.success) {
      setImportError(result.error || "Error al importar");
      return;
    }
    const mappedPlugins: MaintenancePlugin[] = result.plugins.map((p) => ({
      id: p.id,
      name: p.name,
      version: p.version,
      author: p.author || "",
      status: p.status,
      hasUpdate: p.hasUpdate,
      isUpdatedThisMonth: false,
    }));
    onImport(mappedPlugins);
    setImportText("");
    setImportError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100]" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-700">Importar desde WordPress</h3>
            <p className="text-xs text-slate-500 mt-0.5">Copia desde Salud del Sitio y pega aquí</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <p className="text-xs font-semibold text-slate-600 mb-2">Pasos:</p>
            <ol className="text-xs text-slate-500 space-y-1 ml-4 list-decimal">
              <li>WP Admin → Herramientas → Salud del Sitio</li>
              <li>Pestaña "Información"</li>
              <li>Botón "Copiar información al portapapeles"</li>
              <li>Pega el texto aquí abajo</li>
            </ol>
          </div>

          <textarea
            value={importText}
            onChange={(e) => { setImportText(e.target.value); setImportError(null); }}
            placeholder="Pega aquí el texto copiado de WordPress..."
            rows={5}
            className="w-full px-4 py-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono leading-relaxed resize-y min-h-[100px] transition-all"
          />

          {importError && (
            <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600">{importError}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button onClick={onClose} className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleImport} disabled={!importText.trim()} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
            Importar
          </button>
        </div>
      </div>
    </div>
  );
}

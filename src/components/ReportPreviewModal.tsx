"use client";

import { X } from "lucide-react";
import { Client, MaintenancePlugin } from "@/types";
import { generateProfessionalEmailHtml } from "@/lib/email-template";

interface Props {
  client: Client;
  currentMonthYear: string;
  plugins: MaintenancePlugin[];
  wpVersion: string;
  notes: string;
  onClose: () => void;
}

export default function ReportPreviewModal({ client, currentMonthYear, plugins, wpVersion, notes, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex flex-col z-[100]">
      <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <X className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-700">Vista Previa del Informe</h3>
            <p className="text-xs text-slate-500">{client.nombre} • {currentMonthYear}</p>
          </div>
        </div>
        <button onClick={onClose} className="px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-slate-100">
          <X className="w-3.5 h-3.5" />
          Cerrar
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 flex justify-center">
        <div className="w-full max-w-[700px] bg-white rounded-xl overflow-hidden shadow-2xl">
          <iframe
            srcDoc={generateProfessionalEmailHtml(client, currentMonthYear, plugins, wpVersion, notes)}
            className="w-full border-none"
            style={{ height: "1200px" }}
            title="Informe de Mantenimiento"
          />
        </div>
      </div>
    </div>
  );
}

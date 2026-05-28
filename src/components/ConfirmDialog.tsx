"use client";

import { X, AlertTriangle } from "lucide-react";

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmDialog({
  title, message, confirmLabel = "Confirmar",
  onConfirm, onCancel, variant = "warning",
}: Props) {
  const colors = {
    danger: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", subtext: "text-red-600", btn: "bg-red-600 hover:bg-red-700" },
    warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", subtext: "text-amber-600", btn: "bg-blue-600 hover:bg-blue-700" },
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", subtext: "text-blue-600", btn: "bg-blue-600 hover:bg-blue-700" },
  };

  const c = colors[variant];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100]" onClick={onCancel}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${c.bg}`}>
              <AlertTriangle className={`w-4 h-4 ${c.text}`} />
            </div>
            <h3 className="text-base font-semibold text-slate-700">{title}</h3>
          </div>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          <div className={`p-4 rounded-xl ${c.bg} border ${c.border}`}>
            <p className={`text-sm font-semibold ${c.text} mb-1`}>{message}</p>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button onClick={onCancel} className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
            Cancelar
          </button>
          <button onClick={onConfirm} className={`px-5 py-2 text-white rounded-lg text-sm font-semibold transition-colors ${c.btn}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

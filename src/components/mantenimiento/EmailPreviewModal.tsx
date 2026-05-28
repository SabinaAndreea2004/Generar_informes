"use client";

import { useMemo } from "react";
import { X, Send, Loader2, FileText, CheckCircle, Lock, ShieldCheck } from "lucide-react";
import type { WPPlugin } from "@/types/mantenimiento";

interface EmailPreviewModalProps {
  clientName: string;
  clientUrl: string;
  clientEmail: string;
  plugins: WPPlugin[];
  wpVersion: string;
  notes: string;
  sending: boolean;
  onClose: () => void;
  onSend: () => void;
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function EmailPreviewModal({
  clientName,
  clientUrl,
  clientEmail,
  plugins,
  wpVersion,
  notes,
  sending,
  onClose,
  onSend,
}: EmailPreviewModalProps) {
  const now = new Date();
  const monthYear = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const todayStr = now.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const updatedPlugins = useMemo(() => plugins.filter((p) => p.isUpdatedThisMonth && p.status === "active"), [plugins]);
  const reviewedPlugins = useMemo(() => plugins.filter((p) => !p.isUpdatedThisMonth && p.status === "active"), [plugins]);
  const inactivePlugins = useMemo(() => plugins.filter((p) => p.status === "inactive" && !p.isUpdatedThisMonth), [plugins]);
  const activeCount = useMemo(() => plugins.filter((p) => p.status === "active").length, [plugins]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex flex-col">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Previsualización del Informe</h3>
            <p className="text-xs text-slate-500">{clientName} &middot; {monthYear}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onSend} disabled={sending}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all">
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {sending ? "Enviando..." : "Enviar Ahora"}
          </button>
          <button onClick={onClose} disabled={sending}
            className="px-3 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50 disabled:opacity-50 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gradient-to-b from-slate-50 to-slate-100 p-4 sm:p-8 flex justify-center">
        <div className="w-full max-w-[680px] bg-white rounded-2xl shadow-xl shadow-slate-200/60 ring-1 ring-slate-900/5 overflow-hidden">

          {/* Letter Header */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 sm:px-10 py-8 sm:py-10">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-white text-lg sm:text-xl font-bold tracking-tight">Informe de Mantenimiento Web</h1>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5">{clientName} — {monthYear}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {todayStr}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 sm:px-10 py-7 sm:py-8 space-y-7">

            {/* Greeting */}
            <div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Hola <strong className="text-slate-900">{clientName}</strong>,
              </p>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-3">
                Durante el período de <strong className="text-slate-900">{monthYear}</strong> hemos realizado las tareas
                de mantenimiento y actualización de su sitio web. A continuación le mostramos el detalle de los componentes gestionados.
              </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                <p className="text-2xl sm:text-3xl font-bold text-slate-800">{activeCount}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mt-1 font-medium">Plugins Activos</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{updatedPlugins.length}</p>
                <p className="text-[10px] sm:text-xs text-emerald-600 uppercase tracking-wider mt-1 font-medium">Actualizados</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                <p className="text-2xl sm:text-3xl font-bold text-slate-600">{reviewedPlugins.length}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mt-1 font-medium">Supervisados</p>
              </div>
            </div>

            {/* Updated Plugins */}
            {updatedPlugins.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-sm font-bold text-slate-800">Componentes Actualizados este mes</h2>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 ml-auto">{updatedPlugins.length}</span>
                </div>
                <div className="space-y-1">
                  {updatedPlugins.map((p) => (
                    <div key={p.slug} className="flex items-center justify-between py-2.5 px-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100/60">
                      <span className="text-sm font-medium text-slate-800">{p.name}</span>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-md px-2 py-0.5">v{p.version_actual}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviewed Plugins */}
            {reviewedPlugins.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <h2 className="text-sm font-bold text-slate-800">Componentes Supervisados y Estables</h2>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 ml-auto">{reviewedPlugins.length}</span>
                </div>
                <div className="space-y-1">
                  {reviewedPlugins.map((p) => (
                    <div key={p.slug} className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-sm font-medium text-slate-800">{p.name}</span>
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-md px-2 py-0.5">v{p.version_actual}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Plugins */}
            {inactivePlugins.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">⏸️</span>
                  <h2 className="text-sm font-bold text-slate-800">Componentes Inactivos</h2>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5 ml-auto">{inactivePlugins.length}</span>
                </div>
                <div className="space-y-1">
                  {inactivePlugins.map((p) => (
                    <div key={p.slug} className="flex items-center justify-between py-2 px-3.5 bg-slate-50/50 rounded-xl border border-slate-100/60 opacity-60">
                      <span className="text-sm text-slate-600">{p.name}</span>
                      <span className="text-xs text-slate-400">v{p.version_actual}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WP Version */}
            {wpVersion && (
              <div className="text-center pt-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  WordPress {wpVersion}
                </span>
              </div>
            )}

            {/* Notes */}
            {notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span>📋</span> Notas del técnico
                </p>
                <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{notes}</p>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-slate-100 pt-5 text-center">
              <p className="text-[11px] text-slate-400">
                <span className="font-medium text-slate-500">{clientUrl.replace(/^https?:\/\//, "")}</span>
              </p>
              <p className="text-[10px] text-slate-300 mt-1">© {now.getFullYear()} Agencia de Mantenimiento Web</p>
              <p className="text-[10px] text-slate-300 mt-0.5">
                Este informe es generado automáticamente. Si tiene alguna pregunta, no dude en contactarnos.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
        <p className="text-xs text-slate-400">
          Se enviará a <span className="font-medium text-slate-600">{clientEmail}</span>
        </p>
        <button onClick={onSend} disabled={sending}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? "Enviando..." : `Enviar Informe de ${monthYear}`}
        </button>
      </div>
    </div>
  );
}

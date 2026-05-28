"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { ClipboardPaste, ShieldOff, CheckCircle2, AlertCircle, Loader2, Send, Eye } from "lucide-react";
import type { WPPlugin } from "@/types/mantenimiento";
import { parseSiteHealth } from "@/lib/parseSiteHealth";
import EmailPreviewModal from "./EmailPreviewModal";

interface MantenimientoPanelProps {
  id: string;
  nombreEmpresa: string;
  emailCliente: string;
  urlWeb: string;
  mantenimientoActivo: boolean;
  onToggleMantenimiento?: (activo: boolean) => Promise<void>;
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface PluginRow extends WPPlugin {
  isUpdatedThisMonth: boolean;
}

export default function MantenimientoPanel({
  id: clientId,
  nombreEmpresa: clientName,
  emailCliente: clientEmail,
  urlWeb: clientUrl,
  mantenimientoActivo: isActive,
  onToggleMantenimiento,
}: MantenimientoPanelProps) {
  const [plugins, setPlugins] = useState<PluginRow[]>([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [wpVersion, setWpVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");

  const now = new Date();
  const monthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const monthNum = now.getMonth();
  const yearNum = now.getFullYear();

  const activeCount = useMemo(() => plugins.filter((p) => p.status === "active").length, [plugins]);
  const updatedCount = useMemo(
    () => plugins.filter((p) => p.status === "active" && p.isUpdatedThisMonth).length,
    [plugins],
  );

  useEffect(() => {
    const loadExisting = async () => {
      try {
        const res = await fetch(`/api/monthly?clientId=${clientId}&month=${monthNum}&year=${yearNum}`);
        const data = await res.json();
        if (data.records && data.records.length > 0) {
          const record = data.records[0];
          setWpVersion(record.wpVersion || "");
          setNotes(record.notes || "");
          if (record.plugins) {
            const parsed: PluginRow[] = typeof record.plugins === "string" ? JSON.parse(record.plugins) : record.plugins;
            setPlugins(parsed);
            setHasParsed(true);
          }
          if (record.closed) setSent(true);
        }
      } catch {}
    };
    if (clientId) loadExisting();
  }, [clientId, monthNum, yearNum]);

  const handleProcess = useCallback(() => {
    const trimmed = pastedText.trim();
    if (!trimmed) {
      setError("Pega el contenido del portapapeles de WordPress antes de procesar.");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const result = parseSiteHealth(trimmed);
      if (!result.success) {
        setError(result.error || "Error al analizar el texto.");
        return;
      }
      if (result.plugins.length === 0) {
        setError("No se encontraron plugins en el texto pegado.");
        return;
      }
      const mapped: PluginRow[] = result.plugins.map((p) => ({
        ...p,
        isUpdatedThisMonth: !p.requiere_actualizacion,
      }));
      setPlugins(mapped);
      setHasParsed(true);
      if (result.wpVersion) setWpVersion(result.wpVersion);
    } catch {
      setError("Error inesperado al procesar el texto. Verifica que sea el contenido copiado de Salud del Sitio.");
    } finally {
      setProcessing(false);
    }
  }, [pastedText]);

  const handleReset = useCallback(() => {
    setHasParsed(false);
    setPlugins([]);
    setPastedText("");
    setError("");
  }, []);

  const togglePlugin = useCallback((slug: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, isUpdatedThisMonth: !p.isUpdatedThisMonth } : p)),
    );
  }, []);

  const markAllUpdated = useCallback(() => {
    setPlugins((prev) =>
      prev.map((p) => ({ ...p, isUpdatedThisMonth: true })),
    );
  }, []);

  const handleFinish = useCallback(async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/mantenimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: parseInt(clientId, 10),
          month: monthNum,
          year: yearNum,
          wpVersion,
          plugins,
          notes,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al guardar el informe");
        return;
      }
      setSent(true);
    } catch {
      setError("Error de conexión al finalizar");
    } finally {
      setSending(false);
    }
  }, [clientId, monthNum, yearNum, wpVersion, plugins, notes]);

  if (!isActive) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <ShieldOff className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-700">Servicio de mantenimiento inactivo</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
          Este cliente no tiene contratado el servicio de mantenimiento mensual.
        </p>
        {onToggleMantenimiento && (
          <button
            onClick={() => onToggleMantenimiento(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            <ShieldOff className="h-4 w-4" />
            Activar servicio de mantenimiento
          </button>
        )}
      </div>
    );
  }

  return (
    <>
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mantenimiento de Sitios Web</h1>
          <p className="text-sm text-slate-500 mt-1">Panel de control para la gestión y actualización de webs de clientes</p>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {sent && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">¡Informe de Mantenimiento Enviado!</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              El reporte detallado de {monthLabel} ha sido generado y enviado a <span className="font-semibold text-slate-700">{clientEmail}</span>.
            </p>
            <button
              onClick={() => { setSent(false); setHasParsed(false); setPlugins([]); }}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
            >
              Nuevo Procesamiento
            </button>
          </div>
        )}

        {!sent && (
          <>
            {/* ── Textarea / Paste Section ── */}
            {!hasParsed && !processing && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 pt-6 pb-5 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                    <ClipboardPaste className="h-7 w-7 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Pegar Información de Salud del Sitio</h3>
                  <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
                    Ve al WordPress del cliente, accede a <strong>Herramientas → Salud del Sitio → Información</strong>,
                    haz clic en <strong>"Copiar la información del sitio en el portapapeles"</strong> y pega el contenido aquí.
                  </p>
                </div>
                <div className="px-6 pb-5">
                  <div className="relative">
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder={`Pega aquí el contenido copiado de Salud del Sitio de WordPress...\n\nEjemplo:\n### wp-core ###\nversion: 7.0\n...\n\n### wp-plugins-active ###\nAkismet Anti-spam: Spam Protection: version: 5.3, author: Automattic\n...\n\n### wp-plugins-inactive ###\nHello Dolly: version: 1.7.2, author: Matt Mullenweg\n...`}
                      rows={14}
                      className="w-full rounded-xl border border-slate-200 px-5 py-4 text-sm font-mono text-slate-700 placeholder-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all resize-y bg-white leading-relaxed"
                    />
                    {pastedText.length > 0 && (
                      <div className="absolute bottom-4 right-4 text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded">
                        {pastedText.length} caracteres
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
                    <p className="text-xs text-slate-400 max-w-md">
                      El procesamiento es 100% local. Los datos no se envían a ningún servidor externo.
                    </p>
                    <button
                      onClick={handleProcess}
                      disabled={!pastedText.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                    >
                      <ClipboardPaste className="h-4 w-4" />
                      Procesar Información de Salud del Sitio
                    </button>
                  </div>
                </div>
              </div>
            )}

            {processing && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
                <p className="mt-4 text-sm font-medium text-slate-600">Procesando información...</p>
                <p className="text-xs text-slate-400 mt-1">Analizando plugins activos, inactivos y versiones disponibles</p>
              </div>
            )}

            {/* ── Plugin Table ── */}
            {hasParsed && plugins.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3 text-sm flex-wrap">
                  <span className="text-slate-400 font-medium">WordPress:</span>
                  <input
                    type="text" value={wpVersion} onChange={(e) => setWpVersion(e.target.value)}
                    placeholder="Versión"
                    className="w-24 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <span className="text-xs text-slate-400 ml-auto">
                    <span className="font-semibold text-slate-600">{activeCount}</span> activos &middot;
                    <span className="font-semibold text-slate-600 ml-1">{updatedCount}/{activeCount}</span> actualizados
                  </span>
                  <button
                    onClick={handleReset}
                    className="text-[10px] font-medium text-slate-400 hover:text-slate-600 hover:underline uppercase tracking-wider transition-colors"
                  >
                    Volver a pegar
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-200">
                        <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-widest">Plugin</th>
                        <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-widest">Versión</th>
                        <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-widest text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span>Acción Mantenimiento</span>
                            <button onClick={markAllUpdated} className="text-[10px] font-medium text-blue-600 hover:underline uppercase tracking-normal">
                              Marcar todos como al día
                            </button>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {plugins.map((plugin) => (
                        <tr
                          key={plugin.slug}
                          className={`transition-colors hover:bg-slate-50/50 ${plugin.status === "inactive" ? "opacity-60" : ""}`}
                        >
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1.5">
                              <span className="text-sm font-bold text-slate-800">{plugin.name}</span>
                              <span
                                className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  plugin.status === "active"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                                }`}
                              >
                                {plugin.status === "active" ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            {plugin.requiere_actualizacion && plugin.version_nueva ? (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-400 line-through decoration-slate-300">v{plugin.version_actual}</span>
                                <span className="text-slate-300 text-xs">→</span>
                                <span className="inline-flex items-center rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                  v{plugin.version_nueva}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span className="text-slate-700 font-medium">v{plugin.version_actual}</span>
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={plugin.isUpdatedThisMonth}
                                onChange={() => togglePlugin(plugin.slug)}
                                className="sr-only peer"
                              />
                              <div
                                className={`w-11 h-6 rounded-full transition-all after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white ${
                                  plugin.isUpdatedThisMonth
                                    ? "bg-green-500"
                                    : "bg-slate-300"
                                }`}
                              />
                              <span
                                className={`ml-2.5 text-xs font-medium transition-colors ${
                                  plugin.isUpdatedThisMonth ? "text-green-600 font-semibold" : "text-slate-400"
                                }`}
                              >
                                {plugin.isUpdatedThisMonth ? "Actualizado" : "Pendiente"}
                              </span>
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-200">
                  <div className="px-6 py-4 bg-slate-50/50">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <span className="text-base">📝</span> Notas del Informe (Opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Añade observaciones, tareas extras realizadas o advertencias de seguridad para el cliente..."
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all resize-none bg-white"
                    />
                  </div>

                  <div className="px-6 py-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                      Al cerrar el mes se enviará un informe automático al cliente con los cambios realizados, el estado de los plugins y las notas registradas.
                    </p>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button onClick={() => setShowPreview(true)} disabled={plugins.length === 0}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-700 border border-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all disabled:opacity-50">
                        <Eye className="h-4 w-4" />
                        <span>Vista Previa</span>
                      </button>
                      <button onClick={handleFinish} disabled={sending || plugins.length === 0}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-md hover:bg-blue-700 transition-all duration-300 active:scale-[0.98] disabled:opacity-50">
                        {sending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                        <span>{sending ? "Enviando..." : `Enviar Informe de ${monthLabel}`}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>

    {showPreview && (
      <EmailPreviewModal
        clientName={clientName}
        clientUrl={clientUrl}
        clientEmail={clientEmail}
        plugins={plugins}
        wpVersion={wpVersion}
        notes={notes}
        sending={sending}
        onClose={() => setShowPreview(false)}
        onSend={() => {
          setShowPreview(false);
          handleFinish();
        }}
      />
    )}
    </>
  );
}

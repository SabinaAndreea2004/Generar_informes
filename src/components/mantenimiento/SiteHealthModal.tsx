"use client";

import { useState, useEffect } from "react";
import { X, Shield, Globe, Server, Database, CheckCircle2, AlertCircle, Loader2, Upload } from "lucide-react";
import { formatHealthImport } from "@/lib/wp-health-parser";
import type { WPPlugin } from "@/types/mantenimiento";

interface HealthData {
  wpVersion: string;
  siteName: string;
  siteUrl: string;
  timezone: string;
  isAccessible: boolean;
  hasRestApi: boolean;
  restNamespaces: string[];
  serverSoftware: string;
  phpVersion: string;
  wordPressPaths: {
    restApiRoot: boolean;
    wpAdmin: boolean;
  };
  activeTheme?: string;
  siteStats?: {
    posts?: number;
    pages?: number;
    users?: number;
    media?: number;
  };
}

interface Props {
  wpUrl: string;
  onClose: () => void;
  onImport: (plugins: WPPlugin[], wpVersion?: string) => void;
}

function HealthCard({ icon, label, value, status }: { icon: React.ReactNode; label: string; value: string; status?: "ok" | "warn" | "info" }) {
  const dotColor = status === "ok" ? "bg-green-500" : status === "warn" ? "bg-amber-500" : "bg-blue-500";
  return (
    <div className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-label-sm font-label-sm text-outline uppercase tracking-wider">{label}</p>
        <p className="mt-0.5 text-body-md font-body-md font-semibold text-on-surface truncate">{value}</p>
      </div>
      {status && <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dotColor}`} />}
    </div>
  );
}

export default function SiteHealthModal({ wpUrl, onClose, onImport }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [health, setHealth] = useState<HealthData | null>(null);
  const [tab, setTab] = useState<"info" | "import">("info");

  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const [parsedPlugins, setParsedPlugins] = useState<WPPlugin[] | null>(null);
  const [importWpVersion, setImportWpVersion] = useState<string | undefined>();
  const [pluginStatuses, setPluginStatuses] = useState<Map<string, { status: "updated" | "outdated" | "unknown"; latestVersion: string | null }>>(new Map());

  useEffect(() => {
    const fetchHealth = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/wordpress/site-health?wpUrl=${encodeURIComponent(wpUrl)}`);
        const data = await res.json();
        if (data.success && data.health) {
          setHealth(data.health);
        } else {
          setError(data.error || "Error al obtener datos de salud del sitio");
        }
      } catch {
        setError("Error de conexión al obtener datos de salud");
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, [wpUrl]);

  const handleParse = async () => {
    if (!importText.trim()) {
      setImportError("Pega el texto copiado de Salud del Sitio");
      return;
    }
    setImporting(true);
    setImportError("");
    setParsedPlugins(null);

    const result = formatHealthImport(importText);
    if (!result.success) {
      setImportError(result.error || "Error al analizar el texto");
      setImporting(false);
      return;
    }

    setImportWpVersion(result.info.wpVersion || undefined);
    setPluginStatuses(new Map());

    const mapped: WPPlugin[] = result.plugins.map((p) => ({
      name: p.name,
      slug: `imported-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      status: p.status as "active" | "inactive",
      version_actual: p.version,
      version_nueva: null,
      requiere_actualizacion: false,
      isUpdatedThisMonth: false,
    }));

    try {
      const updateRes = await fetch("/api/wordpress/check-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plugins: mapped.map((p) => ({ name: p.name, version: p.version_actual })),
        }),
      });
      const updateData = await updateRes.json();
      const pluginStatusMap = new Map<string, { status: "updated" | "outdated" | "unknown"; latestVersion: string | null }>();
      if (updateData.success && updateData.results) {
        for (const r of updateData.results) {
          pluginStatusMap.set(r.name, { status: r.status, latestVersion: r.latestVersion || null });
          if (r.status === "outdated") {
            const p = mapped.find((pl) => pl.name === r.name);
            if (p) p.requiere_actualizacion = true;
          }
        }
      }
      setPluginStatuses(pluginStatusMap);
    } catch {}

    setParsedPlugins(mapped);
    setImporting(false);
  };

  const handleImportPlugins = () => {
    if (parsedPlugins && parsedPlugins.length > 0) {
      onImport(parsedPlugins, importWpVersion);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100]" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-on-surface">Site Health</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Información y plugins desde WordPress</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 shrink-0">
          <button
            onClick={() => setTab("info")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              tab === "info" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Información del Sitio
          </button>
          <button
            onClick={() => setTab("import")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              tab === "import" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Importar Plugins
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === "info" && (
            <>
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-body-sm font-body-sm text-on-surface-variant">Obteniendo información de salud...</p>
                </div>
              )}

              {error && !loading && (
                <div className="flex items-start gap-3 rounded-xl border border-error-container bg-error-container p-4 text-body-sm font-body-sm text-on-error-container">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {health && !loading && (
                <div className="space-y-5">
                  <div>
                    <h4 className="font-label-md text-label-md font-semibold text-on-surface mb-3 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      Información General
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <HealthCard icon={<Globe className="h-4 w-4 text-primary" />} label="Nombre del Sitio" value={health.siteName} status="info" />
                      <HealthCard icon={<Shield className="h-4 w-4 text-primary" />} label="Versión WordPress" value={health.wpVersion} status="ok" />
                      <HealthCard icon={<Server className="h-4 w-4 text-primary" />} label="Servidor" value={health.serverSoftware} status="info" />
                      <HealthCard icon={<Server className="h-4 w-4 text-primary" />} label="PHP" value={health.phpVersion || "Desconocida"} status={health.phpVersion !== "Desconocida" ? "ok" : "warn"} />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-label-md text-label-md font-semibold text-on-surface mb-3 flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      Estado del Sitio
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${health.isAccessible ? "bg-green-100" : "bg-red-100"}`}>
                          {health.isAccessible ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                        </div>
                        <div>
                          <p className="text-label-sm font-label-sm text-outline uppercase tracking-wider">Accesible</p>
                          <p className="mt-0.5 text-body-md font-body-md font-semibold text-on-surface">{health.isAccessible ? "Sí" : "No"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${health.hasRestApi ? "bg-green-100" : "bg-amber-100"}`}>
                          {health.hasRestApi ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
                        </div>
                        <div>
                          <p className="text-label-sm font-label-sm text-outline uppercase tracking-wider">REST API</p>
                          <p className="mt-0.5 text-body-md font-body-md font-semibold text-on-surface">{health.hasRestApi ? "Disponible" : "No disponible"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${health.wordPressPaths.wpAdmin ? "bg-green-100" : "bg-amber-100"}`}>
                          {health.wordPressPaths.wpAdmin ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
                        </div>
                        <div>
                          <p className="text-label-sm text-label-sm text-outline uppercase tracking-wider">WP Admin</p>
                          <p className="mt-0.5 font-body-md font-body-md font-semibold text-on-surface">{health.wordPressPaths.wpAdmin ? "Accesible" : "No accesible"}</p>
                        </div>
                      </div>
                      <HealthCard icon={<Globe className="h-4 w-4 text-primary" />} label="Zona Horaria" value={health.timezone} status="info" />
                    </div>
                  </div>

                  {health.activeTheme && (
                    <div>
                      <h4 className="font-label-md text-label-md font-semibold text-on-surface mb-3">Tema Activo</h4>
                      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container">
                          <span className="material-symbols-outlined text-[20px] text-primary">palette</span>
                        </div>
                        <div>
                          <p className="text-label-sm font-label-sm text-outline uppercase tracking-wider">Tema</p>
                          <p className="mt-0.5 text-body-md font-body-md font-semibold text-on-surface">{health.activeTheme}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {health.siteStats && (health.siteStats.posts !== undefined || health.siteStats.pages !== undefined) && (
                    <div>
                      <h4 className="font-label-md text-label-md font-semibold text-on-surface mb-3">Estadísticas del Sitio</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {health.siteStats.posts !== undefined && (
                          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3 text-center">
                            <p className="text-headline-md font-headline-md text-primary">{health.siteStats.posts}</p>
                            <p className="text-label-sm font-label-sm text-outline">Entradas</p>
                          </div>
                        )}
                        {health.siteStats.pages !== undefined && (
                          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3 text-center">
                            <p className="text-headline-md font-headline-md text-primary">{health.siteStats.pages}</p>
                            <p className="text-label-sm font-label-sm text-outline">Páginas</p>
                          </div>
                        )}
                        {health.siteStats.media !== undefined && (
                          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3 text-center">
                            <p className="text-headline-md font-headline-md text-primary">{health.siteStats.media}</p>
                            <p className="text-label-sm font-label-sm text-outline">Medios</p>
                          </div>
                        )}
                        {health.siteStats.users !== undefined && (
                          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3 text-center">
                            <p className="text-headline-md font-headline-md text-primary">{health.siteStats.users}</p>
                            <p className="text-label-sm font-label-sm text-outline">Usuarios</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {health.restNamespaces.length > 0 && (
                    <div>
                      <h4 className="font-label-md text-label-md font-semibold text-on-surface mb-3">Namespaces REST API</h4>
                      <div className="flex flex-wrap gap-2">
                        {health.restNamespaces.map((ns) => (
                          <span key={ns} className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-label-sm font-label-sm text-on-surface-variant border border-outline-variant">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            {ns}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {tab === "import" && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-2">Pasos para importar plugins desde Salud del Sitio:</p>
                <ol className="text-xs text-slate-500 space-y-1 ml-4 list-decimal">
                  <li>Ve a WP Admin &rarr; Herramientas &rarr; Salud del Sitio</li>
                  <li>Haz clic en la pestaña &quot;Información&quot;</li>
                  <li>Haz clic en &quot;Copiar información al portapapeles&quot;</li>
                  <li>Pega el texto aquí abajo</li>
                </ol>
              </div>

              <textarea
                value={importText}
                onChange={(e) => { setImportText(e.target.value); setImportError(""); setParsedPlugins(null); setPluginStatuses(new Map()); }}
                placeholder="Pega aquí el texto copiado de WordPress..."
                rows={6}
                className="w-full px-4 py-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs font-mono leading-relaxed resize-y min-h-[120px] transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-container"
              />

              {importError && (
                <div className="flex items-start gap-3 rounded-xl border border-error-container bg-error-container p-4 text-body-sm font-body-sm text-on-error-container">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {parsedPlugins && (
                <div className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
                  <div className="px-4 py-3 bg-primary/5 border-b border-outline-variant flex items-center justify-between">
                    <span className="text-label-sm font-label-sm font-semibold text-on-surface">
                      {parsedPlugins.length} plugins detectados
                      {importWpVersion && <span className="font-normal text-on-surface-variant ml-1">(WP {importWpVersion})</span>}
                    </span>
                    <button onClick={handleImportPlugins}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm hover:bg-[#1d4ed8] transition-colors">
                      <Upload className="h-3.5 w-3.5" />
                      Importar
                    </button>
                  </div>
                  <div className="divide-y divide-outline-variant/20 max-h-48 overflow-y-auto">
                    {parsedPlugins.map((plugin) => (
                      <div key={plugin.slug} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/50">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-1.5 h-1.5 shrink-0 rounded-full ${plugin.status === "active" ? "bg-green-500" : "bg-slate-300"}`} />
                          <span className="text-body-sm font-body-sm text-on-surface truncate">{plugin.name}</span>
                          <span className="text-label-sm font-label-sm text-outline shrink-0">v{plugin.version_actual}</span>
                        </div>
                        {(() => {
                          const info = pluginStatuses.get(plugin.name);
                          if (info?.status === "outdated") return <span className="text-label-sm font-label-sm text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">{plugin.version_actual} → {info.latestVersion}</span>;
                          if (info?.status === "unknown") return <span className="text-label-sm font-label-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">No verificado</span>;
                          return <span className="text-label-sm font-label-sm text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">Al día</span>;
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleParse} disabled={importing || !importText.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-label-md font-label-md text-on-primary shadow-sm hover:bg-[#1d4ed8] transition-all disabled:opacity-50 active:scale-[0.98]">
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {importing ? "Analizando..." : "Analizar e Importar Plugins"}
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

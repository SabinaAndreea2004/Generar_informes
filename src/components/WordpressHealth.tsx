"use client";

import React, { useState, useCallback } from "react";
import {
  RefreshCw,
  CheckCircle2,
  Circle,
  AlertCircle,
  Globe,
  Package,
  TrendingUp,
  Plus,
  Trash2,
  Edit3,
   ChevronDown,
   ChevronUp,
   X,
   Clipboard,
   Save,
  AlertTriangle,
} from "lucide-react";

export interface ManualPlugin {
  id: string;
  name: string;
  version: string;
  status: "active" | "inactive";
  hasUpdate: boolean;
  newVersion?: string;
  isUpdated: boolean;
}

interface SiteInfo {
  name: string;
  description: string;
  url: string;
  timezone: string;
  isAccessible: boolean;
  hasRestApi: boolean;
  wpVersion: string;
}

interface WordpressHealthProps {
  wpUrl?: string;
  initialPlugins?: ManualPlugin[];
  onPluginsChange?: (plugins: ManualPlugin[]) => void;
  onSiteInfo?: (info: SiteInfo | null) => void;
  className?: string;
}

const commonPlugins = [
  "Yoast SEO",
  "WooCommerce",
  "Elementor",
  "Contact Form 7",
  "Akismet Anti-Spam",
  "WP Rocket",
  "WPForms",
  "Divi Builder",
  "Rank Math SEO",
  "UpdraftPlus",
  "Wordfence Security",
  "Duplicator",
  "All in One SEO",
  "MonsterInsights",
  "Smush",
  "iThemes Security",
  "Redirection",
  "Simple History",
  "User Role Editor",
  "Advanced Custom Fields (ACF)",
];

export default function WordpressHealth({
  wpUrl: initialUrl,
  initialPlugins = [],
  onPluginsChange,
  onSiteInfo,
  className = "",
}: WordpressHealthProps) {
  const [wpUrl, setWpUrl] = useState(initialUrl || "");
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  const [plugins, setPlugins] = useState<ManualPlugin[]>(
    initialPlugins.length > 0
      ? initialPlugins
      : []
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlugin, setNewPlugin] = useState({
    name: "",
    version: "",
    status: "active" as "active" | "inactive",
    hasUpdate: false,
    newVersion: "",
  });

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const [showInactive, setShowInactive] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const fetchSiteInfo = useCallback(async () => {
    if (!wpUrl) {
      setError("Por favor, introduce la URL del sitio WordPress");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ wpUrl });
      const response = await fetch(`/api/wordpress/site?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Error al verificar el sitio");
        setSiteInfo(null);
      } else {
        setSiteInfo(data.siteInfo);
        setHasScanned(true);
        onSiteInfo?.(data.siteInfo);
      }
    } catch {
      setError("Error de conexión. Verifica tu conexión a internet.");
      setSiteInfo(null);
    } finally {
      setLoading(false);
    }
  }, [wpUrl, onSiteInfo]);

  const updatePlugins = useCallback(
    (newPlugins: ManualPlugin[]) => {
      setPlugins(newPlugins);
      onPluginsChange?.(newPlugins);
    },
    [onPluginsChange]
  );

  const toggleUpdateStatus = useCallback(
    (pluginId: string) => {
      updatePlugins(
        plugins.map((p) => (p.id === pluginId ? { ...p, isUpdated: !p.isUpdated } : p))
      );
    },
    [plugins, updatePlugins]
  );

  const deletePlugin = useCallback(
    (pluginId: string) => {
      updatePlugins(plugins.filter((p) => p.id !== pluginId));
    },
    [plugins, updatePlugins]
  );

  const addPlugin = useCallback(() => {
    if (!newPlugin.name.trim()) return;

    const plugin: ManualPlugin = {
      id: `manual-${Date.now()}`,
      name: newPlugin.name.trim(),
      version: newPlugin.version.trim() || "1.0.0",
      status: newPlugin.status,
      hasUpdate: newPlugin.hasUpdate,
      newVersion: newPlugin.newVersion.trim() || undefined,
      isUpdated: !newPlugin.hasUpdate,
    };

    updatePlugins([...plugins, plugin]);
    setNewPlugin({
      name: "",
      version: "",
      status: "active",
      hasUpdate: false,
      newVersion: "",
    });
    setShowAddForm(false);
  }, [newPlugin, plugins, updatePlugins]);

  const addQuickPlugin = useCallback(
    (pluginName: string) => {
      const plugin: ManualPlugin = {
        id: `quick-${Date.now()}`,
        name: pluginName,
        version: "Desconocida",
        status: "active",
        hasUpdate: false,
        isUpdated: true,
      };
      updatePlugins([...plugins, plugin]);
      setShowQuickAdd(false);
    },
    [plugins, updatePlugins]
  );

  const parsePastedPlugins = useCallback(() => {
    const lines = pasteText.split("\n").filter((line) => line.trim().length > 0);
    const newPlugins: ManualPlugin[] = lines.map((line, index) => {
      const parts = line.split(/[,;|\t]/).map((p) => p.trim());
      return {
        id: `pasted-${Date.now()}-${index}`,
        name: parts[0] || `Plugin ${index + 1}`,
        version: parts[1] || "Desconocida",
        status: parts[2]?.toLowerCase() === "inactive" ? "inactive" : "active",
        hasUpdate: !!parts[3],
        newVersion: parts[3] || undefined,
        isUpdated: !parts[3],
      };
    });

    updatePlugins([...plugins, ...newPlugins]);
    setPasteText("");
    setShowPasteModal(false);
  }, [pasteText, plugins, updatePlugins]);

  const markAllAsUpdated = useCallback(() => {
    updatePlugins(plugins.map((p) => ({ ...p, isUpdated: true })));
  }, [plugins, updatePlugins]);

  const markAllAsPending = useCallback(() => {
    updatePlugins(plugins.map((p) => ({ ...p, isUpdated: false })));
  }, [plugins, updatePlugins]);

  const activePlugins = plugins.filter((p) => p.status === "active");
  const inactivePlugins = plugins.filter((p) => p.status === "inactive");
  const pluginsWithUpdates = plugins.filter((p) => p.hasUpdate);
  const updatedCount = plugins.filter((p) => p.isUpdated).length;

  const shouldShowForm = !hasScanned || !initialUrl;

  return (
    <div className={`space-y-6 ${className}`}>
      {shouldShowForm && (
        <div className="card-base p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl" style={{ background: "var(--accent-light)" }}>
              <Globe className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
            </div>
            <div>
              <h2
                className="font-medium text-lg"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-display), serif",
                }}
              >
                Estado del Sitio
              </h2>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Verifica información básica del sitio (sin credenciales)
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Globe
                  className="absolute left-4 top-3.5 w-4 h-4"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  type="text"
                  value={wpUrl}
                  onChange={(e) => setWpUrl(e.target.value)}
                  placeholder="https://misitio.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all input-field"
                  onKeyDown={(e) => e.key === "Enter" && fetchSiteInfo()}
                />
              </div>
            </div>
            <button
              onClick={fetchSiteInfo}
              disabled={loading || !wpUrl}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all btn-primary disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  Verificar Sitio
                </>
              )}
            </button>
          </div>

          <div
            className="p-4 rounded-xl text-sm"
            style={{ background: "var(--bg-secondary)", color: "var(--text-tertiary)" }}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#ca8a04" }} />
              <div>
                <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
                  Nota: Sin Application Password no se puede leer la lista de plugins automáticamente
                </p>
                <p className="mt-1">
                  Usa el botón "Verificar Sitio" para obtener info básica, luego añade plugins manualmente o pega tu lista.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          className="card-base p-5"
          style={{
            background: "#fef2f2",
            borderColor: "#fecaca",
          }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: "#dc2626" }}
            />
            <p className="font-medium text-sm" style={{ color: "#991b1b" }}>
              {error}
            </p>
          </div>
        </div>
      )}

      {siteInfo && (
        <div className="card-base p-5">
          <h3
            className="font-medium mb-4"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-display), serif",
            }}
          >
            Información del Sitio
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                Nombre
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {siteInfo.name}
              </p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                Versión WP
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {siteInfo.wpVersion}
              </p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                Estado
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: siteInfo.isAccessible ? "#16a34a" : "#dc2626" }}
              >
                {siteInfo.isAccessible ? "✓ Online" : "✗ Error"}
              </p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                REST API
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: siteInfo.hasRestApi ? "#16a34a" : "#ca8a04" }}
              >
                {siteInfo.hasRestApi ? "✓ Disponible" : "Parcial"}
              </p>
            </div>
          </div>
          {siteInfo.description && (
            <p className="text-xs mt-4 pt-4" style={{ borderTop: "1px solid var(--border-light)", color: "var(--text-muted)" }}>
              {siteInfo.description}
            </p>
          )}
        </div>
      )}

      {plugins.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-base p-4 stat-card">
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              Total Plugins
            </p>
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {plugins.length}
            </p>
          </div>
          <div className="card-base p-4 stat-card">
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              Activos
            </p>
            <p className="text-2xl font-bold" style={{ color: "#16a34a" }}>
              {activePlugins.length}
            </p>
          </div>
          <div className="card-base p-4 stat-card">
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              Actualizaciones
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: pluginsWithUpdates.length > 0 ? "#ca8a04" : "var(--text-muted)" }}
            >
              {pluginsWithUpdates.length}
            </p>
          </div>
          <div className="card-base p-4 stat-card">
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              Marcados Actualizados
            </p>
            <p className="text-2xl font-bold" style={{ color: "var(--accent-primary)" }}>
              {updatedCount}/{plugins.length}
            </p>
          </div>
        </div>
      )}

      <div className="card-base overflow-hidden">
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4"
          style={{
            background: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: "var(--accent-light)" }}>
              <Package className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
            </div>
            <div>
              <h3
                className="font-medium"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-display), serif",
                }}
              >
                Plugins
              </h3>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {plugins.length > 0 && (
              <>
                <button
                  onClick={markAllAsUpdated}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: "#dcfce7", color: "#166534" }}
                >
                  Marcar todos
                </button>
                <button
                  onClick={markAllAsPending}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: "var(--bg-card)",
                    color: "var(--text-tertiary)",
                    border: "1px solid var(--border-medium)",
                  }}
                >
                  Desmarcar
                </button>
                <button
                  onClick={() => setShowInactive(!showInactive)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: "var(--bg-card)",
                    color: "var(--text-tertiary)",
                    border: "1px solid var(--border-medium)",
                  }}
                >
                  {showInactive ? (
                    <span className="flex items-center gap-1">
                      <ChevronUp className="w-3 h-3" />
                      Inactivos ({inactivePlugins.length})
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <ChevronDown className="w-3 h-3" />
                      Inactivos ({inactivePlugins.length})
                    </span>
                  )}
                </button>
              </>
            )}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all btn-primary"
            >
              <span className="flex items-center gap-1">
                <Plus className="w-3 h-3" />
                Añadir
              </span>
            </button>
            <button
              onClick={() => setShowPasteModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: "var(--bg-card)",
                color: "var(--text-tertiary)",
                border: "1px solid var(--border-medium)",
              }}
            >
               <span className="flex items-center gap-1">
                       <Clipboard className="w-3 h-3" />
                       Pegar Lista
                     </span>
            </button>
          </div>
        </div>

        {showAddForm && (
          <div
            className="p-5" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-light)" }}>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Nombre del Plugin *
                  </label>
                  <input
                    type="text"
                    value={newPlugin.name}
                    onChange={(e) => setNewPlugin({ ...newPlugin, name: e.target.value })}
                    placeholder="Ej: Yoast SEO"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all input-field"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Versión
                  </label>
                  <input
                    type="text"
                    value={newPlugin.version}
                    onChange={(e) => setNewPlugin({ ...newPlugin, version: e.target.value })}
                    placeholder="2.5.0"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all input-field"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Estado
                  </label>
                  <select
                    value={newPlugin.status}
                    onChange={(e) =>
                      setNewPlugin({ ...newPlugin, status: e.target.value as "active" | "inactive" })
                    }
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all input-field"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPlugin.hasUpdate}
                    onChange={(e) => setNewPlugin({ ...newPlugin, hasUpdate: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Tiene actualización pendiente
                  </span>
                </label>
                {newPlugin.hasUpdate && (
                  <div>
                    <input
                      type="text"
                      value={newPlugin.newVersion}
                      onChange={(e) => setNewPlugin({ ...newPlugin, newVersion: e.target.value })}
                      placeholder="Nueva versión (ej: 3.0.0)"
                      className="px-3 py-2 rounded-lg text-sm outline-none transition-all input-field"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={addPlugin}
                  disabled={!newPlugin.name.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all btn-primary disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Guardar Plugin
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewPlugin({
                      name: "",
                      version: "",
                      status: "active",
                      hasUpdate: false,
                      newVersion: "",
                    });
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: "var(--bg-card)",
                    color: "var(--text-tertiary)",
                    border: "1px solid var(--border-medium)",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowQuickAdd(!showQuickAdd)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: "var(--bg-card)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-medium)",
                  }}
                >
                  + Añadir rápido
                </button>
              </div>

              {showQuickAdd && (
                <div
                  className="mt-3 p-4 rounded-xl"
                  style={{ background: "var(--bg-tertiary)" }}
                >
                  <p
                    className="text-xs font-medium mb-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Plugins comunes (haz click para añadir):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {commonPlugins.map((name) => (
                      <button
                        key={name}
                        onClick={() => addQuickPlugin(name)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: "var(--bg-card)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-medium)",
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showPasteModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="card-base p-6 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="font-medium text-lg"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-display), serif",
                  }}
                >
                  Pegar Lista de Plugins
                </h3>
                <button onClick={() => setShowPasteModal(false)}>
                  <X className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                </button>
              </div>
              <p
                className="text-sm mb-3"
                style={{ color: "var(--text-tertiary)" }}
              >
                Pega tu lista de plugins. Un plugin por línea. Formato:
                <br />
                <code className="text-xs" style={{ background: "var(--bg-secondary)" }}>
                  Nombre, Versión, (active/inactive), (nueva versión)
                </code>
              </p>
               <textarea
                 value={pasteText}
                 onChange={(e) => setPasteText(e.target.value)}
                 placeholder={"Yoast SEO, 21.7, active\nWooCommerce, 8.9.1, active, 9.0.0\nPlugin Inactivo, 1.0, inactive"}
                 rows={8}
                 className="w-full p-3 rounded-xl text-sm outline-none transition-all resize-none input-field"
                 style={{ lineHeight: "1.6" }}
               />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: "var(--bg-card)",
                    color: "var(--text-tertiary)",
                    border: "1px solid var(--border-medium)",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={parsePastedPlugins}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all btn-primary"
                >
                  Importar
                </button>
              </div>
            </div>
           </div>
         )}

        {plugins.length === 0 ? (
          <div className="p-12 text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--bg-secondary)" }}
            >
              <Package className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              No hay plugins registrados
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
              Usa "Añadir" o "Pegar Lista" para empezar
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Plugin
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Versión
                  </th>
                  <th
                    className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Estado
                  </th>
                  <th
                    className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Actualización
                  </th>
                  <th
                    className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Actualizado
                  </th>
                  <th
                    className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border-light)" }}>
                {activePlugins.map((plugin) => (
                  <tr
                    key={plugin.id}
                    className="transition-colors"
                    style={{
                      background: plugin.hasUpdate ? "rgba(251, 191, 36, 0.05)" : "transparent",
                    }}
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                        {plugin.name}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="font-mono text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        v{plugin.version}
                      </span>
                      {plugin.newVersion && (
                        <div className="flex items-center gap-1 mt-1">
                          <TrendingUp className="w-3 h-3" style={{ color: "#ca8a04" }} />
                          <span
                            className="text-xs font-medium"
                            style={{ color: "#ca8a04" }}
                          >
                            v{plugin.newVersion}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: "#dcfce7", color: "#166534" }}
                      >
                        Activo
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {plugin.hasUpdate ? (
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ background: "#fef3c7", color: "#92400e" }}
                        >
                          Pendiente
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ background: "rgba(220, 252, 231, 0.5)", color: "#166534" }}
                        >
                          Al día
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => toggleUpdateStatus(plugin.id)}
                        className="transition-transform active:scale-95"
                      >
                        {plugin.isUpdated ? (
                          <CheckCircle2
                            className="w-6 h-6 mx-auto"
                            style={{ color: "#16a34a" }}
                          />
                        ) : (
                          <Circle
                            className="w-6 h-6 mx-auto"
                            style={{ color: "var(--text-muted)" }}
                          />
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => deletePlugin(plugin.id)}
                        className="p-2 rounded-lg transition-all hover:bg-red-50"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: "#dc2626" }} />
                      </button>
                    </td>
                  </tr>
                ))}

                {showInactive && inactivePlugins.length > 0 && (
                  <>
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-2 text-xs font-semibold uppercase tracking-wider"
                        style={{
                          background: "var(--bg-tertiary)",
                          color: "var(--text-muted)",
                        }}
                      >
                        Plugins Inactivos ({inactivePlugins.length})
                      </td>
                    </tr>
                    {inactivePlugins.map((plugin) => (
                      <tr
                        key={plugin.id}
                        className="transition-colors opacity-60"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-sm" style={{ color: "var(--text-secondary)" }}>
                            {plugin.name}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="font-mono text-sm"
                            style={{ color: "var(--text-muted)" }}
                          >
                            v{plugin.version}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
                          >
                            Inactivo
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {plugin.hasUpdate ? (
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{ background: "#fef3c7", color: "#92400e" }}
                            >
                              Pendiente
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => toggleUpdateStatus(plugin.id)}
                            className="transition-transform active:scale-95"
                          >
                            {plugin.isUpdated ? (
                              <CheckCircle2
                                className="w-6 h-6 mx-auto"
                                style={{ color: "#16a34a" }}
                              />
                            ) : (
                              <Circle
                                className="w-6 h-6 mx-auto"
                                style={{ color: "var(--text-muted)" }}
                              />
                            )}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => deletePlugin(plugin.id)}
                            className="p-2 rounded-lg transition-all hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" style={{ color: "#dc2626" }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

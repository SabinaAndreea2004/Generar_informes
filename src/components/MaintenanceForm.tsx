"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Circle,
  Send,
  Loader2,
  Globe,
  AlertTriangle,
  CheckSquare,
  FileText,
  Package,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Eye,
} from "lucide-react";
import { checkSite } from "@/app/actions/maintenance";
import { maintenanceTasks } from "@/lib/wordpress";
import { formatHealthImport } from "@/lib/wp-health-parser";
import { Client, MaintenanceTask, SiteCheckData } from "@/types";

interface ManualPlugin {
  id: string;
  name: string;
  version: string;
  status: "active" | "inactive";
  hasUpdate: boolean;
  newVersion?: string;
  isUpdated: boolean;
  author?: string;
}

interface MaintenanceFormProps {
  client: Client;
  onBack: () => void;
  onComplete: () => void;
}

const STORAGE_KEY = "mantenimiento_app_reports";

function saveReport(report: {
  clientId: number;
  clientName: string;
  clientEmail: string;
  siteData: SiteCheckData | null;
  tasks: MaintenanceTask[];
  plugins: ManualPlugin[];
  notes: string;
  sentAt: string;
}) {
  if (typeof window === "undefined") return;
  const reports = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  reports.push(report);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  console.log("📋 Informe guardado:", report);
  console.log("📊 Total informes:", reports.length);
}

export default function MaintenanceForm({ client, onBack, onComplete }: MaintenanceFormProps) {
  const [siteData, setSiteData] = useState<SiteCheckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<"tasks" | "plugins">("tasks");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<{
    wpVersion: string;
    activePlugins: number;
    inactivePlugins: number;
  } | null>(null);
  const [previewPlugins, setPreviewPlugins] = useState<ManualPlugin[] | null>(null);

  const [tasks, setTasks] = useState<MaintenanceTask[]>(
    maintenanceTasks.map((t) => ({
      id: t.id,
      label: t.label,
      completed: t.defaultChecked,
    }))
  );

  const [plugins, setPlugins] = useState<ManualPlugin[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInactive, setShowInactive] = useState(true);
  const [newPlugin, setNewPlugin] = useState({
    name: "",
    version: "",
    status: "active" as "active" | "inactive",
    hasUpdate: false,
    newVersion: "",
  });

  const loadSiteInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await checkSite(client.url);
      if (result.success && result.data) {
        setSiteData(result.data);
      } else {
        setError(result.error || "Error desconocido");
      }
    } catch (e) {
      setError("No se pudo conectar con el sitio");
    }
    setLoading(false);
  }, [client.url]);

  useEffect(() => {
    loadSiteInfo();
  }, [loadSiteInfo]);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const markAllTasksAsCompleted = () => {
    setTasks((prev) => prev.map((t) => ({ ...t, completed: true })));
  };

  const markAllTasksAsPending = () => {
    setTasks((prev) => prev.map((t) => ({ ...t, completed: false })));
  };

  const togglePluginUpdate = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === pluginId ? { ...p, isUpdated: !p.isUpdated } : p))
    );
  };

  const deletePlugin = (pluginId: string) => {
    setPlugins((prev) => prev.filter((p) => p.id !== pluginId));
  };

  const addPlugin = () => {
    if (!newPlugin.name.trim()) return;

    const plugin: ManualPlugin = {
      id: `manual-${Date.now()}`,
      name: newPlugin.name.trim(),
      version: newPlugin.version.trim() || "Desconocida",
      status: newPlugin.status,
      hasUpdate: newPlugin.hasUpdate,
      newVersion: newPlugin.newVersion.trim() || undefined,
      isUpdated: !newPlugin.hasUpdate,
    };

    setPlugins((prev) => [...prev, plugin]);
    setNewPlugin({
      name: "",
      version: "",
      status: "active",
      hasUpdate: false,
      newVersion: "",
    });
    setShowAddForm(false);
  };

  const sampleWpData = `### wp-core ###

version: 6.5.3
site_language: es_ES
user_language: es_ES
timezone: +00:00
permalink: /%postname%/
https_status: true
multisite: false
user_registration: 0
blog_public: 1
default_comment_status: open
environment_type: production
site_url: https://ejemplo.com
home_url: https://ejemplo.com

### wp-active-theme ###

name: Astra (astra)
version: 4.8.2
author: Brainstorm Force
author_website: https://wpastra.com/
is_child_theme: No

### wp-plugins-active (3) ###

Akismet Anti-Spam: version: 5.3.1, author: Automattic, Auto-updates disabled
Yoast SEO: version: 22.7, author: Team Yoast, Auto-updates enabled
WooCommerce: version: 8.9.1, author: Automattic, Auto-updates enabled

### wp-plugins-inactive (2) ###

Hello Dolly: version: 1.7.2, author: Matt Mullenweg, Auto-updates disabled
Classic Editor: version: 1.6.3, author: WordPress Contributors, Auto-updates disabled
`;

  const handlePreview = useCallback(() => {
    setImportError(null);
    setPreviewPlugins(null);

    if (!importText.trim()) {
      return;
    }

    const result = formatHealthImport(importText);

    if (!result.success) {
      setImportError(result.error || "Error al analizar");
      return;
    }

    setPreviewPlugins(result.plugins);
  }, [importText]);

  const fillSampleData = () => {
    setImportText(sampleWpData);
    setImportError(null);
    setPreviewPlugins(null);
    setImportSuccess(null);
  };

  const handleImport = () => {
    setImportError(null);
    setImportSuccess(null);

    const result = formatHealthImport(importText);

    if (!result.success) {
      setImportError(result.error || "Error al importar");
      return;
    }

    setPlugins((prev) => [...prev, ...result.plugins]);
    setImportSuccess(result.info);
    setImportText("");
    setPreviewPlugins(null);

    setTimeout(() => {
      setShowImportModal(false);
      setImportSuccess(null);
    }, 2500);
  };

  const handleSendReport = async () => {
    setSending(true);

    const report = {
      clientId: client.id,
      clientName: client.nombre,
      clientEmail: client.correo,
      siteData,
      tasks,
      plugins,
      notes,
      sentAt: new Date().toISOString(),
    };

    saveReport(report);

    setTimeout(() => {
      setSuccess(true);
      setSending(false);
    }, 800);
  };

  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const activePlugins = plugins.filter((p) => p.status === "active");
  const inactivePlugins = plugins.filter((p) => p.status === "inactive");

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="card-base p-12 text-center max-w-lg">
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ background: "rgba(5, 150, 105, 0.15)" }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: "#34d399" }} />
          </div>
          <h2
            className="text-2xl font-semibold mb-2 section-title"
            style={{ color: "var(--text-primary)" }}
          >
            Informe Generado
          </h2>
          <p className="mb-6" style={{ color: "var(--text-tertiary)" }}>
            El informe se ha guardado correctamente
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Tareas
              </p>
              <p className="text-2xl font-bold" style={{ color: "#34d399" }}>
                {completedTasksCount}/{tasks.length}
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Plugins
              </p>
              <p className="text-2xl font-bold" style={{ color: "#a5b4fc" }}>
                {plugins.length}
              </p>
            </div>
          </div>

          <button
            onClick={onComplete}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all btn-primary"
          >
            Volver al Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl transition-all btn-secondary"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-px" style={{ background: "var(--accent-primary)" }} />
              <span
                className="text-xs font-medium tracking-widest uppercase"
                style={{ color: "var(--accent-muted)" }}
              >
                MANTENIMIENTO
              </span>
            </div>
            <h1
              className="text-xl font-semibold section-title"
              style={{ color: "var(--text-primary)" }}
            >
              {client.nombre}
            </h1>
            <p
              className="text-sm font-mono mt-0.5"
              style={{ color: "var(--accent-muted)" }}
            >
              {client.url}
            </p>
          </div>
        </div>
        <button
          onClick={loadSiteInfo}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all btn-secondary disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Verificar
        </button>
      </div>

      {loading ? (
        <div className="card-base p-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-12 h-12 rounded-full border-2 border-t-2 animate-spin"
              style={{
                borderColor: "var(--border-medium)",
                borderTopColor: "var(--accent-primary)",
              }}
            />
            <p style={{ color: "var(--text-tertiary)" }}>
              Verificando sitio...
            </p>
          </div>
        </div>
      ) : (
        <>
          {siteData && (
            <div className="card-base p-5">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div
                  className="p-3 rounded-xl"
                  style={{
                    background: siteData.isReachable
                      ? "rgba(5, 150, 105, 0.15)"
                      : "rgba(220, 38, 38, 0.15)",
                  }}
                >
                  <Globe
                    className="w-5 h-5"
                    style={{
                      color: siteData.isReachable ? "#34d399" : "#f87171",
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h2
                    className="font-medium text-lg"
                    style={{
                      color: "var(--text-primary)",
                    }}
                  >
                    {siteData.siteName}
                  </h2>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {client.url}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Versión WP
                  </p>
                  <p
                    className="text-lg font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {siteData.wpVersion}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && !siteData && (
            <div
              className="card-base p-5"
              style={{
                background: "rgba(245, 158, 11, 0.1)",
                borderColor: "rgba(245, 158, 11, 0.3)",
              }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  style={{ color: "#fbbf24" }}
                />
                <div>
                  <p className="font-medium" style={{ color: "#fbbf24" }}>
                    {error}
                  </p>
                  <p
                    className="text-xs mt-2"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Puedes continuar con el mantenimiento manualmente.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 p-1 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === "tasks" ? "" : ""}`}
              style={{
                background: activeTab === "tasks" ? "var(--bg-card)" : "transparent",
                color: activeTab === "tasks" ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: activeTab === "tasks" ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
                borderBottom: activeTab === "tasks" ? "2px solid var(--accent-primary)" : "2px solid transparent",
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Tareas ({completedTasksCount}/{tasks.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab("plugins")}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === "plugins" ? "" : ""}`}
              style={{
                background: activeTab === "plugins" ? "var(--bg-card)" : "transparent",
                color: activeTab === "plugins" ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: activeTab === "plugins" ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
                borderBottom: activeTab === "plugins" ? "2px solid var(--accent-primary)" : "2px solid transparent",
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <Package className="w-4 h-4" />
                Plugins ({plugins.length})
              </span>
            </button>
          </div>

          {activeTab === "tasks" && (
            <div className="card-base overflow-hidden">
              <div
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4"
                style={{
                  background: "var(--bg-tertiary)",
                  borderBottom: "1px solid var(--border-medium)",
                }}
              >
                <h3
                  className="font-medium"
                  style={{
                    color: "var(--text-primary)",
                  }}
                >
                  Tareas de Mantenimiento
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={markAllTasksAsCompleted}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all btn-success"
                  >
                    Marcar todas
                  </button>
                  <button
                    onClick={markAllTasksAsPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all btn-secondary"
                  >
                    Desmarcar
                  </button>
                </div>
              </div>

              <div className="divide-y" style={{ borderColor: "var(--border-medium)" }}>
                {tasks.map((task, index) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-opacity-50"
                    style={{
                      background: task.completed
                        ? "rgba(5, 150, 105, 0.08)"
                        : "transparent",
                    }}
                  >
                    {task.completed ? (
                      <CheckCircle2
                        className="w-5 h-5 flex-shrink-0"
                        style={{ color: "#34d399" }}
                      />
                    ) : (
                      <Circle
                        className="w-5 h-5 flex-shrink-0"
                        style={{ color: "var(--text-muted)" }}
                      />
                    )}
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: task.completed
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                      }}
                    >
                      {task.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "plugins" && (
            <div className="card-base overflow-hidden">
              <div
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4"
                style={{
                  background: "var(--bg-tertiary)",
                  borderBottom: "1px solid var(--border-medium)",
                }}
              >
                <div>
                  <h3
                    className="font-medium"
                    style={{
                      color: "var(--text-primary)",
                    }}
                  >
                    Gestión de Plugins
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Importa desde WordPress o añade manualmente
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowImportModal(!showImportModal)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all btn-primary"
                  >
                    <span className="flex items-center gap-1">
                      <Clipboard className="w-3 h-3" />
                      Desde WP
                    </span>
                  </button>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all btn-secondary"
                  >
                    <span className="flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      Añadir
                    </span>
                  </button>
                  {plugins.length > 0 && (
                    <button
                      onClick={() => setShowInactive(!showInactive)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all btn-secondary"
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
                  )}
                </div>
              </div>

              {showImportModal && (
                <div
                  className="p-5"
                  style={{
                    background: "rgba(99, 102, 241, 0.05)",
                    borderBottom: "1px solid var(--border-medium)",
                    borderTop: "1px solid var(--border-medium)",
                  }}
                >
                  <div className="mb-4 p-4 rounded-xl" style={{ background: "var(--bg-card)" }}>
                    <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                      📋 Pasos para importar desde WordPress
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--accent-primary)", color: "white" }}>1</span>
                        <div>
                          <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Ir a Herramientas</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Panel → Herramientas → Salud del Sitio</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--accent-primary)", color: "white" }}>2</span>
                        <div>
                          <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Pestaña Información</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Haz clic en la pestaña "Información"</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--accent-primary)", color: "white" }}>3</span>
                        <div>
                          <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Copiar y pegar</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Botón "Copiar información al portapapeles"</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={fillSampleData}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{ 
                          background: "rgba(99, 102, 241, 0.1)", 
                          color: "var(--accent-muted)",
                          border: "1px dashed rgba(99, 102, 241, 0.3)"
                        }}
                      >
                        <span className="text-base">✨</span>
                        Probar con datos de ejemplo
                      </button>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        (Rellena este campo con datos simulados para probar)
                      </p>
                    </div>
                  </div>

                  <textarea
                    value={importText}
                    onChange={(e) => {
                      setImportText(e.target.value);
                      setImportError(null);
                      setPreviewPlugins(null);
                      setImportSuccess(null);
                    }}
                    placeholder={`Pega aquí el texto copiado de WordPress...

Ejemplo del formato que busca:
### wp-plugins-active (2) ###
Akismet Anti-Spam: version: 5.3.1, author: Automattic
Yoast SEO: version: 22.7, author: Team Yoast`}
                    rows={6}
                    className="w-full p-4 rounded-xl text-sm outline-none transition-all resize-none input-field"
                    style={{ lineHeight: "1.6", background: "var(--bg-card)", fontFamily: "monospace", fontSize: "12px" }}
                  />
                  
                  {previewPlugins && previewPlugins.length > 0 && (
                    <div className="mt-4 p-4 rounded-xl" style={{ background: "rgba(5, 150, 105, 0.08)", border: "1px solid rgba(5, 150, 105, 0.2)" }}>
                      <h5 className="text-sm font-semibold mb-3" style={{ color: "#34d399" }}>
                        ✓ Vista previa - Se encontraron {previewPlugins.length} plugins
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {previewPlugins.slice(0, 10).map((p, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "var(--bg-card)" }}>
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                background: p.status === "active" ? "rgba(5, 150, 105, 0.15)" : "rgba(148, 163, 184, 0.1)",
                                color: p.status === "active" ? "#34d399" : "#94a3b8",
                              }}
                            >
                              {p.status === "active" ? "Activo" : "Inactivo"}
                            </span>
                            <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                              {p.name}
                            </span>
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                              v{p.version}
                            </span>
                          </div>
                        ))}
                        {previewPlugins.length > 10 && (
                          <p className="text-xs col-span-2" style={{ color: "var(--text-muted)" }}>
                            ... y {previewPlugins.length - 10} más
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {importError && (
                    <div className="mt-4 p-4 rounded-xl" style={{ background: "rgba(248, 113, 113, 0.08)", border: "1px solid rgba(248, 113, 113, 0.2)" }}>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#fbbf24" }} />
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: "#fbbf24" }}>
                            No se pudieron detectar plugins
                          </p>
                          <p className="text-xs whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                            {importError}
                          </p>
                          <div className="mt-2 p-2 rounded" style={{ background: "var(--bg-card)" }}>
                            <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                              Formato esperado:
                            </p>
                            <p className="text-xs font-mono mt-1" style={{ color: "#a5b4fc" }}>
                              NombrePlugin: version: X.Y.Z, author: Autor
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {importSuccess && (
                    <div className="mt-4 p-4 rounded-xl flex items-center gap-3" style={{ background: "rgba(5, 150, 105, 0.1)", border: "1px solid rgba(52, 211, 153, 0.3)" }}>
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#34d399" }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#34d399" }}>
                          ✓ Importación exitosa!
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                          {importSuccess.activePlugins} activos, {importSuccess.inactivePlugins} inactivos
                          {importSuccess.wpVersion && ` | WP v${importSuccess.wpVersion}`}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-between items-center mt-4 gap-3">
                    <div className="flex gap-2">
                      <button
                        onClick={handlePreview}
                        disabled={!importText.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 btn-secondary"
                      >
                        <Eye className="w-4 h-4" />
                        Vista previa
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowImportModal(false);
                          setImportText("");
                          setImportError(null);
                          setImportSuccess(null);
                          setPreviewPlugins(null);
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all btn-secondary"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleImport}
                        disabled={!importText.trim() || !!importSuccess}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium transition-all btn-primary disabled:opacity-50"
                      >
                        {previewPlugins && previewPlugins.length > 0 ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Importar {previewPlugins.length} plugins
                          </>
                        ) : (
                          <>
                            <Package className="w-4 h-4" />
                            Importar Plugins
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showAddForm && (
                <div
                  className="p-5"
                  style={{
                    background: "var(--bg-tertiary)",
                    borderBottom: "1px solid var(--border-medium)",
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                    <div className="md:col-span-2">
                      <label
                        className="block text-xs font-medium mb-1.5"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={newPlugin.name}
                        onChange={(e) =>
                          setNewPlugin({ ...newPlugin, name: e.target.value })
                        }
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
                        onChange={(e) =>
                          setNewPlugin({ ...newPlugin, version: e.target.value })
                        }
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
                          setNewPlugin({
                            ...newPlugin,
                            status: e.target.value as "active" | "inactive",
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all input-field"
                      >
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPlugin.hasUpdate}
                        onChange={(e) =>
                          setNewPlugin({ ...newPlugin, hasUpdate: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                      <span
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Tiene actualización pendiente
                      </span>
                    </label>
                    <div className="flex gap-2">
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
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all btn-secondary"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          if (newPlugin.name.trim()) {
                            addPlugin();
                          }
                        }}
                        disabled={!newPlugin.name.trim()}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all btn-primary disabled:opacity-50"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {plugins.length === 0 ? (
                <div className="p-12 text-center">
                  <div
                    className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                    style={{ background: "var(--bg-tertiary)" }}
                  >
                    <Package
                      className="w-8 h-8"
                      style={{ color: "var(--text-muted)" }}
                    />
                  </div>
                  <p
                    className="font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    No hay plugins registrados
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Usa "Desde WP" para importar desde Salud del Sitio
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: "var(--bg-tertiary)" }}>
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
                          Actualizado
                        </th>
                        <th
                          className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          Eliminar
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className="divide-y"
                      style={{ borderColor: "var(--border-medium)" }}
                    >
                      {activePlugins.map((plugin) => (
                        <tr
                          key={plugin.id}
                          className="transition-colors hover:bg-opacity-50"
                          style={{
                            background: "transparent",
                          }}
                        >
                          <td className="px-5 py-4">
                            <p
                              className="font-medium text-sm"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {plugin.name}
                            </p>
                            {plugin.author && (
                              <p
                                className="text-xs mt-0.5"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {plugin.author}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className="font-mono text-sm"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              v{plugin.version}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium badge-active"
                            >
                              Activo
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={() => togglePluginUpdate(plugin.id)}
                              className="transition-transform active:scale-95"
                            >
                              {plugin.isUpdated ? (
                                <CheckCircle2
                                  className="w-6 h-6 mx-auto"
                                  style={{ color: "#34d399" }}
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
                              className="p-2 rounded-lg transition-all hover:bg-red-900/20"
                              title="Eliminar"
                            >
                              <Trash2
                                className="w-4 h-4"
                                style={{ color: "#f87171" }}
                              />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {showInactive && inactivePlugins.length > 0 && (
                        <>
                          <tr>
                            <td
                              colSpan={5}
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
                                <p
                                  className="font-medium text-sm"
                                  style={{ color: "var(--text-secondary)" }}
                                >
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
                                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium badge-inactive"
                                >
                                  Inactivo
                                </span>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <button
                                  onClick={() => togglePluginUpdate(plugin.id)}
                                  className="transition-transform active:scale-95"
                                >
                                  {plugin.isUpdated ? (
                                    <CheckCircle2
                                      className="w-6 h-6 mx-auto"
                                      style={{ color: "#34d399" }}
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
                                  className="p-2 rounded-lg transition-all hover:bg-red-900/20"
                                >
                                  <Trash2
                                    className="w-4 h-4"
                                    style={{ color: "#f87171" }}
                                  />
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
          )}

          <div className="card-base p-5">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="p-2.5 rounded-xl"
                style={{ background: "rgba(99, 102, 241, 0.15)" }}
              >
                <FileText
                  className="w-4 h-4"
                  style={{ color: "#a5b4fc" }}
                />
              </div>
              <h2
                className="font-medium"
                style={{
                  color: "var(--text-primary)",
                }}
              >
                Notas Adicionales
              </h2>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Añade observaciones: plugins actualizados, problemas, recomendaciones..."
              className="w-full p-4 rounded-xl text-sm resize-none outline-none transition-all input-field"
              style={{ lineHeight: "1.7" }}
            />
          </div>

          <div
            className="sticky bottom-0 pt-4 pb-2"
            style={{
              background:
                "linear-gradient(to top, var(--bg-primary), transparent",
            }}
          >
            <div className="card-base p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Resumen
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span style={{ color: "#34d399" }}>
                    {completedTasksCount} tareas
                  </span>
                  {" • "}
                  <span style={{ color: "#a5b4fc" }}>
                    {plugins.length} plugins
                  </span>
                </p>
              </div>
              <button
                onClick={handleSendReport}
                disabled={sending}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all btn-primary disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Generar Informe
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

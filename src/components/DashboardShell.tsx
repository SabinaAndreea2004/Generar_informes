"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Globe, Search, Plus, Loader2, ChevronRight, Calendar,
  Users, CheckCircle2, RefreshCw, X, Building2, ChevronDown, ChevronLeft,
  UserCheck, UserX, Sparkles,
} from "lucide-react";
import {
  Client, MaintenancePlugin, getCurrentMonthNumber, getCurrentYear,
  getMonthYear,
} from "@/types";
import ImportModal from "./ImportModal";
import ReportPreviewModal from "./ReportPreviewModal";
import ConfirmDialog from "./ConfirmDialog";
import ClientFormModal from "./ClientFormModal";
import MantenimientoPanel from "./mantenimiento/MantenimientoPanel";

const SAMPLE_PLUGINS = [
  { name: "Yoast SEO", version: "22.7", author: "Team Yoast", hasUpdate: true, newVersion: "22.8" },
  { name: "WooCommerce", version: "8.9.1", author: "Automattic", hasUpdate: true, newVersion: "9.0.0" },
  { name: "Akismet Anti-Spam", version: "5.3.1", author: "Automattic", hasUpdate: false },
  { name: "Elementor", version: "3.22.0", author: "Elementor.com", hasUpdate: false },
  { name: "Contact Form 7", version: "5.9.8", author: "Takayuki Miyoshi", hasUpdate: true, newVersion: "6.0" },
  { name: "WP Rocket", version: "3.16.4", author: "WP Media", hasUpdate: false },
  { name: "Wordfence Security", version: "7.11.5", author: "Wordfence", hasUpdate: true, newVersion: "7.11.6" },
  { name: "UpdraftPlus", version: "1.24.1", author: "UpdraftPlus", hasUpdate: false },
];

function generatePlugins(hasUpdates = true): MaintenancePlugin[] {
  const shuffled = [...SAMPLE_PLUGINS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.floor(Math.random() * 4) + 4).map((p, i) => ({
    id: `plugin-${Date.now()}-${i}`,
    name: p.name,
    version: p.version,
    author: p.author,
    status: i < 4 ? "active" as const : "inactive" as const,
    hasUpdate: hasUpdates ? p.hasUpdate : false,
    newVersion: p.newVersion,
    isUpdatedThisMonth: false,
  }));
}

interface MonthlyRecord {
  id?: number;
  clientId: number;
  year: number;
  month: number;
  wpVersion: string;
  plugins: MaintenancePlugin[];
  notes: string;
  closed: boolean;
  closedAt?: string;
}

export default function DashboardShell() {
  const [clients, setClients] = useState<Client[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActivo, setFilterActivo] = useState<string>("all");
  const [filterMantenimiento, setFilterMantenimiento] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthNumber());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [calendarViewYear, setCalendarViewYear] = useState(getCurrentYear());
  const [showClientModal, setShowClientModal] = useState(false);

  const [plugins, setPlugins] = useState<MaintenancePlugin[]>([]);
  const [wpVersion, setWpVersion] = useState("6.5.3");
  const [hasScanned, setHasScanned] = useState(false);
  const [notes, setNotes] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [monthlyRecords, setMonthlyRecords] = useState<MonthlyRecord[]>([]);
  const [allMonthStatus, setAllMonthStatus] = useState<Record<number, { closed: boolean; hasPlugins: boolean }>>({});

  const [showImportModal, setShowImportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Client | null>(null);
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const currentMonthYear = getMonthYear(selectedMonth, selectedYear);
  const isCurrentMonth = selectedMonth === getCurrentMonthNumber() && selectedYear === getCurrentYear();

  const fetchClients = useCallback(async (page = 1, search = "", filter = "all") => {
    setLoadingClients(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (search) params.set("search", search);
      if (filter === "active") params.set("activo", "true");
      else if (filter === "inactive") params.set("activo", "false");
      const res = await fetch(`/api/clients?${params}`);
      if (!res.ok) throw new Error("Error fetching clients");
      const data = await res.json();
      setClients(data.clients);
      setTotalClients(data.total);
      setCurrentPage(data.page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClients(false);
      setLoading(false);
    }
  }, []);

  const fetchMonthlyRecords = useCallback(async (clientId: number) => {
    try {
      const res = await fetch(`/api/monthly?clientId=${clientId}`);
      if (!res.ok) throw new Error("Error fetching monthly records");
      const data = await res.json();
      setMonthlyRecords(data.records.map((r: any) => ({
        ...r,
        plugins: typeof r.plugins === "string" ? JSON.parse(r.plugins) : r.plugins,
      })));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAllMonthStatus = useCallback(async (year: number, month: number) => {
    try {
      const res = await fetch(`/api/monthly?year=${year}&month=${month}`);
      if (!res.ok) throw new Error("Error fetching month status");
      const data = await res.json();
      const map: Record<number, { closed: boolean; hasPlugins: boolean }> = {};
      for (const r of data.records) {
        const plugins = typeof r.plugins === "string" ? JSON.parse(r.plugins) : r.plugins;
        map[r.clientId] = {
          closed: r.closed,
          hasPlugins: Array.isArray(plugins) && plugins.length > 0,
        };
      }
      setAllMonthStatus(map);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchClients(); fetchAllMonthStatus(selectedYear, selectedMonth); }, [fetchClients, fetchAllMonthStatus, selectedYear, selectedMonth]);

  const activeCount = clients.filter((c) => c.activo).length;

  const completedThisMonth = useMemo(() => {
    return (
      monthlyRecords.filter((r) => {
        if (r.clientId === selectedClient?.id) return false;
        return r.closed;
      }).length +
      (reportSent ? 1 : 0)
    );
  }, [monthlyRecords, selectedClient, reportSent]);

  const progressPercentage = activeCount > 0 ? Math.round((completedThisMonth / activeCount) * 100) : 0;

  const handleSelectClient = useCallback(async (client: Client) => {
    if (!client.activo) return;
    setSelectedClient(client);
    setReportSent(false);
    setNotes("");
    setPlugins([]);
    setHasScanned(false);
    setShowClientModal(false);
    await fetchMonthlyRecords(client.id);
    const currentRecord = monthlyRecords.find(
      (r) => r.clientId === client.id && r.year === selectedYear && r.month === selectedMonth
    );
    if (currentRecord) {
      setPlugins(currentRecord.plugins);
      setWpVersion(currentRecord.wpVersion);
      setHasScanned(true);
      setNotes(currentRecord.notes || "");
      setReportSent(currentRecord.closed);
    }
  }, [fetchMonthlyRecords, monthlyRecords, selectedYear, selectedMonth]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    fetchClients(1, value, filterActivo);
  }, [fetchClients, filterActivo]);

  const handleFilterChange = useCallback((filter: string) => {
    setFilterActivo(filter);
    fetchClients(1, searchQuery, filter);
  }, [fetchClients, searchQuery]);

  const handleChangeMonth = useCallback((month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setSelectedClient(null);
    setPlugins([]);
    setHasScanned(false);
    setReportSent(false);
    setNotes("");
    setShowMonthSelector(false);
  }, []);

  const saveMonthly = useCallback(async (data: Partial<MonthlyRecord>) => {
    if (!selectedClient) return;
    setSaving(true);
    try {
      await fetch("/api/monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          year: selectedYear,
          month: selectedMonth,
          wpVersion,
          plugins,
          notes,
          closed: reportSent,
          ...data,
        }),
      });
      await fetchMonthlyRecords(selectedClient.id);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [selectedClient, selectedYear, selectedMonth, wpVersion, plugins, notes, reportSent, fetchMonthlyRecords]);

  const handleScanPlugins = useCallback(() => {
    if (!selectedClient) return;
    if (plugins.length > 0 && hasScanned) { setHasScanned(true); return; }
    setScanning(true);
    setTimeout(() => {
      const newPlugins = generatePlugins(true);
      const newWpVersion = `6.${Math.floor(Math.random() * 5) + 2}.${Math.floor(Math.random() * 10)}`;
      setPlugins(newPlugins);
      setWpVersion(newWpVersion);
      setHasScanned(true);
      setScanning(false);
      saveMonthly({ plugins: newPlugins, wpVersion: newWpVersion });
    }, 800);
  }, [selectedClient, plugins, hasScanned, saveMonthly]);

  const handleTogglePluginUpdated = useCallback((pluginId: string) => {
    setPlugins((prev) => prev.map((p) => p.id === pluginId ? { ...p, isUpdatedThisMonth: !p.isUpdatedThisMonth } : p));
  }, []);

  const handleCopyFromPreviousMonth = useCallback(() => {
    if (!selectedClient) return;
    let pm = selectedMonth - 1, py = selectedYear;
    if (pm < 0) { pm = 11; py--; }
    const prevRecord = monthlyRecords.find((r) => r.clientId === selectedClient.id && r.year === py && r.month === pm);
    if (prevRecord) {
      const resetPlugins: MaintenancePlugin[] = prevRecord.plugins.map((p) => ({
        ...p,
        id: `plugin-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        isUpdatedThisMonth: false,
      }));
      setPlugins(resetPlugins);
      setWpVersion(prevRecord.wpVersion);
      setHasScanned(true);
      setNotes("");
      setReportSent(false);
      saveMonthly({ plugins: resetPlugins, wpVersion: prevRecord.wpVersion, notes: "", closed: false });
    }
    setShowCopyConfirm(false);
  }, [selectedClient, selectedMonth, selectedYear, monthlyRecords, saveMonthly]);

  const handleClearMonth = useCallback(() => {
    if (!selectedClient) return;
    setPlugins([]);
    setHasScanned(false);
    setReportSent(false);
    setNotes("");
    saveMonthly({ plugins: [], wpVersion: "", notes: "", closed: false });
    setShowClearConfirm(false);
  }, [selectedClient, saveMonthly]);

  const handleSendReport = useCallback(async () => {
    if (!selectedClient) return;
    setSendingReport(true);
    try {
      await fetch("/api/monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          year: selectedYear,
          month: selectedMonth,
          wpVersion, plugins, notes,
          closed: true,
          closedAt: new Date().toISOString(),
        }),
      });
      setReportSent(true);
      await fetchMonthlyRecords(selectedClient.id);
    } catch (err) {
      console.error(err);
      setReportSent(true);
    } finally {
      setSendingReport(false);
    }
  }, [selectedClient, selectedYear, selectedMonth, wpVersion, plugins, notes, fetchMonthlyRecords]);

  const handleAddClient = useCallback(async (data: { nombre: string; correo: string; dni: string; url: string }) => {
    const res = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) {
      await fetchClients(currentPage, searchQuery, filterActivo);
      setShowAddForm(false);
    }
  }, [fetchClients, currentPage, searchQuery, filterActivo]);

  const handleEditClient = useCallback(async (data: any) => {
    if (!editingClient) return;
    await fetch(`/api/clients/${editingClient.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    await fetchClients(currentPage, searchQuery, filterActivo);
    setEditingClient(null);
    if (selectedClient?.id === editingClient.id) {
      setSelectedClient((prev) => prev ? { ...prev, ...data } : prev);
    }
  }, [editingClient, fetchClients, currentPage, searchQuery, filterActivo, selectedClient]);

  const handleDeleteClient = useCallback(async () => {
    if (!showDeleteConfirm) return;
    await fetch(`/api/clients/${showDeleteConfirm.id}`, { method: "DELETE" });
    await fetchClients(currentPage, searchQuery, filterActivo);
    if (selectedClient?.id === showDeleteConfirm.id) setSelectedClient(null);
    setShowDeleteConfirm(null);
  }, [showDeleteConfirm, fetchClients, currentPage, searchQuery, filterActivo, selectedClient]);

  const handleToggleActive = useCallback(async (e: React.SyntheticEvent, c: Client) => {
    e.stopPropagation();
    await fetch(`/api/clients/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activo: !c.activo }) });
    await fetchClients(currentPage, searchQuery, filterActivo);
  }, [fetchClients, currentPage, searchQuery, filterActivo]);

  const handlePluginAction = useCallback((action: string) => {
    setPlugins((prev) => {
      switch (action) {
        case "markAll": return prev.map((p) => ({ ...p, isUpdatedThisMonth: p.status === "active" ? true : p.isUpdatedThisMonth }));
        case "markPending": return prev.map((p) => ({ ...p, isUpdatedThisMonth: p.hasUpdate && p.status === "active" ? true : p.isUpdatedThisMonth }));
        case "unmarkAll": return prev.map((p) => ({ ...p, isUpdatedThisMonth: false }));
        default: return prev;
      }
    });
  }, []);

  const updatedCount = plugins.filter((p) => p.isUpdatedThisMonth).length;
  const totalActivePlugins = plugins.filter((p) => p.status === "active").length;
  const withUpdatesCount = plugins.filter((p) => p.hasUpdate && p.status === "active").length;

  const filteredByMaintenance = useMemo(() => {
    if (filterMantenimiento === "all") return clients;
    return clients.filter((c) => {
      const status = allMonthStatus[c.id];
      switch (filterMantenimiento) {
        case "pending": return !status || (!status.closed && !status.hasPlugins);
        case "progress": return status && !status.closed && status.hasPlugins;
        case "completed": return status && status.closed;
        default: return true;
      }
    });
  }, [clients, filterMantenimiento, allMonthStatus]);

  const renderClientModalContent = () => (
    <div className="flex flex-col gap-4 h-full">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
        <input
          type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface text-body-sm font-body-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-container transition-all placeholder:text-outline"
        />
      </div>

      <div className="flex gap-1 bg-surface-container p-1 rounded-xl">
        {["all", "active", "inactive"].map((f) => (
          <button key={f} onClick={() => handleFilterChange(f)}
            className={`flex-1 py-1.5 text-label-sm font-label-sm rounded-lg transition-all ${
              filterActivo === f
                ? "bg-white text-on-surface shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}>
            {f === "all" ? "Todos" : f === "active" ? "Activos" : "Inactivos"}
          </button>
        ))}
      </div>

      <div className="flex gap-1">
        {[
          { key: "all", label: "Todos", dot: "bg-outline" },
          { key: "pending", label: "Pendiente", dot: "bg-outline" },
          { key: "progress", label: "Progreso", dot: "bg-tertiary" },
          { key: "completed", label: "Completado", dot: "bg-green-500" },
        ].map(({ key, label, dot }) => (
          <button key={key} onClick={() => setFilterMantenimiento(key)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-all ${
              filterMantenimiento === key
                ? "bg-surface-container-high text-on-surface shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot} ${filterMantenimiento === key ? "" : "opacity-40"}`} />
            {label}
          </button>
        ))}
      </div>

      <button onClick={() => { setShowAddForm(true); setShowClientModal(false); }}
        className="w-full py-3 bg-primary text-on-primary rounded-xl text-label-md font-label-md flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]">
        <Plus className="w-4 h-4" /> Añadir clientes
      </button>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-1 pr-1">
        {loadingClients ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        ) : filteredByMaintenance.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="w-10 h-10 text-outline mx-auto mb-3" />
            <p className="text-body-sm font-body-sm text-outline">{searchQuery ? "No hay resultados" : "No hay clientes"}</p>
          </div>
        ) : (
          filteredByMaintenance.map((c) => {
            const st = allMonthStatus[c.id];
            let statusDot = "bg-outline";
            let statusLabel = "Sin actividad";
            if (st?.closed) { statusDot = "bg-green-500"; statusLabel = "Completado"; }
            else if (st?.hasPlugins) { statusDot = "bg-tertiary"; statusLabel = "En progreso"; }
            return (
              <div key={c.id} onClick={() => handleSelectClient(c)}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all border border-transparent hover:border-outline-variant ${
                  !c.activo ? "opacity-50" : ""
                } bg-surface-container-lowest hover:bg-surface-container-low hover:shadow-sm active:scale-[0.99]`}>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm">
                  {c.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-body-sm font-body-sm font-semibold text-on-surface truncate">{c.nombre}</p>
                    {c.activo ? (
                      <UserCheck className="w-3 h-3 text-green-500 shrink-0" />
                    ) : (
                      <UserX className="w-3 h-3 text-outline shrink-0" />
                    )}
                  </div>
                  <p className="text-label-sm font-label-sm text-outline truncate">{c.url}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label onClick={(e) => e.stopPropagation()} className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={c.activo} onChange={(e) => handleToggleActive(e, c)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-outline rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                  <span className={`w-2 h-2 rounded-full ${statusDot}`} title={statusLabel} />
                  <ChevronRight className="w-4 h-4 text-outline opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalClients > 50 && (
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-outline-variant/30">
          <button onClick={() => fetchClients(currentPage - 1, searchQuery, filterActivo)}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 text-label-sm font-label-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface disabled:opacity-30 hover:bg-surface-container transition-all">
            Anterior
          </button>
          <span className="text-label-sm font-label-sm text-on-surface-variant">{currentPage} / {Math.ceil(totalClients / 50)}</span>
          <button onClick={() => fetchClients(currentPage + 1, searchQuery, filterActivo)}
            disabled={currentPage >= Math.ceil(totalClients / 50)}
            className="px-3 py-1.5 text-label-sm font-label-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface disabled:opacity-30 hover:bg-surface-container transition-all">
            Siguiente
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Globe className="w-6 h-6 text-on-primary" />
          </div>
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-body-sm font-body-sm text-on-surface-variant font-medium">Cargando panel...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 bg-surface-container-lowest border-b border-outline-variant/40 backdrop-blur-lg bg-white/90">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <Globe className="w-5 h-5 text-on-primary" />
            </div>
            <div>
              <h1 className="text-headline-md font-headline-md text-on-surface tracking-tight">Mantenimiento Web</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <button onClick={() => setShowMonthSelector(!showMonthSelector)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-label-sm font-label-sm border transition-all ${
                    isCurrentMonth
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "bg-surface-container border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
                  }`}>
                  <Calendar className="w-3.5 h-3.5" />
                  {currentMonthYear}
                  <ChevronDown className={`w-3 h-3 transition-transform ${showMonthSelector ? "rotate-180" : ""}`} />
                </button>
                {isCurrentMonth && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold uppercase tracking-wider">Actual</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowClientModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-label-md font-label-md hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Seleccionar Cliente</span>
              <span className="sm:hidden">Cliente</span>
            </button>



          </div>
        </div>

        {showMonthSelector && (
          <div className="absolute top-full left-4 sm:left-8 mt-1 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl z-50 p-3 min-w-[300px] animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Calendar header with year navigation */}
            <div className="flex items-center justify-between mb-2 px-1">
              <button onClick={() => setCalendarViewYear((y) => y - 1)}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-label-md font-label-md text-on-surface font-semibold">{calendarViewYear}</span>
              <button onClick={() => setCalendarViewYear((y) => y + 1)}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map((name, idx) => {
                const isSel = idx === selectedMonth && calendarViewYear === selectedYear;
                const monthClosed = monthlyRecords.filter((r) => r.year === calendarViewYear && r.month === idx && r.closed).length;
                const isFuture = calendarViewYear > getCurrentYear() || (calendarViewYear === getCurrentYear() && idx > getCurrentMonthNumber());
                return (
                  <button key={idx} onClick={() => !isFuture && handleChangeMonth(idx, calendarViewYear)}
                    disabled={isFuture}
                    className={`flex flex-col items-center gap-0.5 px-2 py-2.5 rounded-xl text-body-sm font-body-sm transition-all ${
                      isFuture
                        ? "opacity-30 cursor-not-allowed"
                        : isSel
                          ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/30"
                          : "hover:bg-surface-container text-on-surface"
                    }`}>
                    <span>{name}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                      monthClosed === 0 || monthClosed === undefined
                        ? "text-on-surface-variant"
                        : monthClosed === activeCount && activeCount > 0
                          ? "bg-secondary/10 text-secondary"
                          : "bg-surface-container text-on-surface-variant"
                    }`}>
                      {monthClosed}/{activeCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Client Selection Modal */}
      {showClientModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowClientModal(false)} />
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant w-full max-w-lg max-h-[75vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-headline-md font-headline-md text-on-surface">Seleccionar Cliente</h2>
              </div>
              <button onClick={() => setShowClientModal(false)}
                className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 flex-1 overflow-hidden">
              {renderClientModalContent()}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-6">
        {!selectedClient ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant flex flex-col items-center justify-center py-24 px-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-5">
              <Sparkles className="w-8 h-8 text-outline" />
            </div>
            <h3 className="text-headline-md font-headline-md text-on-surface mb-1">Bienvenido al Panel de Mantenimiento</h3>
            <p className="text-body-sm font-body-sm text-on-surface-variant max-w-md mb-6">
              Selecciona un cliente para gestionar sus plugins, actualizaciones y enviar informes mensuales.
            </p>
            <button onClick={() => setShowClientModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl text-label-md font-label-md hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]">
              <Building2 className="w-4 h-4" />
              Elegir Cliente
            </button>
          </div>
        ) : (
          <MantenimientoPanel
            id={String(selectedClient.id)}
            nombreEmpresa={selectedClient.nombre}
            emailCliente={selectedClient.correo}
            urlWeb={selectedClient.url}
            mantenimientoActivo={selectedClient.activo}
            onToggleMantenimiento={async () => {
              await fetch(`/api/clients/${selectedClient.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activo: !selectedClient.activo }) });
              await fetchClients(currentPage, searchQuery, filterActivo);
            }}
          />
        )}
      </div>

      {showImportModal && (
        <ImportModal
          onImport={(importedPlugins: MaintenancePlugin[], wpVer?: string) => {
            setPlugins((prev) => [...prev, ...importedPlugins]);
            if (wpVer) setWpVersion(wpVer);
            setHasScanned(true);
            setShowImportModal(false);
          }}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {showPreviewModal && selectedClient && (
        <ReportPreviewModal
          client={selectedClient} currentMonthYear={currentMonthYear}
          plugins={plugins} wpVersion={wpVersion} notes={notes}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      {showAddForm && (
        <ClientFormModal title="Nuevo Cliente" onSave={handleAddClient} onClose={() => { setShowAddForm(false); setShowClientModal(true); }} />
      )}

      {editingClient && (
        <ClientFormModal title="Editar Cliente" client={editingClient} onSave={handleEditClient} onClose={() => setEditingClient(null)} />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog title="Eliminar Cliente" message={`\u00bfEst\u00e1s seguro de eliminar a "${showDeleteConfirm.nombre}"? Se eliminar\u00e1n todos sus datos de mantenimiento.`}
          confirmLabel="Eliminar" onConfirm={handleDeleteClient} onCancel={() => setShowDeleteConfirm(null)} variant="danger" />
      )}

      {showCopyConfirm && (
        <ConfirmDialog title="Copiar del Mes Anterior" message="Se copiar\u00e1n los plugins y configuraci\u00f3n del mes anterior. Cualquier cambio no guardado se perder\u00e1."
          confirmLabel="Confirmar Copia" onConfirm={handleCopyFromPreviousMonth} onCancel={() => setShowCopyConfirm(false)} />
      )}

      {showClearConfirm && (
        <ConfirmDialog title="Limpiar Datos del Mes" message="\u00bfEst\u00e1s seguro? Se eliminar\u00e1n todos los plugins, notas y el estado de este mes."
          confirmLabel="Limpiar" onConfirm={handleClearMonth} onCancel={() => setShowClearConfirm(false)} variant="danger" />
      )}
    </div>
  );
}

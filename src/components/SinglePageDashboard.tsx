"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  RefreshCw,
  CheckCircle2,
  Send,
  Loader2,
  Globe,
  Package,
  Plus,
  X,
  CheckSquare,
  Square,
  AlertCircle,
  Eye,
  Save,
  ChevronRight,
  MoreHorizontal,
  TrendingUp,
  Users,
  Settings,
  FileText,
  Zap,
  Calendar,
} from "lucide-react";
import { 
  Client, 
  MaintenancePlugin, 
  getCurrentMonthYear,
  getCurrentMonthNumber,
  getCurrentYear,
  getMonthYear,
  getMonthKey,
  getPreviousMonths,
} from "@/types";
import { formatHealthImport } from "@/lib/wp-health-parser";
import { generateProfessionalEmailHtml } from "@/lib/email-template";

const SAMPLE_PLUGINS_DATA = [
  { name: "Yoast SEO", version: "22.7", author: "Team Yoast", hasUpdate: true, newVersion: "22.8" },
  { name: "WooCommerce", version: "8.9.1", author: "Automattic", hasUpdate: true, newVersion: "9.0.0" },
  { name: "Akismet Anti-Spam", version: "5.3.1", author: "Automattic", hasUpdate: false },
  { name: "Elementor", version: "3.22.0", author: "Elementor.com", hasUpdate: false },
  { name: "Contact Form 7", version: "5.9.8", author: "Takayuki Miyoshi", hasUpdate: true, newVersion: "6.0" },
  { name: "WP Rocket", version: "3.16.4", author: "WP Media", hasUpdate: false },
  { name: "Wordfence Security", version: "7.11.5", author: "Wordfence", hasUpdate: true, newVersion: "7.11.6" },
  { name: "UpdraftPlus", version: "1.24.1", author: "UpdraftPlus", hasUpdate: false },
];

const CLIENTS_STORAGE_KEY = "spd_clients_v1";
const MONTHLY_STATE_KEY = "spd_monthly_state";

interface MonthlyState {
  [key: string]: {
    [clientId: number]: {
      plugins: MaintenancePlugin[];
      wpVersion: string;
      closed: boolean;
      closedAt?: Date;
      notes?: string;
    };
  };
}

function getStoredClients(): Client[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (data) return JSON.parse(data);
    
    const defaultClients: Client[] = [
      {
        id: 1,
        nombre: "Agencia Creativa Digital",
        correo: "contacto@agenciacreativa.com",
        dni: "B12345678",
        url: "https://agenciacreativa.com",
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        nombre: "Tienda Online Fashion",
        correo: "info@fashionstore.es",
        dni: "A98765432",
        url: "https://fashionstore.es",
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        nombre: "Restaurante El Gourmet",
        correo: "reservas@gourmet.com",
        dni: "C45678912",
        url: "https://restaurantegourmet.com",
        activo: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(defaultClients));
    return defaultClients;
  } catch {
    return [];
  }
}

function saveStoredClients(clients: Client[]): void {
  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
}

function getMonthlyState(): MonthlyState {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(MONTHLY_STATE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveMonthlyState(state: MonthlyState): void {
  localStorage.setItem(MONTHLY_STATE_KEY, JSON.stringify(state));
}

function generatePlugins(hasUpdates = true): MaintenancePlugin[] {
  const shuffled = [...SAMPLE_PLUGINS_DATA].sort(() => Math.random() - 0.5);
  const subset = shuffled.slice(0, Math.floor(Math.random() * 4) + 4);
  
  return subset.map((p, i) => ({
    id: `plugin-${Date.now()}-${i}`,
    name: p.name,
    version: p.version,
    author: p.author,
    status: i < subset.length - 2 ? 'active' : 'inactive',
    hasUpdate: hasUpdates ? p.hasUpdate : false,
    newVersion: p.newVersion,
    isUpdatedThisMonth: false,
  }));
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f1f5f9",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
  },
  headerContent: {
    maxWidth: "1600px",
    margin: "0 auto",
    padding: "16px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  logo: {
    width: "44px",
    height: "44px",
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px -2px rgba(37, 99, 235, 0.3)",
  },
  headerTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#1e293b",
    letterSpacing: "-0.3px",
    margin: 0,
  },
  headerSubtitle: {
    fontSize: "13px",
    color: "#64748b",
    margin: "2px 0 0 0",
    fontWeight: 500,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  statBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "10px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  statBadgeSuccess: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  statText: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#475569",
  },
  statTextSuccess: {
    color: "#166534",
  },
  mainContent: {
    maxWidth: "1600px",
    margin: "0 auto",
    padding: "24px 32px",
    display: "flex",
    gap: "28px",
  },
  sidebar: {
    width: "320px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  searchWrapper: {
    position: "relative" as const,
  },
  searchIcon: {
    position: "absolute" as const,
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    width: "18px",
    height: "18px",
  },
  searchInput: {
    width: "100%",
    padding: "12px 14px 12px 42px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    backgroundColor: "#ffffff",
    outline: "none",
    transition: "all 0.2s ease",
    color: "#1e293b",
  },
  searchInputFocus: {
    borderColor: "#2563eb",
    boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.1)",
  },
  addButton: {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px -2px rgba(37, 99, 235, 0.4)",
  },
  addButtonHover: {
    backgroundColor: "#1d4ed8",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 12px -2px rgba(37, 99, 235, 0.5)",
  },
  clientList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  clientCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "14px 16px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    position: "relative" as const,
  },
  clientCardSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
    boxShadow: "0 2px 8px -2px rgba(37, 99, 235, 0.15)",
  },
  clientCardInactive: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  clientHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "8px",
  },
  clientName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#1e293b",
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  clientUrl: {
    fontSize: "12px",
    color: "#64748b",
    margin: "4px 0 0 0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  completedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    backgroundColor: "#dcfce7",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#166534",
    marginLeft: "8px",
  },
  toggleWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },
  toggle: {
    width: "40px",
    height: "22px",
    borderRadius: "11px",
    position: "relative" as const,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  toggleActive: {
    backgroundColor: "#22c55e",
  },
  toggleInactive: {
    backgroundColor: "#cbd5e1",
  },
  toggleKnob: {
    position: "absolute" as const,
    top: "2px",
    width: "18px",
    height: "18px",
    backgroundColor: "#ffffff",
    borderRadius: "50%",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.15)",
    transition: "left 0.2s ease",
  },
  mainPanel: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 40px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px dashed #cbd5e1",
    textAlign: "center" as const,
  },
  emptyIcon: {
    width: "64px",
    height: "64px",
    color: "#cbd5e1",
    marginBottom: "20px",
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#475569",
    margin: "0 0 8px 0",
  },
  emptyText: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: 0,
    maxWidth: "400px",
  },
  clientHeaderCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: "16px",
  },
  clientInfo: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  clientIcon: {
    width: "48px",
    height: "48px",
    backgroundColor: "#eff6ff",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  clientNameLarge: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#1e293b",
    margin: 0,
    letterSpacing: "-0.3px",
  },
  clientMeta: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "4px",
  },
  clientLink: {
    fontSize: "13px",
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 500,
  },
  clientEmail: {
    fontSize: "13px",
    color: "#64748b",
  },
  actionButtons: {
    display: "flex",
    gap: "10px",
  },
  buttonSecondary: {
    padding: "10px 18px",
    backgroundColor: "#f8fafc",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s ease",
  },
  buttonPrimary: {
    padding: "10px 20px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px -2px rgba(37, 99, 235, 0.4)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
  },
  statCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    padding: "18px 20px",
    transition: "all 0.2s ease",
  },
  statCardHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 24px -4px rgba(0, 0, 0, 0.1)",
    borderColor: "#cbd5e1",
  },
  statLabel: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    margin: "0 0 8px 0",
  },
  statValue: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#1e293b",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  statValueBlue: {
    color: "#2563eb",
  },
  statValueGreen: {
    color: "#16a34a",
  },
  statValueAmber: {
    color: "#d97706",
  },
  pluginsHeader: {
    backgroundColor: "#ffffff",
    borderRadius: "14px 14px 0 0",
    border: "1px solid #e2e8f0",
    borderBottom: "none",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: "12px",
  },
  pluginsTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  pluginsTitleText: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#1e293b",
    margin: 0,
  },
  quickActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
  },
  quickButton: {
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    transition: "all 0.2s ease",
    border: "1px solid transparent",
  },
  quickButtonDefault: {
    backgroundColor: "#f8fafc",
    color: "#475569",
    borderColor: "#e2e8f0",
  },
  quickButtonGreen: {
    backgroundColor: "#f0fdf4",
    color: "#166534",
    borderColor: "#bbf7d0",
  },
  quickButtonBlue: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    borderColor: "#bfdbfe",
  },
  tableContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "0 0 14px 14px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  tableHeader: {
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  tableHeaderCell: {
    padding: "12px 20px",
    textAlign: "left" as const,
    fontSize: "11px",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  tableRow: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background-color 0.15s ease",
  },
  tableRowHover: {
    backgroundColor: "#fafafa",
  },
  tableRowUpdated: {
    backgroundColor: "#f0fdf4",
  },
  tableCell: {
    padding: "14px 20px",
    fontSize: "14px",
  },
  pluginName: {
    fontWeight: 600,
    color: "#1e293b",
    margin: 0,
  },
  pluginAuthor: {
    fontSize: "12px",
    color: "#64748b",
    margin: "3px 0 0 0",
  },
  versionBadge: {
    fontFamily: "'SF Mono', 'Monaco', monospace",
    fontSize: "13px",
    color: "#475569",
    padding: "4px 10px",
    backgroundColor: "#f1f5f9",
    borderRadius: "6px",
    display: "inline-block",
  },
  versionUpdate: {
    display: "block",
    fontSize: "11px",
    color: "#d97706",
    fontWeight: 600,
    marginTop: "4px",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 500,
  },
  statusSuccess: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusWarning: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  statusInfo: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  checkboxWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  checkbox: {
    cursor: "pointer",
    transition: "transform 0.1s ease",
  },
  inactiveSection: {
    backgroundColor: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
    padding: "12px 20px",
  },
  inactiveTitle: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    margin: "0 0 8px 0",
  },
  inactiveTags: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "6px",
  },
  inactiveTag: {
    fontSize: "12px",
    color: "#64748b",
    backgroundColor: "#e2e8f0",
    padding: "4px 10px",
    borderRadius: "6px",
  },
  notesSection: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    padding: "20px 24px",
  },
  notesLabel: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#1e293b",
    margin: "0 0 10px 0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  notesTextarea: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    lineHeight: 1.6,
    resize: "vertical" as const,
    minHeight: "90px",
    outline: "none",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
    color: "#1e293b",
    backgroundColor: "#fafafa",
  },
  stickyFooter: {
    position: "sticky" as const,
    bottom: "16px",
    marginTop: "8px",
    zIndex: 10,
  },
  footerCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    padding: "18px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: "16px",
    boxShadow: "0 4px 24px -4px rgba(0, 0, 0, 0.08)",
  },
  footerInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  footerTitle: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#64748b",
    margin: 0,
  },
  footerStats: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#1e293b",
    margin: 0,
  },
  footerActions: {
    display: "flex",
    gap: "10px",
  },
  successBanner: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "10px",
  },
  successIcon: {
    width: "32px",
    height: "32px",
    backgroundColor: "#dcfce7",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  successText: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },
  successTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#166534",
    margin: 0,
  },
  successSubtitle: {
    fontSize: "12px",
    color: "#4ade80",
    margin: 0,
  },
  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    zIndex: 100,
  },
  modal: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "560px",
    overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },
  modalHeader: {
    padding: "18px 24px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1e293b",
    margin: 0,
  },
  modalSubtitle: {
    fontSize: "13px",
    color: "#64748b",
    margin: "3px 0 0 0",
  },
  modalClose: {
    padding: "8px",
    borderRadius: "8px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  modalContent: {
    padding: "24px",
  },
  helpBox: {
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "16px",
  },
  helpTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#475569",
    margin: "0 0 8px 0",
  },
  helpList: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0,
    paddingLeft: "20px",
  },
  helpListItem: {
    marginBottom: "4px",
  },
  importTextarea: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    fontFamily: "'SF Mono', monospace",
    lineHeight: 1.5,
    resize: "vertical" as const,
    minHeight: "120px",
    outline: "none",
    transition: "all 0.2s ease",
    backgroundColor: "#fafafa",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "12px 16px",
    marginTop: "12px",
  },
  errorText: {
    fontSize: "13px",
    color: "#dc2626",
    margin: 0,
  },
  modalFooter: {
    padding: "16px 24px",
    backgroundColor: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  buttonCancel: {
    padding: "10px 18px",
    backgroundColor: "#ffffff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  buttonImport: {
    padding: "10px 20px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  previewModal: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    flexDirection: "column" as const,
    zIndex: 100,
  },
  previewHeader: {
    backgroundColor: "#ffffff",
    padding: "16px 24px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewContent: {
    flex: 1,
    overflow: "auto",
    padding: "24px",
    display: "flex",
    justifyContent: "center",
  },
  previewFrame: {
    width: "100%",
    maxWidth: "700px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },
  previewIframe: {
    width: "100%",
    height: "1200px",
    border: "none",
  },
  addClientForm: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    padding: "16px",
  },
  formGrid: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  formInput: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s ease",
    backgroundColor: "#fafafa",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  formRow: {
    display: "flex",
    gap: "8px",
  },
  formButtonCancel: {
    flex: 1,
    padding: "10px",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
  },
  formButtonSave: {
    flex: 1,
    padding: "10px",
    backgroundColor: "#22c55e",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  loadingSpinner: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  noScanCard: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    padding: "48px 40px",
    textAlign: "center" as const,
  },
  noScanIcon: {
    width: "56px",
    height: "56px",
    backgroundColor: "#eff6ff",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  noScanTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  noScanText: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 24px 0",
    maxWidth: "400px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  noScanButtons: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap" as const,
  },
} as const;

export default function SinglePageDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hoveredClient, setHoveredClient] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  
  const [scanning, setScanning] = useState(false);
  const [plugins, setPlugins] = useState<MaintenancePlugin[]>([]);
  const [wpVersion, setWpVersion] = useState("6.5.3");
  const [hasScanned, setHasScanned] = useState(false);
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  const [sendingReport, setSendingReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [notes, setNotes] = useState("");
  
  const [monthlyState, setMonthlyState] = useState<MonthlyState>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClient, setNewClient] = useState({
    nombre: "",
    correo: "",
    dni: "",
    url: "",
  });
  
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthNumber());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showCopyConfirmation, setShowCopyConfirmation] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  const currentMonthYear = getMonthYear(selectedMonth, selectedYear);
  const monthKey = getMonthKey(selectedMonth, selectedYear);
  const isCurrentMonth = selectedMonth === getCurrentMonthNumber() && selectedYear === getCurrentYear();
  
  const previousMonths = getPreviousMonths(12);

  useEffect(() => {
    setClients(getStoredClients());
    setMonthlyState(getMonthlyState());
    setIsInitialized(true);
  }, []);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.correo.toLowerCase().includes(q) ||
        c.url.toLowerCase().includes(q)
    );
  }, [clients, searchQuery]);

  const activeCount = clients.filter((c) => c.activo).length;
  const completedThisMonth = useMemo(() => {
    if (!monthlyState[monthKey]) return 0;
    return Object.values(monthlyState[monthKey]).filter((s) => s.closed).length;
  }, [monthlyState, monthKey]);

  const isClientClosedThisMonth = useMemo(() => {
    if (!selectedClient || !monthlyState[monthKey]) return false;
    return monthlyState[monthKey][selectedClient.id]?.closed || false;
  }, [selectedClient, monthlyState, monthKey]);

  const updatedCount = plugins.filter((p) => p.isUpdatedThisMonth).length;
  const totalActivePlugins = plugins.filter((p) => p.status === 'active').length;
  const withUpdatesCount = plugins.filter((p) => p.hasUpdate && p.status === 'active').length;
  const withoutUpdatesCount = totalActivePlugins - withUpdatesCount;

  const handleToggleClientStatus = useCallback((id: number) => {
    const updated = clients.map((c) =>
      c.id === id ? { ...c, activo: !c.activo, updatedAt: new Date() } : c
    );
    setClients(updated);
    saveStoredClients(updated);
  }, [clients]);

  const handleSelectClient = useCallback((client: Client) => {
    if (!client.activo) return;
    
    setSelectedClient(client);
    setReportSent(false);
    setNotes("");
    
    if (monthlyState[monthKey]?.[client.id]) {
      const saved = monthlyState[monthKey][client.id];
      setPlugins(saved.plugins);
      setWpVersion(saved.wpVersion);
      setHasScanned(true);
      setNotes(saved.notes || "");
      setReportSent(saved.closed || false);
    } else {
      setPlugins([]);
      setHasScanned(false);
      setReportSent(false);
    }
  }, [monthlyState, monthKey]);

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

  const handleCopyFromPreviousMonth = useCallback(() => {
    if (!selectedClient) return;
    
    const currentMonthIdx = selectedMonth;
    const currentYearIdx = selectedYear;
    
    let prevMonth = currentMonthIdx - 1;
    let prevYear = currentYearIdx;
    
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = currentYearIdx - 1;
    }
    
    const prevMonthKey = getMonthKey(prevMonth, prevYear);
    
    if (monthlyState[prevMonthKey]?.[selectedClient.id]) {
      const saved = monthlyState[prevMonthKey][selectedClient.id];
      
      const resetPlugins = saved.plugins.map((p: MaintenancePlugin) => ({
        ...p,
        id: `plugin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isUpdatedThisMonth: false,
      }));
      
      setPlugins(resetPlugins);
      setWpVersion(saved.wpVersion);
      setHasScanned(true);
      setNotes("");
      setReportSent(false);
      
      const newState: MonthlyState = { ...monthlyState };
      if (!newState[monthKey]) newState[monthKey] = {};
      newState[monthKey][selectedClient.id] = {
        plugins: resetPlugins,
        wpVersion: saved.wpVersion,
        closed: false,
        notes: "",
      };
      setMonthlyState(newState);
      saveMonthlyState(newState);
    }
  }, [selectedClient, selectedMonth, selectedYear, monthlyState, monthKey]);

   const handleScanPlugins = useCallback(() => {
     if (!selectedClient) return;
     
     if (monthlyState[monthKey]?.[selectedClient.id]?.plugins?.length > 0) {
       const saved = monthlyState[monthKey][selectedClient.id];
       setPlugins(saved.plugins);
       setWpVersion(saved.wpVersion);
       setHasScanned(true);
       return;
     }
     
     setScanning(true);
     
     setTimeout(() => {
       const newPlugins = generatePlugins(true);
       const newWpVersion = `6.${Math.floor(Math.random() * 5) + 2}.${Math.floor(Math.random() * 10)}`;
       setPlugins(newPlugins);
       setWpVersion(newWpVersion);
       setHasScanned(true);
       setScanning(false);
       
       const newState: MonthlyState = { ...monthlyState };
       if (!newState[monthKey]) newState[monthKey] = {};
       newState[monthKey][selectedClient.id] = {
         plugins: newPlugins,
         wpVersion: newWpVersion,
         closed: false,
       };
       setMonthlyState(newState);
       saveMonthlyState(newState);
     }, 800);
   }, [selectedClient, monthlyState, monthKey]);

  const handleTogglePluginUpdated = useCallback((pluginId: string) => {
    const updated = plugins.map((p) =>
      p.id === pluginId ? { ...p, isUpdatedThisMonth: !p.isUpdatedThisMonth } : p
    );
    setPlugins(updated);
    
    if (selectedClient) {
      const newState: MonthlyState = { ...monthlyState };
      if (!newState[monthKey]) newState[monthKey] = {};
      newState[monthKey][selectedClient.id] = {
        ...(newState[monthKey][selectedClient.id] || {}),
        plugins: updated,
        wpVersion: wpVersion,
        closed: false,
        notes,
      };
      setMonthlyState(newState);
      saveMonthlyState(newState);
    }
  }, [plugins, selectedClient, monthlyState, monthKey, wpVersion, notes]);

  const handleImportFromWP = useCallback(() => {
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
    
    setPlugins((prev) => [...prev, ...mappedPlugins]);
    setHasScanned(true);
    setImportText("");
    setImportError(null);
    setShowImportModal(false);
  }, [importText]);

  const handleSendReport = useCallback(async () => {
    if (!selectedClient) return;
    
    setSendingReport(true);
    
    try {
      const response = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: selectedClient,
          monthYear: currentMonthYear,
          plugins,
          wpVersion,
          notes,
        }),
      });
      
      if (response.ok) {
        const newState: MonthlyState = { ...monthlyState };
        if (!newState[monthKey]) newState[monthKey] = {};
        newState[monthKey][selectedClient.id] = {
          plugins,
          wpVersion,
          closed: true,
          closedAt: new Date(),
          notes,
        };
        setMonthlyState(newState);
        saveMonthlyState(newState);
        setReportSent(true);
      }
    } catch {
      const newState: MonthlyState = { ...monthlyState };
      if (!newState[monthKey]) newState[monthKey] = {};
      newState[monthKey][selectedClient.id] = {
        plugins,
        wpVersion,
        closed: true,
        closedAt: new Date(),
        notes,
      };
      setMonthlyState(newState);
      saveMonthlyState(newState);
      setReportSent(true);
    } finally {
      setSendingReport(false);
    }
  }, [selectedClient, plugins, wpVersion, notes, currentMonthYear, monthlyState, monthKey]);

  const handleAddClient = useCallback(() => {
    if (!newClient.nombre.trim() || !newClient.url.trim()) return;
    
    const client: Client = {
      id: clients.length === 0 ? 1 : Math.max(...clients.map((c) => c.id)) + 1,
      nombre: newClient.nombre.trim(),
      correo: newClient.correo.trim(),
      dni: newClient.dni.trim(),
      url: newClient.url.startsWith("http") ? newClient.url.trim() : `https://${newClient.url.trim()}`,
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updated = [...clients, client];
    setClients(updated);
    saveStoredClients(updated);
    setNewClient({ nombre: "", correo: "", dni: "", url: "" });
    setShowAddForm(false);
  }, [newClient, clients]);

  const progressPercentage = activeCount > 0 ? Math.round((completedThisMonth / activeCount) * 100) : 0;

  if (!isInitialized) {
    return (
      <div style={styles.container}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: "16px",
        }}>
          <div style={styles.logo}>
            <Globe style={{ width: "24px", height: "24px", color: "#ffffff" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Loader2 style={{ width: "18px", height: "18px", color: "#2563eb", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 500 }}>Cargando panel...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input:focus, textarea:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
        }
        button:hover {
          opacity: 0.9;
        }
        button:active {
          transform: translateY(0) !important;
        }
      `}</style>
      
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <div style={styles.logo}>
              <Globe style={{ width: "22px", height: "22px", color: "#ffffff" }} />
            </div>
            <div>
              <h1 style={styles.headerTitle}>Mantenimiento Web</h1>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "2px" }}>
                <button
                  onClick={() => setShowMonthSelector(!showMonthSelector)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    backgroundColor: isCurrentMonth ? "#eff6ff" : "#f8fafc",
                    border: isCurrentMonth ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: isCurrentMonth ? "#1d4ed8" : "#475569",
                  }}
                >
                  <Calendar style={{ width: "14px", height: "14px" }} />
                  {currentMonthYear}
                  <ChevronRight style={{ 
                    width: "12px", 
                    height: "12px",
                    transform: showMonthSelector ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }} />
                </button>
                {isCurrentMonth && (
                  <span style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    backgroundColor: "#dcfce7",
                    color: "#166534",
                    fontWeight: 600,
                  }}>
                    MES ACTUAL
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div style={styles.headerRight}>
            {/* Barra de progreso */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minWidth: "200px",
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#64748b",
                }}>
                  Progreso mensual
                </span>
                <span style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: progressPercentage === 100 ? "#16a34a" : "#1e293b",
                }}>
                  {completedThisMonth}/{activeCount} ({progressPercentage}%)
                </span>
              </div>
              <div style={{
                width: "100%",
                height: "8px",
                backgroundColor: "#e2e8f0",
                borderRadius: "4px",
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${progressPercentage}%`,
                  height: "100%",
                  backgroundColor: progressPercentage === 100 ? "#22c55e" : "#2563eb",
                  borderRadius: "4px",
                  transition: "width 0.3s ease",
                }} />
              </div>
            </div>
            
            <div style={styles.statBadge}>
              <Users style={{ width: "16px", height: "16px", color: "#64748b" }} />
              <span style={styles.statText}>{activeCount} clientes</span>
            </div>
          </div>
        </div>
        
        {/* Selector de mes */}
        {showMonthSelector && (
          <div style={{
            position: "absolute",
            top: "100%",
            left: "32px",
            marginTop: "4px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.15)",
            padding: "12px",
            zIndex: 100,
            minWidth: "220px",
          }}>
            <p style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#64748b",
              margin: "0 0 8px 8px",
            }}>
              Seleccionar mes
            </p>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}>
              {previousMonths.map((monthData) => {
                const isSelected = monthData.month === selectedMonth && monthData.year === selectedYear;
                const monthCompleted = monthlyState[monthData.key] 
                  ? Object.values(monthlyState[monthData.key]).filter((s: any) => s.closed).length 
                  : 0;
                
                return (
                  <button
                    key={monthData.key}
                    onClick={() => handleChangeMonth(monthData.month, monthData.year)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      backgroundColor: isSelected ? "#eff6ff" : "transparent",
                      border: isSelected ? "1px solid #bfdbfe" : "1px solid transparent",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? "#1d4ed8" : "#1e293b",
                      textAlign: "left" as const,
                      width: "100%",
                    }}
                  >
                    <span>{monthData.label}</span>
                    <span style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      backgroundColor: monthCompleted === activeCount && activeCount > 0 ? "#dcfce7" : "#f1f5f9",
                      color: monthCompleted === activeCount && activeCount > 0 ? "#166534" : "#64748b",
                      fontWeight: 600,
                    }}>
                      {monthCompleted}/{activeCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <div style={styles.mainContent}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          {/* Buscador */}
          <div style={styles.searchWrapper}>
            <Search style={styles.searchIcon} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente..."
              style={styles.searchInput}
              onFocus={(e) => {
                e.target.style.borderColor = "#2563eb";
                e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Botón añadir */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={styles.addButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1d4ed8";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#2563eb";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Plus style={{ width: "16px", height: "16px" }} />
            Añadir Cliente
          </button>

          {/* Formulario añadir */}
          {showAddForm && (
            <div style={styles.addClientForm}>
              <div style={styles.formGrid}>
                <input
                  type="text"
                  value={newClient.nombre}
                  onChange={(e) => setNewClient({ ...newClient, nombre: e.target.value })}
                  placeholder="Nombre de la empresa *"
                  style={styles.formInput}
                />
                <input
                  type="text"
                  value={newClient.url}
                  onChange={(e) => setNewClient({ ...newClient, url: e.target.value })}
                  placeholder="URL del sitio *"
                  style={styles.formInput}
                />
                <input
                  type="email"
                  value={newClient.correo}
                  onChange={(e) => setNewClient({ ...newClient, correo: e.target.value })}
                  placeholder="Email de contacto"
                  style={styles.formInput}
                />
                <div style={styles.formRow}>
                  <button
                    onClick={() => setShowAddForm(false)}
                    style={styles.formButtonCancel}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddClient}
                    disabled={!newClient.nombre.trim() || !newClient.url.trim()}
                    style={{
                      ...styles.formButtonSave,
                      opacity: !newClient.nombre.trim() || !newClient.url.trim() ? 0.5 : 1,
                    }}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de clientes */}
          <div style={styles.clientList}>
            {filteredClients.length === 0 ? (
              <div style={{
                padding: "32px 16px",
                textAlign: "center",
              }}>
                <Users style={{ 
                  width: "40px", 
                  height: "40px", 
                  color: "#cbd5e1", 
                  marginBottom: "12px",
                  marginLeft: "auto",
                  marginRight: "auto",
                  display: "block",
                }} />
                <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>
                  {searchQuery ? "No hay resultados" : "No hay clientes"}
                </p>
              </div>
            ) : (
              filteredClients.map((client) => {
                const isSelected = selectedClient?.id === client.id;
                const isClosed = monthlyState[monthKey]?.[client.id]?.closed;
                const isHovered = hoveredClient === client.id;
                
                return (
                  <div
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    onMouseEnter={() => setHoveredClient(client.id)}
                    onMouseLeave={() => setHoveredClient(null)}
                    style={{
                      ...styles.clientCard,
                      ...(isSelected ? styles.clientCardSelected : {}),
                      ...(!client.activo ? styles.clientCardInactive : {}),
                      ...(isHovered && !isSelected && client.activo ? {
                        borderColor: "#cbd5e1",
                        boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.08)",
                      } : {}),
                    }}
                  >
                    <div style={styles.clientHeader}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                          <p style={styles.clientName}>{client.nombre}</p>
                          {isClosed && (
                            <span style={styles.completedBadge}>
                              <CheckCircle2 style={{ width: "12px", height: "12px" }} />
                              Completado
                            </span>
                          )}
                        </div>
                        <p style={styles.clientUrl}>{client.url}</p>
                      </div>
                      
                      <div style={styles.toggleWrapper}>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleClientStatus(client.id);
                          }}
                          style={{
                            ...styles.toggle,
                            ...(client.activo ? styles.toggleActive : styles.toggleInactive),
                          }}
                        >
                          <div style={{
                            ...styles.toggleKnob,
                            left: client.activo ? "20px" : "2px",
                          }} />
                        </div>
                        
                        {client.activo && isSelected && (
                          <ChevronRight style={{ width: "16px", height: "16px", color: "#2563eb" }} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel principal */}
        <div style={styles.mainPanel}>
          {!selectedClient ? (
            <div style={styles.emptyState}>
              <Globe style={styles.emptyIcon} />
              <h2 style={styles.emptyTitle}>Selecciona un cliente</h2>
              <p style={styles.emptyText}>
                Elige un cliente de la lista para empezar a gestionar su mantenimiento mensual. 
                Usa el buscador para encontrar rápidamente cualquier cliente.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Cabecera del cliente */}
              <div style={styles.clientHeaderCard}>
                <div style={styles.clientInfo}>
                  <div style={styles.clientIcon}>
                    <Globe style={{ width: "24px", height: "24px", color: "#2563eb" }} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <h2 style={styles.clientNameLarge}>{selectedClient.nombre}</h2>
                      {isClientClosedThisMonth && (
                        <span style={styles.completedBadge}>
                          <CheckCircle2 style={{ width: "12px", height: "12px" }} />
                          Informe Enviado
                        </span>
                      )}
                    </div>
                    <div style={styles.clientMeta}>
                      <a 
                        href={selectedClient.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={styles.clientLink}
                      >
                        {selectedClient.url}
                      </a>
                      {selectedClient.correo && (
                        <span style={styles.clientEmail}>{selectedClient.correo}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                 <div style={styles.actionButtons}>
                   {hasScanned && !isClientClosedThisMonth && (
                     <button
                       onClick={() => {
                         const newState: MonthlyState = { ...monthlyState };
                         if (!newState[monthKey]) newState[monthKey] = {};
                         newState[monthKey][selectedClient.id] = {
                           ...(newState[monthKey][selectedClient.id] || {}),
                           plugins,
                           wpVersion,
                           closed: false,
                           notes,
                         };
                         setMonthlyState(newState);
                         saveMonthlyState(newState);
                       }}
                       style={styles.buttonSecondary}
                     >
                       <Save style={{ width: "14px", height: "14px" }} />
                       Guardar Progreso
                     </button>
                   )}
                   {hasScanned && (
                     <button
                       onClick={() => setShowClearConfirmation(true)}
                       style={styles.buttonSecondary}
                     >
                       <X style={{ width: "14px", height: "14px" }} />
                       Limpiar Mes
                     </button>
                   )}
                   {!hasScanned && (
                     <button
                       onClick={() => setShowImportModal(true)}
                       disabled={isClientClosedThisMonth}
                       style={{
                         ...styles.buttonSecondary,
                         opacity: isClientClosedThisMonth ? 0.5 : 1,
                       }}
                     >
                       <Package style={{ width: "14px", height: "14px" }} />
                       Importar desde WP
                     </button>
                   )}
                   <button
                     onClick={handleScanPlugins}
                     disabled={scanning || isClientClosedThisMonth}
                     style={{
                       ...styles.buttonPrimary,
                       opacity: scanning || isClientClosedThisMonth ? 0.5 : 1,
                     }}
                   >
                     {scanning ? (
                       <>
                         <Loader2 style={{ 
                           width: "16px", 
                           height: "16px", 
                           animation: "spin 1s linear infinite" 
                         }} />
                         Escaneando...
                       </>
                     ) : (
                       <>
                         <RefreshCw style={{ width: "14px", height: "14px" }} />
                         {hasScanned ? "Actualizar Escaneo" : "Escanear Plugins"}
                       </>
                     )}
                   </button>
                 </div>
              </div>

              {/* No escaneado */}
              {!hasScanned && (
                <div style={styles.noScanCard}>
                  <div style={styles.noScanIcon}>
                    <Package style={{ width: "28px", height: "28px", color: "#2563eb" }} />
                  </div>
                  <h3 style={styles.noScanTitle}>
                    Mantenimiento de {currentMonthYear}
                  </h3>
                  <p style={styles.noScanText}>
                    {isCurrentMonth 
                      ? "Este es el mantenimiento de este mes. Escanea los plugins o cópialos del mes anterior."
                      : `Estás viendo el mantenimiento de ${currentMonthYear}.`
                    }
                  </p>
                  
                  {/* Verificar si hay datos del mes anterior */}
                  {selectedClient && (() => {
                    let prevMonth = selectedMonth - 1;
                    let prevYear = selectedYear;
                    if (prevMonth < 0) {
                      prevMonth = 11;
                      prevYear = selectedYear - 1;
                    }
                    const prevMonthKey = getMonthKey(prevMonth, prevYear);
                    const hasPreviousData = monthlyState[prevMonthKey]?.[selectedClient.id];
                    
                    if (hasPreviousData) {
                      return (
                        <div style={{
                          marginBottom: "20px",
                          padding: "14px 18px",
                          backgroundColor: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          borderRadius: "10px",
                        }}>
                          <p style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#1d4ed8",
                            margin: "0 0 6px 0",
                          }}>
                            💡 Datos encontrados del mes anterior
                          </p>
                          <p style={{
                            fontSize: "12px",
                            color: "#3b82f6",
                            margin: "0 0 12px 0",
                          }}>
                            {getMonthYear(prevMonth, prevYear)} - {hasPreviousData.plugins?.length || 0} plugins guardados
                          </p>
                           <button
                             onClick={() => setShowCopyConfirmation(true)}
                             style={{
                               padding: "10px 18px",
                               backgroundColor: "#2563eb",
                               color: "#ffffff",
                               border: "none",
                               borderRadius: "8px",
                               fontSize: "14px",
                               fontWeight: 600,
                               cursor: "pointer",
                               width: "100%",
                             }}
                           >
                             <RefreshCw style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px" }} />
                             Copiar del Mes Anterior
                           </button>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  <div style={styles.noScanButtons}>
                    <button
                      onClick={handleScanPlugins}
                      style={styles.buttonPrimary}
                    >
                      <Zap style={{ width: "14px", height: "14px" }} />
                      Escanear Plugins
                    </button>
                    <button
                      onClick={() => setShowImportModal(true)}
                      style={styles.buttonSecondary}
                    >
                      <Package style={{ width: "14px", height: "14px" }} />
                      Importar desde WP
                    </button>
                  </div>
                </div>
              )}

              {/* Plugins escaneados */}
              {hasScanned && plugins.length > 0 && (
                <>
                  {/* Estadísticas */}
                  <div style={styles.statsGrid}>
                    <div 
                      style={styles.statCard}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 24px -4px rgba(0, 0, 0, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <p style={styles.statLabel}>WP Version</p>
                      <p style={{ ...styles.statValue, ...styles.statValueBlue }}>{wpVersion}</p>
                    </div>
                    <div 
                      style={styles.statCard}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 24px -4px rgba(0, 0, 0, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <p style={styles.statLabel}>Plugins Activos</p>
                      <p style={styles.statValue}>{totalActivePlugins}</p>
                    </div>
                    <div 
                      style={{
                        ...styles.statCard,
                        backgroundColor: withUpdatesCount > 0 ? "#fffbeb" : "#ffffff",
                        borderColor: withUpdatesCount > 0 ? "#fde68a" : "#e2e8f0",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 24px -4px rgba(0, 0, 0, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <p style={styles.statLabel}>Pendientes</p>
                      <p style={{ ...styles.statValue, ...styles.statValueAmber }}>{withUpdatesCount}</p>
                    </div>
                    <div 
                      style={{
                        ...styles.statCard,
                        backgroundColor: updatedCount > 0 ? "#f0fdf4" : "#ffffff",
                        borderColor: updatedCount > 0 ? "#bbf7d0" : "#e2e8f0",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 24px -4px rgba(0, 0, 0, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <p style={styles.statLabel}>Actualizados</p>
                      <p style={{ ...styles.statValue, ...styles.statValueGreen }}>
                        {updatedCount}/{totalActivePlugins}
                      </p>
                    </div>
                  </div>

                  {/* Cabecera plugins */}
                  <div style={styles.pluginsHeader}>
                    <div style={styles.pluginsTitle}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        backgroundColor: "#eff6ff",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <Package style={{ width: "18px", height: "18px", color: "#2563eb" }} />
                      </div>
                      <div>
                        <h3 style={styles.pluginsTitleText}>Gestión de Plugins</h3>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                          Marca los plugins que has actualizado este mes
                        </p>
                      </div>
                    </div>
                    
                    <div style={styles.quickActions}>
                      {hasScanned && !isClientClosedThisMonth && (
                        <button
                          onClick={() => {
                            const newState: MonthlyState = { ...monthlyState };
                            if (!newState[monthKey]) newState[monthKey] = {};
                            newState[monthKey][selectedClient.id] = {
                              ...(newState[monthKey][selectedClient.id] || {}),
                              plugins,
                              wpVersion,
                              closed: false,
                              notes,
                            };
                            setMonthlyState(newState);
                            saveMonthlyState(newState);
                          }}
                          style={{ ...styles.quickButton, ...styles.quickButtonDefault }}
                        >
                          <Save style={{ width: "13px", height: "13px" }} />
                          Guardar
                        </button>
                      )}
                      <button
                        onClick={() => setShowImportModal(true)}
                        disabled={isClientClosedThisMonth}
                        style={{ 
                          ...styles.quickButton, 
                          ...styles.quickButtonDefault,
                          opacity: isClientClosedThisMonth ? 0.5 : 1,
                        }}
                      >
                        Importar
                      </button>
                      {updatedCount > 0 && (
                        <button
                          onClick={() => {
                            setPlugins(plugins.map((p) => ({ ...p, isUpdatedThisMonth: false })));
                          }}
                          disabled={isClientClosedThisMonth}
                          style={{ ...styles.quickButton, ...styles.quickButtonDefault }}
                        >
                          Desmarcar Todo
                        </button>
                      )}
                      {withUpdatesCount > 0 && (
                        <button
                          onClick={() => {
                            const updated = plugins.map((p) => ({
                              ...p,
                              isUpdatedThisMonth: p.hasUpdate && p.status === 'active' ? true : p.isUpdatedThisMonth,
                            }));
                            setPlugins(updated);
                          }}
                          disabled={isClientClosedThisMonth}
                          style={{ ...styles.quickButton, ...styles.quickButtonGreen }}
                        >
                          <CheckSquare style={{ width: "13px", height: "13px" }} />
                          Marcar Pendientes
                        </button>
                      )}
                      {totalActivePlugins > 0 && (
                        <button
                          onClick={() => {
                            const updated = plugins.map((p) => ({
                              ...p,
                              isUpdatedThisMonth: p.status === 'active' ? true : p.isUpdatedThisMonth,
                            }));
                            setPlugins(updated);
                          }}
                          disabled={isClientClosedThisMonth}
                          style={{ ...styles.quickButton, ...styles.quickButtonBlue }}
                        >
                          <CheckSquare style={{ width: "13px", height: "13px" }} />
                          Marcar Todos
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tabla de plugins */}
                  <div style={styles.tableContainer}>
                    <div style={{ overflowX: "auto" }}>
                      <table style={styles.table}>
                        <thead style={styles.tableHeader}>
                          <tr>
                            <th style={{ ...styles.tableHeaderCell, width: "50%" }}>Plugin</th>
                            <th style={{ ...styles.tableHeaderCell, width: "15%", textAlign: "center" }}>Versión</th>
                            <th style={{ ...styles.tableHeaderCell, width: "20%", textAlign: "center" }}>Estado</th>
                            <th style={{ ...styles.tableHeaderCell, width: "15%", textAlign: "center" }}>Actualizado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plugins
                            .filter((p) => p.status === 'active')
                            .map((plugin) => {
                              const isHovered = hoveredRow === plugin.id;
                              return (
                                <tr
                                  key={plugin.id}
                                  style={{
                                    ...styles.tableRow,
                                    ...(plugin.isUpdatedThisMonth ? styles.tableRowUpdated : {}),
                                    ...(isHovered && !plugin.isUpdatedThisMonth ? styles.tableRowHover : {}),
                                  }}
                                  onMouseEnter={() => setHoveredRow(plugin.id)}
                                  onMouseLeave={() => setHoveredRow(null)}
                                >
                                  <td style={styles.tableCell}>
                                    <p style={styles.pluginName}>{plugin.name}</p>
                                    {plugin.author && (
                                      <p style={styles.pluginAuthor}>{plugin.author}</p>
                                    )}
                                  </td>
                                  <td style={{ ...styles.tableCell, textAlign: "center" }}>
                                    <span style={styles.versionBadge}>v{plugin.version}</span>
                                    {plugin.newVersion && plugin.hasUpdate && (
                                      <span style={styles.versionUpdate}>
                                        → v{plugin.newVersion}
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ ...styles.tableCell, textAlign: "center" }}>
                                    {plugin.hasUpdate ? (
                                      <span style={{ ...styles.statusBadge, ...styles.statusWarning }}>
                                        <AlertCircle style={{ width: "12px", height: "12px" }} />
                                        Pendiente
                                      </span>
                                    ) : (
                                      <span style={{ ...styles.statusBadge, ...styles.statusSuccess }}>
                                        ✓ Al día
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ ...styles.tableCell, textAlign: "center" }}>
                                    <div style={styles.checkboxWrapper}>
                                      <button
                                        onClick={() => handleTogglePluginUpdated(plugin.id)}
                                        disabled={isClientClosedThisMonth}
                                        style={{
                                          ...styles.checkbox,
                                          opacity: isClientClosedThisMonth ? 0.5 : 1,
                                          cursor: isClientClosedThisMonth ? "not-allowed" : "pointer",
                                          border: "none",
                                          background: "transparent",
                                          padding: 0,
                                        }}
                                      >
                                        {plugin.isUpdatedThisMonth ? (
                                          <CheckSquare 
                                            style={{ width: "24px", height: "24px", color: "#16a34a" }} 
                                          />
                                        ) : (
                                          <Square 
                                            style={{ width: "24px", height: "24px", color: "#cbd5e1" }} 
                                          />
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {/* Plugins inactivos */}
                    {plugins.some((p) => p.status === 'inactive') && (
                      <div style={styles.inactiveSection}>
                        <p style={styles.inactiveTitle}>
                          Plugins Inactivos ({plugins.filter((p) => p.status === 'inactive').length})
                        </p>
                        <div style={styles.inactiveTags}>
                          {plugins
                            .filter((p) => p.status === 'inactive')
                            .map((p) => (
                              <span key={p.id} style={styles.inactiveTag}>
                                {p.name}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notas */}
                  {!isClientClosedThisMonth && (
                    <div style={styles.notesSection}>
                      <p style={styles.notesLabel}>
                        <FileText style={{ width: "16px", height: "16px", color: "#2563eb" }} />
                        Notas Adicionales
                      </p>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Añade observaciones: plugins actualizados manualmente, problemas encontrados, recomendaciones..."
                        rows={3}
                        style={styles.notesTextarea}
                      />
                    </div>
                  )}

                  {/* Footer sticky */}
                  <div style={styles.stickyFooter}>
                    <div style={styles.footerCard}>
                      <div style={styles.footerInfo}>
                        <p style={styles.footerTitle}>
                          Cerrar Mantenimiento • {currentMonthYear}
                        </p>
                        <p style={styles.footerStats}>
                          <span style={{ color: "#16a34a", fontWeight: 600 }}>
                            {updatedCount} plugins actualizados
                          </span>
                          <span style={{ margin: "0 8px", color: "#cbd5e1" }}>•</span>
                          <span>{plugins.filter((p) => p.status === 'active').length} plugins revisados</span>
                        </p>
                      </div>
                      
                      {reportSent ? (
                        <div style={styles.successBanner}>
                          <div style={styles.successIcon}>
                            <CheckCircle2 style={{ width: "18px", height: "18px", color: "#166534" }} />
                          </div>
                          <div style={styles.successText}>
                            <p style={styles.successTitle}>¡Informe Enviado!</p>
                            <p style={styles.successSubtitle}>El mantenimiento está cerrado</p>
                          </div>
                        </div>
                      ) : (
                        <div style={styles.footerActions}>
                          <button
                            onClick={() => setShowPreviewModal(true)}
                            style={styles.buttonSecondary}
                          >
                            <Eye style={{ width: "14px", height: "14px" }} />
                            Vista previa
                          </button>
                          <button
                            onClick={handleSendReport}
                            disabled={sendingReport}
                            style={{
                              ...styles.buttonPrimary,
                              opacity: sendingReport ? 0.5 : 1,
                            }}
                          >
                            {sendingReport ? (
                              <>
                                <Loader2 style={{ 
                                  width: "16px", 
                                  height: "16px", 
                                  animation: "spin 1s linear infinite" 
                                }} />
                                Generando...
                              </>
                            ) : (
                              <>
                                <Send style={{ width: "14px", height: "14px" }} />
                                Enviar Informe
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de importación */}
      {showImportModal && (
        <div style={styles.modalOverlay} onClick={() => {
          setShowImportModal(false);
          setImportText("");
          setImportError(null);
        }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Importar desde WordPress</h3>
                <p style={styles.modalSubtitle}>Copia desde Salud del Sitio y pega aquí</p>
              </div>
              <button
                style={styles.modalClose}
                onClick={() => {
                  setShowImportModal(false);
                  setImportText("");
                  setImportError(null);
                }}
              >
                <X style={{ width: "18px", height: "18px", color: "#64748b" }} />
              </button>
            </div>
            
            <div style={styles.modalContent}>
              <div style={styles.helpBox}>
                <p style={styles.helpTitle}>Pasos:</p>
                <ol style={styles.helpList}>
                  <li style={styles.helpListItem}>WP Admin → Herramientas → Salud del Sitio</li>
                  <li style={styles.helpListItem}>Pestaña "Información"</li>
                  <li style={styles.helpListItem}>Botón "Copiar información al portapapeles"</li>
                </ol>
              </div>
              
              <textarea
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportError(null);
                }}
                placeholder="Pega aquí el texto copiado de WordPress..."
                rows={5}
                style={styles.importTextarea}
              />
              
              {importError && (
                <div style={styles.errorBox}>
                  <p style={styles.errorText}>⚠️ {importError}</p>
                </div>
              )}
            </div>
            
            <div style={styles.modalFooter}>
              <button
                style={styles.buttonCancel}
                onClick={() => {
                  setShowImportModal(false);
                  setImportText("");
                  setImportError(null);
                }}
              >
                Cancelar
              </button>
              <button
                style={styles.buttonImport}
                onClick={handleImportFromWP}
                disabled={!importText.trim()}
              >
                Importar
              </button>
            </div>
          </div>
        </div>
      )}

       {/* Modal de vista previa */}
       {showPreviewModal && selectedClient && (
         <div style={styles.previewModal}>
           <div style={styles.previewHeader}>
             <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
               <div style={{
                 padding: "8px",
                 backgroundColor: "#eff6ff",
                 borderRadius: "10px",
               }}>
                 <Eye style={{ width: "18px", height: "18px", color: "#2563eb" }} />
               </div>
               <div>
                 <h3 style={styles.modalTitle}>Vista Previa del Informe</h3>
                 <p style={styles.modalSubtitle}>
                   {selectedClient.nombre} • {currentMonthYear}
                 </p>
               </div>
             </div>
             <button
               style={styles.buttonSecondary}
               onClick={() => setShowPreviewModal(false)}
             >
               <X style={{ width: "14px", height: "14px" }} />
               Cerrar
             </button>
           </div>
           
           <div style={styles.previewContent}>
             <div style={styles.previewFrame}>
               <iframe
                 srcDoc={generateProfessionalEmailHtml(selectedClient, currentMonthYear, plugins, wpVersion, notes)}
                 style={styles.previewIframe}
                 title="Informe de Mantenimiento"
               />
             </div>
           </div>
         </div>
       )}

       {/* Modal de confirmación para copiar del mes anterior */}
       {showCopyConfirmation && selectedClient && (() => {
         let prevMonth = selectedMonth - 1;
         let prevYear = selectedYear;
         if (prevMonth < 0) {
           prevMonth = 11;
           prevYear = selectedYear - 1;
         }
         const prevMonthKey = getMonthKey(prevMonth, prevYear);
         const prevMonthYear = getMonthYear(prevMonth, prevYear);
         
         return (
           <div style={styles.modalOverlay} onClick={() => setShowCopyConfirmation(false)}>
             <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
               <div style={styles.modalHeader}>
                 <div>
                   <h3 style={styles.modalTitle}>Confirmar Copia</h3>
                   <p style={styles.modalSubtitle}>
                     Copiar datos de {prevMonthYear} a {currentMonthYear}
                   </p>
                 </div>
                 <button
                   style={styles.modalClose}
                   onClick={() => setShowCopyConfirmation(false)}
                 >
                   <X style={{ width: "18px", height: "18px", color: "#64748b" }} />
                 </button>
               </div>
               
               <div style={styles.modalContent}>
                 <div style={{
                   padding: "16px",
                   backgroundColor: "#fffbeb",
                   border: "1px solid #fde68a",
                   borderRadius: "10px",
                   marginBottom: "16px",
                 }}>
                   <p style={{
                     fontSize: "14px",
                     fontWeight: 600,
                     color: "#92400e",
                     margin: "0 0 6px 0",
                   }}>
                     ⚠️ Esta acción sobrescribirá los datos actuales de {currentMonthYear}
                   </p>
                   <p style={{
                     fontSize: "13px",
                     color: "#b45309",
                     margin: "0",
                   }}>
                     Se copiarán {monthlyState[prevMonthKey]?.[selectedClient.id]?.plugins?.length || 0} plugins del mes anterior.
                     Cualquier progreso no guardado en este mes se perderá.
                   </p>
                 </div>
               </div>
               
               <div style={styles.modalFooter}>
                 <button
                   style={styles.buttonCancel}
                   onClick={() => setShowCopyConfirmation(false)}
                 >
                   Cancelar
                 </button>
                 <button
                   style={{ ...styles.buttonImport, backgroundColor: "#2563eb" }}
                   onClick={() => {
                     handleCopyFromPreviousMonth();
                     setShowCopyConfirmation(false);
                   }}
                 >
                   Confirmar Copia
                 </button>
               </div>
             </div>
           </div>
         );
       })()}

       {/* Modal de confirmación para limpiar datos del mes */}
       {showClearConfirmation && selectedClient && (
         <div style={styles.modalOverlay} onClick={() => setShowClearConfirmation(false)}>
           <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
             <div style={styles.modalHeader}>
               <div>
                 <h3 style={styles.modalTitle}>Limpiar Datos del Mes</h3>
                 <p style={styles.modalSubtitle}>
                   Eliminar todos los datos de {currentMonthYear} para {selectedClient.nombre}
                 </p>
               </div>
               <button
                 style={styles.modalClose}
                 onClick={() => setShowClearConfirmation(false)}
               >
                 <X style={{ width: "18px", height: "18px", color: "#64748b" }} />
               </button>
             </div>
             
             <div style={styles.modalContent}>
               <div style={{
                 padding: "16px",
                 backgroundColor: "#fef2f2",
                 border: "1px solid #fecaca",
                 borderRadius: "10px",
                 marginBottom: "16px",
               }}>
                 <p style={{
                   fontSize: "14px",
                   fontWeight: 600,
                   color: "#991b1b",
                   margin: "0 0 6px 0",
                 }}>
                   ⚠️ Esta acción es irreversible
                 </p>
                 <p style={{
                   fontSize: "13px",
                   color: "#b91c1c",
                   margin: "0",
                 }}>
                   Se eliminarán todos los plugins, notas y el estado de este mes.
                   Esta acción no se puede deshacer.
                 </p>
               </div>
             </div>
             
             <div style={styles.modalFooter}>
               <button
                 style={styles.buttonCancel}
                 onClick={() => setShowClearConfirmation(false)}
               >
                 Cancelar
               </button>
               <button
                 style={{ ...styles.buttonImport, backgroundColor: "#dc2626" }}
                 onClick={() => {
                   const newState: MonthlyState = { ...monthlyState };
                   if (newState[monthKey] && newState[monthKey][selectedClient.id]) {
                     delete newState[monthKey][selectedClient.id];
                     if (Object.keys(newState[monthKey]).length === 0) {
                       delete newState[monthKey];
                     }
                   }
                   setMonthlyState(newState);
                   saveMonthlyState(newState);
                   
                   setPlugins([]);
                   setHasScanned(false);
                   setReportSent(false);
                   setNotes("");
                   setShowClearConfirmation(false);
                 }}
               >
                 Confirmar Limpieza
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }

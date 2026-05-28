import { MaintenanceTaskId } from '@/lib/wordpress';

export interface Client {
  id: number;
  nombre: string;
  correo: string;
  dni: string;
  url: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteCheckData {
  siteName: string;
  description: string;
  wpVersion: string;
  timezone: string;
  isReachable: boolean;
  hasRestApi: boolean;
  healthStatus?: 'good' | 'recommended' | 'critical';
}

export interface MaintenanceTask {
  id: MaintenanceTaskId;
  label: string;
  completed: boolean;
}

export interface MaintenancePlugin {
  id: string;
  name: string;
  version: string;
  author: string;
  status: 'active' | 'inactive';
  hasUpdate: boolean;
  newVersion?: string;
  isUpdatedThisMonth: boolean;
}

export interface MaintenanceReportData {
  id: number;
  clientId: number;
  wpVersion: string | null;
  siteName: string | null;
  tasksData: MaintenanceTask[];
  notes: string | null;
  sentAt: Date;
}

export interface HistorialMantenimiento {
  id: number;
  clienteId: number;
  mesAnio: string;
  fechaRealizado: Date;
  pluginsTocados: string[];
  pluginsActualizados: string[];
  totalPlugins: number;
  enviado: boolean;
}

export interface MonthlyReport {
  clientId: number;
  clientName: string;
  clientEmail: string;
  clientUrl: string;
  monthYear: string;
  month: number;
  year: number;
  generatedAt: Date;
  plugins: {
    updated: MaintenancePlugin[];
    reviewed: MaintenancePlugin[];
    total: number;
  };
  wpVersion: string;
  notes?: string;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SendReportPayload {
  client: Client;
  monthYear: string;
  plugins: MaintenancePlugin[];
  wpVersion: string;
  notes?: string;
}

export function getCurrentMonthYear(): string {
  const date = new Date();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

export function getCurrentMonthNumber(): number {
  return new Date().getMonth();
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function getMonthYear(month: number, year: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

export function getMonthKey(month: number, year: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function parseMonthKey(key: string): { month: number; year: number } | null {
  const match = key.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10) - 1,
    };
  }
  return null;
}

export function getPreviousMonths(count: number = 12): Array<{ month: number; year: number; key: string; label: string }> {
  const months = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.getMonth();
    const year = date.getFullYear();
    months.push({
      month,
      year,
      key: getMonthKey(month, year),
      label: getMonthYear(month, year),
    });
  }
  
  return months;
}

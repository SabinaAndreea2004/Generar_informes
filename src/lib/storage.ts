export interface Client {
  id: number;
  nombre: string;
  correo: string;
  dni: string;
  url: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  reportsCount?: number;
}

export interface MaintenanceReport {
  id: number;
  clientId: number;
  wpVersion: string | null;
  siteName: string | null;
  tasksData: TaskData[];
  notes: string | null;
  sentAt: string;
}

export interface TaskData {
  id: string;
  label: string;
  completed: boolean;
}

const CLIENTS_KEY = 'mantenimiento_clients';
const REPORTS_KEY = 'mantenimiento_reports';

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

function getNextId(items: { id: number }[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map(i => i.id)) + 1;
}

export async function getClients(): Promise<Client[]> {
  const clients = getFromStorage<Client[]>(CLIENTS_KEY, []);
  const reports = getFromStorage<MaintenanceReport[]>(REPORTS_KEY, []);
  
  return clients.map(c => ({
    ...c,
    reportsCount: reports.filter(r => r.clientId === c.id).length,
  }));
}

export async function createClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'reportsCount'>): Promise<Client> {
  const clients = getFromStorage<Client[]>(CLIENTS_KEY, []);
  
  const existing = clients.find(c => c.correo === data.correo || c.dni === data.dni);
  if (existing) {
    throw new Error('Ya existe un cliente con este correo o DNI');
  }
  
  const now = new Date().toISOString();
  const newClient: Client = {
    id: getNextId(clients),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  
  clients.push(newClient);
  saveToStorage(CLIENTS_KEY, clients);
  
  return newClient;
}

export async function updateClient(id: number, data: Partial<Client>): Promise<Client> {
  const clients = getFromStorage<Client[]>(CLIENTS_KEY, []);
  const index = clients.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw new Error('Cliente no encontrado');
  }
  
  clients[index] = {
    ...clients[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  saveToStorage(CLIENTS_KEY, clients);
  return clients[index];
}

export async function toggleClientStatus(id: number, activo: boolean): Promise<void> {
  await updateClient(id, { activo });
}

export async function createReport(data: {
  clientId: number;
  wpVersion: string | null;
  siteName: string | null;
  tasksData: TaskData[];
  notes: string | null;
}): Promise<MaintenanceReport> {
  const reports = getFromStorage<MaintenanceReport[]>(REPORTS_KEY, []);
  
  const newReport: MaintenanceReport = {
    id: getNextId(reports),
    ...data,
    sentAt: new Date().toISOString(),
  };
  
  reports.push(newReport);
  saveToStorage(REPORTS_KEY, reports);
  
  return newReport;
}

export async function getClientReports(clientId: number): Promise<MaintenanceReport[]> {
  const reports = getFromStorage<MaintenanceReport[]>(REPORTS_KEY, []);
  return reports
    .filter(r => r.clientId === clientId)
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
    .slice(0, 10);
}

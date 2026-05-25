// @ts-nocheck
"use client";

import React, { useState } from "react";
import { Search, Wrench, UserMinus, UserPlus, Plus, Users, ClipboardList, TrendingUp } from "lucide-react";

export default function ClientList({
  initialClients,
  onSelectClient,
  onToggleStatus,
  onAddClient,
}: any) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = initialClients.filter(
    (c: any) =>
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.dni.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = initialClients.filter((c: any) => c.activo).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-100 tracking-tight">Directorio de Clientes</h2>
        <button onClick={onAddClient} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="panel-surface p-6">
          <p className="text-slate-500 text-xs font-semibold uppercase">Total</p>
          <p className="text-3xl font-bold text-slate-100 mt-1">{initialClients.length}</p>
        </div>
        <div className="panel-surface p-6">
          <p className="text-slate-500 text-xs font-semibold uppercase">Activos</p>
          <p className="text-3xl font-bold text-emerald-500 mt-1">{activeCount}</p>
        </div>
        <div className="panel-surface p-6">
          <p className="text-slate-500 text-xs font-semibold uppercase">En Mantenimiento</p>
          <p className="text-3xl font-bold text-indigo-500 mt-1">0</p>
        </div>
      </div>

      <div className="panel-surface">
        <div className="p-4 border-b border-[#1F1F1F]">
          <input 
            type="text"
            placeholder="Buscar por nombre o DNI..."
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2 text-sm text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none w-full"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <table className="w-full text-left text-sm">
          <thead className="text-[10px] uppercase text-slate-500 tracking-widest border-b border-[#1F1F1F]">
            <tr>
              <th className="p-4">Cliente</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F1F1F]">
            {filteredClients.map((client: any) => (
              <tr key={client.id} className="hover:bg-[#151515] transition-colors">
                <td className="p-4">
                  <div className="text-slate-200 font-medium">{client.nombre}</div>
                  <div className="text-[11px] text-slate-500">{client.url}</div>
                </td>
                <td className="p-4">
                  <span className={`text-[10px] px-2 py-1 rounded ${client.activo ? 'bg-emerald-900/30 text-emerald-500' : 'bg-red-900/30 text-red-500'}`}>
                    {client.activo ? 'ACTIVO' : 'BAJA'}
                  </span>
                </td>
                <td className="p-4 text-right space-x-3">
                  <button onClick={() => onSelectClient(client)} className="text-slate-400 hover:text-indigo-400">
                    <Wrench className="w-4 h-4" />
                  </button>
                  <button onClick={() => onToggleStatus(client.id)} className="text-slate-400 hover:text-red-400">
                    {client.activo ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

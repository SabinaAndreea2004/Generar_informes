// @ts-nocheck
// src/components/StatsDashboard.tsx
"use client";

import React from "react";
import { ChartBarIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";

export default function StatsDashboard({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      {/* Card: Total Informes */}
      <div className="glass p-8 rounded-3xl flex items-center gap-6 border border-slate-700/50">
        <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
          <ClipboardDocumentCheckIcon className="w-8 h-8" />
        </div>
        <div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Informes Enviados</p>
          <p className="text-4xl font-black text-white">{stats.totalReports}</p>
        </div>
      </div>

      {/* Card: Histórico por Mes */}
      <div className="glass p-8 rounded-3xl col-span-2 border border-slate-700/50">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
          <ChartBarIcon className="w-4 h-4 text-emerald-400" /> Actividad Mensual
        </h3>
        <div className="flex items-end gap-4 h-24">
          {stats.monthlyData.map((data: any) => (
            <div key={data.name} className="flex-1 flex flex-col items-center gap-3">
              <div 
                className="w-full bg-emerald-500/20 rounded-t-lg transition-all hover:bg-emerald-500/40 relative group" 
                style={{ height: `${(data.total / stats.totalReports) * 100}%` }}
              >
                <div className="absolute -top-10 left-0 right-0 text-center text-[10px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {data.total}
                </div>
              </div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter truncate w-full text-center">
                {data.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

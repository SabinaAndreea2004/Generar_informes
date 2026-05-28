"use client";

import { useState, useEffect } from "react";
import { X, Globe } from "lucide-react";
import { Client } from "@/types";

interface Props {
  title: string;
  client?: Client;
  onSave: (data: { nombre: string; correo: string; dni: string; url: string; activo?: boolean }) => void;
  onClose: () => void;
}

export default function ClientFormModal({ title, client, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    dni: "",
    url: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (client) {
      setForm({
        nombre: client.nombre,
        correo: client.correo,
        dni: client.dni,
        url: client.url,
      });
    }
  }, [client]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nombre.trim()) errs.nombre = "El nombre es requerido";
    if (!form.url.trim()) errs.url = "La URL es requerida";
    if (form.correo && !form.correo.includes("@")) errs.correo = "Email inválido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      nombre: form.nombre.trim(),
      correo: form.correo.trim(),
      dni: form.dni.trim(),
      url: form.url.startsWith("http") ? form.url.trim() : `https://${form.url.trim()}`,
    });
  };

  interface FormField { key: string; label: string; placeholder: string; required?: boolean; }
  const fields: FormField[] = [
    { key: "nombre", label: "Nombre de la empresa", placeholder: "Ej: Agencia Creativa", required: true },
    { key: "url", label: "URL del sitio web", placeholder: "Ej: https://agenciacreativa.com", required: true },
    { key: "correo", label: "Email de contacto", placeholder: "Ej: contacto@empresa.com" },
    { key: "dni", label: "DNI / CIF", placeholder: "Ej: B12345678" },
  ];

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100]" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {fields.map(({ key, label, placeholder, required }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={form[key as keyof typeof form]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-700 bg-slate-50 transition-all ${
                  errors[key] ? "border-red-300 bg-red-50" : "border-slate-200"
                }`}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              {errors[key] && <p className="text-[11px] text-red-500 mt-1">{errors[key]}</p>}
            </div>
          ))}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button onClick={onClose} className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-md shadow-blue-200">
            {client ? "Guardar Cambios" : "Añadir clientes"}
          </button>
        </div>
      </div>
    </div>
  );
}

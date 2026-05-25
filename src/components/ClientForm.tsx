"use client";

import React, { useState } from "react";
import { ArrowLeft, User, Mail, Hash, Globe, Loader2 } from "lucide-react";
import { Client } from "@/types";

interface ClientFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  onAdd: (data: Omit<Client, "id" | "createdAt" | "updatedAt" | "reportsCount">) => void;
}

export default function ClientForm({ onCancel, onAdd }: ClientFormProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    dni: "",
    url: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    setTimeout(() => {
      if (!formData.nombre || formData.nombre.length < 2) {
        setError("El nombre debe tener al menos 2 caracteres");
        setIsPending(false);
        return;
      }
      if (!formData.correo || !formData.correo.includes("@")) {
        setError("Correo electrónico inválido");
        setIsPending(false);
        return;
      }
      if (!formData.dni || formData.dni.length < 5) {
        setError("DNI debe tener al menos 5 caracteres");
        setIsPending(false);
        return;
      }
      if (!formData.url || formData.url.length < 5) {
        setError("URL inválida");
        setIsPending(false);
        return;
      }

      onAdd({
        nombre: formData.nombre,
        correo: formData.correo,
        dni: formData.dni,
        url: formData.url,
        activo: true,
      });
      setIsPending(false);
    }, 300);
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    fontSize: "14px",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-medium)",
    color: "var(--text-primary)",
    transition: "all 0.2s ease",
    outline: "none",
  } as React.CSSProperties;

  const labelStyle = {
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--text-secondary)",
    marginBottom: "8px",
    display: "block",
    letterSpacing: "0.01em",
  } as React.CSSProperties;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onCancel}
          className="p-2.5 rounded-xl transition-all btn-secondary"
        >
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-px" style={{ background: "var(--accent-primary)" }} />
            <span
              className="text-xs font-medium tracking-widest uppercase"
              style={{ color: "var(--accent-primary)" }}
            >
              Nuevo Registro
            </span>
          </div>
          <h1 className="text-2xl font-semibold section-title" style={{ color: "var(--text-primary)" }}>
            Agregar Nuevo Cliente
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="card-base p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: "var(--accent-light)" }}>
              <User className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
            </div>
            <h2
              className="font-medium text-lg"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), serif" }}
            >
              Datos del Cliente
            </h2>
          </div>

          <div>
            <label style={labelStyle}>Nombre del Cliente *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Acme Corporation"
              className="input-field"
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label style={labelStyle}>DNI / Identificación Fiscal *</label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                placeholder="Ej: A12345678"
                className="input-field"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Correo Electrónico *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  placeholder="cliente@ejemplo.com"
                  className="input-field"
                  style={{ ...inputStyle, paddingLeft: "44px" }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>URL del Sitio Web *</label>
            <div className="relative">
              <Globe className="absolute left-4 top-4 w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://misitio.com o misitio.com"
                className="input-field"
                style={{ ...inputStyle, paddingLeft: "44px" }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              La app verificará automáticamente el estado del sitio WordPress
            </p>
          </div>
        </div>

        {error && (
          <div
            className="mt-6 p-4 rounded-xl text-sm"
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
            }}
          >
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-xl font-medium text-sm transition-all btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all btn-primary disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cliente"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

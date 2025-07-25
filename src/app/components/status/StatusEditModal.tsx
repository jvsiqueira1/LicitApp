"use client";
import React, { useState, useEffect } from "react";
import { createOrReuseStatus } from "@/app/lib/statusUtils";
import { useSupabase } from "../../context/SupabaseContext";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface Status {
  id: string;
  name: string;
  color_hex?: string;
}

interface StatusEditModalProps {
  open: boolean;
  onClose: () => void;
  onStatusSaved: () => void;
  status?: Status | null; // null = criar novo, Status = editar existente
  projectId: string;
}

const DEFAULT_STATUS_COLOR = "#3B82F6";

export default function StatusEditModal({ 
  open, 
  onClose, 
  onStatusSaved, 
  status, 
  projectId 
}: StatusEditModalProps) {
  const { supabase } = useSupabase();
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_STATUS_COLOR);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preencher dados quando editar
  useEffect(() => {
    if (status) {
      setName(status.name);
      setColor(status.color_hex || DEFAULT_STATUS_COLOR);
    } else {
      setName("");
      setColor(DEFAULT_STATUS_COLOR);
    }
    setError(null);
  }, [status, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (status) {
        // Atualizar status existente
        const { error } = await supabase
          .from("statuses")
          .update({ name: name.trim(), color_hex: color })
          .eq("id", status.id);
        if (error) throw new Error(error.message || JSON.stringify(error));
      } else {
        // Criar novo status
        await createOrReuseStatus(supabase, projectId, name.trim(), color);
      }
      onStatusSaved();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar status:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!status) return;
    if (!confirm("Tem certeza que deseja excluir este status? Todas as tarefas associadas serão movidas para o primeiro status disponível.")) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Buscar outros status do mesmo projeto
      const { data: otherStatuses, error: statusError } = await supabase
        .from("statuses")
        .select("id")
        .eq("project_id", projectId)
        .neq("id", status.id)
        .order("order_index", { ascending: true })
        .limit(1);
      if (statusError) throw new Error(statusError.message || JSON.stringify(statusError));
      if (!otherStatuses || otherStatuses.length === 0) {
        // Último status: verificar se há tarefas associadas
        const { data: tasksWithThisStatus, error: tasksError } = await supabase
          .from("tasks")
          .select("id")
          .eq("status_id", status.id)
          .limit(1);
        if (tasksError) throw new Error(tasksError.message || JSON.stringify(tasksError));
        if (tasksWithThisStatus && tasksWithThisStatus.length > 0) {
          setError("Não é possível excluir o último status do projeto enquanto houver tarefas associadas a ele.");
          setLoading(false);
          return;
        }
        // Não há tarefas, pode excluir
        const { error } = await supabase
          .from("statuses")
          .delete()
          .eq("id", status.id);
        if (error) throw new Error(error.message || JSON.stringify(error));
        onStatusSaved();
        onClose();
        setLoading(false);
        return;
      }
      // Mover tarefas para o primeiro status disponível
      await supabase
        .from("tasks")
        .update({ status_id: otherStatuses[0].id })
        .eq("status_id", status.id);
      // Excluir o status
      const { error } = await supabase
        .from("statuses")
        .delete()
        .eq("id", status.id);
      if (error) throw new Error(error.message || JSON.stringify(error));
      onStatusSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir status");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-[400px] max-w-full bg-background-primary rounded-2xl shadow-2xl p-8 border border-border-subtle animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-default">{status ? "Editar Status" : "Novo Status"}</h2>
          <button
            onClick={onClose}
            className="text-[var(--color-icon-secondary)] hover:text-[var(--color-icon-primary)] transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="status-name" className="block text-sm font-medium text-text-muted mb-2">Nome do status</label>
            <input
              id="status-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-lg border border-border-subtle px-4 py-3 text-base bg-background-secondary text-text-default placeholder-[var(--color-text-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] hover:border-[var(--color-hover)] transition-colors duration-200"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Cor</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-10 h-10 p-0 border-none bg-transparent cursor-pointer"
                aria-label="Selecionar cor do status"
              />
              <span className="ml-2 text-xs text-text-muted">{color}</span>
            </div>
          </div>
          {error && (
            <div className="text-[var(--color-destructive, #ef4444)] text-sm bg-background-secondary border border-border-subtle rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            {status && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-3 text-[var(--color-destructive, #ef4444)] bg-background-secondary hover:bg-highlight-hover border border-border-subtle rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Excluir
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 text-text-default bg-background-secondary hover:bg-highlight-hover border border-border-subtle rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-highlight-light hover:bg-highlight-hover text-text-default border border-border-subtle rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Salvando..." : status ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
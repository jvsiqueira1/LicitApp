"use client";
import React, { useState, useEffect } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Project {
  id: string;
  name: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProjectEditModalProps {
  open: boolean;
  onClose: () => void;
  onProjectSaved: () => void;
  project: Project;
}

export default function ProjectEditModal({ 
  open, 
  onClose, 
  onProjectSaved, 
  project 
}: ProjectEditModalProps) {
  const { supabase } = useSupabase();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preencher dados quando abrir
  useEffect(() => {
    if (project) {
      setName(project.name);
      setColor(project.color || "#3B82F6");
    }
    setError(null);
  }, [project, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("O nome é obrigatório.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("projects")
        .update({ name: name.trim(), color })
        .eq("id", project.id);
      
      if (error) throw new Error(error.message || JSON.stringify(error));

      toast.success("Projeto atualizado com sucesso!");
      onProjectSaved();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao salvar projeto";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita e excluirá todas as listas, pastas, sprints, statuses e tarefas associadas.")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Excluir em cascata (Supabase deve ter RLS configurado para isso)
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", project.id);

      if (error) throw new Error(error.message || JSON.stringify(error));

      toast.success("Projeto excluído com sucesso!");
      onProjectSaved();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao excluir projeto";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-full" style={{ 
        backgroundColor: 'var(--color-background-primary)', 
        color: 'var(--color-text-primary)' 
      }}>
        <DialogHeader>
          <DialogTitle>Editar Projeto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <div className="space-y-2">
            <label htmlFor="project-name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Nome do Projeto
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do projeto"
              className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-colors duration-200"
              style={{
                backgroundColor: 'var(--color-background-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-subtle)'
              }}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Cor do Projeto</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-10 h-10 p-0 border-none bg-transparent cursor-pointer rounded-lg"
              />
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{color}</span>
            </div>
          </div>

          {error && (
            <div className="text-status-error text-sm bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-200 disabled:opacity-50"
              style={{
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border-subtle)',
                backgroundColor: 'transparent'
              }}
            >
              <TrashIcon className="w-4 h-4" />
              Excluir Projeto
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 rounded-xl transition-colors duration-200 disabled:opacity-50"
                style={{
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border-subtle)',
                  backgroundColor: 'transparent'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-xl font-medium transition-colors duration-200 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-highlight)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-subtle)'
                }}
              >
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
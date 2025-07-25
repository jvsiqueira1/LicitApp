"use client";
import React, { useState, useEffect } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { XMarkIcon, TrashIcon, UserIcon } from "@heroicons/react/24/outline";
import Checklist from "./Checklist";
import { Slider } from "@/components/ui/slider";

export interface Task {
  id: string;
  name: string;
  description?: string;
  status_id: string; // Corrigido: status_id é o campo correto
  assignee?: string;
  priority?: "low" | "medium" | "high";
  due_date?: string;
  progress?: number | null;
  list_id: string;
}

interface Status {
  id: string;
  name: string;
  color?: string;
}

interface TaskEditModalProps {
  open: boolean;
  onClose: () => void;
  onTaskSaved: () => void;
  task?: Task | null; // null = criar novo, Task = editar existente
  listId: string;
  statuses: Status[];
  defaultStatusId?: string;
}

export default function TaskEditModal({ 
  open, 
  onClose, 
  onTaskSaved, 
  task, 
  listId,
  statuses,
  defaultStatusId
}: TaskEditModalProps) {
  const { supabase } = useSupabase();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preencher dados quando editar
  useEffect(() => {
    if (task) {
      setName(task.name);
      setDescription(task.description || "");
      setStatusId(task.status_id); // Corrigido: usar status_id
      setAssignee(task.assignee || "");
      setPriority(task.priority || "medium");
      setDueDate(task.due_date || "");
      setProgress(task.progress || 0);
    } else {
      setName("");
      setDescription("");
      setStatusId(defaultStatusId || (statuses.length > 0 ? statuses[0].id : ""));
      setAssignee("");
      setPriority("medium");
      setDueDate("");
      setProgress(0);
    }
    setError(null);
  }, [task, open, statuses, defaultStatusId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("O nome é obrigatório.");
      return;
    }

    if (!statusId) {
      setError("Selecione um status.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Remover lógica de atualização de statuses.list_id
      const taskData = {
        name: name.trim(),
        description: description.trim() || null,
        status_id: statusId,
        assignee: assignee || null,
        priority,
        due_date: dueDate || null,
        progress,
        list_id: listId
      };
      let error;
      if (task && task.id) {
        // Editar tarefa existente
        ({ error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", task.id));
      } else {
        // Criar nova tarefa
        ({ error } = await supabase
          .from("tasks")
          .insert(taskData));
      }
      if (error) {
        console.error("Erro ao salvar tarefa:", error);
        if (error.details) console.error("Detalhes:", error.details);
        if (error.hint) console.error("Hint:", error.hint);
        setError(error.message);
        return;
      }
      onTaskSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar tarefa");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id);

      if (error) throw new Error(error.message || JSON.stringify(error));

      onTaskSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir tarefa");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-[800px] max-w-full bg-background-primary rounded-3xl shadow-2xl p-8 border border-border-subtle animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-default">
            {task ? "Editar Tarefa" : "Nova Tarefa"}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-icon-secondary)] hover:text-[var(--color-icon-primary)] transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        {/* Checklist no topo */}
        {task?.id ? (
          <div className="mb-6">
            <Checklist taskId={task.id} />
          </div>
        ) : (
          <div className="text-text-muted text-sm px-2 py-4 bg-background-secondary rounded border border-border-subtle mb-6">
            Salve a tarefa para adicionar um checklist.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="task-name" className="block text-sm font-medium text-text-muted mb-2">
              Nome da Tarefa
            </label>
            <input
              id="task-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome da tarefa"
              className="w-full bg-background-secondary border border-border-subtle rounded-xl px-4 py-3 text-text-default placeholder-[var(--color-text-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] hover:border-[var(--color-hover)] transition-colors duration-200"
              required
            />
          </div>

          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-text-muted mb-2">
              Descrição
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a tarefa..."
              rows={3}
              className="w-full bg-background-secondary border border-border-subtle rounded-xl px-4 py-3 text-text-default placeholder-[var(--color-text-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] hover:border-[var(--color-hover)] transition-colors duration-200 resize-none"
            />
          </div>

          <div>
            <label htmlFor="task-assignee" className="block text-sm font-medium text-text-muted mb-2">
              Responsável
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--color-icon-secondary)]" />
              <input
                id="task-assignee"
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Nome do responsável"
                className="w-full bg-background-secondary border border-border-subtle rounded-xl pl-10 pr-4 py-3 text-text-default placeholder-[var(--color-text-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] hover:border-[var(--color-hover)] transition-colors duration-200"
              />
            </div>
          </div>

          <div>
            <label htmlFor="task-priority" className="block text-sm font-medium text-text-muted mb-2">
              Prioridade
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={e => setPriority(e.target.value as "low" | "medium" | "high")}
              className="w-full bg-background-secondary border border-border-subtle rounded-xl px-4 py-3 text-text-default focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] hover:border-[var(--color-hover)] transition-colors duration-200"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>

          <div>
            <label htmlFor="task-status" className="block text-sm font-medium text-text-muted mb-2">
              Status *
            </label>
            <select
              id="task-status"
              value={statusId}
              onChange={e => setStatusId(e.target.value)}
              className="w-full bg-background-secondary border border-border-subtle rounded-xl px-4 py-3 text-text-default focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] hover:border-[var(--color-hover)] transition-colors duration-200"
              required
            >
              {statuses.length === 0 && <option value="">Nenhum status disponível</option>}
              {statuses.map(status => (
                <option key={status.id} value={status.id}>{status.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="task-due-date" className="block text-sm font-medium text-text-muted mb-2">
              Data de Entrega
            </label>
            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full bg-background-secondary border border-border-subtle rounded-xl px-4 py-3 text-text-default focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] hover:border-[var(--color-hover)] transition-colors duration-200"
            />
          </div>

          <div>
            <label htmlFor="task-progress" className="block text-sm font-medium text-text-muted mb-2">
              Progresso
            </label>
            <div className="flex items-center gap-4">
              <Slider
                value={[progress]}
                min={0}
                max={100}
                step={1}
                onValueChange={([val]) => setProgress(val)}
                className="flex-1 h-2 [&_[role=slider]]:bg-[var(--color-progress-fill)] [&_[role=slider]]:border-none [&_[role=slider]]:shadow [&_[role=slider]]:focus-visible:outline-none"
                aria-label="Progresso da tarefa"
              />
              <span className="text-xs text-text-muted min-w-[32px] text-right">{progress}%</span>
            </div>
          </div>

          {error && (
            <div className="text-[var(--color-destructive, #ef4444)] text-sm bg-background-secondary border border-border-subtle rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {task && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-[var(--color-destructive, #ef4444)] hover:text-text-default hover:bg-highlight-hover rounded-xl transition-colors disabled:opacity-50 border border-border-subtle"
              >
                <TrashIcon className="w-4 h-4" />
                Excluir
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 text-text-muted hover:text-text-default rounded-xl transition-colors disabled:opacity-50 border border-border-subtle bg-background-secondary hover:bg-highlight-hover"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-highlight-light hover:bg-highlight-hover text-text-default rounded-xl font-medium transition-colors disabled:opacity-50 border border-border-subtle"
              >
                {loading ? "Salvando..." : task ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 
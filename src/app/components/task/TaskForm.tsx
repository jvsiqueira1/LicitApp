"use client";
import { useState, useEffect } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface Status {
  id: string;
  name: string;
  color?: string;
}

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
  listId: string;
  listName: string;
  listType: "lista" | "sprint" | "pasta";
}

export default function TaskForm({ 
  open, 
  onClose, 
  onTaskAdded, 
  listId, 
  listName, 
  listType 
}: TaskFormProps) {
  const { supabase, user } = useSupabase();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"baixa" | "média" | "alta">("média");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [statusId, setStatusId] = useState<string>("");

  // Buscar statuses da lista
  useEffect(() => {
    if (!open || !listId) return;
    setStatuses([]);
    setStatusId("");
    supabase
      .from("statuses")
      .select("id, name, color")
      .eq("list_id", listId)
      .order("order_index", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setStatuses(data);
          setStatusId(data[0].id); // Seleciona o primeiro status por padrão
        }
      });
  }, [open, listId, supabase]);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setPriority("média");
      setError(null);
      setStatusId("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("O nome da tarefa é obrigatório.");
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
      const { error } = await supabase
        .from("tasks")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          priority,
          list_id: listId,
          status_id: statusId,
          user_id: user?.id
        });
      if (error) throw new Error(error.message || JSON.stringify(error));
      toast.success("Tarefa criada com sucesso!");
      onTaskAdded();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar tarefa";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const getListTypeIcon = () => {
    switch (listType) {
      case "lista":
        return "📝";
      case "sprint":
        return "🏁";
      case "pasta":
        return "📁";
      default:
        return "📋";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-[480px] max-w-full bg-[var(--color-background-primary)] rounded-3xl shadow-2xl p-8 border border-[var(--color-border-subtle)] animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            Nova Tarefa {getListTypeIcon()} <span className="text-base font-normal text-[var(--color-text-secondary)]">em {listName}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-icon-secondary)] hover:text-[var(--color-icon-primary)] transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-2 space-y-4">
          <div>
            <label htmlFor="task-name" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Nome da tarefa *
            </label>
            <input
              id="task-name"
              type="text"
              placeholder="Digite o nome da tarefa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-subtle)] px-4 py-3 text-base bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] hover:border-[var(--color-hover)] transition-colors duration-200"
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Descrição
            </label>
            <textarea
              id="task-description"
              placeholder="Adicione uma descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[var(--color-border-subtle)] px-4 py-3 text-base bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] hover:border-[var(--color-hover)] transition-colors duration-200 resize-none"
            />
          </div>
          <div>
            <label htmlFor="task-status" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Status *
            </label>
            <select
              id="task-status"
              value={statusId}
              onChange={e => setStatusId(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-subtle)] px-4 py-3 text-base bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] hover:border-[var(--color-hover)] transition-colors duration-200"
              required
            >
              {statuses.length === 0 && <option value="">Nenhum status disponível</option>}
              {statuses.map(status => (
                <option key={status.id} value={status.id}>{status.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="task-priority" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Prioridade
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as "baixa" | "média" | "alta")}
              className="w-full rounded-lg border border-[var(--color-border-subtle)] px-4 py-3 text-base bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] hover:border-[var(--color-hover)] transition-colors duration-200"
            >
              <option value="baixa">Baixa</option>
              <option value="média">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          {error && (
            <div className="text-[var(--color-destructive, #ef4444)] text-sm bg-[var(--color-background-secondary)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 text-[var(--color-text-primary)] bg-[var(--color-background-secondary)] hover:bg-[var(--color-hover)] border border-[var(--color-border-subtle)] rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-[var(--color-highlight)] hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar Tarefa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
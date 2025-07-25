import React from "react";
import { EllipsisHorizontalIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Progress } from "@/components/ui/progress";
import { GripVertical } from "lucide-react";

export interface KanbanColumnProps {
  status: { id: string; name: string; color_hex: string };
  tasks: Array<{ 
    id: string; 
    name: string; 
    description?: string;
    status: string; 
    assignee?: string;
    priority?: "low" | "medium" | "high";
    due_date?: string;
    progress?: number | null; 
  }>;
  onAddTask?: () => void;
  onEditStatus?: () => void;
  onEditTask?: (taskId: string) => void;
}

export default function KanbanColumn({ status, tasks, onAddTask, onEditStatus, onEditTask }: KanbanColumnProps) {
  return (
    <div className="min-w-[320px] w-full flex flex-col mb-2 bg-background-primary rounded-xl p-4 border border-border-subtle">
      <div className="flex items-center mb-2">
        <div
          className="flex items-center gap-2 select-none cursor-grab opacity-60 hover:opacity-100 transition-opacity mr-2"
          title="Arraste para reordenar"
          role="button"
          tabIndex={-1}
          aria-label="Arraste para reordenar status"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-[var(--color-border-subtle)]" />
        </div>
      </div>
      <div className="font-bold text-text-default mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-4 h-4 rounded-full border border-border-subtle"
            style={{ backgroundColor: status.color_hex || '#888' }}
            title="Cor do status"
          />
          <span>{status.name}</span>
          <span className="bg-[var(--color-border-subtle)] text-xs px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        {onEditStatus && (
          <button
            onClick={onEditStatus}
            className="text-[var(--color-icon-secondary)] hover:text-[var(--color-icon-primary)] transition-colors p-1 rounded"
            title="Editar status"
          >
            <EllipsisHorizontalIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-text-muted text-xs border-b border-border-subtle">
              <th className="py-1 px-2 font-semibold">Nome</th>
              <th className="py-1 px-2 font-semibold">Data de Entrega</th>
              <th className="py-1 px-2 font-semibold">Progresso</th>
              <th className="py-1 px-2 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, idx) => (
              <tr
                key={task.id}
                className={
                  "text-sm text-text-default " +
                  (idx !== tasks.length - 1 ? "border-b border-border-subtle" : "") +
                  " hover:bg-highlight-hover transition-colors duration-150"
                }
                style={{ background: 'none', boxShadow: 'none', borderRadius: 0 }}
              >
                <td className="py-2 px-2 cursor-pointer font-medium" onClick={() => onEditTask?.(task.id)}>
                  {task.name}
                </td>
                <td className="py-2 px-2 text-text-muted text-xs">{task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</td>
                <td className="py-2 px-2 w-40">
                  <div className="flex items-center gap-2">
                    <Progress value={task.progress ?? 0} className="w-24" />
                    <span className="text-xs text-text-muted min-w-[32px] text-right">{task.progress ?? 0}%</span>
                  </div>
                </td>
                <td>
                  <button
                    className="text-[var(--color-icon-secondary)] hover:text-[var(--color-icon-primary)] transition-colors p-1"
                    title="Editar tarefa"
                    onClick={() => onEditTask?.(task.id)}
                  >
                    <EllipsisHorizontalIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && (
          <div className="text-text-muted text-center py-4">Nenhuma tarefa</div>
        )}
      </div>
      <button className="mt-2 text-xs text-text-muted hover:underline flex items-center gap-1" onClick={onAddTask}>
        <PlusIcon className="w-4 h-4" />
        Adicionar Tarefa
      </button>
    </div>
  );
} 
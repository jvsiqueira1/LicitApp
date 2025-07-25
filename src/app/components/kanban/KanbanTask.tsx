import React from "react";
import { PencilIcon, UserIcon, CalendarIcon, FlagIcon } from "@heroicons/react/24/outline";
import { Progress } from "@/components/ui/progress";

export interface KanbanTaskProps {
  task: {
    id: string;
    name: string;
    description?: string;
    status: string;
    assignee?: string;
    priority?: "low" | "medium" | "high";
    due_date?: string;
    progress?: number | null;
  };
  onEditTask?: () => void;
}

const PRIORITY_COLORS = {
  low: "text-[var(--color-text-secondary)]",
  medium: "text-[var(--color-text-secondary)]",
  high: "text-[var(--color-text-secondary)]"
};

const PRIORITY_LABELS = {
  low: "Baixa",
  medium: "Média",
  high: "Alta"
};

export default function KanbanTask({ task, onEditTask }: KanbanTaskProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div 
      className="bg-[var(--color-background-secondary)] rounded-lg p-3 mb-2 shadow flex flex-col gap-2 border border-[var(--color-border-subtle)] hover:border-[var(--color-hover)] transition-colors duration-200 cursor-pointer group"
      onClick={onEditTask}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[var(--color-text-primary)] text-sm leading-tight">
            {task.name}
          </div>
          {task.description && (
            <div className="text-[var(--color-text-secondary)] text-xs mt-1 line-clamp-2">
              {task.description}
            </div>
          )}
        </div>
        <button
          className="text-[var(--color-icon-secondary)] hover:text-[var(--color-icon-primary)] transition-colors duration-200 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onEditTask?.();
          }}
        >
          <PencilIcon className="w-3 h-3" />
        </button>
      </div>

      {/* Meta informações */}
      <div className="flex flex-wrap gap-2 mt-1">
        {task.assignee && (
          <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
            <UserIcon className="w-3 h-3" />
            <span>{task.assignee}</span>
          </div>
        )}
        {task.priority && (
          <div className={`flex items-center gap-1 ${PRIORITY_COLORS[task.priority]}`}> 
            <FlagIcon className="w-3 h-3" />
            <span>{PRIORITY_LABELS[task.priority]}</span>
          </div>
        )}
        {task.due_date && (
          <div className={`flex items-center gap-1 ${task.due_date && new Date(task.due_date) < new Date() ? 'text-[var(--color-destructive, #ef4444)]' : 'text-[var(--color-text-secondary)]'}`}>
            <CalendarIcon className="w-3 h-3" />
            <span>{formatDate(task.due_date)}</span>
          </div>
        )}
      </div>

      {/* Progresso */}
      {typeof task.progress === "number" && (
        <Progress value={task.progress} className="w-full mt-1 h-1.5" />
      )}
    </div>
  );
} 
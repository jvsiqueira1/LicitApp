"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import KanbanColumn from "./KanbanColumn";
import StatusEditModal from "../status/StatusEditModal";
import TaskEditModal from "../task/TaskEditModal";
import { List } from "../../hooks/useLists";
import { useSupabase } from "../../context/SupabaseContext";
import { PlusIcon } from "@heroicons/react/24/outline";
import { createOrReuseStatus } from "@/app/lib/statusUtils";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Status {
  id: string;
  name: string;
  color?: string;
  color_hex?: string;
}

interface Task {
  id: string;
  name: string;
  description?: string;
  status_id: string;
  assignee?: string;
  priority?: "low" | "medium" | "high";
  due_date?: string;
  progress?: number | null;
  list_id: string;
}

// Wrapper para validação de lista antes de chamar hooks
function KanbanBoardWrapper(props: { lista: List, taskCreatedFlag?: number }) {
  const { lista } = props;
  if (!lista || !lista.id || !lista.project_id || !lista.name || !lista.type) {
    console.error('KanbanBoard: lista incompleta recebida:', lista);
    return <div className="p-8 text-red-500">Erro: Lista incompleta ou inválida selecionada.</div>;
  }
  return <KanbanBoard {...props} />;
}

// KanbanBoard original, sem validação condicional de hooks
function KanbanBoard({ lista, taskCreatedFlag }: { lista: List, taskCreatedFlag?: number }) {
  const { supabase } = useSupabase();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingStatus, setCreatingStatus] = useState(false);
  const [newStatusName, setNewStatusName] = useState("");
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Buscar statuses e tasks
  const fetchBoard = async () => {
    setLoading(true);
    try {
      
      // Buscar também o campo color_hex e order_index
      const [statusesRes, tasksRes] = await Promise.all([
        supabase.from("statuses").select("id, name, color_hex, order_index").eq("project_id", lista.project_id).order("order_index", { ascending: true }),
        supabase.from("tasks").select("id, name, description, status_id, assignee, priority, due_date, progress, list_id").eq("list_id", lista.id),
      ]);
      
      if (statusesRes.error) {
        console.error("Erro ao buscar statuses:", statusesRes.error);
        console.error("Detalhes do erro statuses:", {
          code: statusesRes.error.code,
          message: statusesRes.error.message,
          details: statusesRes.error.details,
          hint: statusesRes.error.hint
        });
      }
      if (tasksRes.error) {
        console.error("Erro ao buscar tasks:", tasksRes.error);
        console.error("Detalhes do erro tasks:", {
          code: tasksRes.error.code,
          message: tasksRes.error.message,
          details: tasksRes.error.details,
          hint: tasksRes.error.hint
        });
      }
      
      setStatuses(statusesRes.data || []);
      setTasks(tasksRes.data || []);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!lista?.id) return;
    fetchBoard();
    // eslint-disable-next-line
  }, [lista, supabase, taskCreatedFlag]);

  // Agrupar tarefas por status
  const tasksByStatus: Record<string, Task[]> = {};
  statuses.forEach((status) => {
    tasksByStatus[status.id] = tasks.filter((t) => t.status_id === status.id);
  });

  // Mapear tasks do formato do banco para o formato esperado pelos componentes
  const mapTaskForKanban = (task: Task) => ({
    id: task.id,
    name: task.name,
    description: task.description,
    status: task.status_id, // Mapear status_id para status
    assignee: task.assignee,
    priority: task.priority,
    due_date: task.due_date,
    progress: task.progress
  });

  // Função para ordenar tarefas conforme desejado
  function ordenarTarefas(tarefas: Task[]): Task[] {
    return [...tarefas].sort((a, b) => {
      const progA = typeof a.progress === 'number' ? a.progress : 0;
      const progB = typeof b.progress === 'number' ? b.progress : 0;

      // 1. Concluídas primeiro
      if (progA === 100 && progB !== 100) return -1;
      if (progB === 100 && progA !== 100) return 1;
      // 2. Em andamento depois
      if (progA > 0 && progA < 100 && (progB === 0 || progB === 100)) return -1;
      if (progB > 0 && progB < 100 && (progA === 0 || progA === 100)) return 1;
      // 3. Não iniciadas por último
      if (progA === 0 && progB !== 0) return 1;
      if (progB === 0 && progA !== 0) return -1;
      // 4. Dentro do grupo, por nome
      return a.name.localeCompare(b.name);
    });
  }

  // Criar novo status
  const handleCreateStatus = async () => {
    if (!newStatusName.trim()) return;
    if (!lista?.id) {
      toast.error("Lista não encontrada");
      return;
    }
    try {
      // Buscar o project_id da lista
      const { data: listData, error: listError } = await supabase
        .from("lists")
        .select("project_id")
        .eq("id", lista.id)
        .single();
      if (listError || !listData) throw new Error("Erro ao buscar projeto da lista");
      // Deduplicação: criar ou reutilizar status
      await createOrReuseStatus(supabase, listData.project_id, newStatusName.trim(), "#3B82F6"); // Ajuste a cor conforme necessário
      toast.success("Status criado ou reutilizado com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar status");
    }
    setNewStatusName("");
    setCreatingStatus(false);
    fetchBoard();
  };

  // Abrir modal para criar/editar status
  const handleOpenStatusModal = (status?: Status) => {
    setEditingStatus(status || null);
    setShowStatusModal(true);
  };

  const handleStatusSaved = () => {
    fetchBoard();
  };

  // Abrir modal para criar/editar tarefa
  const handleOpenTaskModal = (task?: Task) => {
    setEditingTask(task || null);
    setShowTaskModal(true);
  };

  const handleTaskSaved = () => {
    fetchBoard();
  };

  // Estado para ordem dos status (drag and drop)
  const [statusOrder, setStatusOrder] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => {
    setStatusOrder(statuses.map((s) => s.id));
  }, [statuses]);

  // Handler de drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = statusOrder.indexOf(String(active.id));
    const newIndex = statusOrder.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(statusOrder, oldIndex, newIndex);
    setStatusOrder(newOrder);
    // Montar array de status completos na nova ordem
    const statusesToUpdate = newOrder.map((id, idx) => {
      const s = statuses.find(st => st.id === id);
      if (!s) return null;
      return {
        id: s.id,
        project_id: lista.project_id,
        name: s.name,
        color_hex: s.color_hex || s.color || "#3B82F6",
        order_index: idx
      };
    }).filter(Boolean);
    try {
      await fetch("/api/update-statuses-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statuses: statusesToUpdate }),
      });
      fetchBoard();
    } catch (e) {
      toast.error("Erro ao atualizar ordem dos status");
    }
  };

  // Sensores do dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (loading) return <div className="p-8 text-neutral-400">Carregando quadro...</div>;

  // Estado vazio - quando não há statuses
  if (statuses.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="bg-neutral-200 border border-neutral-400 rounded-xl p-8 max-w-md">
            <div className="w-16 h-16 bg-neutral-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusIcon className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">
              Nenhum status encontrado
            </h3>
            <p className="text-neutral-700 mb-6">
              Para começar a usar o quadro Kanban, você precisa criar pelo menos um status para organizar suas tarefas.
            </p>
            <button 
              className="bg-neutral-500 hover:bg-neutral-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
              onClick={() => handleOpenStatusModal()}
            >
              <PlusIcon className="w-5 h-5" />
              Criar primeiro status
            </button>
          </div>
        </div>

        <StatusEditModal
          open={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          onStatusSaved={handleStatusSaved}
          status={editingStatus}
          listId={lista.id}
        />

        <TaskEditModal
          open={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          onTaskSaved={handleTaskSaved}
          task={editingTask}
          listId={lista.id}
          statuses={statuses}
          defaultStatusId={editingTask?.status_id}
        />
      </>
    );
  }

  // Sortable wrapper para KanbanColumn
  function SortableKanbanColumn({ id, children }: { id: string; children: React.ReactNode }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
      isOver,
    } = useSortable({ id });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      zIndex: isDragging ? 20 : undefined,
      boxShadow: isDragging
        ? "0 4px 16px 0 rgba(0,0,0,0.10), 0 0 0 2px #8882"
        : isOver
        ? "0 0 0 2px #8884"
        : undefined,
      opacity: isDragging ? 0.5 : 1,
      background: isDragging ? "var(--color-background-secondary)" : undefined,
      filter: isDragging ? "blur(1px)" : undefined,
      pointerEvents: isDragging ? "none" : undefined,
      transitionProperty: "box-shadow, opacity, filter, background, transform",
      transitionDuration: "180ms",
      transitionTimingFunction: "cubic-bezier(.4,2,.6,1)",
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {children}
        {isOver && !isDragging && (
          <div className="h-8 bg-[var(--color-border-subtle)] rounded-xl opacity-40 my-2 animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="w-full flex flex-col gap-4">
        <div className="mb-2">
          {creatingStatus ? (
            <div className="bg-neutral-900 border border-primary-500 rounded-xl p-4 flex flex-col gap-2 max-w-md">
              <input
                className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-neutral-100"
                placeholder="Nome do status"
                value={newStatusName}
                onChange={e => setNewStatusName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button className="bg-primary-600 text-white px-3 py-1 rounded" onClick={handleCreateStatus}>Adicionar</button>
                <button className="text-neutral-400 px-3 py-1" onClick={() => setCreatingStatus(false)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <button className="bg-[var(--color-background-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] rounded-xl px-4 py-2 hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] transition-colors duration-200" onClick={() => handleOpenStatusModal()}>
              + Novo status
            </button>
          )}
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={statusOrder} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-4 w-full">
              {statusOrder.map((statusId) => {
                const status = statuses.find((s) => s.id === statusId);
                if (!status) return null;
                return (
                  <SortableKanbanColumn key={status.id} id={status.id}>
                    <KanbanColumn
                      status={status}
                      tasks={ordenarTarefas(tasksByStatus[status.id] || []).map(mapTaskForKanban)}
                      onAddTask={() => handleOpenTaskModal()}
                      onEditStatus={() => handleOpenStatusModal(status)}
                      onEditTask={(taskId) => {
                        const task = tasks.find(t => t.id === taskId);
                        if (task) handleOpenTaskModal(task);
                      }}
                    />
                  </SortableKanbanColumn>
                );
              })}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div style={{ opacity: 0.85 }}>
                <KanbanColumn
                  status={statuses.find(s => s.id === activeId)!}
                  tasks={ordenarTarefas(tasksByStatus[activeId] || []).map(mapTaskForKanban)}
                  onAddTask={() => {}}
                  onEditStatus={() => {}}
                  onEditTask={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <StatusEditModal
        open={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onStatusSaved={handleStatusSaved}
        status={editingStatus}
        listId={lista.id}
      />

      <TaskEditModal
        open={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onTaskSaved={handleTaskSaved}
        task={editingTask}
        listId={lista.id}
        statuses={statuses}
        defaultStatusId={editingTask?.status_id}
      />
    </>
  );
} 

// Exportar o wrapper como default
export default KanbanBoardWrapper; 
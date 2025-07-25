import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DialogDescription } from "@/components/ui/dialog";
import type { Status } from "../../hooks/useStatuses";
import { useSupabase } from "@/app/context/SupabaseContext";
import type { Task } from "../task/TaskEditModal";
import PieStatusChart, { PieStatusChartData } from "./PieStatusChart";

interface StatusTasksSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: Status | null;
  chartData: PieStatusChartData[];
  statuses: Status[];
}

export const StatusTasksModal: React.FC<StatusTasksSheetProps> = ({ open, onOpenChange, status, chartData, statuses }) => {
  const { supabase } = useSupabase();
  // Estado local para status selecionado no modal
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(status);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Atualiza status selecionado ao abrir o modal
  React.useEffect(() => {
    if (open) setSelectedStatus(status);
  }, [open, status]);

  // Busca tarefas do status selecionado
  useEffect(() => {
    if (!open || !selectedStatus) return;
    setLoading(true);
    setError(null);
    supabase
      .from("tasks")
      .select("*")
      .eq("status_id", selectedStatus.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setTasks(data || []);
        setLoading(false);
      });
  }, [open, selectedStatus, supabase]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full bg-background-primary border border-border-subtle rounded-2xl shadow-xl p-0 overflow-hidden">
        <DialogDescription />
        {/* CSS global para garantir remoção de borda/stroke no modal */}
        <style jsx global>{`
          .recharts-sector:focus,
          .recharts-sector:focus-visible,
          .recharts-sector:active,
          .recharts-sector {
            outline: none !important;
            stroke: none !important;
            box-shadow: none !important;
          }
          .recharts-sector[stroke] {
            stroke: none !important;
          }
        `}</style>
        <div className="flex flex-col md:flex-row h-full">
          {/* Gráfico à esquerda */}
          <div className="md:w-1/2 w-full p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-border-subtle bg-background-primary">
            <PieStatusChart
              data={chartData}
              statuses={statuses}
              onSliceClick={(s) => setSelectedStatus(s)}
              selectedStatusId={selectedStatus?.id}
              highlightSelected={true}
              explodeOffset={1}
            />
          </div>
          {/* Tarefas à direita */}
          <div className="md:w-1/2 w-full p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              {selectedStatus && (
                <span
                  className="inline-block w-5 h-5 rounded-full border border-border-subtle shrink-0"
                  style={{ background: selectedStatus.color_hex || "#888" }}
                  aria-label={selectedStatus.name}
                />
              )}
              <DialogTitle className="text-lg font-bold text-text-default">
                {selectedStatus ? selectedStatus.name : "Status"}
              </DialogTitle>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground animate-pulse">
                  Carregando tarefas...
                </div>
              ) : error ? (
                <div className="text-status-error text-center">Erro: {error}</div>
              ) : tasks.length === 0 ? (
                <div className="text-center text-muted-foreground">Nenhuma tarefa para este status.</div>
              ) : (
                <div>
                  <div className="flex items-center justify-between px-1 pb-1 text-xs text-text-muted font-semibold uppercase">
                    <span className="w-1/2">Nome</span>
                    <span className="w-1/4 text-center">Data de Entrega</span>
                    <span className="w-1/4 text-right">Progresso</span>
                  </div>
                  <ul className="divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <li key={task.id} className="flex items-center justify-between py-2 text-sm">
                        <span className="truncate font-medium text-text-default w-1/2">{task.name}</span>
                        <span className="ml-2 text-xs text-text-muted w-1/4 text-center">{task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : '-'}</span>
                        <span className="ml-2 text-xs text-text-muted w-1/4 text-right">{typeof task.progress === "number" ? Math.round(task.progress) + '%' : '-'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatusTasksModal; 
import React, { useEffect, useState } from "react";
import { Project } from "../components/project/ProjectList";
import { useSupabase } from "../context/SupabaseContext";
import {
  RocketLaunchIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { useLists, List as TaskList } from "../hooks/useLists";
import { useStatuses } from "../hooks/useStatuses";
import PieStatusChart from "../components/status/PieStatusChart";
import { StatusTasksModal } from "../components/status/StatusTasksSheet";
import type { Status } from "../components/task/ListList";
import { Progress } from "@/components/ui/progress";
import type { Task } from "../components/task/TaskEditModal";

interface ProjectDetailsDashboardProps {
  project: Project;
}

function EditListColorModal({ open, onClose, list, onSaved }: { open: boolean; onClose: () => void; list: TaskList; onSaved: () => void }) {
  const { supabase } = useSupabase();
  const [color, setColor] = useState(list.color || "#8884d8");
  const [colorName, setColorName] = useState(list.color_name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-80 max-w-full bg-[var(--color-background-primary)] rounded-2xl shadow-2xl p-6 border border-[var(--color-border-subtle)] animate-fade-in flex flex-col gap-4">
        <div className="text-lg font-bold text-[var(--color-text-primary)] mb-1 text-center">Editar cor da lista</div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            const { error } = await supabase
              .from("lists")
              .update({ color, color_name: colorName })
              .eq("id", list.id);
            setLoading(false);
            if (error) setError(error.message);
            else {
              onSaved();
              onClose();
            }
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col items-center gap-1">
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-12 h-12 p-0 border-none bg-transparent cursor-pointer"
              title="Escolha a cor da lista"
              style={{ boxShadow: '0 0 0 1.5px var(--color-border-subtle)' }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1" htmlFor="colorNameInput">Nome da cor</label>
            <input
              id="colorNameInput"
              type="text"
              value={colorName}
              onChange={e => setColorName(e.target.value)}
              placeholder="Ex: Financeiro, Jurídico, Projeto..."
              className="rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-base bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              maxLength={24}
            />
          </div>
          <div className="text-xs text-[var(--color-text-secondary)] text-left mt-1">
            A cor e o nome serão exibidos no dashboard e na sidebar para indicar o tipo ou área da lista.
          </div>
          {error && <div className="text-[var(--color-destructive)] text-sm text-center">{error}</div>}
          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-hover)] font-medium text-sm"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-[var(--color-highlight)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-hover)] font-semibold text-sm"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetailsDashboard({
  project,
}: ProjectDetailsDashboardProps) {
  const { supabase } = useSupabase();
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingList, setEditingList] = useState<TaskList | null>(null);
  const [colorModalOpen, setColorModalOpen] = useState(false);

  // Buscar listas (tarefas)
  const { fetchLists } = useLists(project.id);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [listsLoading, setListsLoading] = useState(true);

  // Buscar tarefas do projeto
  const [tasks, setTasks] = useState<Task[]>([]);

  // Buscar statuses
  const { fetchStatuses } = useStatuses(project.id);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [statusesLoading, setStatusesLoading] = useState(true);

  useEffect(() => {
    setStatusesLoading(true);
    fetchStatuses().then((data) => {
      setStatuses(data);
      setStatusesLoading(false);
    });
  }, [fetchStatuses]);

  // Fetch lists
  useEffect(() => {
    setListsLoading(true);
    fetchLists().then((data) => {
      setTaskLists(data);
      setListsLoading(false);
    });
  }, [fetchLists]);

  // Buscar tarefas (com logs detalhados)
  useEffect(() => {
    const listIds = taskLists.map(l => l.id);
    if (listIds.length === 0) {
      setTasks([]);
      return;
    }
    supabase
      .from("tasks")
      .select("*")
      .in("list_id", listIds)
      .then(({ data, error }) => {
        setTasks(data || []);
      });
  }, [taskLists, supabase]);

  // Montar dados para o gráfico (tarefas por status)
  const pieData = statuses.map((status) => ({
    statusId: status.id,
    statusName: status.name,
    count: tasks.filter((t) => t.status_id === status.id).length,
  }));

  // Agrupar por tipo
  const pastaLists = taskLists.filter((l) => l.type === "pasta");

  // Cronograma de listas (projetos)
  const cronograma = taskLists.map((list) => {
    // Progresso: tarefas concluídas/total
    const tarefasDaLista = tasks.filter(t => t.list_id === list.id);
    const total = tarefasDaLista.length;
    const concluidas = tarefasDaLista.filter(t => t.progress === 100).length;
    return {
      id: list.id,
      nome: list.name,
      cor: list.color || '#8884d8',
      cor_nome: list.color_name || '',
      progresso: total > 0 ? (concluidas / total) * 100 : 0,
      textoProgresso: `${concluidas}/${total}`,
      inicio: list.start_date ? new Date(list.start_date).toLocaleDateString('pt-BR', { month: 'short', day: '2-digit' }) : '-',
      fim: list.end_date ? new Date(list.end_date).toLocaleDateString('pt-BR', { month: 'short', day: '2-digit' }) : '-',
    };
  });

  // Folders e docs: mock por enquanto
  const folders: TaskList[] = pastaLists;

  // Recentes: últimas listas criadas
  const recentes = taskLists.slice(0, 6);

  // Mostrar alerta se não houver nenhuma lista, pasta ou sprint
  const hasAnyList = taskLists.length > 0;

  if (listsLoading || statusesLoading)
    return (
      <div className="text-center py-8 text-[var(--color-text-secondary)]">
        Carregando dados do projeto...
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      {!hasAnyList ? (
        <div className="bg-[var(--color-highlight)] border-l-4 border-[var(--color-border-subtle)] text-[var(--color-text-primary)] p-4 rounded-xl font-medium flex items-center gap-2">
          Para visualizar o dashboard, crie pelo menos uma lista, pasta ou sprint neste projeto.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Recentes */}
            <div className="bg-[var(--color-background-secondary)] rounded-2xl p-4 border border-[var(--color-border-subtle)] flex flex-col">
              <div className="font-bold text-[var(--color-text-primary)] mb-2">Recentes</div>
              <ul className="flex flex-col gap-2 text-[var(--color-text-primary)] text-sm">
                {recentes.length === 0 && (
                  <li className="text-[var(--color-text-secondary)]">Nenhum item recente</li>
                )}
                {recentes.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    {item.type === "sprint" && (
                      <RocketLaunchIcon className="w-4 h-4 text-[var(--color-icon-primary)]" />
                    )}
                    {item.type === "lista" && (
                      <ClipboardDocumentListIcon className="w-4 h-4 text-[var(--color-icon-primary)]" />
                    )}
                    {item.type === "pasta" && (
                      <FolderIcon className="w-4 h-4 text-[var(--color-icon-primary)]" />
                    )}
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">• {item.type}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Links (placeholder) */}
            <div className="bg-[var(--color-background-secondary)] rounded-2xl p-4 border border-[var(--color-border-subtle)] flex flex-col">
              <div className="font-bold text-[var(--color-text-primary)] mb-2">Links</div>
              <div className="text-[var(--color-text-secondary)] text-sm">(Em breve)</div>
            </div>
            {/* Status dos processos (placeholder) */}
            <div className="bg-[var(--color-background-secondary)] rounded-2xl p-4 border border-[var(--color-border-subtle)] flex flex-col">
              <div className="font-bold text-[var(--color-text-primary)] mb-2">Status dos processos</div>
              {sheetOpen ? null : (
                <PieStatusChart
                  data={pieData}
                  statuses={statuses}
                  loading={listsLoading || statusesLoading}
                  onSliceClick={(status) => {
                    setSelectedStatus(status);
                    setSheetOpen(true);
                  }}
                  highlightSelected={false}
                />
              )}
              <StatusTasksModal
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                status={selectedStatus}
                projectId={project.id}
                chartData={pieData || []}
                statuses={statuses || []}
              />
            </div>
          </div>
          {/* Cronograma de Projetos/Listas */}
          <div className="bg-[var(--color-background-secondary)] rounded-2xl p-4 border border-[var(--color-border-subtle)]">
            <div className="font-bold text-[var(--color-text-primary)] mb-4">Cronograma de Projetos</div>
            <table className="w-full text-sm text-[var(--color-text-primary)]">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)]">
                  <th className="text-left py-2">Nome</th>
                  <th className="text-left py-2">Cor</th>
                  <th className="text-left py-2">Progresso</th>
                  <th className="text-left py-2">Início</th>
                  <th className="text-left py-2">Término</th>
                </tr>
              </thead>
              <tbody>
                {cronograma.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-[var(--color-text-secondary)] py-4">
                      Nenhuma lista cadastrada
                    </td>
                  </tr>
                )}
                {cronograma.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-hover)] transition-colors"
                  >
                    <td className="py-2 font-semibold text-[var(--color-text-primary)]">{row.nome}</td>
                    <td className="py-2">
                      <span
                        className="inline-block px-3 py-1 rounded-lg text-xs font-bold text-white shadow mr-2 cursor-pointer hover:opacity-80"
                        style={{ background: row.cor }}
                        title={row.cor_nome || row.cor}
                        onClick={() => {
                          const listObj = taskLists.find(l => l.id === row.id);
                          if (listObj) {
                            setEditingList(listObj);
                            setColorModalOpen(true);
                          }
                        }}
                      >
                        {row.cor_nome || row.cor}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Progress value={row.progresso} className="w-24 h-2" />
                        <span className="text-xs text-[var(--color-text-secondary)]">{row.textoProgresso}</span>
                      </div>
                    </td>
                    <td className="py-2">{row.inicio}</td>
                    <td className="py-2 font-bold text-[var(--color-text-secondary)]">{row.fim}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Modal de edição de cor/nome da lista */}
            {editingList && colorModalOpen && (
              <EditListColorModal
                open={colorModalOpen}
                onClose={() => {
                  setColorModalOpen(false);
                  setEditingList(null);
                }}
                list={editingList}
                onSaved={async () => {
                  setColorModalOpen(false);
                  setEditingList(null);
                  // Recarregar listas após edição
                  const data = await fetchLists();
                  setTaskLists(data);
                }}
              />
            )}
          </div>
          {/* Folders e Docs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--color-background-secondary)] rounded-2xl p-4 border border-[var(--color-border-subtle)] flex flex-col min-h-[180px]">
              <div className="font-bold text-[var(--color-text-primary)] mb-2">Folders</div>
              {folders.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[var(--color-text-secondary)]">
                  Nenhuma pasta para mostrar
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {folders.map((folder) => (
                    <li
                      key={folder.id}
                      className="flex items-center gap-2 text-[var(--color-text-primary)]"
                    >
                      <FolderIcon className="w-4 h-4 text-[var(--color-icon-primary)]" />
                      <span>{folder.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-[var(--color-background-secondary)] rounded-2xl p-4 border border-[var(--color-border-subtle)] flex flex-col min-h-[180px]">
              <div className="font-bold text-[var(--color-text-primary)] mb-2">Resoluções e docs</div>
              <div className="flex-1 flex items-center justify-center text-[var(--color-text-secondary)]">
                (Em breve)
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

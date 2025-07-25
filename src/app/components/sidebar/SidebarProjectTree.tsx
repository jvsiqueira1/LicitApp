/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useEffect, useState, useRef } from "react";
import { useProjects, Project } from "../../hooks/useProjects";
import { useFolders, Folder } from "../../hooks/useFolders";
import { useLists, List } from "../../hooks/useLists";
import { useSprints, Sprint } from "../../hooks/useSprints";
import { useSupabase } from "../../context/SupabaseContext";
import ListForm from "../task/ListForm";
import TaskForm from "../task/TaskForm";
import ProjectEditModal from "../project/ProjectEditModal";
import TemplateCenter from "../templates/TemplateCenter";
import TemplateListForm from "../templates/TemplateListForm";
import { EllipsisHorizontalIcon, ChevronDownIcon, PlusIcon, DocumentTextIcon, FlagIcon, FolderIcon } from "@heroicons/react/24/outline";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../../../components/ui/context-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
import TaskEditModal from "../task/TaskEditModal";
import type { Status } from "../../hooks/useStatuses";
import { TaskEventsContext } from "../../context/TaskEventsContext";
import { useTaskEvents } from "../../context/TaskEventsContext";
import ToggleTheme from "./ToggleTheme";

interface SidebarProjectTreeProps {
  userId: string;
  projects: Project[];
  loading: boolean;
  reloadProjects: () => void;
  onSelectProject?: (project: Project) => void;
  onSelectList?: (list: List) => void;
}

export default function SidebarProjectTree({ userId, projects, loading, reloadProjects, onSelectProject, onSelectList }: SidebarProjectTreeProps) {
  const { supabase, user } = useSupabase();
  // const { fetchProjects } = useProjects(userId); // não precisa mais
  // const [projects, setProjects] = useState<Project[]>([]); // não precisa mais
  // const [loading, setLoading] = useState(true); // não precisa mais
  const [error, setError] = useState<string | null>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Record<string, Folder[]>>({});
  const [lists, setLists] = useState<Record<string, List[]>>({});
  const [sprints, setSprints] = useState<Record<string, Sprint[]>>({});
  const [showListForm, setShowListForm] = useState(false);
  const [listFormType, setListFormType] = useState<"sprint" | "lista" | "pasta" | null>(null);
  const [listFormProjectId, setListFormProjectId] = useState<string | null>(null);
  const [listFormAnchorRef, setListFormAnchorRef] = useState<React.RefObject<HTMLButtonElement> | null | undefined>(undefined);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTemplateCenter, setShowTemplateCenter] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    id: string;
    name: string;
    description: string;
    statuses: string[];
    customFields: Array<{
      name: string;
      type: "text" | "number" | "date" | "select" | "url";
      required: boolean;
      icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    }>;
  } | null>(null);
  
  // Estados para controlar popovers
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});

  // Estados para TaskForm
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormListId, setTaskFormListId] = useState<string>("");
  const [taskFormListName, setTaskFormListName] = useState<string>("");
  const [taskFormListType, setTaskFormListType] = useState<"lista" | "sprint" | "pasta">("lista");

  // Estados para seleção
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // refs para cada botão de criação por projeto e pasta
  const createButtonRefs = useRef<Record<string, React.RefObject<HTMLButtonElement>>>({});
  const folderCreateButtonRefs = useRef<Record<string, { lista: React.RefObject<HTMLButtonElement>, sprint: React.RefObject<HTMLButtonElement> }>>({});
  const [listFormFolderId, setListFormFolderId] = useState<string | undefined>(undefined);

  // Adicione estado para controlar o dropdown das pastas
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  // Novo estado para edição de lista
  const [editingList, setEditingList] = useState<List | null>(null);

  // Hooks SEMPRE chamados, mas projectId pode ser undefined
  const foldersHook = useFolders(expandedProjectId ?? undefined);
  const listsHook = useLists(expandedProjectId ?? undefined, undefined);
  const sprintsHook = useSprints(expandedProjectId ?? undefined, undefined);

  // Estado para TaskEditModal completo
  const [taskEditModalData, setTaskEditModalData] = useState<{
    open: boolean;
    listId: string;
    listName: string;
    statuses: Status[];
    defaultStatusId?: string;
    task: null;
  }>({ open: false, listId: "", listName: "", statuses: [], task: null });
  const [statusesCache, setStatusesCache] = useState<Record<string, Status[]>>({});
  const { onTaskCreated } = useTaskEvents();

  useEffect(() => {
    // setLoading(true); // não precisa mais
    setError(null);
    // fetchProjects() // não precisa mais
    //   .then((data) => { // não precisa mais
    //     setProjects(data); // não precisa mais
    //     setLoading(false); // não precisa mais
    //   }) // não precisa mais
    //   .catch((err) => { // não precisa mais
    //     setError(getErrorMessage(err)); // não precisa mais
    //     setLoading(false); // não precisa mais
    //   }); // não precisa mais
  }, [reloadProjects]); // não precisa mais

  useEffect(() => {
    if (!expandedProjectId) return;
    setError(null);
    const fetchAll = async () => {
      try {
        const [foldersData, listsData, sprintsData] = await Promise.all([
          foldersHook.fetchFolders(),
          listsHook.fetchLists(),
          sprintsHook.fetchSprints(),
        ]);
        setFolders((prev) => ({ ...prev, [expandedProjectId]: foldersData }));
        setLists((prev) => ({ ...prev, [expandedProjectId]: listsData }));
        setSprints((prev) => ({ ...prev, [expandedProjectId]: sprintsData }));
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedProjectId]);

  const handleExpandProject = (project: Project) => {
    setExpandedProjectId(expandedProjectId === project.id ? null : project.id);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProjectId(project.id);
    setSelectedListId(null);
    onSelectProject?.(project);
  };

  const handleSelectList = (list: List) => {
    setSelectedListId(list.id);
    setSelectedProjectId(null);
    onSelectList?.(list);
  };

  const handleSelectSprint = (sprint: Sprint) => {
    setSelectedListId(sprint.id);
    setSelectedProjectId(null);
    // Trate Sprint como List para seleção
    onSelectList?.(sprint as unknown as List);
  };

  // Função para recarregar dados do projeto expandido
  const reloadExpandedProject = () => {
    if (expandedProjectId) {
      setExpandedProjectId(null);
      setTimeout(() => setExpandedProjectId(expandedProjectId), 10);
    }
  };

  // Abrir modal para editar projeto
  const handleOpenProjectModal = (project: Project) => {
    setEditingProject(project);
    setShowProjectModal(true);
  };

  const handleProjectSaved = () => {
    reloadProjects();
  };

  const handleUseTemplate = (template: {
    id: string;
    name: string;
    description: string;
    statuses: string[];
    customFields: Array<{
      name: string;
      type: "text" | "number" | "date" | "select" | "url";
      required: boolean;
      icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    }>;
  }) => {
    setSelectedTemplate(template);
    setShowTemplateForm(true);
  };

  const handleTemplateListCreated = () => {
    reloadExpandedProject();
  };

  const handleTaskAdded = () => {
    // Recarregar dados se necessário
    reloadExpandedProject();
    onTaskCreated();
  };

  // Handler para abrir o modal completo de tarefa
  const handleOpenTaskEditModal = async (listOrSprint: { id: string; name: string; project_id: string; }) => {
    let statuses = statusesCache[listOrSprint.id];
    if (!statuses) {
      const { data, error } = await supabase
        .from("statuses")
        .select("*")
        .eq("list_id", listOrSprint.id)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message || JSON.stringify(error));
      statuses = data as Status[];
      setStatusesCache((prev) => ({ ...prev, [listOrSprint.id]: statuses }));
    }
    setTaskEditModalData({
      open: true,
      listId: listOrSprint.id,
      listName: listOrSprint.name,
      statuses,
      defaultStatusId: statuses[0]?.id,
      task: null,
    });
  };

  // Funções para editar/deletar itens
  const handleEditItem = (list: List, tipo: 'lista' | 'sprint' | 'pasta') => {
    setEditingList(list);
    setListFormProjectId(list.project_id);
    setListFormType(tipo);
    setShowListForm(true);
    setListFormAnchorRef(undefined);
    setListFormFolderId(list.folder_id ?? undefined);
  };

  const handleDeleteItem = async (item: List | Sprint | Folder) => {
    // Só execute deleção em cascata se for uma pasta (type === 'pasta')
    if ((item as List).type === "pasta") {
      const confirm = window.confirm("Tem certeza que deseja excluir esta pasta e TODO o seu conteúdo? Todas as listas, sprints e subpastas dentro dela serão removidas permanentemente.");
      if (!confirm) return;
      try {
        // Função recursiva para deletar tudo dentro da pasta
        const deleteFolderCascade = async (folderId: string) => {
          // 1. Deletar listas dentro da pasta
          const { data: listsToDelete, error: listsError } = await supabase.from("lists").select("id, type").eq("folder_id", folderId);
          if (listsError) throw new Error(listsError.message);
          for (const l of listsToDelete ?? []) {
            if (l.type === "pasta") {
              await deleteFolderCascade(l.id); // recursivo para subpastas
            } else {
              const { error: delListError } = await supabase.from("lists").delete().eq("id", l.id);
              if (delListError) throw new Error(delListError.message);
            }
          }
          // 2. Deletar a própria pasta
          const { error: delFolderError } = await supabase.from("lists").delete().eq("id", folderId);
          if (delFolderError) throw new Error(delFolderError.message);
        };
        await deleteFolderCascade(item.id);
        alert("Pasta e todo o conteúdo removidos com sucesso.");
        reloadExpandedProject();
      } catch (err) {
        console.error("Erro ao deletar pasta em cascata:", err);
        alert("Erro ao deletar pasta e conteúdo interno: " + (err instanceof Error ? err.message : String(err)));
      }
      return;
    }
    // Caso contrário, deleção normal
    if (!window.confirm("Tem certeza que deseja excluir este item?")) return;
    try {
      const { error } = await supabase
        .from("lists")
        .delete()
        .eq("id", item.id);
      if (error) throw new Error(error.message || JSON.stringify(error));
      reloadExpandedProject();
    } catch (err) {
      console.error("Erro ao deletar item:", err);
      alert("Erro ao deletar item");
    }
  };

  // Adicionar função para exclusão em cascata de projeto
  const handleDeleteProject = async (project: Project) => {
    if (!window.confirm("Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita e excluirá todas as listas, pastas, sprints, status e tarefas associadas.")) {
      return;
    }
    try {
      // 1. Buscar todas as listas (inclui pastas e sprints) do projeto
      const { data: lists, error: listsError } = await supabase
        .from("lists")
        .select("id")
        .eq("project_id", project.id);
      if (listsError) throw new Error(listsError.message);
      // 2. Para cada lista, deletar tarefas e statuses
      for (const list of lists ?? []) {
        // Deletar tarefas
        const { error: tasksError } = await supabase
          .from("tasks")
          .delete()
          .eq("list_id", list.id);
        if (tasksError) throw new Error(tasksError.message);
        // Deletar statuses
        const { error: statusesError } = await supabase
          .from("statuses")
          .delete()
          .eq("list_id", list.id);
        if (statusesError) throw new Error(statusesError.message);
      }
      // 3. Deletar listas (inclui pastas e sprints)
      const { error: delListsError } = await supabase
        .from("lists")
        .delete()
        .eq("project_id", project.id);
      if (delListsError) throw new Error(delListsError.message);
      // 4. Deletar o projeto
      const { error: delProjectError } = await supabase
        .from("projects")
        .delete()
        .eq("id", project.id);
      if (delProjectError) throw new Error(delProjectError.message);
      alert("Projeto e todos os dados relacionados foram excluídos com sucesso.");
      reloadProjects();
    } catch (err) {
      console.error("Erro ao excluir projeto em cascata:", err);
      alert("Erro ao excluir projeto: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <TaskEventsContext.Provider value={{ onTaskCreated }}>
      <div className="w-full">
        {/* Modal ListForm como popover */}
        {showListForm && listFormProjectId && (
          <ListForm
            projectId={listFormProjectId}
            onListAdded={reloadExpandedProject}
            open={showListForm}
            onClose={() => { setShowListForm(false); setEditingList(null); }}
            initialType={listFormType ?? undefined}
            anchorRef={listFormAnchorRef}
            folderId={listFormFolderId}
            editingList={editingList}
          />
        )}

        {/* Modal TaskForm */}
        {showTaskForm && taskFormListId && (
          <TaskForm
            open={showTaskForm}
            onClose={() => setShowTaskForm(false)}
            onTaskAdded={handleTaskAdded}
            listId={taskFormListId}
            listName={taskFormListName}
            listType={taskFormListType}
          />
        )}
        {error && (
          <div className="text-center py-2 text-status-error font-sans text-sm">{error}</div>
        )}
        {loading ? (
          <div className="text-center py-4 text-neutral-400 font-sans">Carregando projetos...</div>
        ) : (
          <ul className="flex flex-col gap-1">
            {projects.map((project) => {
              // ref para o botão de criar do projeto
              if (!createButtonRefs.current[project.id]) {
                createButtonRefs.current[project.id] = React.createRef<HTMLButtonElement>() as React.RefObject<HTMLButtonElement>;
              }
              return (
                <li key={project.id}>
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div
                        className={`rounded-lg border transition-colors duration-200 select-none
                          ${selectedProjectId === project.id ||
                            lists[project.id]?.some(l => l.id === selectedListId) ||
                            sprints[project.id]?.some(s => s.id === selectedListId) ||
                            folders[project.id]?.some(f => f.id === selectedListId)
                            ? "bg-highlight-light border-border-subtle text-text-default"
                            : expandedProjectId === project.id && selectedListId === null
                              ? "bg-[var(--color-hover)] border-border-subtle text-text-default"
                              : "hover:bg-highlight-hover border border-transparent text-text-default"}
                          focus:outline focus:outline-2 focus:outline-[var(--color-focus-ring)]`
                        }
                      >
                        {/* Cabeçalho do projeto */}
                        <div className="flex items-center justify-between px-3 py-2 font-medium text-primary-900 select-none">
                          <span
                            className="flex items-center gap-2 flex-1 cursor-pointer"
                            onClick={() => {
                              handleSelectProject(project);
                              handleExpandProject(project);
                            }}
                          >
                            <span
                              className="inline-block w-3 h-3 rounded-full border border-border-subtle"
                              style={{ background: project.color || '#3B82F6' }}
                              title="Cor do projeto"
                            />
                            <span className="text-text-default">{project.name}</span>
                          </span>
                          <span className="flex items-center gap-0.5">
                            <ChevronDownIcon
                              className={`w-4 h-4 text-[var(--color-icon-secondary)] transition-transform cursor-pointer ${expandedProjectId === project.id ? 'rotate-180' : ''}`}
                              onClick={() => handleExpandProject(project)}
                            />
                            <Popover open={openPopovers[`project-${project.id}`]} onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, [`project-${project.id}`]: open }))}>
                              <PopoverTrigger asChild>
                                <button
                                  className="ml-1 p-1 rounded hover:bg-highlight-hover focus:bg-[var(--color-hover)]"
                                  onClick={e => e.stopPropagation()}
                                  title="Ações do projeto"
                                >
                                  <PlusIcon className="w-4 h-4 text-[var(--color-icon-primary)]" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-48 p-1" align="end">
                                <div className="space-y-1">
                                  <button
                                    className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]"
                                    onClick={() => {
                                      handleExpandProject(project);
                                      setOpenPopovers(prev => ({ ...prev, [`project-${project.id}`]: false }));
                                    }}
                                  >
                                    Expandir/Recolher
                                  </button>
                                  <button
                                    className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]"
                                    onClick={() => {
                                      handleOpenProjectModal(project);
                                      setOpenPopovers(prev => ({ ...prev, [`project-${project.id}`]: false }));
                                    }}
                                  >
                                    Editar projeto
                                  </button>
                                  <div className="h-px bg-border my-1" />
                                  <button
                                    className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]"
                                    onClick={() => {
                                      setListFormProjectId(project.id);
                                      setListFormType("lista");
                                      setShowListForm(true);
                                      setListFormAnchorRef(undefined);
                                      setListFormFolderId(undefined);
                                      setOpenPopovers(prev => ({ ...prev, [`project-${project.id}`]: false }));
                                    }}
                                  >
                                    Criar lista
                                  </button>
                                  <button
                                    className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]"
                                    onClick={() => {
                                      setListFormProjectId(project.id);
                                      setListFormType("pasta");
                                      setShowListForm(true);
                                      setListFormAnchorRef(undefined);
                                      setListFormFolderId(undefined);
                                      setOpenPopovers(prev => ({ ...prev, [`project-${project.id}`]: false }));
                                    }}
                                  >
                                    Criar pasta
                                  </button>
                                  <button
                                    className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]"
                                    onClick={() => {
                                      setListFormProjectId(project.id);
                                      setListFormType("sprint");
                                      setShowListForm(true);
                                      setListFormAnchorRef(undefined);
                                      setListFormFolderId(undefined);
                                      setOpenPopovers(prev => ({ ...prev, [`project-${project.id}`]: false }));
                                    }}
                                  >
                                    Criar sprint
                                  </button>
                                  <div className="h-px bg-border my-1" />
                                  <button
                                    className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]"
                                    onClick={() => {
                                      setShowTemplateCenter(true);
                                      setOpenPopovers(prev => ({ ...prev, [`project-${project.id}`]: false }));
                                    }}
                                  >
                                    Usar template
                                  </button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </span>
                        </div>
                        {expandedProjectId === project.id && (
                          <div className="pl-2 pr-2 pb-2 pt-1">
                            {/* Pastas */}
                            {folders[project.id]?.length > 0 && (
                              <ul className="mb-1">
                                {folders[project.id].map((folder) => (
                                  <li key={folder.id} className="group relative">
                                    <div className={`flex items-center justify-between text-sm font-semibold rounded px-2 py-1 mb-1 transition-colors duration-200
                                      ${selectedListId === folder.id ? "bg-highlight-light border border-border-subtle text-text-default" : "hover:bg-highlight-hover text-text-default border border-transparent"}
                                      focus:outline focus:outline-2 focus:outline-[var(--color-focus-ring)]`
                                    }> {/* highlight só se selecionada, sem bg branco */}
                                      <div className="flex items-center flex-1 min-w-0">
                                        <button
                                          className="mr-1 p-0.5 rounded hover:bg-highlight-hover transition-colors duration-200"
                                          onClick={e => {
                                            e.stopPropagation();
                                            setOpenFolders(prev => ({ ...prev, [folder.id]: !prev[folder.id] }));
                                          }}
                                          title={openFolders[folder.id] ? "Esconder itens" : "Mostrar itens"}
                                        >
                                          <ChevronDownIcon className={`w-4 h-4 transition-transform text-[var(--color-icon-secondary)] ${openFolders[folder.id] ? '' : '-rotate-90'}`} />
                                        </button>
                                        <span className="flex items-center truncate"><FolderIcon className="w-4 h-4 mr-1 text-[var(--color-icon-secondary)]" />{folder.name}</span>
                                      </div>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <button
                                            className="ml-1 p-1 rounded hover:bg-highlight-hover focus:bg-[var(--color-hover)] transition-colors duration-200"
                                            onClick={e => e.stopPropagation()}
                                            title="Mais opções"
                                          >
                                            <EllipsisHorizontalIcon className="w-4 h-4 text-[var(--color-icon-secondary)]" />
                                          </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-48 p-1" align="end">
                                          <button className="w-full text-left px-2 py-1.5 text-sm rounded-sm text-text-muted cursor-not-allowed" disabled>Editar pasta</button>
                                          <button
                                            className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]"
                                            onClick={() => {
                                              setListFormProjectId(project.id);
                                              setListFormType('lista');
                                              setShowListForm(true);
                                              setListFormAnchorRef(undefined);
                                              setListFormFolderId(folder.id); 
                                            }}
                                          >
                                            Adicionar lista
                                          </button>
                                          <button className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]" onClick={() => { setListFormProjectId(project.id); setListFormType('sprint'); setShowListForm(true); setListFormAnchorRef(undefined); setListFormFolderId(folder.id); }}>Adicionar sprint</button>
                                          <div className="h-px bg-border my-1" />
                                          <button className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)] text-[var(--color-destructive)]" onClick={() => handleDeleteItem(folder)}>Excluir pasta</button>
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                    {/* Renderize os itens internos da pasta apenas se openFolders[folder.id] for true */}
                                    {openFolders[folder.id] && (
                                      <FolderListsAndSprints
                                        folderId={folder.id}
                                        projectId={project.id}
                                        onSelectList={onSelectList}
                                        selectedListId={selectedListId}
                                      />
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {/* Listas fora de pasta */}
                            {lists[project.id]?.length > 0 && (
                              <ul className="mb-1">
                                {lists[project.id].filter((l) => !l.folder_id).map((list) => (
                                  <li key={list.id} className={`flex items-center text-sm cursor-pointer px-2 py-1 rounded transition-colors duration-200
                                    ${selectedListId === list.id ? "bg-highlight-light border border-border-subtle text-text-default" : "hover:bg-highlight-hover text-text-default border border-transparent"}
                                    focus:outline focus:outline-2 focus:outline-[var(--color-focus-ring)]`
                                  } onClick={() => {
                                    handleSelectList(list);
                                  }}> {/* highlight lista */}
                                    <span className="flex items-center">
                                      <span className="inline-block w-3 h-3 rounded-full mr-1 border border-border-subtle" style={{ background: list.color || '#8884d8' }} title={list.color_name || 'Cor da lista'} />
                                      <DocumentTextIcon className="w-4 h-4 mr-1 text-[var(--color-icon-secondary)]" />
                                      {list.name}
                                    </span>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button
                                          className="ml-1 p-1 rounded hover:bg-highlight-hover focus:bg-[var(--color-hover)]"
                                          onClick={e => e.stopPropagation()}
                                          title="Mais opções"
                                        >
                                          <EllipsisHorizontalIcon className="w-3 h-3 text-[var(--color-icon-secondary)]" />
                                        </button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-48 p-1" align="end">
                                        <button className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]" onClick={() => onSelectList && onSelectList(list)}>Abrir lista</button>
                                        <button
                                          className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]"
                                          onClick={async () => {
                                            await handleOpenTaskEditModal(list);
                                          }}
                                        >
                                          Adicionar tarefa
                                        </button>
                                        <button className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]" onClick={() => handleEditItem(list, 'lista')}>Editar lista</button>
                                        <div className="h-px bg-border my-1" />
                                        <button className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)] text-[var(--color-destructive)]" onClick={() => handleDeleteItem(list)}>Excluir lista</button>
                                      </PopoverContent>
                                    </Popover>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {/* Sprints fora de pasta */}
                            {sprints[project.id]?.length > 0 && (
                              <ul>
                                {sprints[project.id].filter((s) => !s.folder_id).map((sprint) => (
                                  <li key={sprint.id} className={`flex items-center text-sm cursor-pointer px-2 py-1 rounded transition-colors duration-200
                                    ${selectedListId === sprint.id ? "bg-highlight-light border border-border-subtle text-text-default" : "hover:bg-highlight-hover text-text-default border border-transparent"}
                                    focus:outline focus:outline-2 focus:outline-[var(--color-focus-ring)]`
                                  }> {/* highlight sprint */}
                                    <span className="flex items-center flex-1" onClick={() => handleSelectSprint(sprint)}>
                                      <FlagIcon className="w-4 h-4 mr-1 text-[var(--color-icon-secondary)]" />{sprint.name}
                                    </span>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button
                                          className="ml-1 p-1 rounded hover:bg-highlight-hover focus:bg-[var(--color-hover)]"
                                          onClick={e => e.stopPropagation()}
                                          title="Mais opções"
                                        >
                                          <EllipsisHorizontalIcon className="w-3 h-3 text-[var(--color-icon-secondary)]" />
                                        </button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-48 p-1" align="end">
                                        <button className="w-full text-left px-2 py-1.5 text-sm rounded-sm text-text-muted cursor-not-allowed" disabled>Editar sprint</button>
                                        <button
                                          className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]"
                                          onClick={async () => {
                                            await handleOpenTaskEditModal(sprint);
                                          }}
                                        >
                                          Adicionar tarefa
                                        </button>
                                        <button
                                          className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]"
                                          onClick={() => handleEditItem(sprint as unknown as List, 'sprint')}
                                        >
                                          Editar sprint
                                        </button>
                                        <div className="h-px bg-border my-1" />
                                        <button
                                          className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)] text-[var(--color-destructive)]"
                                          onClick={() => handleDeleteItem(sprint)}
                                        >
                                          Excluir sprint
                                        </button>
                                      </PopoverContent>
                                    </Popover>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuItem onClick={() => handleSelectProject(project)}>
                        Abrir dashboard
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleOpenProjectModal(project)}>
                        Editar projeto
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem className="text-[var(--color-destructive)]" onClick={() => handleDeleteProject(project)}>
                        Excluir projeto
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </li>
              );
            })}
          </ul>
        )}

        <ProjectEditModal
          open={showProjectModal}
          onClose={() => setShowProjectModal(false)}
          onProjectSaved={handleProjectSaved}
          project={editingProject!}
        />

        <TemplateCenter
          open={showTemplateCenter}
          onClose={() => setShowTemplateCenter(false)}
          onUseTemplate={handleUseTemplate}
        />

        {selectedTemplate && (
          <TemplateListForm
            open={showTemplateForm}
            onClose={() => {
              setShowTemplateForm(false);
              setSelectedTemplate(null);
            }}
            onListCreated={handleTemplateListCreated}
            template={selectedTemplate}
            projectId={expandedProjectId!}
          />
        )}

        {taskEditModalData.open && (
          <TaskEditModal
            open={taskEditModalData.open}
            onClose={() => setTaskEditModalData((prev) => ({ ...prev, open: false }))}
            onTaskSaved={handleTaskAdded}
            task={null}
            listId={taskEditModalData.listId}
            statuses={taskEditModalData.statuses}
            defaultStatusId={taskEditModalData.defaultStatusId}
          />
        )}
        
      </div>
    </TaskEventsContext.Provider>
  );
}

function getErrorMessage(err: unknown): string {
  if (!err) return "Erro desconhecido";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err && typeof (err as { message?: unknown }).message === "string") {
    return (err as { message?: string }).message ?? "Erro desconhecido";
  }
  try {
    return JSON.stringify(err);
  } catch {
    return "Erro desconhecido";
  }
}

// Componente auxiliar para exibir listas e sprints dentro de uma pasta
function FolderListsAndSprints({ 
  folderId, 
  projectId, 
  onSelectList,
  selectedListId,
  onSelectListInternal
}: { 
  folderId: string; 
  projectId: string; 
  onSelectList?: (list: List) => void;
  selectedListId?: string | null;
  onSelectListInternal?: (list: List) => void;
}) {
  const { fetchLists } = useLists(projectId, folderId);
  const { fetchSprints } = useSprints(projectId, folderId);
  const [lists, setLists] = useState<List[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);

  useEffect(() => {
    fetchLists().then(setLists);
    fetchSprints().then(setSprints);
  }, [fetchLists, fetchSprints]);

  return (
    <div className="ml-4">
      {lists.length > 0 && (
        <ul>
          {lists.map((list) => (
            <ContextMenu key={list.id}>
              <ContextMenuTrigger asChild>
                <li
                  className={`flex items-center gap-1 text-xs cursor-pointer px-1 py-0.5 rounded ${
                    selectedListId === list.id 
                      ? "bg-[var(--color-hover)] text-text-default border border-border-subtle" 
                      : "text-text-default hover:bg-highlight-hover"
                  }`}
                  onClick={() => {
                    const safeList = {
                      id: list.id,
                      project_id: list.project_id,
                      name: list.name,
                      type: "lista",
                      color: list.color || "#8884d8",
                      color_name: list.color_name || "",
                      status: list.status || "",
                      created_at: list.created_at || "",
                      acquisition_type: list.acquisition_type || null,
                      process_number: list.process_number || null,
                      deadline: list.deadline || null,
                      value: list.value || null,
                      start_date: list.start_date || null,
                      end_date: list.end_date || null,
                      folder_id: list.folder_id || null,
                    };
                    onSelectList?.(safeList);
                  }}
                  tabIndex={0}
                  role="button"
                  style={{ userSelect: 'none' }}
                >
                  <span className="inline-block w-3 h-3 rounded-full mr-1 border border-border-subtle" style={{ background: list.color || '#8884d8' }} title={list.color_name || 'Cor da lista'} />
                  <DocumentTextIcon className="w-4 h-4 mr-1 text-[var(--color-icon-secondary)]" />
                  {list.name}
                </li>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem onClick={() => {
                  onSelectList && onSelectList(list);
                }}>
                  Abrir lista
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => {
                    // Precisamos acessar os setters do componente pai
                    // Por enquanto, vamos usar uma abordagem diferente
                  }}
                >
                  Adicionar tarefa
                </ContextMenuItem>
                <ContextMenuItem>
                  Editar lista
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem className="text-[var(--color-destructive)]">
                  Excluir lista
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </ul>
      )}
      {sprints.length > 0 && (
        <ul>
          {sprints.map((sprint) => (
            <ContextMenu key={sprint.id}>
              <ContextMenuTrigger asChild>
                <li className={`flex items-center gap-1 text-xs cursor-pointer px-1 py-0.5 rounded ${
                  selectedListId === sprint.id 
                    ? "bg-[var(--color-hover)] text-text-default border border-border-subtle" 
                    : "text-text-default hover:bg-highlight-hover"
                }`} onClick={() => {
                  onSelectList?.(sprint as unknown as List);
                }}>
                  <span className="flex items-center"><FlagIcon className="w-4 h-4 mr-1 text-[var(--color-icon-secondary)]" />{sprint.name}</span>
                </li>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem>
                  Abrir sprint
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => {
                  }}
                >
                  Adicionar tarefa
                </ContextMenuItem>
                <ContextMenuItem>
                  Editar sprint
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem className="text-[var(--color-destructive)]">
                  Excluir sprint
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </ul>
      )}
    </div>
  );
} 
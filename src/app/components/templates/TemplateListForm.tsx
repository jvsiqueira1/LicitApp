"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { XMarkIcon, CheckIcon, SparklesIcon, FunnelIcon, CalendarIcon, ArrowPathIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { createOrReuseStatus } from "@/app/lib/statusUtils";

interface Template {
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
}

interface TemplateListFormProps {
  open: boolean;
  onClose: () => void;
  onListCreated: () => void;
  template: Template;
  projectId: string;
}

export default function TemplateListForm({ 
  open, 
  onClose, 
  onListCreated, 
  template, 
  projectId 
}: TemplateListFormProps) {
  const { supabase, user } = useSupabase();
  const [listName, setListName] = useState(template.name);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"name" | "creating" | "success">("name");
  
  // Opções de importação
  const [importMode, setImportMode] = useState<"all" | "custom">("all");
  const [dateMode, setDateMode] = useState<"as-is" | "remap">("as-is");
  const [archivedTasks, setArchivedTasks] = useState<"no" | "include" | "unarchive">("no");
  
  // Opções personalizadas
  const [includeAutomations, setIncludeAutomations] = useState(true);
  const [includeViews, setIncludeViews] = useState(true);
  const [includeTasks, setIncludeTasks] = useState(true);
  
  // Propriedades de tarefas
  const [taskProperties, setTaskProperties] = useState({
    dueDates: true,
    startDate: true,
    followers: true,
    commentAttachments: true,
    recurrenceSettings: true,
    labels: true,
    priority: true,
    subtasks: true,
    relationships: true,
    assignees: true,
    attachments: true,
    comments: true,
    currentStatus: true,
    dependencies: true,
    description: true,
    customFields: true,
    checklists: true,
    taskTypes: true,
    duration: true
  });
  
  // Datas do projeto
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ignoreWeekends, setIgnoreWeekends] = useState(false);
  const [importAsOpen, setImportAsOpen] = useState(false);

  // Buscar projetos do usuário
  const fetchProjects = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw new Error(error.message || JSON.stringify(error));
      setProjects(data || []);
      
      // Se não há projeto selecionado e há projetos disponíveis, selecionar o primeiro
      if (!selectedProjectId && data && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err) {
      console.error("Erro ao buscar projetos:", err);
    }
  }, [user?.id, supabase, selectedProjectId]);

  // Buscar projetos quando o modal abrir
  useEffect(() => {
    if (open && user?.id) {
      fetchProjects();
    }
  }, [open, user?.id, fetchProjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName.trim()) {
      setError("O nome da lista é obrigatório.");
      return;
    }

    if (!selectedProjectId) {
      setError("Selecione um projeto.");
      return;
    }

    setLoading(true);
    setError(null);
    setStep("creating");

    try {
      // 1. Criar a lista
      const { data: listData, error: listError } = await supabase
        .from("lists")
        .insert({
          name: listName.trim(),
          project_id: selectedProjectId,
          type: "lista",
          status_config: JSON.stringify({
            template: template.id,
            customFields: template.customFields,
            importMode,
            dateMode,
            archivedTasks,
            includeAutomations,
            includeViews,
            includeTasks,
            taskProperties,
            startDate,
            endDate,
            ignoreWeekends,
            importAsOpen
          })
        })
        .select()
        .single();

      if (listError) throw new Error(listError.message || JSON.stringify(listError));

      // 2. Criar os statuses do template
      await Promise.all(
        template.statuses.map((statusName, index) =>
          createOrReuseStatus(
            supabase,
            selectedProjectId,
            statusName,
            getStatusColor(index)
          )
        )
      );

      setStep("success");
      
      // Fechar modal após 2 segundos
      setTimeout(() => {
        onListCreated();
        onClose();
        setStep("name");
        setListName("");
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar lista com template");
      setStep("name");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (index: number): string => {
    const colors = [
      "#3B82F6", // blue
      "#10B981", // green
      "#F59E0B", // yellow
      "#EF4444", // red
      "#8B5CF6", // purple
      "#F97316", // orange
      "#06B6D4", // cyan
      "#84CC16", // lime
      "#EC4899", // pink
      "#6366F1", // indigo
      "#14B8A6", // teal
      "#F43F5E", // rose
      "#8B5A2B"  // brown
    ];
    return colors[index % colors.length];
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-[500px] max-w-full bg-neutral-900 rounded-3xl shadow-2xl p-8 border border-neutral-700 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-neutral-100">
            {step === "name" && "Criar lista com template"}
            {step === "creating" && "Criando lista..."}
            {step === "success" && "Lista criada!"}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {step === "name" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome da Lista */}
            <div>
              <label htmlFor="list-name" className="block text-sm font-medium text-neutral-300 mb-2">
                Nome de Lista
              </label>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 text-neutral-400">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                  </svg>
                </div>
                <input
                  id="list-name"
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-300 transition-colors duration-200"
                  required
                />
              </div>
            </div>

            {/* Onde criar a lista */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Onde este Lista deve ser criado?*
              </label>
              <select 
                value={selectedProjectId || ""}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-300 transition-colors duration-200"
                required
              >
                {projects.length === 0 ? (
                  <option value="" disabled>Nenhum projeto encontrado</option>
                ) : (
                  projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Opções de importação */}
            <div>
              <h3 className="text-sm font-medium text-neutral-300 mb-3">Opções de importação</h3>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setImportMode("all")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    importMode === "all" 
                      ? "bg-neutral-700 text-neutral-100" 
                      : "bg-neutral-800 text-neutral-400 hover:text-neutral-300"
                  }`}
                >
                  <SparklesIcon className="w-4 h-4" />
                  Importar tudo
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode("custom")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    importMode === "custom" 
                      ? "bg-neutral-700 text-neutral-100" 
                      : "bg-neutral-800 text-neutral-400 hover:text-neutral-300"
                  }`}
                >
                  <FunnelIcon className="w-4 h-4" />
                  Personalizar importação de itens
                </button>
              </div>
              <p className="text-sm text-neutral-400">
                Todas as propriedades, configurações e campos serão importados exatamente como estão.
              </p>
            </div>

            {/* Opções personalizadas */}
            {importMode === "custom" && (
              <div className="bg-neutral-800 rounded-lg p-4 space-y-4">
                <h4 className="font-medium text-neutral-300">Incluir no modelo</h4>
                
                {/* Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-300">Automações</span>
                    <button
                      type="button"
                      onClick={() => setIncludeAutomations(!includeAutomations)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        includeAutomations ? "bg-neutral-700" : "bg-neutral-600"
                      }`}
                    >
                      <div className={`w-4 h-4 bg-background-primary rounded-full transition-transform ${
                        includeAutomations ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-300">Visualizações</span>
                    <button
                      type="button"
                      onClick={() => setIncludeViews(!includeViews)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        includeViews ? "bg-neutral-700" : "bg-neutral-600"
                      }`}
                    >
                      <div className={`w-4 h-4 bg-background-primary rounded-full transition-transform ${
                        includeViews ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-300">Tarefas</span>
                    <button
                      type="button"
                      onClick={() => setIncludeTasks(!includeTasks)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        includeTasks ? "bg-neutral-700" : "bg-neutral-600"
                      }`}
                    >
                      <div className={`w-4 h-4 bg-background-primary rounded-full transition-transform ${
                        includeTasks ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Propriedades de tarefas */}
                {includeTasks && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-3">
                      Personalize as propriedades da tarefa que você deseja incluir abaixo.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries({
                        dueDates: "Datas de vencimento",
                        startDate: "Data inicial",
                        followers: "Seguidores",
                        commentAttachments: "Anexos de comentários",
                        recurrenceSettings: "Configurações de recorrência",
                        labels: "Etiquetas",
                        priority: "Prioridade",
                        subtasks: "Subtarefas",
                        relationships: "Relacionamentos",
                        assignees: "Responsáveis",
                        attachments: "Anexos",
                        comments: "Comentários",
                        currentStatus: "Status atuais da tarefa",
                        dependencies: "Dependências",
                        description: "Descrição",
                        customFields: "Campos personalizados",
                        checklists: "Checklists",
                        taskTypes: "Tipos de tarefa",
                        duration: "Duração"
                      }).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={taskProperties[key as keyof typeof taskProperties]}
                            onChange={(e) => setTaskProperties(prev => ({
                              ...prev,
                              [key]: e.target.checked
                            }))}
                            className="w-4 h-4 checked:border-primary-400 hover:border-primary-300 bg-neutral-700 border-neutral-600 focus:ring-primary-500 transition-colors duration-200"
                          />
                          <span className="text-neutral-300">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Datas do projeto */}
            <div>
              <h3 className="text-sm font-medium text-neutral-300 mb-3">Datas do projeto</h3>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setDateMode("as-is")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    dateMode === "as-is" 
                      ? "bg-neutral-700 text-neutral-100" 
                      : "bg-neutral-800 text-neutral-400 hover:text-neutral-300"
                  }`}
                >
                  <CheckIcon className="w-4 h-4" />
                  Importar como está
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode("remap")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    dateMode === "remap" 
                      ? "bg-neutral-700 text-neutral-100" 
                      : "bg-neutral-800 text-neutral-400 hover:text-neutral-300"
                  }`}
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Remapear datas
                  <InformationCircleIcon className="w-4 h-4" />
                </button>
              </div>
              
              {dateMode === "remap" && (
                <div className="space-y-4">
                  <p className="text-sm text-neutral-400">
                    Defina a data de início ou a data final do seu projeto para calcularmos a outra
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-3 py-2 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-300 transition-colors duration-200"
                        placeholder="Clique para selecionar a data de"
                      />
                    </div>
                    <span className="text-neutral-400">-</span>
                    <div className="flex-1 relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-3 py-2 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-300 transition-colors duration-200"
                        placeholder="Clique para selecionar a data fini"
                      />
                    </div>
                  </div>
                  
                  <div className="border-t border-neutral-700 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-neutral-300">Ignorar fins de semana</span>
                      <button
                        type="button"
                        onClick={() => setIgnoreWeekends(!ignoreWeekends)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          ignoreWeekends ? "bg-neutral-700" : "bg-neutral-600"
                        }`}
                      >
                        <div className={`w-4 h-4 bg-background-primary rounded-full transition-transform ${
                          ignoreWeekends ? "translate-x-6" : "translate-x-1"
                        }`} />
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500">
                      É importante que as datas não caiam nos fins de semana. Contaremos apenas dias úteis na duração de uma tarefa. 
                      <span className="text-pink-400 cursor-pointer"> Saiba mais</span>
                    </p>
                  </div>
                  
                  <div className="border-t border-neutral-700 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-neutral-300">Importar todas as tarefas como abertas</span>
                      <button
                        type="button"
                        onClick={() => setImportAsOpen(!importAsOpen)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          importAsOpen ? "bg-neutral-700" : "bg-neutral-600"
                        }`}
                      >
                        <div className={`w-4 h-4 bg-background-primary rounded-full transition-transform ${
                          importAsOpen ? "translate-x-6" : "translate-x-1"
                        }`} />
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Se você não importar as tarefas como abertas, as tarefas fechadas serão perdidas.
                    </p>
                  </div>
                </div>
              )}
              
              {dateMode === "as-is" && (
                <p className="text-sm text-neutral-400">
                  As datas finais e de início são estáticas e serão importadas exatamente como estão.
                </p>
              )}
            </div>

            {/* Tarefas arquivadas */}
            <div>
              <h3 className="text-sm font-medium text-neutral-300 mb-3">
                Você deseja incluir tarefas arquivadas?
              </h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="archivedTasks"
                    value="no"
                    checked={archivedTasks === "no"}
                    onChange={(e) => setArchivedTasks(e.target.value as "no" | "include" | "unarchive")}
                    className="w-4 h-4 checked:border-primary-400 hover:border-primary-300 bg-neutral-700 border-neutral-600 focus:ring-primary-500 transition-colors duration-200"
                  />
                  <span className="text-neutral-300">Não</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="archivedTasks"
                    value="include"
                    checked={archivedTasks === "include"}
                    onChange={(e) => setArchivedTasks(e.target.value as "no" | "include" | "unarchive")}
                    className="w-4 h-4 checked:border-primary-400 hover:border-primary-300 bg-neutral-700 border-neutral-600 focus:ring-primary-500 transition-colors duration-200"
                  />
                  <span className="text-neutral-300">Sim, incluir tarefas arquivadas</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="archivedTasks"
                    value="unarchive"
                    checked={archivedTasks === "unarchive"}
                    onChange={(e) => setArchivedTasks(e.target.value as "no" | "include" | "unarchive")}
                    className="w-4 h-4 checked:border-primary-400 hover:border-primary-300 bg-neutral-700 border-neutral-600 focus:ring-primary-500 transition-colors duration-200"
                  />
                  <span className="text-neutral-300">Sim, incluir e desarquivar tarefas</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-neutral-900/20 border border-neutral-800 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 text-neutral-400 hover:text-neutral-300 rounded-xl transition-colors duration-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? "Criando..." : "Criar Lista"}
              </button>
            </div>
          </form>
        )}

        {step === "creating" && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-neutral-300">Criando lista com template...</p>
            <p className="text-neutral-500 text-sm mt-2">
              Isso pode levar alguns segundos
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-100 mb-2">
              Lista criada com sucesso!
            </h3>
            <p className="text-neutral-400">
              A lista &quot;{listName}&quot; foi criada com todos os statuses e configurações do template.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 
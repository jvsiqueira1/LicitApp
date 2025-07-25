import React, { useState, useEffect } from "react";
import { useSupabase } from "../context/SupabaseContext";
import { useProjects } from "../hooks/useProjects";
import { Project } from "../components/project/ProjectList";
import ProjectForm from "../components/project/ProjectForm";
import ProjectDetailsDashboard from "./ProjectDetailsDashboard";
import SidebarProjectTree from "../components/sidebar/SidebarProjectTree";
import { List } from "../hooks/useLists";
import KanbanBoard from "../components/kanban/KanbanBoard";
import { Toaster } from "../../components/ui/sonner";
import { TaskEventsContext } from "../context/TaskEventsContext";
import { Sheet, SheetTrigger, SheetContent } from "../../components/ui/sheet";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import ProfileSheetContent from "../components/profile/ProfileSheetContent";
import ToggleTheme from "../components/sidebar/ToggleTheme";

export default function ProjectDashboard() {
  const { session, user, supabase, loading: loadingUser } = useSupabase();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const { fetchProjects } = useProjects(user?.id);
  const [taskCreatedFlag, setTaskCreatedFlag] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [profileName, setProfileName] = useState<string>("");

  // Buscar projetos ao montar e após alterações
  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const data = await fetchProjects();
      setProjects(data);
      // Se o projeto selecionado foi deletado, desmarcar
      if (selectedProject && !data.find((p) => p.id === selectedProject.id)) {
        setSelectedProject(null);
      }
    } catch {
      // Tratar erro se necessário
    } finally {
      setLoadingProjects(false);
    }
  };

  // Buscar nome do perfil ao montar e quando user mudar
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfileName(data?.full_name || ""));
  }, [user, supabase]);

  // Função para atualizar nome após edição
  const handleProfileNameChange = (newName: string) => {
    setProfileName(newName);
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loadingUser)
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-900 text-neutral-50">
        Carregando...
      </div>
    );
  if (!session)
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-900 text-neutral-50">
        Faça login para acessar
      </div>
    );

  return (
    <TaskEventsContext.Provider value={{ onTaskCreated: () => setTaskCreatedFlag(f => f + 1) }}>
      <div className="min-h-screen font-sans flex bg-background-primary text-text-default">
        {/* Sidebar fixa */}
        <aside className="w-64 min-h-screen bg-background-secondary border-r border-border-subtle flex flex-col py-4 px-2 gap-4 fixed left-0 top-0 z-30">
          {/* Logo e nome do sistema */}
          <div className="flex items-center gap-2 px-2 mb-2">
            <span className="text-lg font-bold text-text-default tracking-wide">
              LicitApp
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <ToggleTheme />
            </div>
          </div>
          {/* Navegação */}
          <nav className="flex flex-col gap-1 mt-2">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-muted hover:bg-highlight-hover transition font-medium">
              <span className="material-icons text-base">home</span>
              Início
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-muted hover:bg-highlight-hover transition font-medium">
              <span className="material-icons text-base">calendario</span>
              Planejado
            </button>
          </nav>
          {/* Divider */}
          <div className="border-t border-border-subtle my-3" />
          {/* Lista de projetos (agora árvore) */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs text-text-muted uppercase font-semibold tracking-wider">
                PROJETOS
              </span>
              <button
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-highlight-light hover:bg-highlight-hover text-[var(--color-icon-primary)] text-lg font-bold transition"
                title="Novo projeto"
                onClick={() => setShowCreateProject((v) => !v)}
              >
                +
              </button>
            </div>
            <ProjectForm 
              open={showCreateProject} 
              onClose={() => setShowCreateProject(false)}
              onProjectAdded={loadProjects} 
            />
            {/* SidebarProjectTree agora recebe os projetos e função de recarregar */}
            <SidebarProjectTree
              userId={user?.id ?? ""}
              projects={projects}
              loading={loadingProjects}
              reloadProjects={loadProjects}
              onSelectProject={(project: Project) => {
                setSelectedProject(project);
                setSelectedList(null);
              }}
              onSelectList={(list: List) => {
                setSelectedList({ ...list }); // força novo objeto para garantir re-render
                setSelectedProject(null);
              }}
            />
          </div>
          {/* Usuário e sair */}
          <div className="mt-4 px-2 flex flex-col gap-2 items-start">
            {user?.email && (
              <Sheet>
                <SheetTrigger asChild>
                  <button className="mb-2 flex items-center gap-2 group" title="Clique para acessar o perfil">
                    <Avatar>
                      <AvatarFallback>{profileName ? profileName[0] : (user.user_metadata?.name?.[0] || user.email[0])}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start ml-2">
                      <span className="text-xs text-text-muted opacity-80 group-hover:opacity-100 transition font-semibold">Perfil</span>
                      <span className="text-base font-medium text-text-default group-hover:underline transition">
                        {profileName || user.user_metadata?.name || user.email}
                      </span>
                    </div>
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="max-w-md w-full">
                  <ProfileSheetContent onNameChange={handleProfileNameChange} />
                </SheetContent>
              </Sheet>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-highlight-light text-text-default rounded-lg hover:bg-highlight-hover transition font-semibold w-full border border-border-subtle"
            >
              Sair
            </button>
          </div>
        </aside>
        {/* Conteúdo principal */}
        <main className="flex-1 ml-64 bg-background-primary text-text-default">
          <div className="p-6 max-w-6xl mx-auto">
            {/* SPA: renderiza dashboard ou detalhes conforme seleção */}
            {!selectedProject && !selectedList ? (
              <div className="text-text-muted dark:text-[var(--color-text-light)] text-center py-16">
                Selecione um projeto
              </div>
            ) : selectedProject ? (
              <ProjectDetailsDashboard project={selectedProject} />
            ) : selectedList ? (
              <KanbanBoard lista={selectedList} taskCreatedFlag={taskCreatedFlag} />
            ) : null}
          </div>
        </main>
        <Toaster />
      </div>
    </TaskEventsContext.Provider>
  );
}

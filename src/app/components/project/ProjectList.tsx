"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import React from "react";
export interface Project {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  selectedProject: Project | null;
  loading: boolean;
  onAddList: (
    project: Project,
    ref: React.RefObject<HTMLButtonElement>,
  ) => void;
  addListButtonRefs: Record<string, React.RefObject<HTMLButtonElement>>;
  onDeleteProject: (project: Project) => void;
}

export default function ProjectList({
  projects,
  onSelectProject,
  selectedProject,
  loading,
  onAddList,
  addListButtonRefs,
  onDeleteProject,
}: ProjectListProps) {
  function handleDelete(project: Project) {
    if (window.confirm("Tem certeza que deseja remover este projeto?")) {
      onDeleteProject(project);
    }
  }

  if (loading)
    return (
      <div className="text-center py-4 text-neutral-400 font-sans">
        Carregando projetos...
      </div>
    );
  if (!projects.length)
    return (
      <div className="text-center py-4 text-neutral-400 font-sans">
        Nenhum projeto encontrado.
      </div>
    );

  function renderProject(project: Project) {
    const plusRef = addListButtonRefs[project.id];
    return (
      <li
        key={project.id}
        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer font-medium border transition-colors duration-200
          ${selectedProject?.id === project.id ? "bg-primary-50 border-primary-300 text-primary-800" : "hover:bg-primary-100 border border-transparent text-neutral-800"}
          focus:outline focus:outline-2 focus:outline-blue-300`
        }
      >
        <span
          onClick={() => onSelectProject(project)}
          className="flex-1 select-none"
        >
          {project.name}
        </span>
        <button
          type="button"
          ref={plusRef}
          onClick={(e) => {
            e.stopPropagation();
            onAddList(project, plusRef);
          }}
          className="ml-2 p-1 rounded hover:bg-primary-100 text-primary-700 transition-colors duration-200"
          title="Nova tarefa/sprint/pasta"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          className="ml-1 p-1 rounded hover:bg-neutral-200 text-neutral-700 transition-colors duration-200"
          title="Remover projeto"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(project);
          }}
        >
          🗑️
        </button>
      </li>
    );
  }

  return (
    <ul className="flex flex-col gap-2 font-sans">
      {projects.map(renderProject)}
    </ul>
  );
}

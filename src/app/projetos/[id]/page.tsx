"use client";
import { useEffect, useState } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { useParams } from "next/navigation";
import type { Project } from "../../hooks/useProjects";

export default function ProjectPage() {
  const { id } = useParams() as { id: string };
  const { supabase } = useSupabase();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setProject(data as Project);
        setLoading(false);
      });
  }, [id, supabase]);

  if (loading) return <div className="p-8">Carregando projeto...</div>;
  if (error || !project) return <div className="p-8 text-red-500">Projeto não encontrado.</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Projeto: {project.name}</h1>
      <div className="text-neutral-700 dark:text-neutral-200">
        <div>ID: {project.id}</div>
        <div>Criado em: {project.created_at}</div>
        <div>Usuário: {project.user_id}</div>
      </div>
    </div>
  );
} 
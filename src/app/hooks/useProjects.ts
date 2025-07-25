import { useCallback } from "react";
import { useSupabase } from "../context/SupabaseContext";

export interface Project {
  id: string;
  name: string;
  user_id: string;
  color?: string;
  created_at: string;
}

export function useProjects(userId: string | undefined) {
  const { supabase } = useSupabase();

  const fetchProjects = useCallback(async () => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message || JSON.stringify(error));
    return data as Project[];
  }, [userId, supabase]);

  const createProject = useCallback(
    async (name: string) => {
      if (!userId) return;
      const { error } = await supabase
        .from("projects")
        .insert({ name, user_id: userId });
      if (error) throw new Error(error.message || JSON.stringify(error));
    },
    [userId, supabase],
  );

  const deleteProject = useCallback(
    async (id: string) => {
      if (!userId) return;
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message || JSON.stringify(error));
    },
    [userId, supabase],
  );

  return { fetchProjects, createProject, deleteProject };
}

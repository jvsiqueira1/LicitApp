import { useCallback } from "react";
import { useSupabase } from "../context/SupabaseContext";

export function useTasks(projectId: string | undefined) {
  const { supabase } = useSupabase();

  const fetchTasks = useCallback(async () => {
    if (!projectId) return [];
    const { data, error } = await supabase
      .from("lists")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message || JSON.stringify(error));
    return data;
  }, [projectId, supabase]);

  const createTask = useCallback(
    async (name: string, status: string) => {
      if (!projectId) return;
      const { error } = await supabase
        .from("lists")
        .insert({ project_id: projectId, name, status });
      if (error) throw new Error(error.message || JSON.stringify(error));
    },
    [projectId, supabase],
  );

  // updateTask, deleteTask podem ser adicionados aqui

  return { fetchTasks, createTask };
}

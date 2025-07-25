import { useCallback } from "react";
import { useSupabase } from "../context/SupabaseContext";
import type { Status } from "../components/task/ListList";

export function useStatuses(projectId: string | undefined) {
  const { supabase } = useSupabase();

  const fetchStatuses = useCallback(async () => {
    if (!projectId) return [];
    // Buscar statuses do projeto (ordenar por order_index customizável)
    const { data, error } = await supabase
      .from("statuses")
      .select("*")
      .eq("project_id", projectId)
      .order("order_index", { ascending: true });
    if (error) throw new Error(error.message || JSON.stringify(error));
    return data as Status[];
  }, [projectId, supabase]);

  // Mantém a função de criar status para uso futuro
  const createStatus = useCallback(
    async (name: string, color: string, listId: string) => {
      if (!listId) return;
      const { error } = await supabase
        .from("statuses")
        .insert({ list_id: listId, name, color });
      if (error) throw new Error(error.message || JSON.stringify(error));
    },
    [supabase],
  );

  return { fetchStatuses, createStatus };
}

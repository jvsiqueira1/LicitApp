import { useCallback } from "react";
import { useSupabase } from "../context/SupabaseContext";

export interface Status {
  id: string;
  project_id: string;
  name: string;
  color_hex: string;
  order_index: number;
  created_at: string;
}

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

  const createStatus = useCallback(
    async (name: string, color_hex: string, projectId: string) => {
      if (!projectId) return;
      const { error } = await supabase
        .from("statuses")
        .insert({ 
          project_id: projectId, 
          name, 
          color_hex,
          order_index: 0 // Será atualizado posteriormente se necessário
        });
      if (error) throw new Error(error.message || JSON.stringify(error));
    },
    [supabase],
  );

  const updateStatus = useCallback(
    async (statusId: string, updates: Partial<Status>) => {
      const { error } = await supabase
        .from("statuses")
        .update(updates)
        .eq("id", statusId);
      if (error) throw new Error(error.message || JSON.stringify(error));
    },
    [supabase],
  );

  const deleteStatus = useCallback(
    async (statusId: string) => {
      const { error } = await supabase
        .from("statuses")
        .delete()
        .eq("id", statusId);
      if (error) throw new Error(error.message || JSON.stringify(error));
    },
    [supabase],
  );

  const updateStatusOrder = useCallback(
    async (statuses: Array<{ id: string; order_index: number }>) => {
      const { error } = await supabase
        .from("statuses")
        .upsert(statuses, { onConflict: "id" });
      if (error) throw new Error(error.message || JSON.stringify(error));
    },
    [supabase],
  );

  return { 
    fetchStatuses, 
    createStatus, 
    updateStatus, 
    deleteStatus, 
    updateStatusOrder 
  };
}

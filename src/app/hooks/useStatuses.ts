import { useCallback } from "react";
import { useSupabase } from "../context/SupabaseContext";

export interface Status {
  id: string;
  project_id: string;
  name: string;
  color_hex: string;
  created_at?: string;
  order_index?: number;
}

export function useStatuses(projectId: string | undefined) {
  const { supabase } = useSupabase();

  const fetchStatuses = useCallback(async () => {
    if (!projectId) return [];
    
    try {
      // Buscar statuses diretamente pelo project_id
      const { data, error } = await supabase
        .from("statuses")
        .select("*")
        .eq("project_id", projectId)
        .order("order_index", { ascending: true });
      
      if (error) {
        console.error("fetchStatuses: statusesError =", error);
        throw new Error(error.message || JSON.stringify(error));
      }
      
      // Garantir que o campo color sempre tenha um valor
      const result = (data || []).map(status => ({
        ...status,
        color: status.color_hex || '#3B82F6' // fallback para azul
      })) as Status[];
      
      return result;
    } catch (err) {
      console.error("fetchStatuses: unexpected error =", err);
      return [];
    }
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
          order_index: 0
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
    async (statuses: Array<{ id: string; project_id: string; name: string; color_hex: string; order_index: number }>) => {
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

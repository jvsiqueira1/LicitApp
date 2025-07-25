import { useCallback } from "react";
import { useSupabase } from "../context/SupabaseContext";

export interface List {
  id: string;
  project_id: string;
  name: string;
  acquisition_type?: string | null;
  process_number?: string | null;
  deadline?: string | null;
  value?: number | null;
  status: string;
  type: string;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  folder_id?: string | null;
  color?: string | null;
  color_name?: string | null;
}

export function useLists(projectId: string | undefined, folderId?: string | null) {
  const { supabase } = useSupabase();

  const fetchLists = useCallback(async () => {
    if (!projectId) return [];
    let query = supabase
      .from("lists")
      .select("*")
      .eq("project_id", projectId)
      .eq("type", "lista")
      .order("created_at", { ascending: false });
    if (folderId === null) {
      query = query.is("folder_id", null);
    } else if (folderId !== undefined) {
      query = query.eq("folder_id", folderId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message || JSON.stringify(error));
    return data as List[];
  }, [projectId, folderId, supabase]);

  return { fetchLists };
} 
import { useCallback } from "react";
import { useSupabase } from "../context/SupabaseContext";

export interface Sprint {
  id: string;
  project_id: string;
  folder_id: string | null;
  user_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export function useSprints(projectId: string | undefined, folderId?: string | null) {
  const { supabase } = useSupabase();

  const fetchSprints = useCallback(async () => {
    if (!projectId) return [];
    let query = supabase
      .from("lists")
      .select("*")
      .eq("project_id", projectId)
      .eq("type", "sprint")
      .order("created_at", { ascending: false });
    if (folderId === null) {
      query = query.is("folder_id", null);
    } else if (folderId !== undefined) {
      query = query.eq("folder_id", folderId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message || JSON.stringify(error));
    return data as Sprint[];
  }, [projectId, folderId, supabase]);

  return { fetchSprints };
} 
import { useCallback } from "react";
import { useSupabase } from "../context/SupabaseContext";

export interface Folder {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export function useFolders(projectId: string | undefined) {
  const { supabase } = useSupabase();

  const fetchFolders = useCallback(async () => {
    if (!projectId) return [];
    const { data, error } = await supabase
      .from("lists")
      .select("*")
      .eq("project_id", projectId)
      .eq("type", "pasta")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message || JSON.stringify(error));
    return data as Folder[];
  }, [projectId, supabase]);

  return { fetchFolders };
} 
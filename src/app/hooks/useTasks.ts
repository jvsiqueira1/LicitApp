import { useCallback } from "react";
import { useSupabase } from "../context/SupabaseContext";

export interface Task {
  id: string;
  name: string;
  description?: string;
  list_id: string;
  status_id: string;
  assignee?: string;
  priority?: string;
  due_date?: string;
  progress: number;
  created_at: string;
}

export function useTasks(projectId: string | undefined) {
  const { supabase } = useSupabase();

  const fetchTasks = useCallback(async () => {
    if (!projectId) return [];
    
    // Buscar tasks através das listas do projeto
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        lists!inner(project_id)
      `)
      .eq("lists.project_id", projectId)
      .order("created_at", { ascending: false });
      
    if (error) throw new Error(error.message || JSON.stringify(error));
    return data as Task[];
  }, [projectId, supabase]);

  const fetchTasksByList = useCallback(async (listId: string) => {
    if (!listId) return [];
    
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("list_id", listId)
      .order("created_at", { ascending: false });
      
    if (error) throw new Error(error.message || JSON.stringify(error));
    return data as Task[];
  }, [supabase]);

  const createTask = useCallback(
    async (taskData: {
      name: string;
      description?: string;
      list_id: string;
      status_id: string;
      assignee?: string;
      priority?: string;
      due_date?: string;
      progress?: number;
    }) => {
      const { error } = await supabase
        .from("tasks")
        .insert({
          ...taskData,
          progress: taskData.progress || 0
        });
      if (error) throw new Error(error.message || JSON.stringify(error));
    },
    [supabase],
  );

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId);
      if (error) throw new Error(error.message || JSON.stringify(error));
    },
    [supabase],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);
      if (error) throw new Error(error.message || JSON.stringify(error));
    },
    [supabase],
  );

  const moveTask = useCallback(
    async (taskId: string, newStatusId: string, newListId?: string) => {
      const updates: Partial<Task> = { status_id: newStatusId };
      if (newListId) {
        updates.list_id = newListId;
      }
      
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId);
      if (error) throw new Error(error.message || JSON.stringify(error));
    },
    [supabase],
  );

  return { 
    fetchTasks, 
    fetchTasksByList,
    createTask, 
    updateTask, 
    deleteTask, 
    moveTask 
  };
}

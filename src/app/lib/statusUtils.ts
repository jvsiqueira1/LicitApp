import { SupabaseClient } from "@supabase/supabase-js";

export interface Status {
  id: string;
  project_id: string;
  name: string;
  color_hex: string;
  created_at?: string;
  order_index?: number;
}

export async function createOrReuseStatus(
  supabase: SupabaseClient,
  projectId: string,
  statusName: string,
  colorHex: string = "#3B82F6"
): Promise<Status> {
  // Primeiro, verificar se já existe um status com esse nome no projeto
  const { data: existingStatus, error: searchError } = await supabase
    .from("statuses")
    .select("*")
    .eq("project_id", projectId)
    .eq("name", statusName)
    .single();

  if (searchError && searchError.code !== "PGRST116") {
    throw new Error(`Erro ao buscar status: ${searchError.message}`);
  }

  if (existingStatus) {
    return existingStatus;
  }

  // Se não existe, criar um novo status
  const { data: newStatus, error: insertError } = await supabase
    .from("statuses")
    .insert({
      project_id: projectId,
      name: statusName,
      color_hex: colorHex,
      order_index: 0
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Erro ao criar status: ${insertError.message}`);
  }

  return newStatus;
} 
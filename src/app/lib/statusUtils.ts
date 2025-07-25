import { SupabaseClient } from "@supabase/supabase-js";

export interface Status {
  id: string;
  project_id: string;
  name: string;
  color_hex: string;
  order_num?: number;
}

/**
 * Cria ou reutiliza um status único por projeto.
 * @param supabase Instância do SupabaseClient
 * @param projectId ID do projeto
 * @param name Nome do status
 * @param color_hex Cor do status
 * @returns Status existente ou recém-criado
 */
export async function createOrReuseStatus(
  supabase: SupabaseClient,
  projectId: string,
  name: string,
  color_hex: string
): Promise<Status> {
  // 1. Verificar se já existe status com esse nome no projeto
  const { data: existing, error: selectError } = await supabase
    .from("statuses")
    .select("*")
    .eq("project_id", projectId)
    .eq("name", name)
    .single();

  if (selectError && selectError.code !== "PGRST116") throw selectError; // PGRST116 = no rows found

  if (existing) {
    // Já existe, retorna o existente
    return existing as Status;
  } else {
    // Não existe, cria novo
    const { data, error: insertError } = await supabase
      .from("statuses")
      .insert({ project_id: projectId, name, color_hex })
      .select()
      .single();
    if (insertError) throw insertError;
    return data as Status;
  }
} 
"use client";
import { useEffect, useState } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { useParams } from "next/navigation";
import type { List } from "../../hooks/useLists";

export default function ListaPage() {
  const { id } = useParams() as { id: string };
  const { supabase } = useSupabase();
  const [lista, setLista] = useState<List | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from("lists")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setLista(data as List);
        setLoading(false);
      });
  }, [id, supabase]);

  if (loading) return <div className="p-8">Carregando lista...</div>;
  if (error || !lista) return <div className="p-8 text-status-error">Lista não encontrada.</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Lista: {lista.name}</h1>
      <div className="text-neutral-700 dark:text-neutral-200">
        <div>ID: {lista.id}</div>
        <div>Status: {lista.status}</div>
        <div>Tipo: {lista.type}</div>
        <div>Criado em: {lista.created_at}</div>
        <div>Projeto: {lista.project_id}</div>
      </div>
    </div>
  );
} 
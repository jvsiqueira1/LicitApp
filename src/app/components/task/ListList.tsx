"use client";
import { useEffect, useState } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import {
  RocketLaunchIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  StarIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { createOrReuseStatus } from "@/app/lib/statusUtils";

interface List {
  id: string;
  project_id: string;
  name: string;
  type: "sprint" | "lista" | "pasta";
  acquisition_type?: string;
  process_number?: string;
  deadline?: string;
  value?: number;
  status?: string;
  created_at: string;
}

export interface Status {
  id: string;
  project_id: string;
  name: string;
  color: string; // legado, pode ser removido depois
  color_hex: string; // novo campo para cor exata
  order_num: number;
}

interface ListListProps {
  projectId: string;
  statuses?: Status[];
  onStatusCreated?: () => void;
}

export default function ListList({
  projectId,
  statuses: propStatuses,
  onStatusCreated,
}: ListListProps) {
  const { supabase } = useSupabase();
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingNewStatus, setAddingNewStatus] = useState(false);
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState(
    "bg-status-info text-white",
  );

  // Função para buscar listas do projeto
  const fetchLists = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("lists")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (!error) setLists(data || []);
    else setError(error.message);
    setLoading(false);
  };

  // Atualizar statuses se propStatuses mudar
  useEffect(() => {
    if (propStatuses) return; // Não buscar do Supabase se vier por prop
    // Buscar status personalizados do projeto
    const fetchStatuses = async () => {
      const { data, error } = await supabase
        .from("statuses")
        .select("*")
        .eq("project_id", projectId)
        .order("order_num", { ascending: true });
      if (!error && data) {
        // setStatuses(data as Status[]); // This line was removed
      } else {
        // setStatuses([]); // This line was removed
      }
    };
    fetchStatuses();

    // Realtime para listas
    const channel = supabase
      .channel("realtime-lists")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lists",
          filter: `project_id=eq.${projectId}`,
        },
        fetchLists,
      )
      .subscribe();
    fetchLists(); // Buscar listas inicialmente

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line
  }, [projectId, supabase, propStatuses]);

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Deduplicação: criar ou reutilizar status
      await createOrReuseStatus(supabase, projectId, newStatusName, newStatusColor);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
    setNewStatusName("");
    setNewStatusColor("bg-status-info text-white");
    setAddingNewStatus(false);
    setLoading(false);
    if (onStatusCreated) onStatusCreated();
  };

  // Agrupar listas por tipo
  const sprintLists = lists.filter((l) => l.type === "sprint");
  const listaLists = lists.filter((l) => l.type === "lista");
  const pastaLists = lists.filter((l) => l.type === "pasta");

  const groups = [
    {
      key: "sprint",
      label: "Sprints",
      icon: <RocketLaunchIcon className="w-4 h-4 text-pink-400" />,
      items: sprintLists,
    },
    {
      key: "lista",
      label: "Listas",
      icon: <ClipboardDocumentListIcon className="w-4 h-4 text-blue-400" />,
      items: listaLists,
    },
    {
      key: "pasta",
      label: "Pastas",
      icon: <FolderIcon className="w-4 h-4 text-yellow-400" />,
      items: pastaLists,
    },
  ];

  if (loading)
    return (
      <div className="text-center py-4 text-neutral-400 font-sans">
        Carregando listas...
      </div>
    );
  if (error)
    return (
      <div className="text-status-error text-center py-4 font-sans">
        {error}
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.key}>
          <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold uppercase tracking-wider text-neutral-400">
            {group.icon}
            <span>{group.label}</span>
            <span className="ml-1 bg-neutral-700 text-white rounded-full px-2 py-0.5 text-xs font-semibold">
              {group.items.length}
            </span>
          </div>
          <ul className="flex flex-col gap-1 mt-1">
            {group.items.length === 0 && (
              <li className="text-neutral-500 text-xs px-4 py-2">
                Nenhum item
              </li>
            )}
            {group.items.map((list) => (
              <li
                key={list.id}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                {/* Ícone por tipo */}
                {group.key === "sprint" && (
                  <StarIcon className="w-4 h-4 text-pink-400" />
                )}
                {group.key === "lista" && (
                  <GlobeAltIcon className="w-4 h-4 text-blue-400" />
                )}
                {group.key === "pasta" && (
                  <FolderIcon className="w-4 h-4 text-yellow-400" />
                )}
                <span className="flex-1 truncate font-medium text-neutral-900 dark:text-neutral-100">
                  {list.name}
                </span>
                {/* Badge de status ou quantidade, se desejar */}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {/* Novo status */}
      <div className="px-4 pb-4">
        {addingNewStatus ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddStatus();
            }}
            className="flex items-center gap-2 mt-2"
          >
            <input
              type="text"
              className="flex-1 rounded-lg border border-primary-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-300 transition-colors duration-200 font-sans"
              placeholder="Nome do novo status"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              autoFocus
              disabled={loading}
            />
            <select
              className="rounded-lg border border-primary-300 px-2 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-300 transition-colors duration-200 font-sans"
              value={newStatusColor}
              onChange={(e) => setNewStatusColor(e.target.value)}
              disabled={loading}
            >
              <option value="bg-status-info text-white">Azul</option>
              <option value="bg-status-pending text-white">Amarelo</option>
              <option value="bg-status-success text-white">Verde</option>
              <option value="bg-status-lost text-white">Roxo</option>
              <option value="bg-status-error text-white">Vermelho</option>
              <option value="bg-neutral-400 text-white">Cinza</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold px-3 py-2 shadow transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed font-sans focus:ring-2 focus:ring-primary-500"
              disabled={loading || !newStatusName.trim()}
            >
              Criar
            </button>
            <button
              type="button"
              className="rounded-lg bg-neutral-400 hover:bg-neutral-500 text-white font-semibold px-3 py-2 shadow transition font-sans"
              onClick={() => {
                setAddingNewStatus(false);
                setNewStatusName("");
                setNewStatusColor("bg-status-info text-white");
              }}
              disabled={loading}
            >
              Cancelar
            </button>
          </form>
        ) : (
          <button
            type="button"
            className="flex items-center gap-2 text-primary-700 dark:text-primary-300 hover:underline mt-2 text-sm font-semibold"
            onClick={() => setAddingNewStatus(true)}
          >
            + Novo status
          </button>
        )}
      </div>
    </div>
  );
}

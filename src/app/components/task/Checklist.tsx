import React, { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useSupabase } from "../../context/SupabaseContext";
import { TrashIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/outline";

interface ChecklistItem {
  id: string;
  task_id: string;
  content: string;
  checked: boolean;
  created_at: string;
}

export default function Checklist({ taskId }: { taskId: string }) {
  const { supabase } = useSupabase();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(false);

  // Buscar checklist ao montar
  useEffect(() => {
    if (!taskId) return;
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from("checklist_items")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    if (!error) setItems(data || []);
    setLoading(false);
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim()) return;
    const { error } = await supabase
      .from("checklist_items")
      .insert({ task_id: taskId, content: newItem.trim(), checked: false });
    if (!error) {
      setNewItem("");
      fetchItems();
    }
  }

  async function handleToggleChecked(item: ChecklistItem) {
    const { error } = await supabase
      .from("checklist_items")
      .update({ checked: !item.checked })
      .eq("id", item.id);
    if (!error) fetchItems();
  }

  async function handleRemoveItem(itemId: string) {
    const { error } = await supabase
      .from("checklist_items")
      .delete()
      .eq("id", itemId);
    if (!error) fetchItems();
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-[var(--color-text-primary)]">Checklist</span>
        <span className="text-xs text-neutral-400">{items.filter(i => i.checked).length}/{items.length}</span>
      </div>
      <form onSubmit={handleAddItem} className="flex gap-2 mb-2">
        <input
          className="flex-1 bg-[var(--color-background-secondary)] border border-[var(--color-border-subtle)] rounded px-2 py-1 text-[var(--color-text-primary)] text-sm focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] hover:border-[var(--color-hover)] transition-colors duration-200"
          placeholder="Novo item da checklist"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-[var(--color-highlight)] hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] px-3 py-1 rounded flex items-center gap-1 transition-colors duration-200 border border-[var(--color-border-subtle)]"
          disabled={loading}
        >
          <PlusIcon className="w-4 h-4" />
          Adicionar
        </button>
      </form>
      <ul className="space-y-1">
        {items.map(item => (
          <li
            key={item.id}
            className={
              `flex items-center gap-2 rounded px-2 py-1 transition-colors duration-200 border border-[var(--color-border-subtle)] bg-[var(--color-background-primary)] ` +
              `hover:bg-[var(--color-hover)] focus-within:ring-2 focus-within:ring-[var(--color-focus-ring)] `
            }
          >
            <Checkbox checked={item.checked} onCheckedChange={() => handleToggleChecked(item)} />
            <span className={
              "flex-1 text-sm font-normal " +
              (item.checked ? "line-through text-[var(--color-text-secondary)] opacity-70" : "text-[var(--color-text-primary)]")
            }>{item.content}</span>
            <button
              className="text-[var(--color-icon-secondary)] hover:text-[var(--color-icon-primary)] p-1 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded"
              title="Remover item"
              onClick={() => handleRemoveItem(item.id)}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </li>
        ))}
        {items.length === 0 && !loading && (
          <li className="text-[var(--color-text-secondary)] text-sm px-2 py-1">Nenhum item</li>
        )}
      </ul>
    </div>
  );
} 
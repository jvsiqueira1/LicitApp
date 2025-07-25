"use client";
import { useState, useEffect } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface ProjectFormProps {
  onProjectAdded: () => void;
  open: boolean;
  onClose: () => void;
}

export default function ProjectForm({ onProjectAdded, open, onClose }: ProjectFormProps) {
  const { supabase, user } = useSupabase();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  // Estado para cor do projeto
  const [color, setColor] = useState("#3B82F6");

  useEffect(() => {
    const fetchProfileAndProjects = async () => {
      if (!user?.id) return;
      setProfileLoading(true);
      // Buscar plano e trial_ends_at
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("plan, trial_ends_at")
        .eq("id", user.id)
        .single();
      if (profileError) {
        setError("Erro ao buscar perfil do usuário");
        setProfileLoading(false);
        return;
      }
      setPlan(profile.plan);
      setTrialEndsAt(profile.trial_ends_at);
      // Buscar contagem de projetos
      const { count, error: countError } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (countError) {
        setError("Erro ao buscar projetos do usuário");
        setProfileLoading(false);
        return;
      }
      setProjectCount(count ?? 0);
      setProfileLoading(false);
    };
    if (open) fetchProfileAndProjects();
  }, [open, user, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("O nome é obrigatório.");
      return;
    }
    if (profileLoading) {
      setError("Carregando informações do perfil...");
      return;
    }
    if (plan === "FREE" && projectCount !== null && projectCount >= 1) {
      setError("Seu plano Free permite apenas um projeto. Faça upgrade para criar mais.");
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from("projects")
        .insert({ name: name.trim(), user_id: user?.id, color: color });
      
      if (error) throw new Error(error.message || JSON.stringify(error));
      
      toast.success("Projeto criado com sucesso!");
      setName("");
      onProjectAdded();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar projeto";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-[400px] max-w-full bg-[var(--color-background-primary)] rounded-2xl shadow-2xl border border-[var(--color-border-subtle)] animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Novo projeto
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-icon-secondary)] hover:text-[var(--color-icon-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--color-hover)]"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mensagem de plano/trial */}
          {plan === "TRIAL" && trialEndsAt && (
            <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-background-secondary)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-2 mb-2">
              Seu período trial expira em {new Date(trialEndsAt).toLocaleDateString()}.
            </div>
          )}
          {plan === "FREE" && (
            <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-background-secondary)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-2 mb-2">
              Seu plano Free permite apenas um projeto. Faça upgrade para criar mais.
            </div>
          )}
          <div>
            <label
              htmlFor="project-name"
              className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2"
            >
              Nome do projeto
            </label>
            <input
              id="project-name"
              type="text"
              placeholder="Digite o nome do projeto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-subtle)] px-4 py-3 text-base bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] hover:border-[var(--color-hover)] transition-colors duration-200"
              required
              autoFocus
            />
          </div>
          {/* Adicionar campo de cor ao formulário */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Cor do Projeto</label>
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-10 h-10 p-0 border-none bg-transparent cursor-pointer"
            />
          </div>
          
          {error && (
            <div className="text-[var(--color-destructive, #ef4444)] text-sm bg-[var(--color-background-secondary)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 text-[var(--color-text-primary)] bg-[var(--color-background-secondary)] hover:bg-[var(--color-hover)] border border-[var(--color-border-subtle)] rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-[var(--color-highlight)] hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar Projeto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

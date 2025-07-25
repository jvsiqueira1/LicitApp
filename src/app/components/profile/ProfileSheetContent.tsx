"use client";
import { useEffect, useState } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { Button } from "../../../components/ui/button";
import { SheetHeader, SheetTitle, SheetDescription } from "../../../components/ui/sheet";
import { Input } from "../../../components/ui/input";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";

const PLAN_NAMES: Record<string, string> = {
  "price_1Ro748IbAgakGY3r3tYErCNF": "Plano Premium Mensal"
};

type Subscription = {
  status: string;
  current_period_end: string | null;
  price_id: string | null;
};

export default function ProfileSheetContent({ onNameChange }: { onNameChange?: (name: string) => void }) {
  const { supabase, user } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  // Buscar nome, plano e trial ao abrir
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, plan, trial_ends_at")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setFullName(data?.full_name || "");
        setPlan(data?.plan || null);
        setTrialEndsAt(data?.trial_ends_at || null);
      });
  }, [user, supabase]);

  const handleSave = async () => {
    setSaving(true);
    const session = (await supabase.auth.getSession()).data.session;
    const res = await fetch("/api/update-user-profile", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session?.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ full_name: fullName })
    });
    const json = await res.json();
    setSaving(false);
    if (json.success) {
      toast.success("Nome atualizado com sucesso!");
      if (onNameChange) onNameChange(fullName);
      // Atualize o nome globalmente se necessário
    } else {
      toast.error(json.error || "Erro ao atualizar nome");
    }
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      setLoading(true);
      setError(null);
      if (!user) {
        setError("Usuário não autenticado.");
        setLoading(false);
        return;
      }
      const { data, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (subError && subError.code !== "PGRST116") {
        setError("Erro ao buscar assinatura.");
      } else {
        setSubscription(data || null);
      }
      setLoading(false);
    };
    fetchSubscription();
  }, [supabase, user]);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      setError("Usuário não autenticado.");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success_url: window.location.href,
        cancel_url: window.location.href
      })
    });
    const json = await res.json();
    if (json.url) {
      window.location.href = json.url;
    } else {
      setError(json.error || "Erro ao criar sessão de checkout.");
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    setError(null);
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      setError("Usuário não autenticado.");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/create-customer-portal-session", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        return_url: window.location.href
      })
    });
    const json = await res.json();
    if (json.url) {
      window.location.href = json.url;
    } else {
      setError(json.error || "Erro ao criar portal do cliente.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full items-center px-2 pt-6 bg-background-primary text-text-default">
      <SheetHeader>
        <SheetTitle>Perfil do Usuário</SheetTitle>
        <SheetDescription>
          Gerencie sua assinatura e informações do seu plano.
        </SheetDescription>
      </SheetHeader>
      {/* Avatar e nome/email */}
      <Avatar className="w-16 h-16 mb-2 text-2xl bg-highlight-light text-[var(--color-icon-primary)]">
        <AvatarFallback>{(fullName || user?.user_metadata?.name || user?.email || "?")[0]}</AvatarFallback>
      </Avatar>
      <div className="text-xl font-bold mb-0.5 text-text-default">{fullName || user?.user_metadata?.name || user?.email}</div>
      <div className="text-sm mb-6 text-text-muted">{user?.email}</div>
      {/* Input nome */}
      <div className="w-full max-w-sm flex items-end gap-2 mb-6">
        <Input
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Seu nome"
          disabled={saving}
          className="flex-1 bg-background-secondary border border-border-subtle text-text-default focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] hover:border-[var(--color-hover)]"
        />
        <Button onClick={handleSave} disabled={saving || !fullName.trim()} size="sm" className="h-9 px-4 bg-highlight-light hover:bg-highlight-hover text-text-default border border-border-subtle">
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
      {/* Área de plano Supabase */}
      <div className="w-full max-w-sm rounded-xl border border-border-subtle bg-background-secondary p-4 mb-4">
        <div className="font-semibold mb-1 text-text-default">Plano Atual</div>
        <div className="mb-1">
          <span className="font-medium">Plano:</span> {plan || "-"}
        </div>
        {plan === "TRIAL" && trialEndsAt && (
          <div className="mb-1 text-xs text-text-muted">
            Seu período trial expira em {new Date(trialEndsAt).toLocaleDateString("pt-BR")}
          </div>
        )}
        {plan === "FREE" && (
          <div className="mb-1 text-xs text-text-muted">
            Seu plano Free permite apenas um projeto. Faça upgrade para criar mais.
          </div>
        )}
      </div>
      {/* Área de assinatura */}
      <div className="w-full max-w-sm rounded-xl border border-border-subtle bg-background-secondary p-4 mb-8">
        <div className="font-semibold mb-1 text-text-default">Assinatura</div>
        {loading && <p className="text-text-muted">Carregando...</p>}
        {error && <p className="text-status-error">{error}</p>}
        {!loading && !error && (
          <>
            <div className="mb-2">
              <span className="font-medium">Status:</span>{" "}
              {subscription
                ? {
                    active: "Ativa",
                    trialing: "Em Teste",
                    canceled: "Cancelada",
                    past_due: "Atrasada",
                    incomplete: "Incompleta",
                    incomplete_expired: "Expirada"
                  }[subscription.status] || subscription.status
                : "Nenhuma assinatura ativa"}
            </div>
            {subscription && (
              <>
                <div className="mb-1">
                  <span className="font-medium">Plano:</span>{" "}
                  {PLAN_NAMES[subscription.price_id ?? ""] || subscription.price_id}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Válida até:</span>{" "}
                  {subscription.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleString("pt-BR")
                    : "-"}
                </div>
              </>
            )}
          </>
        )}
        <div className="mt-4">
          {!loading && !error && (
            (!subscription || !["active", "trialing"].includes(subscription.status)) ? (
              <Button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-highlight-light hover:bg-highlight-hover text-text-default border border-border-subtle"
              >
                Assinar Agora
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={handleManage}
                disabled={loading}
                className="w-full bg-background-primary hover:bg-highlight-hover text-text-default border border-border-subtle"
              >
                Gerenciar Assinatura
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
} 
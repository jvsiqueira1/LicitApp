"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Subscription = {
  status: string;
  current_period_end: string | null;
  price_id: string | null;
};

const PLAN_NAMES: Record<string, string> = {
  "price_1Ro748IbAgakGY3r3tYErCNF": "Plano Premium Mensal"
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      setLoading(true);
      setError(null);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
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
  }, []);

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
    <div className="max-w-lg mx-auto mt-10 p-6 bg-background-primary rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Perfil do Usuário</h1>
      {loading && <p>Carregando...</p>}
      {error && <p className="text-status-error">{error}</p>}
      {!loading && !error && (
        <>
          <div className="mb-4">
            <strong>Status da Assinatura:</strong>{" "}
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
              <div className="mb-2">
                <strong>Plano:</strong>{" "}
                {PLAN_NAMES[subscription.price_id ?? ""] || subscription.price_id}
              </div>
              <div className="mb-4">
                <strong>Válida até:</strong>{" "}
                {subscription.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleString("pt-BR")
                  : "-"}
              </div>
            </>
          )}
          {!subscription || !["active", "trialing"].includes(subscription.status) ? (
            <button
              className="bg-neutral-900 text-white px-4 py-2 rounded hover:bg-neutral-800"
              onClick={handleSubscribe}
              disabled={loading}
            >
              Assinar Agora
            </button>
          ) : (
            <button
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
              onClick={handleManage}
              disabled={loading}
            >
              Gerenciar Assinatura
            </button>
          )}
        </>
      )}
    </div>
  );
} 
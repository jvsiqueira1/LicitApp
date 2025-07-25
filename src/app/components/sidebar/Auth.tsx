"use client";
import { useState } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";
import ToggleTheme from "./ToggleTheme";

export default function Auth() {
  const { supabase } = useSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background-primary px-4 font-sans">
      <div className="bg-background-primary shadow-xl rounded-2xl w-full max-w-md p-8 flex flex-col gap-6 border border-border-subtle">
        {/* Header visual do LicitApp */}
        <div className="flex flex-col items-center gap-2 mb-2">
          <h1 className="text-2xl font-extrabold text-text-default tracking-tight font-sans">LicitApp</h1>
          <span className="text-sm text-text-muted">Acesse sua conta</span>
        </div>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full mb-4 bg-highlight-light border border-border-subtle rounded-lg p-1 flex">
            <TabsTrigger value="login" className="shadcn-tabs-trigger flex-1 data-[state=active]:!bg-background-secondary data-[state=active]:!text-text-default rounded-lg transition focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none">Entrar</TabsTrigger>
            <TabsTrigger value="signup" className="shadcn-tabs-trigger flex-1 data-[state=active]:!bg-background-secondary data-[state=active]:!text-text-default rounded-lg transition focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none">Cadastrar</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="login-email" className="text-sm font-medium text-text-default">E-mail</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-border-subtle px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-focus-ring bg-background-secondary text-text-default placeholder-text-muted transition font-sans"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="login-password" className="text-sm font-medium text-text-default">Senha</label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-lg border border-border-subtle px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-focus-ring bg-background-secondary text-text-default placeholder-text-muted transition font-sans"
                  required
                />
              </div>
              {error && tab === "login" && (
                <div className="text-status-error text-center text-sm font-medium animate-shake">{error}</div>
              )}
              <button
                type="submit"
                className="rounded-lg bg-background-secondary border border-border-subtle text-text-default font-semibold py-2 text-lg shadow transition hover:bg-highlight-hover disabled:opacity-60 disabled:cursor-not-allowed font-sans focus:ring-2 focus:ring-focus-ring"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Entrar"}
              </button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="signup-email" className="text-sm font-medium text-text-default">E-mail</label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-border-subtle px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-focus-ring bg-background-secondary text-text-default placeholder-text-muted transition font-sans"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="signup-password" className="text-sm font-medium text-text-default">Senha</label>
                <input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-lg border border-border-subtle px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-focus-ring bg-background-secondary text-text-default placeholder-text-muted transition font-sans"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="signup-confirm-password" className="text-sm font-medium text-text-default">Confirmar senha</label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-lg border border-border-subtle px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-focus-ring bg-background-secondary text-text-default placeholder-text-muted transition font-sans"
                  required
                />
              </div>
              {error && tab === "signup" && (
                <div className="text-status-error text-center text-sm font-medium animate-shake">{error}</div>
              )}
              <button
                type="submit"
                className="rounded-lg bg-background-secondary border border-border-subtle text-text-default font-semibold py-2 text-lg shadow transition hover:bg-highlight-hover disabled:opacity-60 disabled:cursor-not-allowed font-sans focus:ring-2 focus:ring-focus-ring"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Cadastrar"}
              </button>
            </form>
          </TabsContent>
        </Tabs>
        
        {/* Toggle de tema */}
        <div className="pt-4 border-t border-border-subtle">
          <ToggleTheme />
        </div>
      </div>
    </div>
  );
}

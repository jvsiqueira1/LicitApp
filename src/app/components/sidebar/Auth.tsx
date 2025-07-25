"use client";
import { useState } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";

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
    <div className="flex min-h-dvh items-center justify-center bg-primary-50 dark:bg-neutral-900 px-4 font-sans">
      <div className="bg-white/95 dark:bg-neutral-800 shadow-xl rounded-2xl w-full max-w-md p-8 flex flex-col gap-6 border border-primary-100 dark:border-neutral-700">
        {/* Header visual do LicitApp */}
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center font-bold text-white text-2xl">L</div>
          <h1 className="text-2xl font-extrabold text-primary-700 dark:text-primary-200 tracking-tight font-sans">LicitApp</h1>
          <span className="text-sm text-neutral-500 dark:text-neutral-300">Acesse sua conta</span>
        </div>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="login" className="flex-1">Entrar</TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">Cadastrar</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="login-email" className="text-sm font-medium">E-mail</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-900 dark:text-neutral-50 transition font-sans"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="login-password" className="text-sm font-medium">Senha</label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-900 dark:text-neutral-50 transition font-sans"
                  required
                />
              </div>
              {error && tab === "login" && (
                <div className="text-status-error text-center text-sm font-medium animate-shake">{error}</div>
              )}
              <button
                type="submit"
                className="rounded-lg bg-primary-600 hover:bg-primary-700 text-neutral-50 font-semibold py-2 text-lg shadow transition disabled:opacity-60 disabled:cursor-not-allowed font-sans focus:ring-2 focus:ring-primary-500"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Entrar"}
              </button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="signup-email" className="text-sm font-medium">E-mail</label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-900 dark:text-neutral-50 transition font-sans"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="signup-password" className="text-sm font-medium">Senha</label>
                <input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-900 dark:text-neutral-50 transition font-sans"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="signup-confirm-password" className="text-sm font-medium">Confirmar senha</label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-900 dark:text-neutral-50 transition font-sans"
                  required
                />
              </div>
              {error && tab === "signup" && (
                <div className="text-status-error text-center text-sm font-medium animate-shake">{error}</div>
              )}
              <button
                type="submit"
                className="rounded-lg bg-primary-600 hover:bg-primary-700 text-neutral-50 font-semibold py-2 text-lg shadow transition disabled:opacity-60 disabled:cursor-not-allowed font-sans focus:ring-2 focus:ring-primary-500"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Cadastrar"}
              </button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

"use client";
import { useSupabase } from "./context/SupabaseContext";
import dynamic from "next/dynamic";
const Auth = dynamic(() => import("./components/sidebar/Auth"));
const ProjectDashboard = dynamic(() => import("./containers/ProjectDashboard"), { ssr: false });

export default function Home() {
  const { user, loading } = useSupabase();

  if (loading) return <div>Carregando...</div>;

  if (!user) {
    return <Auth />;
  }

  return <ProjectDashboard />;
}

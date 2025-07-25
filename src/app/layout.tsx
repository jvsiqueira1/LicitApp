import "./globals.css";
import { SupabaseProvider } from "./context/SupabaseContext";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "LicitApp",
  description: "Gerencie suas licitações com facilidade",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-neutral-900 transition-colors duration-300">
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}

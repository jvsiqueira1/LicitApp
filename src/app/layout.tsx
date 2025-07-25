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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="transition-colors duration-300">
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}

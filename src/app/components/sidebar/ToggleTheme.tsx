import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ToggleTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Detecta preferência inicial
    const saved = localStorage.getItem("theme");
    if (saved) {
      setDark(saved === "dark");
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      // Usa preferência do sistema
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDark(prefersDark);
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  const toggle = () => {
    setDark((d) => {
      const newTheme = !d;
      document.documentElement.classList.toggle("dark", newTheme);
      localStorage.setItem("theme", newTheme ? "dark" : "light");
      return newTheme;
    });
  };

  return (
    <div className="flex justify-center w-full">
      <button
        onClick={toggle}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
        aria-label="Alternar tema"
        title="Alternar tema"
      >
        {dark ? (
          <span><Sun className="w-4 h-4" /></span>
        ) : (
          <span><Moon className="w-4 h-4" /></span>
        )}
      </button>
    </div>
  );
} 
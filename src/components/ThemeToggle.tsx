"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";

export type ThemeMode = "light" | "dark" | "system";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("addme-theme") as ThemeMode | null;
    if (saved && (saved === "light" || saved === "dark" || saved === "system")) {
      setTheme(saved);
      applyTheme(saved);
    } else {
      applyTheme("system");
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const current = (localStorage.getItem("addme-theme") as ThemeMode) || "system";
      if (current === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else if (mode === "light") {
      root.classList.remove("dark");
    } else {
      // System mode
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  const handleSelect = (mode: ThemeMode) => {
    setTheme(mode);
    localStorage.setItem("addme-theme", mode);
    applyTheme(mode);
  };

  if (!mounted) {
    return (
      <div className={`p-1 rounded-xl bg-[#F0F0F7] border border-[#E3E3EE] flex items-center gap-1 ${className}`}>
        <div className="h-7 w-full rounded-lg bg-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`p-1 rounded-xl bg-[#F0F0F7] dark:bg-[#1A192E] border border-[#E3E3EE] dark:border-[#2E2C48] flex items-center justify-between gap-1 text-xs select-none transition-colors ${className}`}
      title="Thème du dashboard (Clair, Sombre ou Automatique)"
    >
      <button
        type="button"
        onClick={() => handleSelect("light")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold transition-all ${
          theme === "light"
            ? "bg-white text-[#12122A] shadow-xs"
            : "text-[#5A5A70] dark:text-[#A3A1BD] hover:text-[#12122A] dark:hover:text-white"
        }`}
        aria-label="Mode Clair"
      >
        <Sun className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        <span className="hidden sm:inline">Clair</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect("dark")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold transition-all ${
          theme === "dark"
            ? "bg-[#5B3DF5] text-white shadow-xs"
            : "text-[#5A5A70] dark:text-[#A3A1BD] hover:text-[#12122A] dark:hover:text-white"
        }`}
        aria-label="Mode Sombre"
      >
        <Moon className="h-3.5 w-3.5 text-indigo-300 shrink-0" />
        <span className="hidden sm:inline">Sombre</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect("system")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold transition-all ${
          theme === "system"
            ? "bg-white dark:bg-[#2A2744] text-[#12122A] dark:text-white shadow-xs"
            : "text-[#5A5A70] dark:text-[#A3A1BD] hover:text-[#12122A] dark:hover:text-white"
        }`}
        aria-label="Mode Automatique Système"
      >
        <Laptop className="h-3.5 w-3.5 text-[#5B3DF5] dark:text-[#A38EFF] shrink-0" />
        <span className="hidden sm:inline">Auto</span>
      </button>
    </div>
  );
}


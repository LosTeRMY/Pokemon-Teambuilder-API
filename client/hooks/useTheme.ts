"use client";

import { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // On mount: read the saved preference and apply it to the DOM.
  // Nothing else touches localStorage — no second effect that fires with the
  // wrong initial value before this one has run.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pb-theme");
      const resolved: "light" | "dark" =
        saved === "light" || saved === "dark"
          ? saved
          : window.matchMedia?.("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      setTheme(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
    } catch { /* ignore */ }
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      const root = document.documentElement;
      root.classList.add("theme-switching");
      root.setAttribute("data-theme", next);
      setTimeout(() => root.classList.remove("theme-switching"), 80);
      try { localStorage.setItem("pb-theme", next); } catch { /* ignore */ }
      return next;
    });
  };

  return { theme, toggle };
}

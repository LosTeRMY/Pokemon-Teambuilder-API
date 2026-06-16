"use client";

import { useState, useMemo, useEffect } from "react";
import * as LK from "@/lib/lookups";
import type { BrowserTeam } from "@/lib/lookups";
import { useFilterState } from "@/hooks/useFilterState";
import { useTheme } from "@/hooks/useTheme";

export function useTeamBrowser() {
  const { theme, toggle } = useTheme();

  const [teams, setTeams] = useState<BrowserTeam[]>(LK.teams);
  const loggedIn = true; // TODO: replace with real auth hook once auth is implemented
  const filter = useFilterState();
  const { s, set, removeFromList, removeCombo, activeCount, onClear } = filter;

  const [drawer, setDrawer] = useState(false);
  const [copied, setCopied] = useState(false);

  const size = 77;
  const compact = false;

  const queryString = useMemo(() => LK.encode(s), [s]);
  useEffect(() => {
    try {
      const url = window.location.pathname + (queryString ? "?" + queryString : "");
      window.history.replaceState(null, "", url);
    } catch { /* sandboxed origin */ }
  }, [queryString]);

  const counts = useMemo(() => {
    const c: Record<number, number> = {};
    teams.forEach((tm) => { c[tm.format] = (c[tm.format] || 0) + 1; });
    return c;
  }, [teams]);

  const filtered = useMemo(() => {
    const r = teams.filter((tm) => {
      if (s.name && !tm.name.toLowerCase().includes(s.name.toLowerCase())) return false;
      if (s.format != null && tm.format !== s.format) return false;
      if (s.likedBy && !tm.liked) return false;
      for (const pid of s.pokemon)
        if (!tm.members.some((m) => m.pid === pid)) return false;
      for (const mid of s.move)
        if (!tm.members.some((m) => m.moveIds.includes(mid))) return false;
      for (const aid of s.ability)
        if (!tm.members.some((m) => m.abilId === aid)) return false;
      for (const iid of s.item)
        if (!tm.members.some((m) => m.itemId === iid)) return false;
      for (const c of s.combos) {
        const ok = tm.members.some((m) => {
          if (m.pid !== c.pid) return false;
          if (c.kind === "move") return m.moveIds.includes(c.vid);
          if (c.kind === "item") return m.itemId === c.vid;
          if (c.kind === "ability") return m.abilId === c.vid;
          if (c.kind === "nature") return m.natId === c.vid;
          return false;
        });
        if (!ok) return false;
      }
      return true;
    });
    return [...r].sort((a, b) =>
      s.sort === "popular"
        ? b.likes - a.likes
        : s.sort === "oldest"
          ? a.createdAt.localeCompare(b.createdAt)
          : b.createdAt.localeCompare(a.createdAt),
    );
  }, [teams, s]);

  const onLike = (id: number) =>
    setTeams((ts) =>
      ts.map((tm) =>
        tm.id === id
          ? { ...tm, liked: !tm.liked, likes: tm.likes + (tm.liked ? -1 : 1) }
          : tm,
      ),
    );

  const copyLink = () => {
    const link =
      window.location.href.includes("?") || !queryString
        ? window.location.href
        : window.location.href.split("?")[0] + "?" + queryString;
    try { navigator.clipboard.writeText(link); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return {
    theme, toggle,
    filter, counts, loggedIn, drawer, setDrawer,
    filtered, s, set, removeFromList, removeCombo, activeCount, onLike, onClear,
    copied, copyLink, size, compact,
  };
}

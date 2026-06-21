"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import * as LK from "@/lib/lookups";
import { apiFetch } from "@/lib/api";
import { mapServerTeam, type ServerTeam } from "@/lib/teamBrowserMap";
import { useFilterState } from "@/hooks/useFilterState";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useLikeToggle } from "@/hooks/useLikeToggle";

export function useTeamBrowser() {
  const { theme, toggle } = useTheme();

  const { user } = useAuth();
  const loggedIn = !!user;
  const filter = useFilterState();
  const { s, set, removeFromList, removeCombo, activeCount, onClear } = filter;

  const [drawer, setDrawer] = useState(false);
  const [copied, setCopied] = useState(false);

  const size = 64;
  const compact = false;

  const queryString = useMemo(() => LK.encode(s), [s]);
  useEffect(() => {
    try {
      const url = window.location.pathname + (queryString ? "?" + queryString : "");
      window.history.replaceState(null, "", url);
    } catch { /* sandboxed origin */ }
  }, [queryString]);

  const PAGE_SIZE = 20; // matches the server's own default limit, made explicit

  const teamsQuery = useQuery({
    queryKey: ["teams", queryString],
    queryFn: () =>
      apiFetch<ServerTeam[]>(`/teams?${queryString}${queryString ? "&" : ""}limit=${PAGE_SIZE}`).then((rows) =>
        rows.map(mapServerTeam),
      ),
  });
  const filtered = teamsQuery.data ?? [];

  const totalQuery = useQuery({
    queryKey: ["teams", "count", queryString],
    queryFn: () => apiFetch<{ total: number }>(`/teams/count${queryString ? "?" + queryString : ""}`),
  });
  const total = totalQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const countsQuery = useQuery({
    queryKey: ["teams", "format-counts"],
    queryFn: () => apiFetch<Record<number, number>>("/teams/format-counts"),
    staleTime: 5 * 60 * 1000,
  });
  const counts = countsQuery.data ?? {};

  const toggleLike = useLikeToggle(["teams", queryString]);
  const onLike = (id: number) => {
    if (!loggedIn) return;
    toggleLike(filtered, id);
  };

  const copyLink = () => {
    const link =
      window.location.href.includes("?") || !queryString
        ? window.location.href
        : window.location.href.split("?")[0] + "?" + queryString;
    navigator.clipboard.writeText(link)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      })
      .catch(() => {});
  };

  return {
    theme, toggle,
    filter, counts, loggedIn, drawer, setDrawer,
    filtered, s, set, removeFromList, removeCombo, activeCount, onLike, onClear,
    copied, copyLink, size, compact,
    total, totalPages,
  };
}

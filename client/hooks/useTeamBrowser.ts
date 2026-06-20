"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as LK from "@/lib/lookups";
import { apiFetch } from "@/lib/api";
import { mapServerTeam, type ServerTeam } from "@/lib/teamBrowserMap";
import { useFilterState } from "@/hooks/useFilterState";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";

export function useTeamBrowser() {
  const { theme, toggle } = useTheme();
  const queryClient = useQueryClient();

  const { user } = useAuth();
  const loggedIn = !!user;
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

  // limit=100 mirrors the old client-side filtering's "show everything that
  // matches" behavior — there's no pager UI yet, and 100 is the server's cap.
  const teamsQuery = useQuery({
    queryKey: ["teams", queryString],
    queryFn: () =>
      apiFetch<ServerTeam[]>(`/teams?${queryString}${queryString ? "&" : ""}limit=100`).then((rows) =>
        rows.map(mapServerTeam),
      ),
  });
  const filtered = teamsQuery.data ?? [];

  const countsQuery = useQuery({
    queryKey: ["teams", "format-counts"],
    queryFn: () => apiFetch<Record<number, number>>("/teams/format-counts"),
    staleTime: 5 * 60 * 1000,
  });
  const counts = countsQuery.data ?? {};

  const onLike = (id: number) => {
    if (!loggedIn) return;
    const team = filtered.find((tm) => tm.id === id);
    if (!team) return;
    const method = team.liked ? "DELETE" : "POST";
    apiFetch(`/teams/${id}/likes`, { method })
      .then(() => queryClient.invalidateQueries({ queryKey: ["teams", queryString] }))
      .catch(() => {});
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
  };
}

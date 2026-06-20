"use client";

import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { BrowserTeam } from "@/lib/lookups";

/* Shared by useTeamBrowser and useUserProfile: both hold a BrowserTeam[] under
 * their own TanStack Query key and need the same optimistic like/unlike with
 * rollback-on-failure behavior — toggle the cached list immediately, then
 * reconcile with the server, restoring the pre-toggle snapshot if the request
 * fails (e.g. a double-click race against an already-pending unlike). */
export function useLikeToggle(queryKey: QueryKey) {
  const queryClient = useQueryClient();

  return (teams: BrowserTeam[], id: number) => {
    const team = teams.find((t) => t.id === id);
    if (!team) return;
    const method = team.liked ? "DELETE" : "POST";

    const previous = queryClient.getQueryData<BrowserTeam[]>(queryKey);
    queryClient.setQueryData<BrowserTeam[]>(queryKey, (old) =>
      old?.map((t) => (t.id === id ? { ...t, liked: !t.liked, likes: t.likes + (t.liked ? -1 : 1) } : t)),
    );

    apiFetch(`/teams/${id}/likes`, { method })
      .then(() => queryClient.invalidateQueries({ queryKey }))
      .catch(() => queryClient.setQueryData(queryKey, previous));
  };
}

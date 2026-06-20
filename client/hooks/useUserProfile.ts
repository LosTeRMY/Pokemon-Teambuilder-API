"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import { mapServerTeam, type ServerTeam } from "@/lib/teamBrowserMap";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useLikeToggle } from "@/hooks/useLikeToggle";

export type ProfileUser = {
  id: number;
  username: string;
  avatar: string | null;
  bio: string | null;
  createdAt: string;
};

export type ProfileSort = "newest" | "oldest" | "popular";

/* GET /users/:id already embeds a `teams` field, but it's the lean
 * metadata-only shape (no pokemons) — GET /teams?user=<id> returns the same
 * rows teamBrowserMap already knows how to turn into BrowserTeam (with
 * member sprites, likes_count, liked), so we fetch that instead and ignore
 * the embedded list. Same approach useTeamBuilder uses for "my teams". */
export function useUserProfile(userId: number) {
  const { theme, toggle } = useTheme();
  const { user: viewer } = useAuth();
  const [sort, setSort] = useState<ProfileSort>("newest");

  const profileQuery = useQuery({
    queryKey: ["users", userId],
    queryFn: () => apiFetch<ProfileUser>(`/users/${userId}`),
    retry: (failureCount, err) => err instanceof ApiError && err.status === 404 ? false : failureCount < 2,
  });

  const teamsKey = ["teams", "user", userId];
  const teamsQuery = useQuery({
    queryKey: teamsKey,
    queryFn: () =>
      apiFetch<ServerTeam[]>(`/teams?user=${userId}&limit=100`).then((rows) => rows.map(mapServerTeam)),
    enabled: !profileQuery.isError,
  });
  const rawTeams = useMemo(() => teamsQuery.data ?? [], [teamsQuery.data]);

  const teams = useMemo(() => {
    const sorted = [...rawTeams];
    if (sort === "oldest") sorted.reverse(); // server returns newest-first
    else if (sort === "popular") sorted.sort((a, b) => b.likes - a.likes);
    return sorted;
  }, [rawTeams, sort]);

  const stats = useMemo(
    () => ({
      teamsPublished: rawTeams.length,
      likesReceived: rawTeams.reduce((sum, t) => sum + t.likes, 0),
    }),
    [rawTeams],
  );

  const toggleLike = useLikeToggle(teamsKey);
  const onLike = (id: number) => {
    if (!viewer) return;
    toggleLike(rawTeams, id);
  };

  return {
    theme, toggle,
    profile: profileQuery.data ?? null,
    isLoadingProfile: profileQuery.isLoading,
    isProfileError: profileQuery.isError,
    isOwnProfile: viewer != null && viewer.id === userId,
    teams,
    isLoadingTeams: teamsQuery.isLoading,
    sort, setSort,
    stats,
    onLike,
  };
}

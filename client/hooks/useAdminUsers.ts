"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type AdminRole = "user" | "moderator" | "admin";
export type AdminUser = { id: number; username: string; email: string; role: AdminRole; createdAt: string };

const QUERY_KEY = ["admin", "users"];

// `enabled` defaults to true for callers that already know it's safe to
// fire; the admin page passes false until auth has resolved and confirmed
// the viewer is actually an admin, so non-admins (and admins mid-load) never
// issue a request that's guaranteed to 403.
export function useAdminUsers(enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<AdminUser[]>("/users"),
    enabled,
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: AdminRole }) =>
      apiFetch(`/users/${userId}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    updateRole: updateRole.mutateAsync,
  };
}

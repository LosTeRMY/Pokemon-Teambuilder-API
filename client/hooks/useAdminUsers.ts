"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type AdminRole = "user" | "moderator" | "admin";
export type AdminUser = { id: number; username: string; email: string; role: AdminRole; createdAt: string };

const QUERY_KEY = ["admin", "users"];

export function useAdminUsers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<AdminUser[]>("/users"),
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

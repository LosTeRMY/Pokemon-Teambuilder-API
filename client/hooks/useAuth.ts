"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  createdAt: string;
};

const ME_KEY = ["auth", "me"];

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(typeof data?.error === "string" ? data.error : "Request failed");
  }
  return res.json();
}

export function useAuth() {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ME_KEY,
    queryFn: async (): Promise<{ user: AuthUser | null }> => {
      const res = await fetch("/api/auth/me");
      return res.json();
    },
  });

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      postJson<{ user: AuthUser }>("/api/auth/login", data),
    onSuccess: ({ user }) => queryClient.setQueryData(ME_KEY, { user }),
  });

  const registerMutation = useMutation({
    mutationFn: (data: { username: string; email: string; password: string }) =>
      postJson<{ user: AuthUser }>("/api/auth/register", data),
    onSuccess: ({ user }) => queryClient.setQueryData(ME_KEY, { user }),
  });

  const logoutMutation = useMutation({
    mutationFn: () => postJson<{ ok: true }>("/api/auth/logout"),
    onSuccess: () => queryClient.setQueryData(ME_KEY, { user: null }),
  });

  return {
    user: meQuery.data?.user ?? null,
    isLoading: meQuery.isLoading,
    login: loginMutation.mutateAsync,
    loginPending: loginMutation.isPending,
    loginError: loginMutation.error as Error | null,
    register: registerMutation.mutateAsync,
    registerPending: registerMutation.isPending,
    registerError: registerMutation.error as Error | null,
    logout: logoutMutation.mutateAsync,
  };
}

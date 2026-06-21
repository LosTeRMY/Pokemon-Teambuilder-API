"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { mapAnalysis, type RawAnalysis } from "@/lib/analysisMap";
import type { GBPokemon } from "@/lib/gameData";

export type SetFormData = {
  name: string;
  role?: string;
  itemId?: number;
  abilityId?: number;
  natureId?: number;
  evs?: string;
  moves: string[];
  analysis?: string;
  evNote?: string;
  teambuilding?: string;
  matchupNote?: string;
  handles?: number[];
  threats?: number[];
};

export type ProposalFormData = Omit<SetFormData, "name" | "role" | "handles" | "threats"> & {
  targetName: string;
  note: string;
};

export function usePokemonAnalysis(mon: GBPokemon) {
  const queryClient = useQueryClient();
  const queryKey = ["pokemon-analysis", mon.id];

  const query = useQuery({
    queryKey,
    queryFn: () => apiFetch<RawAnalysis | null>(`/pokemon-analyses/${mon.id}`),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const updateOverview = useMutation({
    mutationFn: (data: { role?: string; overview?: string }) =>
      apiFetch(`/pokemon-analyses/${mon.id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const addSet = useMutation({
    mutationFn: (data: SetFormData) =>
      apiFetch(`/pokemon-analyses/${mon.id}/sets`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const editSet = useMutation({
    mutationFn: ({ setId, data }: { setId: number; data: SetFormData }) =>
      apiFetch(`/pokemon-analyses/sets/${setId}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const proposeSet = useMutation({
    mutationFn: (data: ProposalFormData) =>
      apiFetch(`/pokemon-analyses/${mon.id}/proposals`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  // Optimistic, mirroring useLikeToggle — votes are the highest-frequency
  // action here and shouldn't wait on a round trip to feel responsive.
  const vote = useMutation({
    mutationFn: ({ proposalId, voted }: { proposalId: number; voted: boolean }) =>
      apiFetch(`/pokemon-analyses/proposals/${proposalId}/votes`, { method: voted ? "DELETE" : "POST" }),
    onMutate: async ({ proposalId, voted }) => {
      const previous = queryClient.getQueryData<RawAnalysis | null>(queryKey);
      queryClient.setQueryData<RawAnalysis | null>(queryKey, (old) =>
        old && {
          ...old,
          community: {
            ...old.community,
            proposals: old.community.proposals.map((p) =>
              p.id === proposalId
                ? { ...p, hasVoted: !voted, votes: Number(p.votes) + (voted ? -1 : 1) }
                : p,
            ),
          },
        },
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => ctx && queryClient.setQueryData(queryKey, ctx.previous),
    onSettled: invalidate,
  });

  const acceptProposal = useMutation({
    mutationFn: (proposalId: number) =>
      apiFetch(`/pokemon-analyses/proposals/${proposalId}/accept`, { method: "POST" }),
    onSuccess: invalidate,
  });

  const rejectProposal = useMutation({
    mutationFn: (proposalId: number) =>
      apiFetch(`/pokemon-analyses/proposals/${proposalId}/reject`, { method: "POST" }),
    onSuccess: invalidate,
  });

  return {
    raw: query.data ?? null,
    analysis: query.data ? mapAnalysis(query.data, mon) : null,
    isLoading: query.isLoading,
    updateOverview: updateOverview.mutateAsync,
    addSet: addSet.mutateAsync,
    editSet: editSet.mutateAsync,
    proposeSet: proposeSet.mutateAsync,
    vote: vote.mutate,
    acceptProposal: acceptProposal.mutateAsync,
    rejectProposal: rejectProposal.mutateAsync,
  };
}

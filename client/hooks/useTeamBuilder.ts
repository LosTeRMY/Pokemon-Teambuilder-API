"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GAMEDATA } from "@/lib/gameData";
import type { GBPokemon } from "@/lib/gameData";
import {
  type DraftTeam, type DraftMember, type DraftNotes,
  createBlankTeam, createBlankMember, sanitizeTeam,
  loadBuilderState, saveBuilderState,
} from "@/lib/teamBuilder";
import {
  type ServerTeamDetail, type ServerTeamSummary,
  toCreateTeamPayload, fromTeamDetail, fromTeamSummary,
} from "@/lib/teamPublishMap";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch, ApiError } from "@/lib/api";

export type SidebarFilter = "all" | "draft" | "published";
export type ModalKind = "export" | "species" | null;

export function useTeamBuilder() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const loggedIn = !!user;
  const queryClient = useQueryClient();

  const [localTeams, setLocalTeams] = useState<DraftTeam[]>([]);
  const [team, setTeam] = useState<DraftTeam>(createBlankTeam);
  const [dirty, setDirty] = useState(false);

  const [selected, setSelected] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [swapTarget, setSwapTarget] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>("all");
  const [sidebarQuery, setSidebarQuery] = useState("");

  // Load persisted state once on mount.
  useEffect(() => {
    const stored = loadBuilderState();
    if (stored) {
      setLocalTeams(stored.savedTeams.map(sanitizeTeam));
      setTeam(sanitizeTeam(stored.workingTeam));
    }
  }, []);

  // Persist localTeams + the working team together. Skip the very first run
  // (mount) so we don't clobber storage with blank state before the load
  // effect above has a chance to populate it.
  const firstPersist = useRef(true);
  useEffect(() => {
    if (firstPersist.current) {
      firstPersist.current = false;
      return;
    }
    saveBuilderState({ savedTeams: localTeams, workingTeam: team });
  }, [localTeams, team]);

  // Tracked by id rather than message text, so two identical toasts in quick
  // succession (e.g. clicking Save twice) don't have the first one's timer
  // clear the second toast early just because the text matches.
  const toastId = useRef(0);
  const notify = (msg: string) => {
    const id = ++toastId.current;
    setToast(msg);
    setTimeout(() => {
      if (toastId.current === id) setToast(null);
    }, 2600);
  };

  // The "Published" sidebar tab is reconciled from the server rather than
  // trusted purely from localStorage — but a local copy of a published team
  // (e.g. mid-edit) wins over the server's version until the next publish, so
  // in-progress edits survive a refresh without a round trip or flicker.
  const minePublishedQuery = useQuery({
    queryKey: ["teams", "mine", user?.id],
    queryFn: () =>
      apiFetch<ServerTeamSummary[]>(`/teams?user=${user!.id}&limit=100`).then((rows) =>
        rows.map(fromTeamSummary),
      ),
    enabled: !!user,
  });
  const minePublishedData = minePublishedQuery.data;
  const minePublished = minePublishedData ?? [];

  const savedTeams = useMemo(() => {
    const mine = minePublishedData ?? [];
    const drafts = localTeams.filter((t) => !t.published);
    const localPublished = localTeams.filter((t) => t.published && t.serverId != null);
    const reconciled = mine.map(
      (summary) => localPublished.find((t) => t.serverId === summary.serverId) ?? summary,
    );
    // A team that was just published may not be in minePublished yet (the
    // query hasn't refetched) — surface it anyway so it doesn't disappear.
    const knownIds = new Set(reconciled.map((t) => t.serverId));
    const justPublished = localPublished.filter((t) => !knownIds.has(t.serverId));
    return [...drafts, ...reconciled, ...justPublished];
  }, [localTeams, minePublishedData]);

  const newTeam = () => {
    setTeam(createBlankTeam());
    setSelected(null);
    setDirty(false);
  };

  const loadTeam = async (id: string) => {
    const local = localTeams.find((t) => t.id === id);
    if (local) {
      setTeam(local);
      setSelected(null);
      setDirty(false);
      setDrawer(false);
      return;
    }
    // Falls back to a server-only summary — fetch full detail so editing
    // operates on accurate data (nickname/gender/ivs/evs/notes etc., which
    // the lean summary doesn't carry).
    const summary = minePublished.find((t) => t.id === id);
    if (!summary || summary.serverId == null) return;
    try {
      const detail = await apiFetch<ServerTeamDetail>(`/teams/${summary.serverId}`);
      setTeam(fromTeamDetail(detail));
      setSelected(null);
      setDirty(false);
      setDrawer(false);
    } catch {
      notify("Couldn't load that team");
    }
  };

  const saveTeam = () => {
    setLocalTeams((ts) => {
      const exists = ts.some((t) => t.id === team.id);
      return exists ? ts.map((t) => (t.id === team.id ? team : t)) : [...ts, team];
    });
    setDirty(false);
    notify("Team saved");
  };

  const deleteTeam = (id: string) => {
    setLocalTeams((ts) => ts.filter((t) => t.id !== id));
    if (team.id === id) newTeam();
    notify("Team deleted");
  };

  const publishTeam = async () => {
    if (!loggedIn) {
      notify("Log in to publish a team");
      return;
    }
    try {
      const payload = toCreateTeamPayload(team);
      const result =
        team.serverId == null
          ? await apiFetch<{ id: number }>("/teams", { method: "POST", body: JSON.stringify(payload) })
          : await apiFetch<{ id: number }>(`/teams/${team.serverId}`, { method: "PUT", body: JSON.stringify(payload) });

      const published: DraftTeam = { ...team, serverId: team.serverId ?? result.id, published: true };
      setTeam(published);
      setLocalTeams((ts) => {
        const exists = ts.some((t) => t.id === published.id);
        return exists ? ts.map((t) => (t.id === published.id ? published : t)) : [...ts, published];
      });
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["teams", "mine", user?.id] });
      notify("Team published");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Couldn't publish that team");
    }
  };

  const markDirty = () => setDirty(true);

  const updateMember = (i: number, patch: Partial<DraftMember>) => {
    setTeam((t) => ({
      ...t,
      members: t.members.map((m, idx) => (idx === i && m ? { ...m, ...patch } : m)),
    }));
    markDirty();
  };

  const updateNotes = (i: number, notes: DraftNotes) => updateMember(i, { notes });

  const openSpeciesPicker = (slotIndex: number) => {
    setSwapTarget(slotIndex);
    setModal("species");
  };

  const pickSpecies = (pokemon: GBPokemon) => {
    if (swapTarget == null) return;
    const member = createBlankMember(pokemon);
    setTeam((t) => ({
      ...t,
      members: t.members.map((m, idx) => (idx === swapTarget ? member : m)),
    }));
    setSelected(swapTarget);
    setModal(null);
    setSwapTarget(null);
    markDirty();
  };

  const setName = (name: string) => { setTeam((t) => ({ ...t, name })); markDirty(); };
  const setFormat = (formatId: number | null) => { setTeam((t) => ({ ...t, formatId })); markDirty(); };
  const setStrategy = (strategy: string) => { setTeam((t) => ({ ...t, strategy })); markDirty(); };

  const memberCount = useMemo(() => team.members.filter(Boolean).length, [team.members]);

  return {
    theme, toggle,
    savedTeams, team, dirty, memberCount,
    selected, setSelected,
    modal, setModal,
    swapTarget, openSpeciesPicker,
    toast, notify,
    drawer, setDrawer,
    sidebarFilter, setSidebarFilter,
    sidebarQuery, setSidebarQuery,
    formats: GAMEDATA.formats,
    newTeam, loadTeam, saveTeam, deleteTeam, publishTeam,
    updateMember, updateNotes, pickSpecies,
    setName, setFormat, setStrategy,
  };
}

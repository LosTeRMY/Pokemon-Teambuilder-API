"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { GAMEDATA } from "@/lib/gameData";
import type { GBPokemon } from "@/lib/gameData";
import {
  type DraftTeam, type DraftMember, type DraftNotes,
  createBlankTeam, createBlankMember,
  loadBuilderState, saveBuilderState,
} from "@/lib/teamBuilder";
import { useTheme } from "@/hooks/useTheme";

export type SidebarFilter = "all" | "draft" | "published";
export type ModalKind = "export" | "species" | null;

export function useTeamBuilder() {
  const { theme, toggle } = useTheme();

  const [savedTeams, setSavedTeams] = useState<DraftTeam[]>([]);
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
      setSavedTeams(stored.savedTeams);
      setTeam(stored.workingTeam);
    }
  }, []);

  // Persist savedTeams + the working team together. Skip the very first run
  // (mount) so we don't clobber storage with blank state before the load
  // effect above has a chance to populate it.
  const firstPersist = useRef(true);
  useEffect(() => {
    if (firstPersist.current) {
      firstPersist.current = false;
      return;
    }
    saveBuilderState({ savedTeams, workingTeam: team });
  }, [savedTeams, team]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 2600);
  };

  const newTeam = () => {
    setTeam(createBlankTeam());
    setSelected(null);
    setDirty(false);
  };

  const loadTeam = (id: string) => {
    const found = savedTeams.find((t) => t.id === id);
    if (!found) return;
    setTeam(found);
    setSelected(null);
    setDirty(false);
    setDrawer(false);
  };

  const saveTeam = () => {
    setSavedTeams((ts) => {
      const exists = ts.some((t) => t.id === team.id);
      return exists ? ts.map((t) => (t.id === team.id ? team : t)) : [...ts, team];
    });
    setDirty(false);
    notify("Team saved");
  };

  const deleteTeam = (id: string) => {
    setSavedTeams((ts) => ts.filter((t) => t.id !== id));
    if (team.id === id) newTeam();
    notify("Team deleted");
  };

  const publishTeam = () => {
    // Local-only stub for now — no backend yet (see root CLAUDE.md draft/publish
    // flow). Real publish will be a POST /teams call once the API is wired up.
    setTeam((t) => ({ ...t, published: true }));
    setSavedTeams((ts) =>
      ts.map((t) => (t.id === team.id ? { ...t, published: true } : t)),
    );
    notify("Team published");
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

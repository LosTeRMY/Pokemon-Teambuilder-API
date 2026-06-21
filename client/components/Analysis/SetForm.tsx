"use client";

import { useState } from "react";
import * as LK from "@/lib/lookups";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import type { SetFormData, ProposalFormData } from "@/hooks/usePokemonAnalysis";

type FormValues = {
  name: string; // doubles as targetName in proposal mode
  role: string;
  note: string; // proposal mode only
  itemId: string;
  abilityId: string;
  natureId: string;
  evs: string;
  moves: [string, string, string, string];
  analysis: string;
  evNote: string;
  teambuilding: string;
  matchupNote: string;
};

const EMPTY: FormValues = {
  name: "", role: "", note: "", itemId: "", abilityId: "", natureId: "", evs: "",
  moves: ["", "", "", ""], analysis: "", evNote: "", teambuilding: "", matchupNote: "",
};

function toSetFormData(v: FormValues): SetFormData {
  const moves = v.moves.map((m) => m.trim()).filter(Boolean);
  return {
    name: v.name.trim(),
    role: v.role.trim() || undefined,
    itemId: v.itemId ? Number(v.itemId) : undefined,
    abilityId: v.abilityId ? Number(v.abilityId) : undefined,
    natureId: v.natureId ? Number(v.natureId) : undefined,
    evs: v.evs.trim() || undefined,
    moves,
    analysis: v.analysis.trim() || undefined,
    evNote: v.evNote.trim() || undefined,
    teambuilding: v.teambuilding.trim() || undefined,
    matchupNote: v.matchupNote.trim() || undefined,
  };
}

// Shared by "Add a set", "Edit set", and "Suggest a set" — a proposal is the
// same build fields plus a target name + required note, reviewed by a
// moderator before becoming a real set (see usePokemonAnalysis.ts).
export default function SetForm({
  mode,
  initial,
  onSubmit,
  onCancel,
}: {
  mode: "set" | "proposal";
  initial?: Partial<FormValues>;
  onSubmit: (data: SetFormData | ProposalFormData) => Promise<unknown>;
  onCancel: () => void;
}) {
  const [v, setV] = useState<FormValues>({ ...EMPTY, ...initial });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setV((old) => ({ ...old, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const moves = v.moves.map((m) => m.trim()).filter(Boolean);
    if (!v.name.trim()) return setError(mode === "proposal" ? "A target name is required." : "A set name is required.");
    if (moves.length === 0) return setError("At least one move is required.");
    if (mode === "proposal" && !v.note.trim()) return setError("A note explaining the proposal is required.");

    setPending(true);
    setError(null);
    try {
      const { itemId, abilityId, natureId, evs, moves: builtMoves, analysis, evNote, teambuilding, matchupNote } = toSetFormData(v);
      if (mode === "proposal") {
        await onSubmit({
          itemId, abilityId, natureId, evs, moves: builtMoves, analysis, evNote, teambuilding, matchupNote,
          targetName: v.name.trim(), note: v.note.trim(),
        } as ProposalFormData);
      } else {
        await onSubmit({ itemId, abilityId, natureId, evs, moves: builtMoves, analysis, evNote, teambuilding, matchupNote, name: v.name.trim(), role: v.role.trim() || undefined });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(false);
      return;
    }
    setPending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 px-6 py-5.5 overflow-y-auto">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.25">
          <Label>{mode === "proposal" ? "Target set name" : "Set name"}</Label>
          <Input value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Choice Specs" />
        </div>
        {mode === "set" && (
          <div className="flex flex-col gap-1.25">
            <Label>Role (optional)</Label>
            <Input value={v.role} onChange={(e) => set("role", e.target.value)} placeholder="e.g. Wallbreaker" />
          </div>
        )}
      </div>

      {mode === "proposal" && (
        <div className="flex flex-col gap-1.25">
          <Label>Note</Label>
          <textarea
            className="w-full px-3.25 py-2.75 border border-line rounded-[9px] text-[14.5px] font-[inherit] text-ink bg-input-bg focus:outline-none focus:border-accent focus:bg-surface focus:shadow-[0_0_0_3px_var(--accent-soft)] resize-y min-h-20"
            value={v.note}
            onChange={(e) => set("note", e.target.value)}
            placeholder="Why should this be added?"
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.25">
          <Label>Item</Label>
          <select className="w-full px-3 py-2.75 border border-line rounded-[9px] text-[13.5px] bg-input-bg" value={v.itemId} onChange={(e) => set("itemId", e.target.value)}>
            <option value="">—</option>
            {LK.opts.items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.25">
          <Label>Ability</Label>
          <select className="w-full px-3 py-2.75 border border-line rounded-[9px] text-[13.5px] bg-input-bg" value={v.abilityId} onChange={(e) => set("abilityId", e.target.value)}>
            <option value="">—</option>
            {LK.opts.abilities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.25">
          <Label>Nature</Label>
          <select className="w-full px-3 py-2.75 border border-line rounded-[9px] text-[13.5px] bg-input-bg" value={v.natureId} onChange={(e) => set("natureId", e.target.value)}>
            <option value="">—</option>
            {LK.opts.natures.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.25">
        <Label>EVs</Label>
        <Input value={v.evs} onChange={(e) => set("evs", e.target.value)} placeholder="e.g. 4 HP / 252 Atk / 252 Spe" />
      </div>

      <div className="flex flex-col gap-1.25">
        <Label>Moves</Label>
        <div className="grid grid-cols-2 gap-2">
          {v.moves.map((m, i) => (
            <Input
              key={i}
              value={m}
              onChange={(e) => set("moves", v.moves.map((x, j) => (j === i ? e.target.value : x)) as FormValues["moves"])}
              placeholder={`Move ${i + 1}${i === 3 ? " (or \"X / Y\" for alternatives)" : ""}`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.25">
        <Label>Analysis</Label>
        <textarea className="w-full px-3.25 py-2.75 border border-line rounded-[9px] text-[14px] font-[inherit] text-ink bg-input-bg resize-y min-h-24" value={v.analysis} onChange={(e) => set("analysis", e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.25">
        <Label>EV spread breakdown (optional)</Label>
        <textarea className="w-full px-3.25 py-2.75 border border-line rounded-[9px] text-[14px] font-[inherit] text-ink bg-input-bg resize-y min-h-16" value={v.evNote} onChange={(e) => set("evNote", e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.25">
        <Label>Teambuilding (optional)</Label>
        <textarea className="w-full px-3.25 py-2.75 border border-line rounded-[9px] text-[14px] font-[inherit] text-ink bg-input-bg resize-y min-h-16" value={v.teambuilding} onChange={(e) => set("teambuilding", e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.25">
        <Label>Matchups (optional)</Label>
        <textarea className="w-full px-3.25 py-2.75 border border-line rounded-[9px] text-[14px] font-[inherit] text-ink bg-input-bg resize-y min-h-16" value={v.matchupNote} onChange={(e) => set("matchupNote", e.target.value)} />
      </div>

      {error && <p className="text-[13px] text-like-fg m-0">{error}</p>}

      <div className="flex justify-end gap-2.5 pt-1">
        <button type="button" className="border border-line bg-surface text-muted text-[13.5px] font-bold px-4 py-2.25 rounded-[9px]" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" disabled={pending} className="border-0 bg-accent text-white text-[13.5px] font-bold px-4 py-2.25 rounded-[9px] disabled:opacity-60">
          {pending ? "Saving…" : mode === "proposal" ? "Submit proposal" : "Save set"}
        </button>
      </div>
    </form>
  );
}

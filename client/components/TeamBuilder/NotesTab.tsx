"use client";

import { ROLES, type DraftNotes } from "@/lib/teamBuilder";
import { cn } from "@/lib/cn";

export default function NotesTab({
  speciesName,
  notes,
  onChange,
}: {
  speciesName: string;
  notes: DraftNotes;
  onChange: (notes: DraftNotes) => void;
}) {
  const toggleRole = (role: string) => {
    const roles = notes.roles.includes(role)
      ? notes.roles.filter((r) => r !== role)
      : [...notes.roles, role];
    onChange({ ...notes, roles });
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2.5 flex-wrap px-5.5 py-2.75 border-b border-line-soft">
        <span className="text-[10px] font-extrabold tracking-[0.07em] uppercase text-faint whitespace-nowrap shrink-0">Role</span>
        <div className="flex flex-wrap gap-1.75">
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              className={cn(
                "text-[12px] font-bold rounded-full px-3.25 py-1.5 transition-all duration-120 border",
                notes.roles.includes(role)
                  ? "bg-accent border-accent text-white"
                  : "text-muted bg-surface-2 border-line hover:border-accent hover:text-accent",
              )}
              onClick={() => toggleRole(role)}
            >
              {role}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col px-5.5 pt-3.5 pb-5.5">
        <textarea
          placeholder={`What this ${speciesName} does — EV reasoning, move choices, matchups, synergy, alternatives…`}
          value={notes.text}
          onChange={(e) => onChange({ ...notes, text: e.target.value })}
          className="w-full min-h-27.5 max-h-50 resize-y text-[13.5px] leading-[1.65] text-ink bg-input-bg border border-line rounded-[11px] px-3.75 py-3.25 placeholder:text-faint focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)] focus:bg-surface"
        />
      </div>
    </div>
  );
}

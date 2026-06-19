"use client";

export default function AddTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="group flex items-center justify-center gap-2.25 min-h-16 border-[1.5px] border-dashed border-line rounded-[11px] bg-surface-2 text-faint text-[13px] font-bold transition-all duration-140 hover:text-accent hover:border-accent hover:bg-accent-soft"
      onClick={onClick}
    >
      <span className="w-6.5 h-6.5 rounded-full grid place-items-center bg-surface border border-line group-hover:border-accent">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
      </span>
      Add a Pokémon
    </button>
  );
}

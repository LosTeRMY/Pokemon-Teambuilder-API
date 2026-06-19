"use client";

import { useState } from "react";
import { exportShowdown, type DraftTeam } from "@/lib/teamBuilder";
import { fmtName } from "@/lib/browserUtils";

export default function ExportModal({
  team,
  onClose,
  notify,
}: {
  team: DraftTeam;
  onClose: () => void;
  notify: (msg: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const text = exportShowdown(team);

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
      notify("Copied — paste into Showdown");
    }).catch(() => {});
  };

  const download = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (team.name || "team").replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".txt";
    a.click();
    notify("Downloaded " + a.download);
  };

  const memberCount = team.members.filter(Boolean).length;

  return (
    <>
      <div className="flex items-center gap-3 px-5.5 py-4.5 border-b border-line">
        <div className="flex-1">
          <h3 className="text-[18px] font-extrabold tracking-[-0.01em] m-0">Export to Showdown</h3>
          <span className="text-[12.5px] text-muted font-medium">Paste straight into the team importer.</span>
        </div>
        <button
          className="w-8.5 h-8.5 grid place-items-center rounded-lg bg-surface border border-line text-muted hover:text-ink hover:border-muted"
          onClick={onClose}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="px-5.5 py-5 overflow-y-auto">
        <textarea
          readOnly
          value={text}
          onFocus={(e) => e.target.select()}
          className="w-full min-h-80 resize-y font-mono text-[12.5px] leading-[1.55] text-ink bg-input-bg border border-line rounded-[10px] px-4 py-3.5 whitespace-pre focus:outline-none focus:border-accent"
        />
      </div>
      <div className="flex items-center justify-between gap-3 px-5.5 py-3.5 border-t border-line">
        <span className="text-[12px] text-faint">
          {memberCount} Pokémon · {fmtName(team.formatId ?? -1)}
        </span>
        <div className="flex gap-2.25">
          <button
            className="inline-flex items-center gap-1.75 whitespace-nowrap bg-surface border border-line rounded-[9px] px-3.5 py-2.25 text-[13.5px] font-bold text-ink hover:border-muted hover:bg-surface-2"
            onClick={download}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Download .txt
          </button>
          <button
            className="inline-flex items-center gap-1.75 whitespace-nowrap bg-accent text-white border border-accent rounded-[9px] px-3.5 py-2.25 text-[13.5px] font-bold hover:brightness-[1.07]"
            onClick={copy}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            {copied ? "Copied!" : "Copy team"}
          </button>
        </div>
      </div>
    </>
  );
}

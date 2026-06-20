export default function ProfileStats({
  teamsPublished,
  likesReceived,
}: {
  teamsPublished: number;
  likesReceived: number;
}) {
  const rows: { label: string; value: number; caption?: string }[] = [
    { label: "Teams published", value: teamsPublished },
    { label: "Likes received", value: likesReceived },
    // Static placeholder — no wiki-edit tracking exists yet; see CLAUDE.md "Current Limitations"
    { label: "Pokédex pages", value: 28, caption: "142 edits" },
  ];
  return (
    <div className="bg-surface border border-line rounded-(--radius) p-5 flex flex-col gap-3.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="text-[22px] font-extrabold tracking-[-0.02em] font-mono tabular-nums w-12 shrink-0">
            {r.value}
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold text-muted">{r.label}</span>
            {r.caption && <span className="text-[11px] text-faint font-mono">{r.caption}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

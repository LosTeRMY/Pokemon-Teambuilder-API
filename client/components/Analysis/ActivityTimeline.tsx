import { avatarColor } from "@/lib/browserUtils";
import type { Revision } from "@/app/pokedex/[slug]/data";
import { cn } from "@/lib/cn";

function StatusPill({ status }: { status: Revision["status"] }) {
  const map = {
    merged: { t: "Merged", c: "var(--ok)" },
    review: { t: "In review", c: "var(--warn)" },
  } as const;
  const s = map[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11.5px] font-bold whitespace-nowrap rounded-full px-2.75 py-1"
      style={{
        color: s.c,
        background: `color-mix(in srgb, ${s.c} 12%, var(--surface))`,
        border: `1px solid color-mix(in srgb, ${s.c} 26%, var(--surface))`,
      }}
    >
      <i className="w-1.5 h-1.5 rounded-full" style={{ background: s.c }} />
      {s.t}
    </span>
  );
}

export default function ActivityTimeline({
  revisions,
}: {
  revisions: Revision[];
}) {
  return (
    <section className="flex flex-col bg-surface border border-line rounded-2xl p-5">
      <div className="flex items-center gap-2.25 mb-4">
        <span className="flex-none w-6.5 h-6.5 rounded-lg grid place-items-center bg-ok-soft text-ok">
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 8v4l3 2" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </span>
        <h3 className="text-[14.5px] font-extrabold tracking-[-0.01em] m-0">
          Recent activity
        </h3>
      </div>
      <ul className="list-none m-0 p-0 flex flex-col">
        {revisions.map((r, i) => (
          <li
            key={i}
            className={cn(
              "flex gap-3 pb-4 relative",
              i === revisions.length - 1 && "pb-0",
            )}
          >
            {/* connecting line down to the next dot; the last item has none */}
            {i !== revisions.length - 1 && (
              <span className="absolute left-1.25 top-3.75 bottom-0 w-px bg-line" />
            )}
            <span
              className={cn(
                "flex-none w-3 h-3 rounded-full mt-0.5 border-2 border-surface relative z-1",
                r.status === "merged" ? "bg-ok" : "bg-warn",
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.75 flex-wrap">
                <span
                  className={cn(
                    "flex-none w-5.5 h-5.5 rounded-full text-white grid place-items-center font-bold text-[11px]",
                    r.ai && "bg-ai",
                  )}
                  style={
                    !r.ai ? { background: avatarColor(r.author) } : undefined
                  }
                >
                  {r.ai ? "✦" : r.author[0].toUpperCase()}
                </span>
                <b className="text-[12.5px] font-bold">{r.author}</b>
                <StatusPill status={r.status} />
                <span className="ml-auto text-[11px] text-faint">{r.when}</span>
              </div>
              <p className="an-prose m-0 mt-1.25 text-[12.5px] leading-[1.45] text-muted">
                {r.summary}{" "}
                <span className="text-[11px] font-bold text-accent">
                  · {r.target}
                </span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

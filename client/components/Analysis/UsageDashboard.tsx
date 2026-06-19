import * as LK from "@/lib/lookups";
import { tc } from "@/lib/browserUtils";
import { PokeToken } from "@/components/ui/PokeToken";
import type { Usage, UsageRow } from "@/app/pokedex/[slug]/data";

// One labeled bar row, reused across every card below (abilities/items/moves/teammates).
// `max` is the highest pct in that card's own list, so the longest bar always
// fills the track — bars are relative within a card, not against 100%.
function URow({ lead, name, pct, max, color }: { lead?: React.ReactNode; name: string; pct: number; max: number; color?: string }) {
  const w = Math.max(3, (pct / max) * 100);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(56px,1fr)_48px] items-center gap-2.75 py-1.25">
      <div className="flex items-center gap-2 min-w-0">
        {lead}
        <span className="text-[12.5px] font-medium whitespace-nowrap overflow-hidden text-ellipsis" title={name}>{name}</span>
      </div>
      <span className="h-1.5 rounded bg-surface-2 overflow-hidden shadow-[inset_0_0_0_1px_var(--line-soft)]">
        <i className="block h-full rounded transition-[width] duration-500" style={{ width: `${w}%`, background: color || "var(--bar)" }} />
      </span>
      <span className="font-mono text-[11.5px] font-semibold text-faint text-right">{pct.toFixed(1)}%</span>
    </div>
  );
}

function TPill({ type }: { type: string }) {
  return (
    <span className="flex-none text-[9.5px] font-bold capitalize px-1.75 py-0.5 rounded" style={{ background: `color-mix(in srgb, ${tc(type)} 16%, var(--surface))`, color: `color-mix(in srgb, ${tc(type)} 64%, var(--ink))` }}>
      {type}
    </span>
  );
}

function Card({ area, children }: { area?: string; children: React.ReactNode }) {
  return <section className={`flex flex-col bg-surface border border-line rounded-2xl px-5 py-4.5 ${area || ""}`}>{children}</section>;
}

const maxOf = (rows: { pct: number }[]) => Math.max(...rows.map((r) => r.pct));

// Plain 4-column grid with the wide Moves/Teammates cards spanning 2 — auto-flow
// places them last on row 2, which reproduces the original named grid-template-areas
// layout without needing one.
export default function UsageDashboard({ usage }: { usage: Usage }) {
  const itemsMax = maxOf(usage.items);
  const movesMax = maxOf(usage.moves);
  const matesMax = maxOf(usage.teammates);
  const spreadMax = Math.max(...usage.spreads.map((s) => s.pct));

  return (
    <div className="grid grid-cols-4 gap-4 max-[1080px]:grid-cols-2 max-[560px]:grid-cols-1">
      <Card>
        <div className="text-[11px] font-bold tracking-widest uppercase text-faint mb-3.5">Usage</div>
        <div className="flex items-baseline gap-0.75 mb-2.75">
          <b className="font-mono text-[40px] font-extrabold tracking-[-0.03em] leading-none">{usage.rate.toFixed(1)}</b>
          <span className="text-[18px] font-bold text-faint">%</span>
        </div>
        <div className="h-2 rounded bg-surface-2 shadow-[inset_0_0_0_1px_var(--line-soft)] overflow-hidden mb-2.75">
          <i className="block h-full rounded bg-bar" style={{ width: `${usage.rate}%` }} />
        </div>
        <p className="an-prose m-0 text-[12.5px] leading-normal text-muted">{usage.blurb}</p>
      </Card>

      <Card>
        <div className="text-[11px] font-bold tracking-widest uppercase text-faint mb-3.5">Abilities</div>
        <div className="flex flex-col gap-0.5">
          {usage.abilities.map((a: UsageRow) => <URow key={a.name} name={a.name} pct={a.pct} max={100} color="var(--accent)" />)}
        </div>
      </Card>

      <Card>
        <div className="text-[11px] font-bold tracking-widest uppercase text-faint mb-3.5">
          Items <span className="font-mono text-[10px] font-bold bg-accent text-white rounded-full px-1.75 py-px">{usage.items.length}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          {usage.items.map((it: UsageRow) => <URow key={it.name} name={it.name} pct={it.pct} max={itemsMax} />)}
        </div>
      </Card>

      <Card>
        <div className="text-[11px] font-bold tracking-widest uppercase text-faint mb-3.5">EV spreads</div>
        <div className="flex flex-col gap-2.75">
          {usage.spreads.map((sp) => (
            <div key={sp.spread} className="flex flex-col gap-1.25">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[10.5px] font-semibold">{sp.spread}</span>
                <span className="text-[10.5px] font-semibold text-faint flex-none">{sp.pct.toFixed(1)}%</span>
              </div>
              <span className="h-1.5 rounded bg-surface-2 shadow-[inset_0_0_0_1px_var(--line-soft)] overflow-hidden">
                <i className="block h-full rounded bg-bar" style={{ width: `${Math.max(3, (sp.pct / spreadMax) * 100)}%` }} />
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card area="col-span-2 max-[560px]:col-span-1">
        <div className="text-[11px] font-bold tracking-widest uppercase text-faint mb-3.5">
          Moves <span className="font-mono text-[10px] font-bold bg-accent text-white rounded-full px-1.75 py-px">{usage.moves.length}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-6.5 max-[560px]:grid-cols-1">
          {usage.moves.map((mv: UsageRow) => (
            <URow key={mv.name} name={mv.name} pct={mv.pct} max={movesMax} color={tc(mv.type || "")} lead={<TPill type={mv.type || ""} />} />
          ))}
        </div>
      </Card>

      <Card area="col-span-2 max-[560px]:col-span-1">
        <div className="text-[11px] font-bold tracking-widest uppercase text-faint mb-3.5">
          Top teammates <span className="font-mono text-[10px] font-bold bg-accent text-white rounded-full px-1.75 py-px">{usage.teammates.length}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-6.5 max-[560px]:grid-cols-1">
          {usage.teammates.map((tm: UsageRow) => {
            const pid = tm.slug ? LK.pokeBySlug.get(tm.slug)?.id ?? -1 : -1;
            return <URow key={tm.name} name={tm.name} pct={tm.pct} max={matesMax} lead={<PokeToken pid={pid} size={26} />} />;
          })}
        </div>
      </Card>
    </div>
  );
}

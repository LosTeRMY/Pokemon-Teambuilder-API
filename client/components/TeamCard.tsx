import type { TeamListItem, Format } from "@/types";

const FORMAT_BADGE: Record<string, string> = {
  ubers: "bg-purple-100 text-purple-700",
  ou:    "bg-teal-100 text-teal-700",
  uu:    "bg-orange-100 text-orange-700",
  nu:    "bg-red-100 text-red-700",
  pu:    "bg-gray-100 text-gray-600",
  lc:    "bg-green-100 text-green-700",
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

type Props = {
  team: TeamListItem;
  format: Format | undefined;
  author?: { username: string; avatarColor: string };
};

export default function TeamCard({ team, format, author }: Props) {
  const tier = format?.tier ?? "ou";
  const badgeClass = FORMAT_BADGE[tier] ?? FORMAT_BADGE.ou;

  return (
    <article className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 hover:border-blue-300 hover:shadow-sm transition-all">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold uppercase ${badgeClass}`}>
            {format?.name ?? tier.toUpperCase()}
          </span>
          <h2 className="font-semibold text-gray-900 truncate">{team.name}</h2>
        </div>
        <button
          aria-label={team.liked ? "Unlike" : "Like"}
          className="flex items-center gap-1 shrink-0 text-sm font-medium"
        >
          {team.liked ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          )}
          <span className={team.liked ? "text-red-500" : "text-gray-400"}>{team.likes_count}</span>
        </button>
      </div>

      {/* Description */}
      {team.description && (
        <p className="text-sm text-gray-500 line-clamp-2">{team.description}</p>
      )}

      {/* Pokémon sprites */}
      {team.pokemons && (
        <div className="flex gap-2">
          {team.pokemons.map((p) => (
            <div
              key={p.id}
              className="w-14 h-14 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center"
            >
              {/* Placeholder — replace with real sprite when hosting is decided */}
              <div className="w-10 h-10 rounded-full bg-gray-200" />
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 mt-auto">
        <div className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${author?.avatarColor ?? "bg-gray-400"}`}>
          {(author?.username ?? "?")[0].toUpperCase()}
        </div>
        <span className="text-xs text-gray-500">
          {author?.username ?? "Deleted user"}
        </span>
        <span className="text-xs text-gray-400">{timeAgo(team.createdAt)}</span>
      </div>
    </article>
  );
}

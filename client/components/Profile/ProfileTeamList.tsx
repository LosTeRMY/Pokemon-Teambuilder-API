"use client";

import Link from "next/link";
import type { BrowserTeam } from "@/lib/lookups";
import type { ProfileSort } from "@/hooks/useUserProfile";
import ProfileTeamRow from "./ProfileTeamRow";

export default function ProfileTeamList({
  teams,
  sort,
  setSort,
  onLike,
  isOwnProfile,
}: {
  teams: BrowserTeam[];
  sort: ProfileSort;
  setSort: (s: ProfileSort) => void;
  onLike: (id: number) => void;
  isOwnProfile: boolean;
}) {
  return (
    <div>
      {/* Heading + sort sit on the page background, not inside the card below —
          mirrors TeamDisplay's "Community teams" header on the team browser. */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-[20px] font-extrabold tracking-[-0.01em] m-0 flex items-baseline gap-2">
          Published teams
          <span className="text-[13px] text-faint font-mono tabular-nums font-normal">{teams.length}</span>
        </h2>
        {teams.length > 0 && (
          <div className="sort flex items-center gap-1.75">
            <label className="font-mono tabular-nums">SORT</label>
            <select value={sort} onChange={(e) => setSort(e.target.value as ProfileSort)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="popular">Most liked</option>
            </select>
          </div>
        )}
      </div>

      <section className="bg-surface border border-line rounded-(--radius) px-6">
        {teams.length === 0 ? (
          <div className="text-center px-5 py-12 text-muted flex flex-col items-center gap-3">
            <p className="m-0 text-[14px]">
              {isOwnProfile ? "You haven't published any teams yet." : "No teams published yet."}
            </p>
            {isOwnProfile && (
              <Link
                href="/builder"
                className="bg-accent text-white border-none whitespace-nowrap text-[14px] font-bold px-4 py-2.25 rounded-[10px] transition-[filter] duration-150 hover:brightness-[1.07]"
              >
                Build a team
              </Link>
            )}
          </div>
        ) : (
          teams.map((team) => <ProfileTeamRow key={team.id} team={team} onLike={onLike} />)
        )}
      </section>
    </div>
  );
}

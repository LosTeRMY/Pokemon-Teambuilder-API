"use client";

import Link from "next/link";
import type { ProfileUser } from "@/hooks/useUserProfile";
import Avatar from "@/components/ui/Avatar";
import { memberSince } from "@/lib/browserUtils";

export default function ProfileHeader({
  profile,
  isOwnProfile,
}: {
  profile: ProfileUser;
  isOwnProfile: boolean;
}) {
  return (
    <div className="bg-surface border border-line rounded-(--radius) p-6 flex flex-col items-center text-center gap-3.5">
      <Avatar name={profile.username} src={profile.avatar} size={96} className="text-[34px]" />
      <div className="flex items-center gap-2">
        <h1 className="text-[21px] font-extrabold tracking-[-0.01em] m-0">{profile.username}</h1>
        {/* Static placeholder — no account-tier concept exists yet; see CLAUDE.md "Current Limitations" */}
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-faint bg-surface-2 border border-line rounded-full px-2.25 py-1">
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          permanent
        </span>
      </div>
      {profile.bio && <p className="text-[13.5px] text-muted leading-[1.5] m-0">{profile.bio}</p>}
      <span className="inline-flex items-center gap-1.5 text-[12px] text-faint">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        Member since {memberSince(profile.createdAt)}
      </span>
      {isOwnProfile && (
        <Link
          href="/profile/settings"
          className="w-full mt-1 inline-flex items-center justify-center gap-1.75 bg-surface border border-line rounded-[9px] px-3.5 py-2.25 text-[13.5px] font-bold text-ink hover:border-muted hover:bg-surface-2"
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
          </svg>
          Edit profile
        </Link>
      )}
    </div>
  );
}

"use client";

import { useParams, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProfileHeader from "@/components/Profile/ProfileHeader";
import ProfileStats from "@/components/Profile/ProfileStats";
import ProfileTeamList from "@/components/Profile/ProfileTeamList";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id, 10);
  if (!Number.isInteger(userId) || userId <= 0) notFound();

  const {
    theme, toggle,
    profile, isLoadingProfile, isProfileError, isOwnProfile,
    teams, sort, setSort, stats, onLike,
  } = useUserProfile(userId);

  return (
    <div>
      <Navbar theme={theme} onThemeToggle={toggle} />
      <main className="max-w-400 mx-auto px-10 pt-7.5 pb-22.5 max-[900px]:px-4 max-[900px]:pt-4.5">
        {isLoadingProfile ? (
          <p className="text-center text-muted py-20">Loading profile…</p>
        ) : isProfileError || !profile ? (
          <div className="text-center px-5 py-20 text-muted flex flex-col items-center gap-2">
            <p className="m-0 text-[15px] font-semibold text-ink">User not found</p>
            <p className="m-0 text-[13px] text-faint">This account may have been deleted.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[336px_minmax(0,1fr)] gap-7 items-start max-[760px]:grid-cols-1">
            <div className="flex flex-col gap-4 max-[760px]:order-2">
              <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />
              <ProfileStats teamsPublished={stats.teamsPublished} likesReceived={stats.likesReceived} />
            </div>
            <div className="max-[760px]:order-1">
              <ProfileTeamList
                teams={teams}
                sort={sort}
                setSort={setSort}
                onLike={onLike}
                isOwnProfile={isOwnProfile}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

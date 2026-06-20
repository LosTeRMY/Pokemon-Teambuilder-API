"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/ui/Avatar";
import Toast from "@/components/ui/Toast";
import ProfileForm from "@/components/Profile/ProfileForm";
import EmailForm from "@/components/Profile/EmailForm";
import PasswordForm from "@/components/Profile/PasswordForm";
import { useAccountSettings } from "@/hooks/useAccountSettings";
import { useAuth } from "@/hooks/useAuth";
import { memberSince } from "@/lib/browserUtils";

export default function AccountSettingsPage() {
  const { isLoading: authLoading } = useAuth();
  const router = useRouter();
  const {
    theme, toggle, user,
    toast,
    avatarUrl, setAvatarUrl, bio, setBio, clearAvatar,
    profilePending, profileError, saveProfile,
    email, setEmail, emailCurrentPassword, setEmailCurrentPassword,
    emailPending, emailError, updateEmail,
    newPassword, setNewPassword, confirmPassword, setConfirmPassword,
    passwordCurrentPassword, setPasswordCurrentPassword,
    passwordPending, passwordError, changePassword,
  } = useAccountSettings();

  // Settings is an own-account-only page — bounce signed-out visitors to
  // login rather than rendering forms that'll just 401 on submit.
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div>
        <Navbar theme={theme} onThemeToggle={toggle} />
        <p className="text-center text-muted py-20">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar theme={theme} onThemeToggle={toggle} />
      <main className="max-w-400 mx-auto px-28 pt-7.5 pb-22.5 max-[1100px]:px-12 max-[900px]:px-4 max-[900px]:pt-4.5">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <nav className="text-[13px] font-semibold text-faint mb-1.5">
              <Link href={`/profile/${user.id}`} className="text-accent">Profile</Link>
              {" / "}Settings
            </nav>
            <h1 className="text-[27px] font-extrabold tracking-[-0.02em] m-0">Account settings</h1>
          </div>
          <div className="flex items-center gap-3 bg-surface border border-line rounded-(--radius) px-4 py-3">
            <Avatar name={user.username} src={user.avatar} size={44} />
            <div className="flex flex-col leading-tight">
              <span className="flex items-center gap-1.5 text-[14px] font-bold">
                {user.username}
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-faint bg-surface-2 border border-line rounded-full px-1.75 py-0.5">
                  <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                  permanent
                </span>
              </span>
              <span className="text-[12px] text-faint">Member since {memberSince(user.createdAt)}</span>
            </div>
            <Link href={`/profile/${user.id}`} className="text-[13px] font-bold text-accent whitespace-nowrap ml-2">
              View profile →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 items-start max-[820px]:grid-cols-1">
          <ProfileForm
            username={user.username}
            avatarUrl={avatarUrl}
            setAvatarUrl={setAvatarUrl}
            clearAvatar={clearAvatar}
            bio={bio}
            setBio={setBio}
            pending={profilePending}
            error={profileError}
            onSubmit={saveProfile}
          />
          <div className="flex flex-col gap-5">
            <EmailForm
              email={email}
              setEmail={setEmail}
              currentPassword={emailCurrentPassword}
              setCurrentPassword={setEmailCurrentPassword}
              pending={emailPending}
              error={emailError}
              onSubmit={updateEmail}
            />
            <PasswordForm
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              currentPassword={passwordCurrentPassword}
              setCurrentPassword={setPasswordCurrentPassword}
              pending={passwordPending}
              error={passwordError}
              onSubmit={changePassword}
            />
          </div>
        </div>
      </main>

      <Toast message={toast} />
    </div>
  );
}

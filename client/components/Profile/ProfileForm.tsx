"use client";

import type { FormEvent } from "react";
import Avatar from "@/components/ui/Avatar";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";

const BIO_MAX = 255;

export default function ProfileForm({
  username,
  avatarUrl,
  setAvatarUrl,
  clearAvatar,
  bio,
  setBio,
  pending,
  error,
  onSubmit,
}: {
  username: string;
  avatarUrl: string;
  setAvatarUrl: (v: string) => void;
  clearAvatar: () => void;
  bio: string;
  setBio: (v: string) => void;
  pending: boolean;
  error: string | null;
  onSubmit: (e: FormEvent) => void;
}) {
  const remaining = BIO_MAX - bio.length;
  return (
    <form onSubmit={onSubmit} className="bg-surface border border-line rounded-(--radius) p-6 flex flex-col gap-4.5">
      <div>
        <h2 className="text-[17px] font-extrabold tracking-[-0.01em] m-0">Profile</h2>
        <p className="text-[13px] text-muted m-0 mt-1">
          Your public avatar and bio, shown on your profile and next to your teams.
        </p>
      </div>

      <div className="flex items-start gap-3.5">
        <Avatar name={username} src={avatarUrl || null} size={56} />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="avatarUrl">Avatar image URL</Label>
            <span className="text-[11px] text-faint whitespace-nowrap">externally hosted — not an upload</span>
          </div>
          <Input
            id="avatarUrl"
            type="url"
            placeholder="https://…"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[11.5px] text-faint">Paste a link to a hosted image. Leave empty to use your initial.</span>
            {avatarUrl && (
              <button type="button" onClick={clearAvatar} className="text-[12px] font-bold text-accent shrink-0">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          rows={3}
          maxLength={BIO_MAX}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full px-3.25 py-2.75 border border-line rounded-[9px] text-[13.5px] font-[inherit] text-ink bg-input-bg resize-none focus:outline-none focus:border-accent focus:bg-surface focus:shadow-[0_0_0_3px_var(--accent-soft)]"
        />
        <span className="self-end text-[11px] text-faint font-mono tabular-nums">{remaining} left</span>
      </div>

      {error && <p className="text-[13px] text-red-500 m-0">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-end bg-accent text-white border-none whitespace-nowrap text-[14px] font-bold px-4.5 py-2.5 rounded-[10px] transition-[filter] duration-150 hover:brightness-[1.07] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

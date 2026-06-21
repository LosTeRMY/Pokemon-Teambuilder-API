"use client";

import type { FormEvent } from "react";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";

export default function EmailForm({
  email,
  setEmail,
  currentPassword,
  setCurrentPassword,
  pending,
  error,
  onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  pending: boolean;
  error: string | null;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="bg-surface border border-line rounded-(--radius) p-6 flex flex-col gap-4.5">
      <div>
        <h2 className="text-[17px] font-extrabold tracking-[-0.01em] m-0">Email address</h2>
        <p className="text-[13px] text-muted m-0 mt-1">Changing your email requires your current password.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="emailCurrentPassword">Current password</Label>
          <span className="text-[11px] text-faint whitespace-nowrap">required to change email</span>
        </div>
        <Input
          id="emailCurrentPassword"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>

      {error && <p className="text-[13px] text-red-500 m-0">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-end bg-accent text-white border-none whitespace-nowrap text-[14px] font-bold px-4.5 py-2.5 rounded-[10px] transition-[filter] duration-150 hover:brightness-[1.07] disabled:opacity-60"
      >
        {pending ? "Updating…" : "Update email"}
      </button>
    </form>
  );
}

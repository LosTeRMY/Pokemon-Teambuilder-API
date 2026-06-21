"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const { theme, toggle } = useTheme();
  const { user, register, registerPending, registerError } = useAuth();
  const router = useRouter();

  // Already signed in — bounce to the team browser instead of showing a
  // stale signup form (mirrors settings page's logged-out redirect).
  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ username, email, password });
      router.push("/");
    } catch {
      // surfaced via registerError below
    }
  };

  return (
    <div>
      <Navbar theme={theme} onThemeToggle={toggle} />
      <div className="flex justify-center px-4 py-16">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-[380px] bg-surface border border-line rounded-2xl p-7 flex flex-col gap-4.5"
        >
          <h1 className="text-[20px] font-extrabold">Create an account</h1>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              minLength={3}
              maxLength={60}
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {registerError && <p className="text-[13px] text-red-500">{registerError.message}</p>}

          <button
            type="submit"
            disabled={registerPending}
            className="bg-accent text-white border-none whitespace-nowrap text-[15px] font-bold px-4.75 py-2.75 rounded-[10px] transition-[filter] duration-150 hover:brightness-[1.07] disabled:opacity-60"
          >
            {registerPending ? "Creating account…" : "Sign up"}
          </button>

          <p className="text-[13.5px] text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-accent font-semibold">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

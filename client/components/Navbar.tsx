"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";

export default function Navbar({
  theme,
  onThemeToggle,
}: {
  theme: "light" | "dark";
  onThemeToggle: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-30 flex items-center gap-8.5 h-18 px-8.5 bg-surface border-b border-line max-[560px]:gap-3.5 max-[560px]:px-3.5">
      <div className="flex items-baseline gap-2.25">
        <span className="text-accent text-[22px] translate-y-px">▲</span>
        <span className="text-[22px] font-extrabold tracking-[-0.02em]">PokéBuild</span>
        <span className="font-mono tabular-nums text-[10px] text-faint tracking-[0.12em] max-[560px]:hidden">GEN 4 · DPP</span>
      </div>
      <nav className="flex gap-1 max-[900px]:hidden">
        {[
          { href: "/", label: "Teams" },
          { href: "/pokedex", label: "Pokédex" },
          { href: "/builder", label: "Builder" },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "text-[15.5px] font-semibold px-3.75 py-2.25 rounded-[9px]",
              pathname === href || pathname.startsWith(href + "/")
                ? "text-accent bg-accent-soft"
                : "text-muted hover:bg-line-soft hover:text-ink",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-3.5">
        <button
          className="grid place-items-center w-10 h-10 bg-surface border border-line rounded-[10px] text-muted transition-all duration-150 hover:text-ink hover:border-muted hover:bg-surface-2 active:scale-[0.93]"
          onClick={onThemeToggle}
          aria-label="Toggle light or dark theme"
          title={theme === "dark" ? "Switch to light" : "Switch to dark"}
        >
          {theme === "dark" ? (
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5z" />
            </svg>
          )}
        </button>
        <Link
          href="/builder"
          className="bg-accent text-white border-none whitespace-nowrap text-[15px] font-bold px-4.75 py-2.75 rounded-[10px] transition-[filter] duration-150 hover:brightness-[1.07] max-[560px]:px-2.75 max-[560px]:py-2"
        >
          + New team
        </Link>
        {user ? (
          <>
            <button
              className="text-[14px] font-semibold text-muted hover:text-ink whitespace-nowrap"
              onClick={async () => {
                try {
                  await logout();
                } catch (err) {
                  console.error("Logout failed:", err);
                }
              }}
            >
              Log out
            </button>
            <Link
              href="/profile/settings"
              className="grid place-items-center w-10 h-10 bg-surface border border-line rounded-[10px] text-muted transition-all duration-150 hover:text-ink hover:border-muted hover:bg-surface-2 active:scale-[0.93]"
              aria-label="Account settings"
              title="Account settings"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3.2" />
                <path d="M19.4 13.5a7.7 7.7 0 0 0 0-3l1.9-1.5-2-3.4-2.3.7a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.3a7.6 7.6 0 0 0-2.6 1.5l-2.3-.7-2 3.4L4.6 10a7.7 7.7 0 0 0 0 3l-1.9 1.5 2 3.4 2.3-.7c.76.66 1.64 1.17 2.6 1.5L10 22h4l.4-2.3a7.6 7.6 0 0 0 2.6-1.5l2.3.7 2-3.4z" />
              </svg>
            </Link>
            <Link href={`/profile/${user.id}`} title="View your profile">
              <Avatar name={user.username} src={user.avatar} size={38} />
            </Link>
          </>
        ) : (
          <Link
            href="/login"
            className="text-[15px] font-bold text-muted hover:text-ink whitespace-nowrap px-3.75 py-2.25"
          >
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}

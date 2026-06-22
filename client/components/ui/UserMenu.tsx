"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import type { AuthUser } from "@/hooks/useAuth";

const ICON_PROPS = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const ProfileIcon = () => (
  <svg {...ICON_PROPS}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" /></svg>
);
const SettingsIcon = () => (
  <svg {...ICON_PROPS}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 13.5a7.7 7.7 0 0 0 0-3l1.9-1.5-2-3.4-2.3.7a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.3a7.6 7.6 0 0 0-2.6 1.5l-2.3-.7-2 3.4L4.6 10a7.7 7.7 0 0 0 0 3l-1.9 1.5 2 3.4 2.3-.7c.76.66 1.64 1.17 2.6 1.5L10 22h4l.4-2.3a7.6 7.6 0 0 0 2.6-1.5l2.3.7 2-3.4z" />
  </svg>
);
const AdminIcon = () => (
  <svg {...ICON_PROPS}><path d="M12 2.5l7.5 3.4v5.3c0 4.6-3.2 7.9-7.5 9.3-4.3-1.4-7.5-4.7-7.5-9.3V5.9z" /></svg>
);
const LogoutIcon = () => (
  <svg {...ICON_PROPS}><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
);

// Click-to-open only — no hover-open behavior, so there's no trigger/panel
// gap-crossing race to worry about. Closes on click outside, Escape, picking
// an item, or clicking the avatar again — same outside-click pattern as
// FilterSidebar's TypeFilter dropdown. Entrance animation reuses tbMenuIn,
// the same one ItemPicker/MovesEditor use for their dropdown panels.
export default function UserMenu({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemClass = "flex items-center gap-2.75 w-full text-left px-3.75 py-2.5 text-[13.5px] font-semibold text-ink transition-colors duration-100 hover:bg-surface-2 cursor-pointer [&_svg]:text-faint";

  return (
    <div className="relative" ref={ref}>
      <button
        className="block rounded-full cursor-pointer ring-2 ring-transparent transition-[box-shadow,transform] duration-200 hover:ring-accent/35 hover:scale-[1.06] active:scale-95 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <Avatar name={user.username} src={user.avatar} size={38} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+10px)] right-0 z-40 w-56 bg-surface border border-line rounded-[11px] shadow-[0_18px_40px_-14px_var(--shadow-pop)] overflow-hidden motion-safe:animate-[tbMenuIn_0.14s_ease]"
        >
          <div className="px-3.75 py-3 border-b border-line-soft">
            <p className="m-0 text-[13.5px] font-bold text-ink truncate">{user.username}</p>
            <p className="m-0 text-[11.5px] text-faint truncate">{user.email}</p>
          </div>
          <div className="py-1.5">
            <Link role="menuitem" href={`/profile/${user.id}`} className={itemClass} onClick={() => setOpen(false)}>
              <ProfileIcon />
              View profile
            </Link>
            <Link role="menuitem" href="/profile/settings" className={itemClass} onClick={() => setOpen(false)}>
              <SettingsIcon />
              Settings
            </Link>
            {user.role === "admin" && (
              <Link role="menuitem" href="/admin" className={itemClass} onClick={() => setOpen(false)}>
                <AdminIcon />
                Admin
              </Link>
            )}
          </div>
          <div className="py-1.5 border-t border-line-soft">
            <button
              role="menuitem"
              className={itemClass}
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              <LogoutIcon />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

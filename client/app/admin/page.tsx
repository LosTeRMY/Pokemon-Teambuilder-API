"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Toast from "@/components/ui/Toast";
import Input from "@/components/ui/Input";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useAdminUsers, type AdminRole, type AdminUser } from "@/hooks/useAdminUsers";
import { memberSince } from "@/lib/browserUtils";
import { cn } from "@/lib/cn";

const ROLE_STYLE: Record<AdminRole, string> = {
  admin: "text-ai bg-ai-soft border-ai/30",
  moderator: "text-accent bg-accent-soft border-accent/30",
  user: "text-faint bg-surface-2 border-line",
};

function RoleBadge({ role }: { role: AdminRole }) {
  return (
    <span className={cn("inline-flex items-center text-[11px] font-bold uppercase tracking-[0.04em] rounded-full px-2.5 py-1 border", ROLE_STYLE[role])}>
      {role}
    </span>
  );
}

function UserRow({ u, isSelf, onChangeRole }: { u: AdminUser; isSelf: boolean; onChangeRole: (role: AdminRole) => void }) {
  return (
    <tr className="border-b border-line-soft last:border-0">
      <td className="py-3 pr-4">
        <div className="flex flex-col">
          <span className="text-[14px] font-bold">{u.username}</span>
          <span className="text-[12.5px] text-faint">{u.email}</span>
        </div>
      </td>
      <td className="py-3 pr-4">
        <RoleBadge role={u.role} />
      </td>
      <td className="py-3 pr-4 text-[12.5px] text-faint whitespace-nowrap">{memberSince(u.createdAt)}</td>
      <td className="py-3">
        <select
          className="border border-line rounded-[8px] bg-input-bg text-[13px] font-semibold px-2.5 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          value={u.role}
          disabled={isSelf}
          title={isSelf ? "You can't change your own role" : undefined}
          onChange={(e) => onChangeRole(e.target.value as AdminRole)}
        >
          <option value="user">user</option>
          <option value="moderator">moderator</option>
          <option value="admin">admin</option>
        </select>
      </td>
    </tr>
  );
}

export default function AdminPage() {
  const { theme, toggle } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = !authLoading && user?.role === "admin";
  const { users, isLoading: usersLoading, updateRole } = useAdminUsers(isAdmin);
  const router = useRouter();

  const [q, setQ] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Admin-only page — bounce anyone else to the home page rather than
  // rendering a table that'll just 403 on every action.
  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) => u.username.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
  }, [users, q]);

  const handleChangeRole = async (userId: number, role: AdminRole) => {
    try {
      await updateRole({ userId, role });
      setToast(`Updated to ${role}.`);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Couldn't update role.");
    }
  };

  if (authLoading || user?.role !== "admin") {
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
      <main className="max-w-200 mx-auto px-8 pt-7.5 pb-22.5 max-[820px]:px-4">
        <div className="mb-5.5">
          <h1 className="text-[27px] font-extrabold tracking-[-0.02em] m-0 mb-1">User roles</h1>
          <p className="m-0 text-[14px] text-muted">
            {users.length} account{users.length === 1 ? "" : "s"} · grant moderator/admin access
          </p>
        </div>

        <Input
          className="mb-4 max-w-90"
          placeholder="Search by username or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="bg-surface border border-line rounded-2xl px-5 overflow-x-auto">
          {usersLoading ? (
            <p className="text-center text-muted py-10">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted py-10">No accounts match &ldquo;{q}&rdquo;.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line text-[11px] font-bold uppercase tracking-[0.04em] text-faint">
                  <th className="py-3 pr-4">Account</th>
                  <th className="py-3 pr-4">Role</th>
                  <th className="py-3 pr-4">Member since</th>
                  <th className="py-3">Change role</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <UserRow key={u.id} u={u} isSelf={u.id === user.id} onChangeRole={(role) => handleChangeRole(u.id, role)} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <Toast message={toast} />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

/* Three independent forms (profile / email / password) map to the same
 * PATCH /users/:id endpoint with different field subsets — see
 * server/CLAUDE.md's validation table for why email/password changes need
 * currentPassword and profile changes don't. */
export function useAccountSettings() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [profilePending, setProfilePending] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [emailPending, setEmailPending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordCurrentPassword, setPasswordCurrentPassword] = useState("");
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const toastId = useRef(0);
  const notify = (msg: string) => {
    const id = ++toastId.current;
    setToast(msg);
    setTimeout(() => {
      if (toastId.current === id) setToast(null);
    }, 2600);
  };

  // Seed the editable fields from the session user once it loads — not on
  // every change, so an in-progress edit isn't clobbered by a background
  // refetch of the same query.
  const seeded = useRef(false);
  useEffect(() => {
    if (user && !seeded.current) {
      seeded.current = true;
      setAvatarUrl(user.avatar ?? "");
      setBio(user.bio ?? "");
      setEmail(user.email);
    }
  }, [user]);

  const refreshMe = () => queryClient.invalidateQueries({ queryKey: ["auth", "me"] });

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfilePending(true);
    setProfileError(null);
    try {
      await apiFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ avatar: avatarUrl.trim(), bio }),
      });
      refreshMe();
      notify("Profile saved");
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : "Couldn't save your profile");
    } finally {
      setProfilePending(false);
    }
  };

  const clearAvatar = () => setAvatarUrl("");

  const updateEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setEmailPending(true);
    setEmailError(null);
    try {
      await apiFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ email, currentPassword: emailCurrentPassword }),
      });
      setEmailCurrentPassword("");
      refreshMe();
      notify("Email updated");
    } catch (err) {
      setEmailError(err instanceof ApiError ? err.message : "Couldn't update your email");
    } finally {
      setEmailPending(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation don't match");
      return;
    }
    setPasswordPending(true);
    setPasswordError(null);
    try {
      await apiFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ password: newPassword, currentPassword: passwordCurrentPassword }),
      });
      setNewPassword("");
      setConfirmPassword("");
      setPasswordCurrentPassword("");
      notify("Password changed");
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Couldn't change your password");
    } finally {
      setPasswordPending(false);
    }
  };

  return {
    theme, toggle, user,
    toast,
    avatarUrl, setAvatarUrl, bio, setBio, clearAvatar,
    profilePending, profileError, saveProfile,
    email, setEmail, emailCurrentPassword, setEmailCurrentPassword,
    emailPending, emailError, updateEmail,
    newPassword, setNewPassword, confirmPassword, setConfirmPassword,
    passwordCurrentPassword, setPasswordCurrentPassword,
    passwordPending, passwordError, changePassword,
  };
}

"use client";

import { useState } from "react";
import { avatarColor } from "@/lib/browserUtils";
import { cn } from "@/lib/cn";

/* Renders the user's hosted avatar image, falling back to the same
 * initial-letter token used everywhere else (Navbar, TeamCard byline) if
 * there's no avatar URL or the image fails to load (dead link, etc.).
 *
 * Keyed remount on `src` (see ItemIcon.tsx for the same pattern): callers
 * like ProfileForm's live preview reuse the same Avatar instance as the user
 * edits the URL field, so a stale `failed` flag from a previous bad URL must
 * reset before trying a new one — doing that via an effect would trip this
 * project's react-hooks/set-state-in-effect rule for no benefit. */
export default function Avatar({
  name,
  src,
  size = 36,
  className,
  title,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
  title?: string;
}) {
  return <AvatarInner key={src ?? "none"} name={name} src={src} size={size} className={className} title={title} />;
}

function AvatarInner({
  name,
  src,
  size,
  className,
  title,
}: {
  name: string;
  src?: string | null;
  size: number;
  className?: string;
  title?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        title={title ?? name}
        className={cn("rounded-full object-cover shrink-0", className)}
        style={{ width: size, height: size }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className={cn("rounded-full text-white grid place-items-center font-bold shrink-0", className)}
      style={{ width: size, height: size, background: avatarColor(name), fontSize: Math.max(12, Math.round(size * 0.42)) }}
      title={title ?? name}
    >
      {name[0]?.toUpperCase() ?? "?"}
    </span>
  );
}

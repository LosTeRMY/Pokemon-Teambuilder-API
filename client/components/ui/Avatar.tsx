"use client";

import { useState } from "react";
import { avatarColor } from "@/lib/browserUtils";
import { cn } from "@/lib/cn";

/* Renders the user's hosted avatar image, falling back to the same
 * initial-letter token used everywhere else (Navbar, TeamCard byline) if
 * there's no avatar URL or the image fails to load (dead link, etc.). */
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

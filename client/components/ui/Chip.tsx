"use client";

import { cn } from "@/lib/cn";

export default function Chip({
  label,
  variant = "chip",
  tone,
  onX,
}: {
  label: string;
  variant?: "chip" | "pill";
  tone?: "fmt" | "combo";
  onX: () => void;
}) {
  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    onX();
  };

  if (variant === "pill") {
    return (
      <span
        className={cn(
          "apill inline-flex items-center gap-1.5 bg-surface border border-line rounded-[20px] py-1 pr-1.5 pl-2.75 text-[12px] font-semibold",
          tone === "fmt" && "bg-accent-soft border-transparent text-accent font-bold",
          tone === "combo" && "apill--combo",
        )}
      >
        {label}
        <button onMouseDown={handleRemove} aria-label="remove">✕</button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.25 bg-chip-bg border border-line rounded-[7px] py-0.75 pl-2.25 pr-1.25 text-[12px] font-semibold">
      {label}
      <button onMouseDown={handleRemove} aria-label={`Remove ${label}`}>✕</button>
    </span>
  );
}

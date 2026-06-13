"use client";

import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export default function Input({
  small,
  className,
  ...props
}: ComponentPropsWithoutRef<"input"> & { small?: boolean }) {
  return (
    <input
      className={cn(
        "w-full px-[13px] py-[11px] border border-line rounded-[9px] text-[14.5px] font-[inherit] text-ink bg-input-bg focus:outline-none focus:border-accent focus:bg-surface focus:shadow-[0_0_0_3px_var(--accent-soft)]",
        small && "px-[9px] py-[7px] text-[12.5px]",
        className,
      )}
      {...props}
    />
  );
}

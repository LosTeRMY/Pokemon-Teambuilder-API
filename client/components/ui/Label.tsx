"use client";

import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export default function Label({ children, className, ...props }: ComponentPropsWithoutRef<"label">) {
  return (
    <label
      className={cn("text-[12px] font-bold tracking-[0.06em] uppercase text-faint", className)}
      {...props}
    >
      {children}
    </label>
  );
}

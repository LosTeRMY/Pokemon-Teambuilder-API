"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";

export default function Modal({
  children,
  onClose,
  wide,
}: {
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-80 bg-[rgba(16,22,34,0.5)] grid place-items-center p-7"
      onMouseDown={onClose}
    >
      <div
        className={cn(
          "w-full max-w-[620px] max-h-[86vh] bg-surface rounded-2xl shadow-[0_30px_70px_-20px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden motion-safe:animate-[tbSlideIn_0.18s_ease]",
          wide && "max-w-[720px]",
        )}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
      >
        {children}
      </div>
    </div>
  );
}

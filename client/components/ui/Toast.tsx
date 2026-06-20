"use client";

export default function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="motion-safe:animate-[tbToastIn_0.25s_ease] fixed bottom-6.5 left-1/2 -translate-x-1/2 z-120 flex items-center gap-2.25 bg-[#1c2433] text-[#eaf0f7] px-4.5 py-3 rounded-[11px] text-[13.5px] font-semibold shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)]">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="text-[#57d98a]"><path d="M20 6 9 17l-5-5" /></svg>
      {message}
    </div>
  );
}

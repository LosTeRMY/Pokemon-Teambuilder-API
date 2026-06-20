"use client";

export default function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const goTo = (p: number) => {
    onChange(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex items-center justify-center gap-3 mt-7">
      <button
        type="button"
        className="bg-surface border border-line rounded-[9px] whitespace-nowrap px-3.75 py-2.25 text-[14px] font-bold text-muted transition-all duration-140 hover:border-muted hover:text-ink disabled:opacity-50 disabled:pointer-events-none"
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
      >
        Prev
      </button>
      <span className="text-[13px] text-faint font-mono tabular-nums">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className="bg-surface border border-line rounded-[9px] whitespace-nowrap px-3.75 py-2.25 text-[14px] font-bold text-muted transition-all duration-140 hover:border-muted hover:text-ink disabled:opacity-50 disabled:pointer-events-none"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </div>
  );
}

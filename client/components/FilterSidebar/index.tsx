"use client";

import type { FilterControls } from "@/lib/useFilterState";
import FilterRail from "./FilterRail";

export default function FilterSidebar({
  filter,
  counts,
  loggedIn,
  drawer,
  setDrawer,
}: {
  filter: FilterControls;
  counts: Record<number, number>;
  loggedIn: boolean;
  drawer: boolean;
  setDrawer: (open: boolean) => void;
}) {
  const rail = (
    <FilterRail filter={filter} counts={counts} loggedIn={loggedIn} />
  );
  return (
    <>
      <aside className="sticky top-[72px] w-[340px] shrink-0 h-[calc(100vh-72px)] overflow-y-auto border-r border-line bg-surface max-[900px]:hidden">
        {rail}
      </aside>
      {drawer && (
        <div
          className="fixed inset-0 bg-[rgba(20,26,38,0.4)] z-50 flex"
          onClick={() => setDrawer(false)}
        >
          <div
            className="w-[300px] max-w-[86vw] bg-surface h-full overflow-y-auto [animation:slideIn_0.2s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-[18px] py-4 border-b border-line sticky top-0 bg-surface">
              <strong>Filters</strong>
              <button
                className="bg-transparent border-none text-[16px] text-muted"
                onClick={() => setDrawer(false)}
              >
                ✕
              </button>
            </div>
            {rail}
          </div>
        </div>
      )}
    </>
  );
}

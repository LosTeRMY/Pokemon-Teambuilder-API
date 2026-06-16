"use client";

import { useTeamBrowser } from "@/hooks/useTeamBrowser";
import Navbar from "@/components/Navbar";
import FilterSidebar from "@/components/FilterSidebar";
import TeamDisplay from "@/components/TeamDisplay/TeamDisplay";

export default function Page() {
  const {
    theme, toggle,
    filter, counts, loggedIn, drawer, setDrawer,
    filtered, s, set, removeFromList, removeCombo, activeCount, onLike, onClear,
    copied, copyLink, size, compact,
  } = useTeamBrowser();

  return (
    <div>
      <Navbar theme={theme} onThemeToggle={toggle} />
      <div className="flex items-start w-full">
        <FilterSidebar
          filter={filter}
          counts={counts}
          loggedIn={loggedIn}
          drawer={drawer}
          setDrawer={setDrawer}
        />
        <TeamDisplay
          filtered={filtered}
          s={s}
          set={set}
          removeFromList={removeFromList}
          removeCombo={removeCombo}
          activeCount={activeCount}
          onLike={onLike}
          onClear={onClear}
          copied={copied}
          copyLink={copyLink}
          size={size}
          compact={compact}
          setDrawer={setDrawer}
        />
      </div>
    </div>
  );
}

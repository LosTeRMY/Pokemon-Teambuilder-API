"use client";

import { useTeamBuilder } from "@/hooks/useTeamBuilder";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/TeamBuilder/Sidebar";
import WorkArea from "@/components/TeamBuilder/WorkArea";
import Modal from "@/components/TeamBuilder/Modal";
import SpeciesPicker from "@/components/TeamBuilder/SpeciesPicker";
import ExportModal from "@/components/TeamBuilder/ExportModal";

export default function BuilderPage() {
  const {
    theme, toggle,
    savedTeams, team, dirty, memberCount,
    selected, setSelected,
    modal, setModal,
    swapTarget, openSpeciesPicker, pickSpecies,
    toast, notify,
    drawer, setDrawer,
    sidebarFilter, setSidebarFilter,
    sidebarQuery, setSidebarQuery,
    formats,
    newTeam, loadTeam, saveTeam, deleteTeam, publishTeam,
    updateMember, updateNotes,
    setName, setFormat, setStrategy,
  } = useTeamBuilder();

  const closeModal = () => setModal(null);
  const speciesPickerTitle = swapTarget != null && team.members[swapTarget] ? "Change species" : "Add a Pokémon";

  return (
    <div>
      <Navbar theme={theme} onThemeToggle={toggle} />
      <div className="flex items-stretch w-full min-h-[calc(100vh-72px)]">
        {drawer && (
          <div
            className="fixed inset-x-0 top-18 bottom-0 z-55 bg-[rgba(16,22,34,0.4)]"
            onClick={() => setDrawer(false)}
          />
        )}
        <Sidebar
          savedTeams={savedTeams}
          activeId={team.id}
          dirty={dirty}
          query={sidebarQuery}
          onQuery={setSidebarQuery}
          filter={sidebarFilter}
          onFilter={setSidebarFilter}
          onNew={newTeam}
          onOpen={loadTeam}
          onDelete={deleteTeam}
          drawer={drawer}
          onCloseDrawer={() => setDrawer(false)}
        />
        <WorkArea
          team={team}
          dirty={dirty}
          memberCount={memberCount}
          formats={formats}
          selected={selected}
          setSelected={setSelected}
          onSetName={setName}
          onSetFormat={setFormat}
          onSetStrategy={setStrategy}
          onSave={saveTeam}
          onPublish={publishTeam}
          onExport={() => setModal("export")}
          onAddSlot={openSpeciesPicker}
          onUpdateMember={updateMember}
          onUpdateNotes={updateNotes}
          onSwapMember={openSpeciesPicker}
          onOpenDrawer={() => setDrawer(true)}
        />
      </div>

      {modal === "species" && (
        <Modal wide onClose={closeModal}>
          <SpeciesPicker title={speciesPickerTitle} onPick={pickSpecies} onClose={closeModal} />
        </Modal>
      )}
      {modal === "export" && (
        <Modal onClose={closeModal}>
          <ExportModal team={team} onClose={closeModal} notify={notify} />
        </Modal>
      )}

      {toast && (
        <div className="motion-safe:animate-[tbToastIn_0.25s_ease] fixed bottom-6.5 left-1/2 -translate-x-1/2 z-120 flex items-center gap-2.25 bg-[#1c2433] text-[#eaf0f7] px-4.5 py-3 rounded-[11px] text-[13.5px] font-semibold shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)]">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="text-[#57d98a]"><path d="M20 6 9 17l-5-5" /></svg>
          {toast}
        </div>
      )}
    </div>
  );
}

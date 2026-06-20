"use client";

import { useTeamBuilder } from "@/hooks/useTeamBuilder";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/TeamBuilder/Sidebar";
import WorkArea from "@/components/TeamBuilder/WorkArea";
import Modal from "@/components/TeamBuilder/Modal";
import SpeciesPicker from "@/components/TeamBuilder/SpeciesPicker";
import ExportModal from "@/components/TeamBuilder/ExportModal";
import DeleteTeamModal from "@/components/TeamBuilder/DeleteTeamModal";
import Toast from "@/components/ui/Toast";

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
    pendingDeleteId, requestDelete, cancelDelete, confirmDelete,
    formats,
    newTeam, loadTeam, saveTeam, deleteTeam, publishTeam,
    updateMember, updateNotes,
    setName, setFormat, setStrategy,
  } = useTeamBuilder();

  const pendingDeleteTeam = pendingDeleteId ? savedTeams.find((t) => t.id === pendingDeleteId) : null;

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
          onRequestDelete={requestDelete}
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
      {pendingDeleteTeam && (
        <Modal onClose={cancelDelete}>
          <DeleteTeamModal team={pendingDeleteTeam} onCancel={cancelDelete} onConfirm={confirmDelete} />
        </Modal>
      )}

      <Toast message={toast} />
    </div>
  );
}

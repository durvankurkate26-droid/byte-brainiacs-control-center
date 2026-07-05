"use client";

import type { ParticipantWorkspace as Workspace } from "@/lib/useParticipantWorkspace";
import ParticipantFilterBar from "@/components/automation/ParticipantFilterBar";
import BulkActionBar from "@/components/automation/BulkActionBar";
import ParticipantTable from "@/components/automation/ParticipantTable";

interface ParticipantWorkspaceProps {
  workspace: Workspace;
  /** Bulk-action handlers wired by the page (scroll to composer / download). */
  onEmail: () => void;
  onWhatsApp: () => void;
  onExport: () => void;
}

/**
 * The participant roster surface: a reusable filter bar, a bulk-action toolbar,
 * and the selectable, highlighted table — all driven by one workspace so the
 * filtered/selected set stays consistent with the communication and export
 * scopes elsewhere on the page.
 */
export default function ParticipantWorkspace({
  workspace,
  onEmail,
  onWhatsApp,
  onExport,
}: ParticipantWorkspaceProps) {
  const {
    filters,
    patchFilters,
    clearFilters,
    filtersActive,
    filtered,
    all,
    options,
    keyOf,
    isSelected,
    toggle,
    selectAllFiltered,
    clearSelection,
    selectedCount,
    allFilteredSelected,
    attendanceLookup,
  } = workspace;

  return (
    <div className="space-y-4">
      <ParticipantFilterBar
        filters={filters}
        patch={patchFilters}
        clear={clearFilters}
        filtersActive={filtersActive}
        options={options}
        resultCount={filtered.length}
        totalCount={all.length}
      />

      <BulkActionBar
        selectedCount={selectedCount}
        filteredCount={filtered.length}
        allFilteredSelected={allFilteredSelected}
        onSelectAll={selectAllFiltered}
        onClearSelection={clearSelection}
        onEmail={onEmail}
        onWhatsApp={onWhatsApp}
        onExport={onExport}
      />

      <ParticipantTable
        rows={filtered}
        highlightQuery={filters.search}
        attendanceLookup={attendanceLookup}
        keyOf={keyOf}
        isSelected={isSelected}
        onToggle={toggle}
        allSelected={allFilteredSelected}
        onToggleAll={allFilteredSelected ? clearSelection : selectAllFiltered}
      />
    </div>
  );
}

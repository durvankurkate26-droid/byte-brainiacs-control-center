"use client";

// ─── components/dashboard/DashboardProvider.tsx ──────────────────────────────
// Holds the Control Center's shared client state in ONE place, mounted at the
// /dashboard layout so it survives client-side navigation between the sub-pages.
//
// This is what lets the split pages behave like the old single-page Control
// Center: the participant filter/selection lives in `workspace`, and the bulk
// actions on the Participants page can point the Email/WhatsApp composers on the
// Communication page at the same scope, then route there. No business logic
// changed — only lifted out of the old monolithic page.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { useDashboardData, type DashboardData } from "@/lib/useDashboardData";
import {
  useParticipantWorkspace,
  type ParticipantWorkspace,
} from "@/lib/useParticipantWorkspace";
import {
  defaultScope,
  type ScopeMode,
  type ScopeSets,
} from "@/lib/scope";
import {
  downloadCsv,
  participantsToCsv,
  stampedFilename,
} from "@/lib/csvExport";

interface DashboardContextValue extends DashboardData {
  workspace: ParticipantWorkspace;

  scopeSets: ScopeSets;

  emailScope: ScopeMode;
  setEmailScope: (m: ScopeMode) => void;
  waScope: ScopeMode;
  setWaScope: (m: ScopeMode) => void;
  exportScope: ScopeMode;
  setExportScope: (m: ScopeMode) => void;

  /** Bulk actions from the participant table. Email/WhatsApp route to the
   *  Communication page with the target scope already selected. */
  handleBulkEmail: () => void;
  handleBulkWhatsApp: () => void;
  handleBulkExport: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const data = useDashboardData();
  const workspace = useParticipantWorkspace(data.participants, data.teams);

  const [emailScope, setEmailScope] = useState<ScopeMode>("all");
  const [waScope, setWaScope] = useState<ScopeMode>("all");
  const [exportScope, setExportScope] = useState<ScopeMode>("all");

  const scopeSets: ScopeSets = useMemo(
    () => ({
      all: workspace.all,
      filtered: workspace.filtered,
      selected: workspace.selected,
    }),
    [workspace.all, workspace.filtered, workspace.selected]
  );

  // The scope a bulk action should target: the explicit selection when present,
  // otherwise the filtered view (falling back to all when no filters are set).
  const bulkScope = useMemo(
    () => defaultScope(scopeSets, workspace.filtersActive),
    [scopeSets, workspace.filtersActive]
  );

  const handleBulkEmail = useCallback(() => {
    setEmailScope(bulkScope);
    router.push("/dashboard/communication#email-composer");
  }, [bulkScope, router]);

  const handleBulkWhatsApp = useCallback(() => {
    setWaScope(bulkScope);
    router.push("/dashboard/communication#whatsapp-composer");
  }, [bulkScope, router]);

  const handleBulkExport = useCallback(() => {
    const rows =
      workspace.selectedCount > 0 ? workspace.selected : workspace.filtered;
    if (rows.length === 0) return;
    const name = workspace.selectedCount > 0 ? "selected" : "filtered";
    downloadCsv(stampedFilename(`participants-${name}`), participantsToCsv(rows));
  }, [workspace.selected, workspace.filtered, workspace.selectedCount]);

  const value: DashboardContextValue = {
    ...data,
    workspace,
    scopeSets,
    emailScope,
    setEmailScope,
    waScope,
    setWaScope,
    exportScope,
    setExportScope,
    handleBulkEmail,
    handleBulkWhatsApp,
    handleBulkExport,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return ctx;
}

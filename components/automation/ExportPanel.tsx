"use client";

import type { ParticipantRow } from "@/lib/automationTypes";
import type { Team } from "@/lib/types";
import {
  attendanceToCsv,
  downloadCsv,
  participantsToCsv,
  stampedFilename,
} from "@/lib/csvExport";

interface ExportPanelProps {
  participants: ParticipantRow[];
  teams: Team[];
}

interface ExportCardProps {
  icon: string;
  title: string;
  description: string;
  count: number;
  countLabel: string;
  disabled: boolean;
  onExport: () => void;
}

function ExportCard({
  icon,
  title,
  description,
  count,
  countLabel,
  disabled,
  onExport,
}: ExportCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-lilac/20 bg-lilac/[0.03] p-5">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-lilac/15 text-lg text-lilac">
          {icon}
        </div>
        <span className="text-right text-xs text-mist">
          <span className="block text-lg font-bold tabular-nums text-lilac">
            {count.toLocaleString()}
          </span>
          {countLabel}
        </span>
      </div>

      <div>
        <p className="text-sm font-semibold text-haze">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-mist">{description}</p>
      </div>

      <button
        type="button"
        onClick={onExport}
        disabled={disabled}
        className={[
          "mt-auto flex items-center justify-center gap-2 rounded border px-4 py-2 text-xs uppercase tracking-wider transition-colors",
          disabled
            ? "cursor-not-allowed border-mist/20 bg-mist/5 text-mist/40"
            : "border-lilac/50 bg-lilac/10 text-lilac hover:bg-lilac/20",
        ].join(" ")}
      >
        ↓ Download CSV
      </button>
    </div>
  );
}

export default function ExportPanel({ participants, teams }: ExportPanelProps) {
  const checkedIn = teams.filter((t) => t.attendance).length;

  const exportParticipants = () => {
    downloadCsv(
      stampedFilename("participants"),
      participantsToCsv(participants)
    );
  };

  const exportAttendance = () => {
    downloadCsv(stampedFilename("attendance"), attendanceToCsv(teams));
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <ExportCard
        icon="◆"
        title="Participant Data"
        description="Full roster with contact details and email/phone validity flags. Ideal for record-keeping and follow-ups."
        count={participants.length}
        countLabel="participants"
        disabled={participants.length === 0}
        onExport={exportParticipants}
      />
      <ExportCard
        icon="◈"
        title="Attendance Data"
        description="One row per team with members, check-in status, and check-in time. Snapshot of the live attendance state."
        count={checkedIn}
        countLabel={`of ${teams.length} checked in`}
        disabled={teams.length === 0}
        onExport={exportAttendance}
      />
    </div>
  );
}

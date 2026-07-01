"use client";

import type { CsvStats } from "@/lib/automationTypes";

interface DatasetCardProps {
  fileName: string;
  uploadTime: Date;
  stats: CsvStats;
  onReset: () => void;
}

export default function DatasetCard({
  fileName,
  uploadTime,
  stats,
  onReset,
}: DatasetCardProps) {
  const formattedTime = uploadTime.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const allValid =
    stats.validEmails === stats.totalParticipants &&
    stats.validPhones === stats.totalParticipants;

  return (
    <div className="rounded border border-lilac/20 bg-lilac/[0.03] p-5">
      {/* Card header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lilac">◈</span>
          <h2 className="text-xs uppercase tracking-widest text-mist">
            Participant Dataset
          </h2>
        </div>
        <button
          onClick={onReset}
          className="rounded border border-lilac/30 px-3 py-1.5 text-xs uppercase tracking-wider text-lilac transition-colors hover:bg-lilac/10"
        >
          ↺ Upload New CSV
        </button>
      </div>

      <hr className="my-4 border-lilac/10" />

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-mist">Status</p>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-magenta/15 px-2.5 py-1 text-xs font-medium text-magenta">
            ✓ CSV Uploaded
          </span>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-mist">Filename</p>
          <p
            className="mt-1 truncate text-sm font-medium text-haze"
            title={fileName}
          >
            {fileName}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-mist">
            Upload Time
          </p>
          <p className="mt-1 text-sm text-haze">{formattedTime}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-mist">
            Participants
          </p>
          <p className="mt-1 text-sm font-bold tabular-nums text-lilac">
            {stats.totalParticipants.toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-mist">Teams</p>
          <p className="mt-1 text-sm font-bold tabular-nums text-magenta">
            {stats.totalTeams.toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-mist">
            Validation
          </p>
          <span
            className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              allValid
                ? "bg-lilac/15 text-lilac"
                : "bg-mist/10 text-mist"
            }`}
          >
            {allValid
              ? "✓ All Valid"
              : `⚠ ${stats.validEmails} emails · ${stats.validPhones} phones`}
          </span>
        </div>
      </div>
    </div>
  );
}

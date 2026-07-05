"use client";

import type { ParticipantFilters } from "@/lib/participantFilters";
import type { WorkspaceOptions } from "@/lib/useParticipantWorkspace";

interface ParticipantFilterBarProps {
  filters: ParticipantFilters;
  patch: (patch: Partial<ParticipantFilters>) => void;
  clear: () => void;
  filtersActive: boolean;
  options: WorkspaceOptions;
  resultCount: number;
  totalCount: number;
}

const selectClass =
  "rounded border border-lilac/30 bg-lilac/5 px-3 py-1.5 text-xs text-haze outline-none transition-colors focus:border-lilac/60";

/**
 * Reusable smart-filter bar for the participant roster: full-text search plus
 * college / registration-type / team / check-in / contact-validity filters.
 * Fully controlled — all state lives in the workspace so the same filters drive
 * the table, bulk actions, and communication scope.
 */
export default function ParticipantFilterBar({
  filters,
  patch,
  clear,
  filtersActive,
  options,
  resultCount,
  totalCount,
}: ParticipantFilterBarProps) {
  return (
    <div className="space-y-3 rounded-lg border border-lilac/20 bg-lilac/[0.03] p-4">
      {/* Search + result count */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor="participant-search" className="sr-only">
          Search participants
        </label>
        <input
          id="participant-search"
          type="search"
          placeholder="Search name, email, phone, college, or team…"
          value={filters.search}
          onChange={(e) => patch({ search: e.target.value })}
          className="w-full max-w-sm rounded border border-lilac/30 bg-lilac/5 px-3 py-1.5 text-xs text-haze placeholder-mist/50 outline-none transition-colors focus:border-lilac/60"
        />
        <p className="text-xs text-mist">
          <span className="text-lilac tabular-nums">
            {resultCount.toLocaleString()}
          </span>{" "}
          / {totalCount.toLocaleString()} shown
        </p>
      </div>

      {/* Filter controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.college}
          onChange={(e) => patch({ college: e.target.value })}
          className={selectClass}
          aria-label="Filter by college"
        >
          <option value="">All colleges</option>
          {options.colleges.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={filters.registrationType}
          onChange={(e) => patch({ registrationType: e.target.value })}
          className={selectClass}
          aria-label="Filter by registration type"
        >
          <option value="">All registration types</option>
          {options.registrationTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={filters.teamNumber}
          onChange={(e) => patch({ teamNumber: e.target.value })}
          className={selectClass}
          aria-label="Filter by team number"
        >
          <option value="">All teams</option>
          {options.teamNumbers.map((t) => (
            <option key={t} value={t}>
              Team {t}
            </option>
          ))}
        </select>

        <select
          value={filters.attendance}
          onChange={(e) =>
            patch({
              attendance: e.target.value as ParticipantFilters["attendance"],
            })
          }
          className={selectClass}
          aria-label="Filter by check-in status"
        >
          <option value="all">Any check-in status</option>
          <option value="checkedIn">Checked in</option>
          <option value="notCheckedIn">Not checked in</option>
        </select>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-mist">
          <input
            type="checkbox"
            checked={filters.validEmailOnly}
            onChange={(e) => patch({ validEmailOnly: e.target.checked })}
            className="h-3.5 w-3.5 accent-lilac"
          />
          Valid email
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-mist">
          <input
            type="checkbox"
            checked={filters.validPhoneOnly}
            onChange={(e) => patch({ validPhoneOnly: e.target.checked })}
            className="h-3.5 w-3.5 accent-lilac"
          />
          Valid phone
        </label>

        {filtersActive && (
          <button
            type="button"
            onClick={clear}
            className="text-xs uppercase tracking-wider text-lilac hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

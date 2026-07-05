"use client";

import { useEffect, useState } from "react";
import type { ParticipantRow } from "@/lib/automationTypes";
import type { Team } from "@/lib/types";
import { isParticipantCheckedIn } from "@/lib/participantFilters";
import { highlight } from "@/lib/highlight";

interface ParticipantTableProps {
  /** Rows to display — already filtered by the workspace. */
  rows: ParticipantRow[];
  /** Search query used to highlight matches in cells. */
  highlightQuery?: string;
  /** Team lookup so each row can show its team's check-in status. */
  attendanceLookup: Map<string, Team>;
  /** Stable per-row key (from the workspace). */
  keyOf: (row: ParticipantRow) => string;
  isSelected: (row: ParticipantRow) => boolean;
  onToggle: (row: ParticipantRow) => void;
  /** True when every currently-shown row is selected. */
  allSelected: boolean;
  /** Toggles selection of all currently-shown rows. */
  onToggleAll: () => void;
}

const PAGE_SIZE = 25;
const COLS = 7; // checkbox + team + participant + email + phone + college + status

function CheckInBadge({ present }: { present: boolean }) {
  return present ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-magenta/15 px-2 py-0.5 text-[10px] font-medium text-magenta">
      ✓ In
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-mist/15 px-2 py-0.5 text-[10px] font-medium text-mist">
      Pending
    </span>
  );
}

/**
 * Presentational participant table with row selection, search highlighting, a
 * per-team check-in badge, and pagination. All filtering lives in the workspace;
 * this component only renders the rows it is given.
 */
export default function ParticipantTable({
  rows,
  highlightQuery = "",
  attendanceLookup,
  keyOf,
  isSelected,
  onToggle,
  allSelected,
  onToggleAll,
}: ParticipantTableProps) {
  const [page, setPage] = useState(1);

  // Reset to the first page whenever the filtered row set changes.
  useEffect(() => {
    setPage(1);
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded border border-lilac/20">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-lilac/20 bg-lilac/5 text-xs uppercase tracking-wider text-mist">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  disabled={rows.length === 0}
                  aria-label="Select all shown participants"
                  className="h-3.5 w-3.5 accent-lilac"
                />
              </th>
              <th className="px-4 py-3">Team #</th>
              <th className="px-4 py-3">Participant</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">College</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={COLS} className="px-4 py-8 text-center text-mist">
                  No participants match your filters.
                </td>
              </tr>
            ) : (
              paginated.map((row) => {
                const key = keyOf(row);
                const selected = isSelected(row);
                const present = isParticipantCheckedIn(row, attendanceLookup);
                return (
                  <tr
                    key={key}
                    onClick={() => onToggle(row)}
                    className={[
                      "cursor-pointer border-b border-lilac/10 last:border-0 transition-colors",
                      selected ? "bg-lilac/10" : "hover:bg-lilac/5",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggle(row)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${row.participant || "participant"}`}
                        className="h-3.5 w-3.5 accent-lilac"
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-lilac">
                      {row.teamNumber ? (
                        highlight(row.teamNumber, highlightQuery)
                      ) : (
                        <span className="text-mist">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-haze">
                      {highlight(row.participant, highlightQuery)}
                    </td>
                    <td className="px-4 py-3">
                      {row.emailValid ? (
                        <span className="text-haze">
                          {highlight(row.email, highlightQuery)}
                        </span>
                      ) : (
                        <span
                          title="Invalid email format"
                          className="text-magenta/80 line-through decoration-magenta/40"
                        >
                          {row.email ? (
                            highlight(row.email, highlightQuery)
                          ) : (
                            "—"
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.phoneValid ? (
                        <span className="text-haze">
                          {highlight(row.phone, highlightQuery)}
                        </span>
                      ) : (
                        <span
                          title="Invalid phone format"
                          className="text-magenta/80 line-through decoration-magenta/40"
                        >
                          {row.phone ? (
                            highlight(row.phone, highlightQuery)
                          ) : (
                            "—"
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-mist">
                      {row.college ? (
                        highlight(row.college, highlightQuery)
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <CheckInBadge present={present} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-mist">
          <span>
            Showing {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, rows.length)} of {rows.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded border border-lilac/30 px-3 py-1 text-lilac disabled:cursor-not-allowed disabled:opacity-30 hover:not-disabled:bg-lilac/10"
            >
              ‹ Prev
            </button>
            <span className="tabular-nums">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded border border-lilac/30 px-3 py-1 text-lilac disabled:cursor-not-allowed disabled:opacity-30 hover:not-disabled:bg-lilac/10"
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

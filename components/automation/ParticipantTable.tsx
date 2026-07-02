"use client";

import { useState, useMemo } from "react";
import type { ParticipantRow } from "@/lib/automationTypes";

interface ParticipantTableProps {
  rows: ParticipantRow[];
}

const PAGE_SIZE = 25;

/** Distinct, sorted, non-empty values of a field across the rows. */
function distinctValues(
  rows: ParticipantRow[],
  pick: (r: ParticipantRow) => string
): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const v = pick(r).trim();
    if (v) set.add(v);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export default function ParticipantTable({ rows }: ParticipantTableProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [college, setCollege] = useState("");
  const [registrationType, setRegistrationType] = useState("");
  const [validEmailOnly, setValidEmailOnly] = useState(false);

  // Filter option lists derived from the full dataset (not the filtered view),
  // so a selection never hides the other options.
  const collegeOptions = useMemo(
    () => distinctValues(rows, (r) => r.college),
    [rows]
  );
  const registrationTypeOptions = useMemo(
    () => distinctValues(rows, (r) => r.registrationType),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const matches =
          r.teamNumber.toLowerCase().includes(q) ||
          r.participant.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.college.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (college && r.college !== college) return false;
      if (registrationType && r.registrationType !== registrationType)
        return false;
      if (validEmailOnly && !r.emailValid) return false;
      return true;
    });
  }, [rows, search, college, registrationType, validEmailOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // Reset to page 1 whenever any filter changes.
  const resetPage = () => setPage(1);
  const hasActiveFilters =
    search.trim() !== "" ||
    college !== "" ||
    registrationType !== "" ||
    validEmailOnly;

  const clearFilters = () => {
    setSearch("");
    setCollege("");
    setRegistrationType("");
    setValidEmailOnly(false);
    setPage(1);
  };

  const selectClass =
    "rounded border border-lilac/30 bg-lilac/5 px-3 py-1.5 text-xs text-haze outline-none focus:border-lilac/60";

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xs uppercase tracking-widest text-mist">
          Participants
          <span className="ml-2 text-lilac">({filtered.length})</span>
        </h2>
        <input
          type="search"
          placeholder="Search name, team, email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetPage();
          }}
          className="w-full max-w-xs rounded border border-lilac/30 bg-lilac/5 px-3 py-1.5 text-xs text-haze placeholder-mist/50 outline-none focus:border-lilac/60 focus:ring-0"
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={college}
          onChange={(e) => {
            setCollege(e.target.value);
            resetPage();
          }}
          className={selectClass}
          aria-label="Filter by college"
        >
          <option value="">All colleges</option>
          {collegeOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={registrationType}
          onChange={(e) => {
            setRegistrationType(e.target.value);
            resetPage();
          }}
          className={selectClass}
          aria-label="Filter by registration type"
        >
          <option value="">All registration types</option>
          {registrationTypeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-mist">
          <input
            type="checkbox"
            checked={validEmailOnly}
            onChange={(e) => {
              setValidEmailOnly(e.target.checked);
              resetPage();
            }}
            className="h-3.5 w-3.5 accent-lilac"
          />
          Valid email only
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs uppercase tracking-wider text-lilac hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded border border-lilac/20">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-lilac/20 bg-lilac/5 text-xs uppercase tracking-wider text-mist">
              <th className="px-4 py-3">Team #</th>
              <th className="px-4 py-3">Participant</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">College</th>
              <th className="px-4 py-3">Course</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-mist">
                  No participants match your filters.
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr
                  key={`${row.teamNumber}-${row.email}-${idx}`}
                  className="border-b border-lilac/10 last:border-0 hover:bg-lilac/5"
                >
                  <td className="px-4 py-3 font-semibold text-lilac">
                    {row.teamNumber || <span className="text-mist">—</span>}
                  </td>
                  <td className="px-4 py-3 text-haze">{row.participant}</td>
                  <td className="px-4 py-3">
                    {row.emailValid ? (
                      <span className="text-haze">{row.email}</span>
                    ) : (
                      <span
                        title="Invalid email format"
                        className="text-magenta/80 line-through decoration-magenta/40"
                      >
                        {row.email || "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.phoneValid ? (
                      <span className="text-haze">{row.phone}</span>
                    ) : (
                      <span
                        title="Invalid phone format"
                        className="text-magenta/80 line-through decoration-magenta/40"
                      >
                        {row.phone || "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-mist">{row.college || "—"}</td>
                  <td className="px-4 py-3 text-mist">{row.course || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-mist">
          <span>
            Showing {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
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

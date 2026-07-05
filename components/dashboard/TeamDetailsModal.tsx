"use client";

import { useEffect, useRef } from "react";
import type { TeamDetail } from "@/lib/teamDetails";
import { formatCheckInTime } from "@/lib/teamDetails";

interface TeamDetailsModalProps {
  detail: TeamDetail;
  onClose: () => void;
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-lilac/15 px-2.5 py-0.5 text-[11px] text-lilac">
      {children}
    </span>
  );
}

/**
 * Read-only detail view for a single team: attendance, check-in time, members
 * with contact validity, and the registration types / colleges represented.
 * Keyboard-accessible — Escape and backdrop click close it; focus lands on the
 * close button. Never mutates attendance.
 */
export default function TeamDetailsModal({
  detail,
  onClose,
}: TeamDetailsModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Close on Escape and focus the close button when the modal opens.
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-void/80 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Team ${detail.teamId} details`}
    >
      <div
        className="my-8 w-full max-w-lg rounded-xl border border-lilac/30 bg-void shadow-2xl shadow-lilac/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-lilac/20 px-6 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-mist">
              Team
            </p>
            <h2 className="text-xl font-bold tracking-tight text-haze">
              {detail.teamId}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {detail.attendance ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-magenta/15 px-3 py-1 text-xs font-medium text-magenta">
                ✓ Checked in
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-mist/15 px-3 py-1 text-xs font-medium text-mist">
                Pending
              </span>
            )}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close team details"
              className="rounded border border-lilac/30 px-2.5 py-1 text-sm text-lilac transition-colors hover:bg-lilac/10"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-mist">
                Check-in time
              </p>
              <p className="mt-1 text-sm text-haze">
                {formatCheckInTime(detail.checkinTime)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-mist">
                Members
              </p>
              <p className="mt-1 text-sm text-haze tabular-nums">
                {detail.members.length}
              </p>
            </div>
          </div>

          {/* Registration types */}
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-widest text-mist">
              Registration type{detail.registrationTypes.length === 1 ? "" : "s"}
            </p>
            <div className="flex flex-wrap gap-2">
              {detail.registrationTypes.length > 0 ? (
                detail.registrationTypes.map((t) => <Tag key={t}>{t}</Tag>)
              ) : (
                <span className="text-xs text-mist">—</span>
              )}
            </div>
          </div>

          {/* Colleges */}
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-widest text-mist">
              College{detail.colleges.length === 1 ? "" : "s"} represented
            </p>
            <div className="flex flex-wrap gap-2">
              {detail.colleges.length > 0 ? (
                detail.colleges.map((c) => <Tag key={c}>{c}</Tag>)
              ) : (
                <span className="text-xs text-mist">—</span>
              )}
            </div>
          </div>

          {/* Members */}
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-widest text-mist">
              Team members
            </p>
            {detail.members.length === 0 ? (
              <p className="text-xs text-mist">
                No participant records found for this team.
              </p>
            ) : (
              <ul className="divide-y divide-lilac/10 overflow-hidden rounded border border-lilac/20">
                {detail.members.map((m, i) => (
                  <li key={`${m.email}-${i}`} className="px-4 py-3">
                    <p className="text-sm text-haze">{m.name || "—"}</p>
                    <p className="mt-0.5 text-xs text-mist">
                      {m.email ? (
                        <span
                          className={
                            m.emailValid ? "" : "text-magenta/80 line-through"
                          }
                        >
                          {m.email}
                        </span>
                      ) : (
                        "no email"
                      )}
                      {" · "}
                      {m.phone ? (
                        <span
                          className={
                            m.phoneValid ? "" : "text-magenta/80 line-through"
                          }
                        >
                          {m.phone}
                        </span>
                      ) : (
                        "no phone"
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

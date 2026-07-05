"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { ParticipantRow } from "@/lib/automationTypes";
import type { SendEmailsResponseBody } from "@/lib/email";
import {
  effectiveScope,
  resolveScope,
  type ScopeMode,
  type ScopeSets,
} from "@/lib/scope";
import ScopeSelector from "@/components/automation/ScopeSelector";

// ─── Send lifecycle type ──────────────────────────────────────────────────────

/** Cumulative outcome across the initial send plus any retry passes. */
interface SendSummary {
  /** Eligible recipients in the original send (denominator for success rate). */
  total: number;
  /** Cumulative successful sends across all passes. */
  sent: number;
  /** Still-failing recipients after the latest pass. */
  failures: Array<{ email: string; error: string }>;
  /** Number of send passes run so far (1 = initial, 2+ = retries). */
  attempts: number;
}

type SendState =
  | { status: "idle" }
  | { status: "sending"; done: number; total: number; isRetry: boolean }
  | { status: "done"; summary: SendSummary }
  | { status: "error"; message: string };

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmailComposerProps {
  /** All/filtered/selected participant lists the send can target. */
  scopeSets: ScopeSets;
  /** Which set is currently targeted. */
  scope: ScopeMode;
  onScopeChange: (mode: ScopeMode) => void;
  /** Whether the filtered view differs from all (controls the Filtered option). */
  filtersActive: boolean;
}

interface ComposerState {
  subject: string;
  body: string;
  personalizeName: boolean;
  includeTeamNumber: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolves the personalised subject/body for a single participant.
 * Substitution tokens:
 *   {{name}}       → participant's first word (informal first name)
 *   {{full_name}}  → full participant name
 *   {{team}}       → team number
 */
function interpolate(
  template: string,
  participant: ParticipantRow,
  opts: Pick<ComposerState, "personalizeName" | "includeTeamNumber">
): string {
  let result = template;

  if (opts.personalizeName) {
    const firstName = participant.participant.split(" ")[0] || participant.participant;
    result = result
      .replace(/\{\{name\}\}/g, firstName)
      .replace(/\{\{full_name\}\}/g, participant.participant);
  } else {
    // Strip tokens when personalisation is off so preview stays clean
    result = result
      .replace(/\{\{name\}\}/g, "Participant")
      .replace(/\{\{full_name\}\}/g, "Participant");
  }

  if (opts.includeTeamNumber) {
    result = result.replace(/\{\{team\}\}/g, participant.teamNumber || "—");
  } else {
    result = result.replace(/\{\{team\}\}/g, "—");
  }

  return result;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface CheckboxFieldProps {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function CheckboxField({ id, label, hint, checked, onChange }: CheckboxFieldProps) {
  return (
    <label
      htmlFor={id}
      className={[
        "flex cursor-pointer items-start gap-3 rounded border px-4 py-3 transition-colors",
        checked
          ? "border-lilac/50 bg-lilac/10"
          : "border-lilac/20 bg-lilac/[0.03] hover:border-lilac/35 hover:bg-lilac/5",
      ].join(" ")}
    >
      {/* Custom checkbox */}
      <div className="mt-0.5 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={[
            "flex h-4 w-4 items-center justify-center rounded border transition-colors",
            checked
              ? "border-lilac bg-lilac text-void"
              : "border-mist/50 bg-transparent",
          ].join(" ")}
          aria-hidden="true"
        >
          {checked && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path
                d="M1 4l2.5 2.5L9 1"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-haze">
          {label}
        </p>
        <p className="mt-0.5 text-xs text-mist">{hint}</p>
      </div>
    </label>
  );
}

// ─── Preview panel ────────────────────────────────────────────────────────────

interface PreviewPanelProps {
  subject: string;
  body: string;
  participant: ParticipantRow;
  opts: Pick<ComposerState, "personalizeName" | "includeTeamNumber">;
}

function PreviewPanel({ subject, body, participant, opts }: PreviewPanelProps) {
  const resolvedSubject = interpolate(subject, participant, opts);
  const resolvedBody = interpolate(body, participant, opts);

  return (
    <div className="flex flex-col rounded border border-lilac/20 bg-lilac/[0.03]">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-lilac/20 px-4 py-3">
        <span className="text-xs uppercase tracking-widest text-mist">
          Live Preview
        </span>
        <span className="rounded bg-lilac/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-lilac">
          First recipient
        </span>
      </div>

      {/* Email chrome */}
      <div className="flex flex-1 flex-col gap-0 overflow-hidden">
        {/* To */}
        <div className="flex items-baseline gap-2 border-b border-lilac/10 px-4 py-2.5">
          <span className="w-12 shrink-0 text-xs uppercase tracking-wider text-mist">
            To
          </span>
          <span className="truncate text-xs text-haze">
            {participant.participant || "—"}
            {participant.email ? (
              <span className="ml-1 text-mist">&lt;{participant.email}&gt;</span>
            ) : null}
          </span>
        </div>

        {/* Team badge (conditional) */}
        {opts.includeTeamNumber && participant.teamNumber && (
          <div className="flex items-baseline gap-2 border-b border-lilac/10 px-4 py-2.5">
            <span className="w-12 shrink-0 text-xs uppercase tracking-wider text-mist">
              Team
            </span>
            <span className="text-xs font-semibold text-lilac">
              {participant.teamNumber}
            </span>
          </div>
        )}

        {/* Subject */}
        <div className="flex items-baseline gap-2 border-b border-lilac/10 px-4 py-2.5">
          <span className="w-12 shrink-0 text-xs uppercase tracking-wider text-mist">
            Subj
          </span>
          <span className="text-xs font-semibold text-haze">
            {resolvedSubject || (
              <span className="text-mist/50 italic">No subject</span>
            )}
          </span>
        </div>

        {/* Body */}
        <div className="min-h-[180px] flex-1 overflow-y-auto px-4 py-3">
          {resolvedBody ? (
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-haze/90">
              {resolvedBody}
            </pre>
          ) : (
            <p className="text-xs italic text-mist/50">No message body yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Token reference chip ─────────────────────────────────────────────────────

function TokenChip({
  token,
  description,
  active,
}: {
  token: string;
  description: string;
  active: boolean;
}) {
  return (
    <span
      title={active ? `Inserts: ${description}` : "Enable the checkbox above to use this token"}
      className={[
        "inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] transition-opacity",
        active
          ? "bg-lilac/15 text-lilac"
          : "bg-mist/10 text-mist/40 line-through",
      ].join(" ")}
    >
      {token}
    </span>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  done,
  total,
  isRetry,
}: {
  done: number;
  total: number;
  isRetry: boolean;
}) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 text-lilac">
          <span className="inline-block animate-spin">⟳</span>
          {isRetry ? "Retrying failed…" : "Sending…"}
        </span>
        <span className="tabular-nums text-mist">
          {done} / {total} · {pct}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-lilac/15">
        <div
          className="h-full rounded-full bg-lilac transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Send results panel ───────────────────────────────────────────────────────

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: "lilac" | "magenta" | "mist" | "haze";
}) {
  const color = {
    lilac: "text-lilac",
    magenta: "text-magenta",
    mist: "text-mist",
    haze: "text-haze",
  }[accent];
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-mist">{label}</p>
      <p className={`mt-0.5 text-lg font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function SendResults({
  summary,
  onRetry,
  onReset,
}: {
  summary: SendSummary;
  onRetry: () => void;
  onReset: () => void;
}) {
  const failed = summary.failures.length;
  const allGood = failed === 0;
  const rate =
    summary.total === 0 ? 0 : Math.round((summary.sent / summary.total) * 100);

  return (
    <div
      className={[
        "rounded border p-4 space-y-3",
        allGood
          ? "border-lilac/30 bg-lilac/5"
          : "border-magenta/30 bg-magenta/5",
      ].join(" ")}
    >
      {/* Headline */}
      <div className="flex items-center justify-between">
        <p
          className={[
            "text-sm font-semibold",
            allGood ? "text-lilac" : "text-magenta",
          ].join(" ")}
        >
          {allGood
            ? "✔ All emails sent successfully"
            : `⚠ ${failed} email${failed === 1 ? "" : "s"} still failing`}
        </p>
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-lilac/30 px-3 py-1 text-xs uppercase tracking-wider text-lilac hover:bg-lilac/10 transition-colors"
        >
          Compose New
        </button>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryStat label="Recipients" value={summary.total} accent="mist" />
        <SummaryStat label="Sent" value={summary.sent} accent="lilac" />
        <SummaryStat
          label="Failed"
          value={failed}
          accent={failed > 0 ? "magenta" : "mist"}
        />
        <SummaryStat label="Success Rate" value={`${rate}%`} accent="haze" />
      </div>

      {summary.attempts > 1 && (
        <p className="text-[11px] text-mist">
          After {summary.attempts} attempt{summary.attempts === 1 ? "" : "s"}.
        </p>
      )}

      {/* Failure details + retry */}
      {failed > 0 && (
        <div className="space-y-2 border-t border-magenta/20 pt-3">
          <p className="text-[10px] uppercase tracking-wider text-mist">
            Failed addresses
          </p>
          <ul className="max-h-32 space-y-1 overflow-y-auto">
            {summary.failures.map((f) => (
              <li key={f.email} className="flex items-start gap-2 text-xs">
                <span className="shrink-0 text-magenta">✕</span>
                <span className="text-haze">{f.email}</span>
                <span className="text-mist">— {f.error}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 flex items-center gap-2 rounded border border-magenta/50 bg-magenta/10 px-4 py-1.5 text-xs uppercase tracking-wider text-magenta transition-colors hover:bg-magenta/20"
          >
            ⟳ Retry Failed ({failed})
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EmailComposer({
  scopeSets,
  scope,
  onScopeChange,
  filtersActive,
}: EmailComposerProps) {
  // Guard against a scope whose option is no longer shown (e.g. selection
  // cleared), then resolve the recipients for whichever scope is in effect.
  const activeScope = effectiveScope(scope, scopeSets, filtersActive);
  const participants = useMemo(
    () => resolveScope(activeScope, scopeSets),
    [activeScope, scopeSets]
  );

  const [state, setState] = useState<ComposerState>({
    subject: "Your Byte Brainiacs Registration — {{team}}",
    body: `Hi {{name}},

Welcome to Byte Brainiacs! 🚀

We're thrilled to have you on board. Here are your registration details:

  Team Number : {{team}}
  Name        : {{full_name}}

Please arrive 15 minutes before the event begins. Bring a valid college ID.

Looking forward to seeing you at the hackathon!

— The Byte Brainiacs Team`,
    personalizeName: true,
    includeTeamNumber: true,
  });

  const [showPreview, setShowPreview] = useState(false);
  const [sendState, setSendState] = useState<SendState>({ status: "idle" });

  const set = <K extends keyof ComposerState>(key: K, val: ComposerState[K]) =>
    setState((prev) => ({ ...prev, [key]: val }));

  // Preview always uses the first participant; falls back to a placeholder row
  // so the panel never crashes when no CSV is loaded (shouldn't happen in
  // practice since EmailComposer is only mounted after a successful parse).
  const previewParticipant: ParticipantRow = useMemo(
    () =>
      participants[0] ?? {
        teamNumber: "BB001",
        participant: "Sample Participant",
        email: "sample@college.edu",
        phone: "9876543210",
        registrationType: "General",
        college: "Sample College",
        course: "B.Tech",
        registeredAt: "",
        emailValid: true,
        phoneValid: true,
      },
    [participants]
  );

  const validCount = participants.filter((p) => p.emailValid).length;
  const isSending = sendState.status === "sending";

  // Holds the simulated-progress interval so it can be cleared on completion,
  // a new send, or unmount. The API returns a single batched response, so we
  // approximate live progress by ticking a bar up to ~90% while awaiting it,
  // then snapping to 100% when the response lands.
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopProgress = () => {
    if (progressTimer.current !== null) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  };

  // Clear any running timer if the component unmounts mid-send.
  useEffect(() => stopProgress, []);

  // ─── Shared send runner ─────────────────────────────────────────────────────
  // Sends `targets` through the (unchanged) /api/send-emails endpoint, animates
  // progress, and folds the outcome into a cumulative summary. Used by both the
  // initial send and the retry-failed pass.
  async function runSend(
    targets: ParticipantRow[],
    opts: { isRetry: boolean; priorSent: number; total: number; attempt: number }
  ) {
    const count = targets.length;
    setSendState({ status: "sending", done: 0, total: count, isRetry: opts.isRetry });

    // Simulated progress: tick toward 90% at a rate scaled to the batch size.
    stopProgress();
    const cap = Math.max(1, Math.floor(count * 0.9));
    const stepMs = Math.min(220, Math.max(60, Math.round(1400 / count)));
    let done = 0;
    progressTimer.current = setInterval(() => {
      done = Math.min(cap, done + 1);
      setSendState({ status: "sending", done, total: count, isRetry: opts.isRetry });
    }, stepMs);

    try {
      const response = await fetch("/api/send-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: state.subject,
          body: state.body,
          participants: targets,
        }),
      });

      const data: SendEmailsResponseBody & { error?: string } =
        await response.json();

      stopProgress();

      // Hard failures (bad key, validation) carry an `error` and no `sent`
      // field. Batch results — including the all-failed 500 — always carry a
      // numeric `sent`, so they flow through to the summary below.
      if (!response.ok && typeof data.sent !== "number") {
        setSendState({
          status: "error",
          message: data.error ?? "Send failed. Please try again.",
        });
        return;
      }

      // Snap to 100% before revealing the summary.
      setSendState({ status: "sending", done: count, total: count, isRetry: opts.isRetry });
      await new Promise<void>((r) => setTimeout(r, 350));

      setSendState({
        status: "done",
        summary: {
          total: opts.total,
          sent: opts.priorSent + (data.sent ?? 0),
          failures: data.failures ?? [],
          attempts: opts.attempt,
        },
      });
    } catch (err) {
      stopProgress();
      const message =
        err instanceof Error
          ? err.message
          : "Network error — could not reach the send endpoint.";
      setSendState({ status: "error", message });
    }
  }

  // ─── Initial send ──────────────────────────────────────────────────────────

  async function handleSend() {
    if (state.subject.trim() === "") {
      setSendState({ status: "error", message: "Subject cannot be empty." });
      return;
    }
    if (state.body.trim() === "") {
      setSendState({ status: "error", message: "Message body cannot be empty." });
      return;
    }
    if (validCount === 0) {
      setSendState({
        status: "error",
        message: "No participants with valid email addresses to send to.",
      });
      return;
    }

    await runSend(participants, {
      isRetry: false,
      priorSent: 0,
      total: validCount,
      attempt: 1,
    });
  }

  // ─── Retry only the failed recipients ───────────────────────────────────────
  // Re-sends through the same endpoint with the participant subset whose emails
  // failed, preserving the cumulative sent count and success-rate denominator.
  async function handleRetry() {
    if (sendState.status !== "done") return;
    const { summary } = sendState;

    const failedEmails = new Set(
      summary.failures.map((f) => f.email.toLowerCase())
    );
    const retryTargets = participants.filter(
      (p) => p.emailValid && failedEmails.has(p.email.toLowerCase())
    );

    if (retryTargets.length === 0) {
      setSendState({
        status: "error",
        message: "Could not match the failed addresses back to participants.",
      });
      return;
    }

    await runSend(retryTargets, {
      isRetry: true,
      priorSent: summary.sent,
      total: summary.total,
      attempt: summary.attempts + 1,
    });
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs uppercase tracking-widest text-mist">
          Email Composer
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <ScopeSelector
            scope={activeScope}
            onChange={onScopeChange}
            counts={{
              all: scopeSets.all.length,
              filtered: scopeSets.filtered.length,
              selected: scopeSets.selected.length,
            }}
            filtersActive={filtersActive}
            label="email recipients"
          />
          <span className="text-xs text-mist">
            <span className="text-lilac">{validCount}</span> valid recipient
            {validCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Two-column layout: composer left, preview right */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ── Left column: editor ────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Subject */}
          <div className="space-y-1.5">
            <label
              htmlFor="email-subject"
              className="text-xs uppercase tracking-wider text-mist"
            >
              Subject
            </label>
            <input
              id="email-subject"
              type="text"
              value={state.subject}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="Email subject line…"
              disabled={isSending}
              className="w-full rounded border border-lilac/30 bg-lilac/5 px-3 py-2 text-sm text-haze placeholder-mist/40 outline-none transition-colors focus:border-lilac/60 focus:bg-lilac/8 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <label
              htmlFor="email-body"
              className="text-xs uppercase tracking-wider text-mist"
            >
              Message Body
            </label>
            <textarea
              id="email-body"
              value={state.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder="Write your email message here…"
              rows={12}
              disabled={isSending}
              className="w-full resize-y rounded border border-lilac/30 bg-lilac/5 px-3 py-2.5 text-xs leading-relaxed text-haze placeholder-mist/40 outline-none transition-colors focus:border-lilac/60 focus:bg-lilac/8 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Personalisation checkboxes */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-mist">
              Personalisation
            </p>
            <CheckboxField
              id="personalize-name"
              label="Personalise using participant name"
              hint="Enables {{name}} and {{full_name}} tokens in subject and body"
              checked={state.personalizeName}
              onChange={(v) => set("personalizeName", v)}
            />
            <CheckboxField
              id="include-team"
              label="Include Team Number"
              hint="Enables {{team}} token and shows team in the preview header"
              checked={state.includeTeamNumber}
              onChange={(v) => set("includeTeamNumber", v)}
            />
          </div>

          {/* Token reference */}
          <div className="rounded border border-lilac/15 bg-void px-4 py-3">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-mist">
              Available tokens
            </p>
            <div className="flex flex-wrap gap-2">
              <TokenChip
                token="{{name}}"
                description="First name"
                active={state.personalizeName}
              />
              <TokenChip
                token="{{full_name}}"
                description="Full name"
                active={state.personalizeName}
              />
              <TokenChip
                token="{{team}}"
                description="Team number"
                active={state.includeTeamNumber}
              />
            </div>
          </div>

          {/* ── Send controls ─────────────────────────────────────────────── */}
          <div className="space-y-3 pt-1">
            {/* Progress bar — only while sending */}
            {sendState.status === "sending" && (
              <ProgressBar
                done={sendState.done}
                total={sendState.total}
                isRetry={sendState.isRetry}
              />
            )}

            {/* Results panel — after completion */}
            {sendState.status === "done" && (
              <SendResults
                summary={sendState.summary}
                onRetry={handleRetry}
                onReset={() => setSendState({ status: "idle" })}
              />
            )}

            {/* Inline error */}
            {sendState.status === "error" && (
              <div className="rounded border border-magenta/40 bg-magenta/5 px-4 py-3">
                <p className="text-xs font-semibold text-magenta">
                  {sendState.message}
                </p>
                <button
                  type="button"
                  onClick={() => setSendState({ status: "idle" })}
                  className="mt-2 text-[10px] uppercase tracking-wider text-lilac hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Button row */}
            <div className="flex items-center gap-3">
              {/* Mobile preview toggle */}
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="rounded border border-lilac/40 px-5 py-2 text-xs uppercase tracking-wider text-lilac transition-colors hover:bg-lilac/10 lg:hidden"
              >
                {showPreview ? "Hide Preview" : "Preview Email"}
              </button>

              {/* Send Emails — live, disabled only while in-flight or done */}
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || sendState.status === "done"}
                className={[
                  "flex items-center gap-2 rounded border px-5 py-2 text-xs uppercase tracking-wider transition-colors",
                  isSending || sendState.status === "done"
                    ? "cursor-not-allowed border-mist/20 bg-mist/5 text-mist/40"
                    : "border-magenta/50 bg-magenta/10 text-magenta hover:bg-magenta/20",
                ].join(" ")}
              >
                {isSending ? (
                  <>
                    <span className="inline-block animate-spin">⟳</span>
                    Sending…
                  </>
                ) : (
                  "Send Emails"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right column: live preview ──────────────────────────────────── */}
        <div className={showPreview ? "block" : "hidden lg:block"}>
          <PreviewPanel
            subject={state.subject}
            body={state.body}
            participant={previewParticipant}
            opts={{
              personalizeName: state.personalizeName,
              includeTeamNumber: state.includeTeamNumber,
            }}
          />
        </div>
      </div>
    </div>
  );
}

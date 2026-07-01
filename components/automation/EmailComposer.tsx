"use client";

import { useState, useMemo } from "react";
import type { ParticipantRow } from "@/lib/automationTypes";
import type { SendEmailsResponseBody } from "@/lib/email";

// ─── Send lifecycle type ──────────────────────────────────────────────────────

type SendState =
  | { status: "idle" }
  | { status: "sending"; done: number; total: number }
  | { status: "done"; result: SendEmailsResponseBody }
  | { status: "error"; message: string };

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmailComposerProps {
  /** Full parsed participant list. Preview always uses index 0. */
  participants: ParticipantRow[];
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

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-lilac">Sending…</span>
        <span className="tabular-nums text-mist">
          {done} / {total}
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

function SendResults({
  result,
  onReset,
}: {
  result: SendEmailsResponseBody;
  onReset: () => void;
}) {
  const allGood = result.failed === 0;
  return (
    <div
      className={[
        "rounded border p-4 space-y-3",
        allGood
          ? "border-lilac/30 bg-lilac/5"
          : "border-magenta/30 bg-magenta/5",
      ].join(" ")}
    >
      {/* Summary row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-lilac">
            ✔ Sent: {result.sent}
          </span>
          {result.failed > 0 && (
            <span className="font-semibold text-magenta">
              ❌ Failed: {result.failed}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-lilac/30 px-3 py-1 text-xs uppercase tracking-wider text-lilac hover:bg-lilac/10 transition-colors"
        >
          Send Again
        </button>
      </div>

      {/* Failure details */}
      {result.failures.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-mist">
            Failed addresses
          </p>
          <ul className="max-h-32 overflow-y-auto space-y-1">
            {result.failures.map((f) => (
              <li key={f.email} className="flex items-start gap-2 text-xs">
                <span className="shrink-0 text-magenta">✕</span>
                <span className="text-haze">{f.email}</span>
                <span className="text-mist">— {f.error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EmailComposer({ participants }: EmailComposerProps) {
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

  // ─── Send handler ─────────────────────────────────────────────────────────

  async function handleSend() {
    // Guard: validate before firing the request
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

    const total = validCount;
    setSendState({ status: "sending", done: 0, total });

    try {
      const response = await fetch("/api/send-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: state.subject,
          body: state.body,
          participants,
        }),
      });

      // The API always returns JSON, even on error statuses
      const data: SendEmailsResponseBody & { error?: string } =
        await response.json();

      if (!response.ok && data.error) {
        // Hard failure before any sends (bad key, empty participants, etc.)
        setSendState({ status: "error", message: data.error });
        return;
      }

      // Animate progress bar to 100% before showing results
      setSendState({ status: "sending", done: total, total });
      await new Promise<void>((r) => setTimeout(r, 400));

      setSendState({ status: "done", result: data });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Network error — could not reach the send endpoint.";
      setSendState({ status: "error", message });
    }
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-widest text-mist">
          Email Composer
        </h2>
        <span className="text-xs text-mist">
          <span className="text-lilac">{validCount}</span> valid recipient
          {validCount !== 1 ? "s" : ""}
        </span>
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
              />
            )}

            {/* Results panel — after completion */}
            {sendState.status === "done" && (
              <SendResults
                result={sendState.result}
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

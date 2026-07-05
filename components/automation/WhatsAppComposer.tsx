"use client";

import { useMemo, useState } from "react";
import {
  buildWhatsAppTargets,
  WHATSAPP_TOKENS,
  type WhatsAppTarget,
} from "@/lib/whatsapp";
import {
  effectiveScope,
  resolveScope,
  type ScopeMode,
  type ScopeSets,
} from "@/lib/scope";
import ScopeSelector from "@/components/automation/ScopeSelector";

// ─── Props ─────────────────────────────────────────────────────────────────

interface WhatsAppComposerProps {
  /** All/filtered/selected participant lists the links can target. */
  scopeSets: ScopeSets;
  /** Which set is currently targeted. */
  scope: ScopeMode;
  onScopeChange: (mode: ScopeMode) => void;
  /** Whether the filtered view differs from all (controls the Filtered option). */
  filtersActive: boolean;
}

const DEFAULT_TEMPLATE = `Hi {{name}}! 👋

This is the Byte Brainiacs team. You're registered for the hackathon as part of team {{team}} ({{college}}).

Please arrive 15 minutes early and bring a valid college ID. Reply here if you have any questions.

See you there! 🚀`;

const PAGE_SIZE = 20;

// ─── Token chip ──────────────────────────────────────────────────────────────

function TokenChip({ token, description }: { token: string; description: string }) {
  return (
    <span
      title={`Inserts: ${description}`}
      className="inline-flex items-center gap-1 rounded bg-lilac/15 px-2 py-0.5 font-mono text-[10px] text-lilac"
    >
      {token}
    </span>
  );
}

// ─── Preview panel ─────────────────────────────────────────────────────────

function PreviewPanel({
  target,
}: {
  target: WhatsAppTarget | null;
}) {
  return (
    <div className="flex flex-col rounded border border-lilac/20 bg-lilac/[0.03]">
      <div className="flex items-center justify-between border-b border-lilac/20 px-4 py-3">
        <span className="text-xs uppercase tracking-widest text-mist">
          Live Preview
        </span>
        <span className="rounded bg-lilac/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-lilac">
          First messageable
        </span>
      </div>

      {target ? (
        <div className="flex flex-1 flex-col">
          {/* Recipient chrome */}
          <div className="flex items-baseline gap-2 border-b border-lilac/10 px-4 py-2.5">
            <span className="w-12 shrink-0 text-xs uppercase tracking-wider text-mist">
              To
            </span>
            <span className="truncate text-xs text-haze">
              {target.participant.participant || "—"}
              <span className="ml-1 text-mist">
                +{target.phone}
              </span>
            </span>
          </div>

          {/* WhatsApp-style bubble */}
          <div className="min-h-[180px] flex-1 overflow-y-auto bg-void/40 px-4 py-4">
            <div className="max-w-[85%] rounded-lg rounded-tl-sm border border-lilac/20 bg-lilac/10 px-3 py-2">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-haze/90">
                {target.message}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[220px] flex-1 items-center justify-center px-6 text-center">
          <p className="text-xs italic text-mist/60">
            No participant has a valid mobile number, so there is nothing to
            preview yet.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Recipient row ───────────────────────────────────────────────────────────

function RecipientRow({ target }: { target: WhatsAppTarget }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-lilac/10 px-4 py-2.5 last:border-0 hover:bg-lilac/5">
      <div className="min-w-0">
        <p className="truncate text-xs text-haze">
          {target.participant.participant || "—"}
        </p>
        <p className="truncate text-[11px] text-mist">
          {target.participant.teamNumber && (
            <span className="text-lilac">{target.participant.teamNumber}</span>
          )}
          {target.participant.teamNumber ? " · " : ""}
          +{target.phone}
        </p>
      </div>
      <a
        href={target.link ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded border border-lilac/40 px-3 py-1.5 text-[10px] uppercase tracking-wider text-lilac transition-colors hover:bg-lilac/10"
      >
        Open Chat ↗
      </a>
    </li>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function WhatsAppComposer({
  scopeSets,
  scope,
  onScopeChange,
  filtersActive,
}: WhatsAppComposerProps) {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [showPreview, setShowPreview] = useState(false);
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState(false);

  // Guard against a stale scope, then resolve which participants get links.
  const activeScope = effectiveScope(scope, scopeSets, filtersActive);
  const participants = useMemo(
    () => resolveScope(activeScope, scopeSets),
    [activeScope, scopeSets]
  );

  // Resolve every participant to a link. Recomputes as the template changes so
  // the preview + list stay live.
  const targets = useMemo(
    () => buildWhatsAppTargets(template, participants),
    [template, participants]
  );

  const messageable = useMemo(
    () => targets.filter((t) => t.link !== null),
    [targets]
  );
  const skipped = targets.length - messageable.length;

  const previewTarget = messageable[0] ?? null;

  const totalPages = Math.max(1, Math.ceil(messageable.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = messageable.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // "Copy all links" — one wa.me link per line, ready to paste into a sheet.
  async function copyAllLinks() {
    const text = messageable
      .map((t) => `${t.participant.participant}\t${t.link}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable (insecure context) — fail silently.
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs uppercase tracking-widest text-mist">
          WhatsApp Composer
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
            label="WhatsApp recipients"
          />
          <span className="text-xs text-mist">
            <span className="text-lilac">{messageable.length}</span> messageable
            {skipped > 0 && (
              <>
                {" · "}
                <span className="text-magenta/80">{skipped}</span> skipped
              </>
            )}
          </span>
        </div>
      </div>

      {/* Two-column: editor + preview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: editor */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="wa-template"
              className="text-xs uppercase tracking-wider text-mist"
            >
              Message Template
            </label>
            <textarea
              id="wa-template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Write your WhatsApp message here…"
              rows={12}
              className="w-full resize-y rounded border border-lilac/30 bg-lilac/5 px-3 py-2.5 font-mono text-xs leading-relaxed text-haze placeholder-mist/40 outline-none transition-colors focus:border-lilac/60"
            />
          </div>

          {/* Token reference */}
          <div className="rounded border border-lilac/15 bg-void px-4 py-3">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-mist">
              Available tokens
            </p>
            <div className="flex flex-wrap gap-2">
              {WHATSAPP_TOKENS.map((t) => (
                <TokenChip key={t.token} {...t} />
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="rounded border border-lilac/40 px-5 py-2 text-xs uppercase tracking-wider text-lilac transition-colors hover:bg-lilac/10 lg:hidden"
            >
              {showPreview ? "Hide Preview" : "Preview Message"}
            </button>

            <button
              type="button"
              onClick={copyAllLinks}
              disabled={messageable.length === 0}
              className={[
                "rounded border px-5 py-2 text-xs uppercase tracking-wider transition-colors",
                messageable.length === 0
                  ? "cursor-not-allowed border-mist/20 bg-mist/5 text-mist/40"
                  : "border-magenta/50 bg-magenta/10 text-magenta hover:bg-magenta/20",
              ].join(" ")}
            >
              {copied ? "✔ Copied" : "Copy All Links"}
            </button>
          </div>

          {skipped > 0 && (
            <p className="text-xs leading-relaxed text-mist">
              {skipped} participant{skipped === 1 ? "" : "s"} ha
              {skipped === 1 ? "s" : "ve"} no valid mobile number and cannot be
              messaged. Fix their numbers in the source CSV and re-import to
              include them.
            </p>
          )}
        </div>

        {/* Right: preview */}
        <div className={showPreview ? "block" : "hidden lg:block"}>
          <PreviewPanel target={previewTarget} />
        </div>
      </div>

      {/* Recipient list */}
      {messageable.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-mist">
            Recipients
          </p>
          <div className="overflow-hidden rounded border border-lilac/20">
            <ul>
              {pageItems.map((t) => (
                <RecipientRow key={t.participant.email || t.phone} target={t} />
              ))}
            </ul>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-mist">
              <span>
                Showing {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, messageable.length)} of{" "}
                {messageable.length}
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
      )}
    </div>
  );
}

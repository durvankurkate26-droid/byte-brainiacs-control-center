// ─── lib/highlight.tsx ───────────────────────────────────────────────────────
// Wraps occurrences of a search query inside a string with <mark> so matches
// stand out in tables and lists. Case-insensitive, safe against regex-special
// characters in the query. Returns the original string untouched when the query
// is empty, so callers can use it unconditionally. Client-safe.

import type { ReactNode } from "react";

/** Escapes regex metacharacters so a raw user query is matched literally. */
function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Splits `text` on the (case-insensitive) `query` and wraps each match in a
 * lilac <mark>. Non-string safety: a blank query returns the text as-is.
 */
export function highlight(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q || !text) return text;

  const re = new RegExp(`(${escapeRegExp(q)})`, "ig");
  const parts = text.split(re);

  // split() with a capturing group keeps the delimiters at odd indices.
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark
        key={i}
        className="rounded-sm bg-lilac/30 text-haze"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

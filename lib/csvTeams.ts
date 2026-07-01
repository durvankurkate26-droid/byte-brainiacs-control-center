import type { ParticipantRow, CsvTeam } from "@/lib/automationTypes";

/**
 * Groups participant rows by Team Number and returns a sorted array of CsvTeam.
 * Each team's members list preserves the order they appear in the CSV.
 */
export function groupByTeam(rows: ParticipantRow[]): CsvTeam[] {
  const map = new Map<string, string[]>();

  for (const row of rows) {
    const id = row.teamNumber.trim();
    if (!id) continue;
    const existing = map.get(id);
    if (existing) {
      existing.push(row.participant);
    } else {
      map.set(id, [row.participant]);
    }
  }

  return Array.from(map.entries())
    .map(([teamId, members]) => ({ teamId, members }))
    .sort((a, b) =>
      a.teamId.localeCompare(b.teamId, undefined, { numeric: true })
    );
}

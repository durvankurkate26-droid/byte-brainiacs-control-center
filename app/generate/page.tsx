import { supabase } from "@/lib/supabaseClient";
import { toParticipantRows } from "@/lib/participantView";
import { groupByTeam } from "@/lib/csvTeams";
import type { Participant } from "@/lib/types";
import CsvQRCard from "@/components/CsvQRCard";
import PrintButton from "@/components/PrintButton";

// QR codes are generated from the imported participants (the single source of
// truth), so always read fresh data — the roster changes as CSVs are imported.
export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .order("team_number", { ascending: true });

  if (error) {
    return (
      <div className="rounded border border-magenta/30 bg-magenta/5 p-6 text-magenta">
        Failed to load participants: {error.message}
      </div>
    );
  }

  const rows = toParticipantRows((data as Participant[]) ?? []);
  const teams = groupByTeam(rows);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-haze">
            QR Codes
          </h1>
          <p className="mt-1 text-sm text-mist">
            {teams.length > 0
              ? `${teams.length} teams · one QR per team · from the imported participant database`
              : "Import participants in the Control Center to generate one QR code per team."}
          </p>
        </div>

        {teams.length > 0 && (
          <div className="flex items-center gap-3 print:hidden">
            <PrintButton />
          </div>
        )}
      </div>

      {/* Empty state */}
      {teams.length === 0 && (
        <div className="rounded border border-lilac/20 p-8 text-center text-mist">
          No teams found. Head to the{" "}
          <a href="/automation" className="text-lilac hover:underline">
            Control Center
          </a>{" "}
          and import your participant CSV first.
        </div>
      )}

      {/* QR grid */}
      {teams.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {teams.map((team) => (
            <CsvQRCard key={team.teamId} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}

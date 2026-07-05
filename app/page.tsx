import { supabase } from "@/lib/supabaseClient";
import { toParticipantRows } from "@/lib/participantView";
import type { Participant } from "@/lib/types";
import TeamTable from "@/components/TeamTable";

// Always fetch fresh data — attendance changes constantly during check-in.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Load teams (attendance source of truth) plus participants so a team row can
  // open a details view with members, registration types, and colleges.
  const [teamsRes, participantsRes] = await Promise.all([
    supabase.from("teams").select("*").order("team_id", { ascending: true }),
    supabase
      .from("participants")
      .select("*")
      .order("team_number", { ascending: true }),
  ]);

  if (teamsRes.error) {
    return (
      <div className="rounded border border-magenta/30 bg-magenta/5 p-6 text-magenta">
        Failed to load teams: {teamsRes.error.message}
      </div>
    );
  }

  const teams = teamsRes.data ?? [];
  const participants = toParticipantRows(
    (participantsRes.data as Participant[]) ?? []
  );

  const total = teams.length;
  const present = teams.filter((t) => t.attendance).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-haze">
          Team Attendance
        </h1>
        <p className="mt-1 text-sm text-mist">
          {present} / {total} teams checked in
          {total > 0 && " · click a team for details"}
        </p>
      </div>
      <TeamTable teams={teams} participants={participants} />
    </div>
  );
}

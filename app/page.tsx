import { supabase } from "@/lib/supabaseClient";
import TeamTable from "@/components/TeamTable";

// Always fetch fresh data — attendance changes constantly during check-in.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { data: teams, error } = await supabase
    .from("teams")
    .select("*")
    .order("team_id", { ascending: true });

  if (error) {
    return (
      <div className="rounded border border-magenta/30 bg-magenta/5 p-6 text-magenta">
        Failed to load teams: {error.message}
      </div>
    );
  }

  const total = teams?.length ?? 0;
  const present = teams?.filter((t) => t.attendance).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-haze">
          Team Attendance
        </h1>
        <p className="mt-1 text-sm text-mist">
          {present} / {total} teams checked in
        </p>
      </div>
      <TeamTable teams={teams ?? []} />
    </div>
  );
}

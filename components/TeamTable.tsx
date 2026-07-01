import type { Team } from "@/lib/types";

function formatTime(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function TeamTable({ teams }: { teams: Team[] }) {
  if (teams.length === 0) {
    return (
      <div className="rounded border border-lilac/20 p-8 text-center text-mist">
        No teams found. Run the seed SQL in Supabase to add sample data.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-lilac/20">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead>
          <tr className="border-b border-lilac/20 bg-lilac/5 text-xs uppercase tracking-wider text-mist">
            <th className="px-4 py-3">Team ID</th>
            <th className="px-4 py-3">Team Name</th>
            <th className="px-4 py-3">Participants</th>
            <th className="px-4 py-3">Attendance</th>
            <th className="px-4 py-3">Check-In Time</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr
              key={team.team_id}
              className="border-b border-lilac/10 last:border-0 hover:bg-lilac/5"
            >
              <td className="px-4 py-3 font-semibold text-lilac">
                {team.team_id}
              </td>
              <td className="px-4 py-3">{team.team_name}</td>
              <td className="px-4 py-3 text-mist">
                {[team.participant_1, team.participant_2, team.participant_3]
                  .filter(Boolean)
                  .join(", ")}
              </td>
              <td className="px-4 py-3">
                {team.attendance ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-magenta/15 px-2.5 py-1 text-xs font-medium text-magenta">
                    ✓ Present
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-mist/15 px-2.5 py-1 text-xs font-medium text-mist">
                    Pending
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-mist">
                {formatTime(team.checkin_time)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

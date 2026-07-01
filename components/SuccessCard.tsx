import type { Team } from "@/lib/types";

interface SuccessCardProps {
  team: Team;
  alreadyMarked: boolean;
  onScanAnother: () => void;
}

function formatTime(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function SuccessCard({
  team,
  alreadyMarked,
  onScanAnother,
}: SuccessCardProps) {
  const participants = [
    team.participant_1,
    team.participant_2,
    team.participant_3,
  ].filter(Boolean) as string[];

  return (
    <div
      className={`rounded border p-6 text-center ${
        alreadyMarked
          ? "border-mist/30 bg-mist/5"
          : "border-magenta/40 bg-magenta/5"
      }`}
    >
      <p
        className={`text-lg font-bold ${
          alreadyMarked ? "text-mist" : "text-magenta"
        }`}
      >
        {alreadyMarked ? "Attendance Already Marked" : "✓ Attendance Marked"}
      </p>

      <div className="mt-5 space-y-2 text-left text-sm">
        <Row label="Team Name" value={team.team_name} />
        <Row label="Team ID" value={team.team_id} />
        <div>
          <p className="text-xs uppercase tracking-wider text-mist">
            Participants
          </p>
          <ul className="mt-1 list-inside list-disc text-haze">
            {participants.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <Row label="Check-In Time" value={formatTime(team.checkin_time)} />
      </div>

      <button
        onClick={onScanAnother}
        className="mt-6 rounded border border-lilac/40 px-5 py-2 text-xs uppercase tracking-wider text-lilac hover:bg-lilac/10"
      >
        Scan Another
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-lilac/10 py-1.5">
      <span className="text-xs uppercase tracking-wider text-mist">
        {label}
      </span>
      <span className="font-medium text-haze">{value}</span>
    </div>
  );
}

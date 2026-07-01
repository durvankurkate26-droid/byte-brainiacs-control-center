import type { CsvStats } from "@/lib/automationTypes";

interface StatCardProps {
  label: string;
  value: number;
  accent: "lilac" | "magenta" | "haze" | "mist";
  icon: string;
}

// Maps accent name → Tailwind classes. Defined as a lookup so we never
// construct dynamic class strings that Tailwind's JIT might not include.
const ACCENT_CLASSES: Record<
  StatCardProps["accent"],
  { border: string; bg: string; value: string; icon: string }
> = {
  lilac: {
    border: "border-lilac/30",
    bg: "bg-lilac/5",
    value: "text-lilac",
    icon: "bg-lilac/15 text-lilac",
  },
  magenta: {
    border: "border-magenta/30",
    bg: "bg-magenta/5",
    value: "text-magenta",
    icon: "bg-magenta/15 text-magenta",
  },
  haze: {
    border: "border-haze/20",
    bg: "bg-haze/5",
    value: "text-haze",
    icon: "bg-haze/10 text-haze",
  },
  mist: {
    border: "border-mist/30",
    bg: "bg-mist/5",
    value: "text-mist",
    icon: "bg-mist/10 text-mist",
  },
};

function StatCard({ label, value, accent, icon }: StatCardProps) {
  const c = ACCENT_CLASSES[accent];
  return (
    <div
      className={`flex items-center gap-4 rounded border ${c.border} ${c.bg} px-5 py-4`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded ${c.icon} text-lg`}>
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-mist">{label}</p>
        <p className={`mt-0.5 text-2xl font-bold tabular-nums ${c.value}`}>
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default function StatsPreview({ stats }: { stats: CsvStats }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs uppercase tracking-widest text-mist">
        CSV Preview
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Participants"
          value={stats.totalParticipants}
          accent="lilac"
          icon="◈"
        />
        <StatCard
          label="Total Teams"
          value={stats.totalTeams}
          accent="magenta"
          icon="⬡"
        />
        <StatCard
          label="Valid Emails"
          value={stats.validEmails}
          accent="haze"
          icon="@"
        />
        <StatCard
          label="Valid Phones"
          value={stats.validPhones}
          accent="mist"
          icon="✆"
        />
      </div>
    </div>
  );
}

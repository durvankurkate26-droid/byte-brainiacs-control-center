type Accent = "lilac" | "magenta" | "mist";

interface ActivityItem {
  icon: string;
  label: string;
  detail: string;
  accent: Accent;
}

const ACCENT_CLASSES: Record<Accent, string> = {
  lilac: "bg-lilac/15 text-lilac",
  magenta: "bg-magenta/15 text-magenta",
  mist: "bg-mist/10 text-mist",
};

const PLACEHOLDER_ITEMS: ActivityItem[] = [
  {
    icon: "⇩",
    label: "CSV Uploaded",
    detail: "participants.csv · just now",
    accent: "lilac",
  },
  {
    icon: "⬡",
    label: "QR Generated",
    detail: "24 QR cards created",
    accent: "magenta",
  },
  {
    icon: "@",
    label: "Emails Sent",
    detail: "48 participants notified",
    accent: "lilac",
  },
  {
    icon: "◈",
    label: "Attendance Started",
    detail: "Scanner opened",
    accent: "mist",
  },
];

export default function RecentActivity() {
  return (
    <div className="rounded border border-lilac/20 bg-lilac/[0.03] p-5">
      <div className="flex items-center gap-2">
        <span className="text-lilac">◈</span>
        <h2 className="text-xs uppercase tracking-widest text-mist">
          Recent Activity
        </h2>
      </div>

      <hr className="my-4 border-lilac/10" />

      <ul className="space-y-3">
        {PLACEHOLDER_ITEMS.map((item) => (
          <li key={item.label} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm ${ACCENT_CLASSES[item.accent]}`}
            >
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-haze">{item.label}</p>
              <p className="truncate text-xs text-mist">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-center text-[10px] uppercase tracking-wider text-mist/40">
        Placeholder · Live feed coming soon
      </p>
    </div>
  );
}

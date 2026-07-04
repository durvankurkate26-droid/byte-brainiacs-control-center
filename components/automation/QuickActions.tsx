"use client";

type StatusType = "Ready" | "Coming Soon";

interface ActionCardProps {
  icon: string;
  title: string;
  description: string;
  status: StatusType;
  /** Internal route or in-page anchor. Omitted for "Coming Soon" cards. */
  href?: string;
}

function ActionCard({ icon, title, description, status, href }: ActionCardProps) {
  const isReady = status === "Ready";

  const inner = (
    <div
      className={[
        "flex h-full flex-col gap-3 rounded-lg border p-5 transition-all duration-150",
        isReady
          ? "border-lilac/30 bg-lilac/[0.03] hover:border-lilac/60 hover:bg-lilac/5 cursor-pointer"
          : "border-mist/15 bg-mist/[0.02] cursor-default opacity-60",
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded text-lg ${
            isReady ? "bg-lilac/15 text-lilac" : "bg-mist/10 text-mist"
          }`}
        >
          {icon}
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider font-medium ${
            isReady ? "bg-magenta/15 text-magenta" : "bg-mist/10 text-mist"
          }`}
        >
          {status}
        </span>
      </div>

      <div>
        <p className="text-sm font-semibold text-haze">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-mist">{description}</p>
      </div>
    </div>
  );

  if (isReady && href) {
    return (
      <a href={href} className="block h-full">
        {inner}
      </a>
    );
  }
  return inner;
}

const ACTIONS: ActionCardProps[] = [
  {
    icon: "⬡",
    title: "Generate QR Codes",
    description: "Generate QR cards for every team in the participant database.",
    status: "Ready",
    href: "/generate",
  },
  {
    icon: "@",
    title: "Send Emails",
    description:
      "Send personalized registration emails using the imported participant list.",
    status: "Ready",
    href: "#email-composer",
  },
  {
    icon: "✆",
    title: "WhatsApp",
    description: "Generate personalized WhatsApp messages using participant data.",
    status: "Ready",
    href: "#whatsapp-composer",
  },
  {
    icon: "◈",
    title: "Attendance",
    description: "Open the QR scanner and mark team attendance.",
    status: "Ready",
    href: "/checkin",
  },
];

export default function QuickActions() {
  return (
    <div className="space-y-3">
      <h2 className="text-xs uppercase tracking-widest text-mist">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ACTIONS.map((action) => (
          <ActionCard key={action.title} {...action} />
        ))}
      </div>
    </div>
  );
}

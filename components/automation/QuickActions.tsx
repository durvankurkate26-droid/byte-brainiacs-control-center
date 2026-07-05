"use client";

import Link from "next/link";

// Premium feature cards for the dashboard overview. Each is a large-icon tile
// with a description and a hover lift, linking to the relevant dashboard page.

interface ActionCardProps {
  icon: string;
  title: string;
  description: string;
  href: string;
  accent: "lilac" | "magenta";
}

const ACTIONS: ActionCardProps[] = [
  {
    icon: "⬡",
    title: "Generate QR",
    description: "One printable QR card per team, straight from the database.",
    href: "/dashboard/qr",
    accent: "lilac",
  },
  {
    icon: "@",
    title: "Send Email",
    description: "Personalized registration emails to any participant scope.",
    href: "/dashboard/communication#email-composer",
    accent: "magenta",
  },
  {
    icon: "✆",
    title: "WhatsApp",
    description: "Click-to-chat links personalized with participant data.",
    href: "/dashboard/communication#whatsapp-composer",
    accent: "lilac",
  },
  {
    icon: "◈",
    title: "Attendance",
    description: "Open the scanner and mark team attendance live.",
    href: "/dashboard/attendance",
    accent: "magenta",
  },
];

function ActionCard({ icon, title, description, href, accent }: ActionCardProps) {
  const iconBg =
    accent === "magenta"
      ? "bg-magenta/15 text-magenta group-hover:bg-magenta/25"
      : "bg-lilac/15 text-lilac group-hover:bg-lilac/25";

  return (
    <Link href={href} className="group block h-full">
      <div className="card-hover flex h-full flex-col gap-4 p-6">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl font-mono text-2xl transition-all duration-200 group-hover:scale-105 ${iconBg}`}
        >
          {icon}
        </div>
        <div className="space-y-1.5">
          <p className="font-heading text-lg font-semibold text-haze">{title}</p>
          <p className="text-sm leading-relaxed text-mist">{description}</p>
        </div>
        <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-lilac opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100">
          Open <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {ACTIONS.map((action) => (
        <ActionCard key={action.title} {...action} />
      ))}
    </div>
  );
}

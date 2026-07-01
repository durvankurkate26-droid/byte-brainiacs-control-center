"use client";

import { QRCodeSVG } from "qrcode.react";
import type { CsvTeam } from "@/lib/automationTypes";

export default function CsvQRCard({ team }: { team: CsvTeam }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded border border-lilac/20 bg-lilac/5 p-5 text-center">
      <div className="rounded bg-haze p-3">
        <QRCodeSVG value={team.teamId} size={140} level="M" />
      </div>
      <div>
        <p className="text-sm font-semibold text-lilac">{team.teamId}</p>
        <p className="mt-1 text-xs leading-relaxed text-mist">
          {team.members.join(" · ")}
        </p>
      </div>
    </div>
  );
}

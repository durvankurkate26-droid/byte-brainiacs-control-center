"use client";

import { QRCodeSVG } from "qrcode.react";
import type { Team } from "@/lib/types";

export default function QRCard({ team }: { team: Team }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded border border-lilac/20 bg-lilac/5 p-5 text-center">
      <div className="rounded bg-haze p-3">
        <QRCodeSVG value={team.team_id} size={140} level="M" />
      </div>
      <div>
        <p className="text-sm font-semibold text-lilac">{team.team_id}</p>
        <p className="text-xs text-mist">{team.team_name}</p>
      </div>
    </div>
  );
}

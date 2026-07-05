"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { groupByTeam } from "@/lib/csvTeams";
import PageHeader from "@/components/ui/PageHeader";
import CsvQRCard from "@/components/CsvQRCard";
import PrintButton from "@/components/PrintButton";
import EmptyState from "@/components/dashboard/EmptyState";

// QR grid skeleton shown while the roster loads.
function QrSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="card h-56 animate-pulse"
          style={{ opacity: 1 - i * 0.06 }}
        />
      ))}
    </div>
  );
}

export default function QrCenterPage() {
  const { participants, loading } = useDashboard();
  const teams = useMemo(() => groupByTeam(participants), [participants]);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="QR Center"
        title="QR Codes"
        description={
          teams.length > 0
            ? `${teams.length} teams · one QR per team · generated from the participant database.`
            : "Generate one QR code per team from the imported participant database."
        }
        actions={teams.length > 0 ? <PrintButton /> : undefined}
      />

      {loading ? (
        <QrSkeleton />
      ) : teams.length === 0 ? (
        <EmptyState
          icon="⬡"
          title="No QR codes yet"
          message="Import your participant CSV to sync teams. A printable QR card is generated automatically for every team."
          action={
            <Link href="/dashboard/participants" className="btn-primary mt-2">
              Import Participants
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {teams.map((team) => (
            <CsvQRCard key={team.teamId} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}

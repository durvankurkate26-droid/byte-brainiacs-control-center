"use client";

import { useDashboard } from "@/components/dashboard/DashboardProvider";
import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import EmailComposer from "@/components/automation/EmailComposer";
import WhatsAppComposer from "@/components/automation/WhatsAppComposer";
import EmptyState from "@/components/dashboard/EmptyState";
import Link from "next/link";

export default function CommunicationPage() {
  const {
    participants,
    loading,
    workspace,
    scopeSets,
    emailScope,
    setEmailScope,
    waScope,
    setWaScope,
  } = useDashboard();

  const hasParticipants = participants.length > 0;

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Outreach"
        title="Communication"
        description="Compose personalized email and WhatsApp messages for all, filtered, or selected participants."
      />

      {!loading && !hasParticipants ? (
        <EmptyState
          icon="@"
          title="No participants to message"
          message="Import your registration CSV first — the email and WhatsApp composers read recipients straight from the participant database."
          action={
            <Link href="/dashboard/participants" className="btn-primary mt-2">
              Import Participants
            </Link>
          }
        />
      ) : (
        <>
          {/* Email */}
          <Section
            id="email-composer"
            title="Email Composer"
            hint="Compose and send personalized emails to all, filtered, or selected participants."
          >
            <EmailComposer
              scopeSets={scopeSets}
              scope={emailScope}
              onScopeChange={setEmailScope}
              filtersActive={workspace.filtersActive}
            />
          </Section>

          {/* WhatsApp */}
          <Section
            id="whatsapp-composer"
            title="WhatsApp Composer"
            hint="Generate personalized WhatsApp click-to-chat links for all, filtered, or selected participants."
          >
            <WhatsAppComposer
              scopeSets={scopeSets}
              scope={waScope}
              onScopeChange={setWaScope}
              filtersActive={workspace.filtersActive}
            />
          </Section>
        </>
      )}
    </div>
  );
}

import { redirect } from "next/navigation";

// The Control Center was split into dedicated dashboard pages in Sprint 5.
// Its participant/import/export surface now lives at /dashboard/participants.
export default function AutomationRedirect() {
  redirect("/dashboard/participants");
}

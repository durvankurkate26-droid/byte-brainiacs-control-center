import { redirect } from "next/navigation";

// QR generation moved to the QR Center under the dashboard in Sprint 5.
export default function GenerateRedirect() {
  redirect("/dashboard/qr");
}

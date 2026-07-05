import { redirect } from "next/navigation";

// Check-in moved to the Attendance page under the dashboard in Sprint 5.
export default function CheckinRedirect() {
  redirect("/dashboard/attendance");
}

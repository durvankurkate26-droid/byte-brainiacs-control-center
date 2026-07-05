import Sidebar from "@/components/dashboard/Sidebar";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";

// Shell for every operational surface: a persistent sidebar plus the shared
// DashboardProvider so participant filters/selection and communication scopes
// stay consistent as the organizer moves between pages.

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <div className="min-h-screen">
        <Sidebar />
        <main
          data-print-main
          className="px-5 py-8 sm:px-8 lg:ml-64 lg:px-10 lg:py-12"
        >
          <div className="mx-auto max-w-6xl animate-fade-in">{children}</div>
        </main>
      </div>
    </DashboardProvider>
  );
}

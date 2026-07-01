import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Byte Brainiacs — Control Center",
  description: "Hackathon control center for Byte Brainiacs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-void text-haze font-mono antialiased">
        <header className="border-b border-lilac/20 px-6 py-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <a href="/" className="text-sm tracking-widest text-lilac">
              02 / BYTE_BRAINIACS
            </a>
            <nav className="flex gap-6 text-xs uppercase tracking-wider text-mist">
              <a href="/" className="hover:text-lilac transition-colors">
                Teams
              </a>
              <a href="/automation" className="hover:text-lilac transition-colors">
                Control Center
              </a>
              <a href="/generate" className="hover:text-lilac transition-colors">
                Generate QR
              </a>
              <a href="/checkin" className="hover:text-magenta transition-colors">
                Check-In
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}

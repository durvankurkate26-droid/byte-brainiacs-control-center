import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// ─── Fonts ───────────────────────────────────────────────────────────────────
// Space Grotesk drives display/headings, Inter carries body copy, and JetBrains
// Mono is reserved for team IDs, timestamps, and small labels. Exposed as CSS
// variables so Tailwind's fontFamily tokens (font-heading / font-sans / font-mono)
// can resolve them anywhere.

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Byte Brainiacs — Hackathon Organizer Platform",
  description:
    "Registration, QR management, communication, attendance, and analytics for the Byte Brainiacs hackathon.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-void font-sans text-haze antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Byte Brainiacs "Afterglow" palette
        void: "#16101F",
        lilac: "#9D8CFF",
        haze: "#E8E2FF",
        magenta: "#FF3DB0",
        mist: "#8C82A8",
        // Slightly lifted surface used for cards over the void background.
        surface: "#1E1730",
      },
      fontFamily: {
        // Body copy.
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        // Display / headings.
        heading: [
          "var(--font-heading)",
          "var(--font-sans)",
          "ui-sans-serif",
          "sans-serif",
        ],
        // Team IDs, timestamps, small labels.
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        // Hierarchy tokens from the Sprint 5 spec.
        hero: ["3.75rem", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        "page-title": ["2.125rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "card-number": ["1.75rem", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
        "section-title": ["1.375rem", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        caption: ["0.8125rem", { lineHeight: "1.5" }],
      },
      borderRadius: {
        "2xl": "1rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.2), 0 8px 24px -12px rgba(157,140,255,0.25)",
        "card-hover":
          "0 4px 12px rgba(0,0,0,0.25), 0 20px 48px -16px rgba(157,140,255,0.4)",
        glow: "0 0 40px -8px rgba(157,140,255,0.5)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;

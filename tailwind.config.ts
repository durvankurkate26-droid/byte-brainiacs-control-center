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
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;

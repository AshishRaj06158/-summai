import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090b10",
        surface: "#090b10",
        "surface-dim": "#090b10",
        "surface-bright": "#353943",
        "surface-container-lowest": "#06080d",
        "surface-container-low": "#11141e",
        "surface-container": "#161a26",
        "surface-container-high": "#262a34",
        "surface-container-highest": "#31353f",
        "on-surface": "#dfe2ef",
        "on-surface-variant": "#c7c4d7",
        outline: "#908fa0",
        "outline-variant": "#464554",
        primary: "#c0c1ff",
        "primary-action": "#6366f1",
        secondary: "#4edea3",
        "secondary-action": "#10b981",
        "secondary-container": "#00a572",
        tertiary: "#d0bcff",
        "tertiary-action": "#8b5cf6",
      },
      fontFamily: {
        headline: ["var(--font-geist)", "Geist", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

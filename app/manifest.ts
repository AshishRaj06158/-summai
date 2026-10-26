import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SummAI — High-Velocity AI Video Intelligence",
    short_name: "SummAI",
    description:
      "Turn any video or lecture into structured executive summaries, synced chapter timestamps, action items, and grounded AI insights using Gemini 3.8 Flash.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f131c",
    theme_color: "#0f131c",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}

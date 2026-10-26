import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://summai.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/video/workspace"],
        disallow: ["/api/*"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

import type { Metadata, Viewport } from "next";
import { Geist, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://summai.vercel.app";

export const viewport: Viewport = {
  themeColor: "#0f131c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SummAI — High-Velocity AI Video Intelligence",
    template: "%s | SummAI",
  },
  description:
    "Production video summarizer powered by Gemini 3.8 Flash Agentic Video Understanding. Real-time split-pane sync, chapters, telemetry, and actionable briefs.",
  keywords: [
    "AI video summarizer",
    "Gemini 3.8 Flash",
    "video intelligence",
    "YouTube summary",
    "timeline navigation",
    "split-pane video notes",
    "automated transcription",
  ],
  authors: [{ name: "SummAI Engineering Team" }],
  creator: "SummAI",
  publisher: "SummAI",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "SummAI",
    title: "SummAI — High-Velocity AI Video Intelligence",
    description:
      "Turn any video into structured executive summaries, synced chapter timestamps, action items, and grounded AI insights using Gemini 3.8 Flash.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SummAI Video Intelligence Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SummAI — High-Velocity AI Video Intelligence",
    description:
      "Turn any video into structured executive summaries, synced chapter timestamps, action items, and grounded AI insights.",
    creator: "@SummAI",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "SummAI",
      description: "High-Velocity AI Video Intelligence Engine",
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/video/workspace?source={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#software`,
      name: "SummAI",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description:
        "High-velocity AI video intelligence engine powered by Gemini 3.8 Flash Agentic Video Understanding.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Sub-second timeline seeking",
        "Executive markdown summaries",
        "Synchronized interactive chapter pills",
        "Grounding chat with timestamp citations",
        "Token telemetry and efficiency benchmarking",
      ],
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "SummAI",
      url: siteUrl,
      logo: `${siteUrl}/favicon.ico`,
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${siteUrl}/#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Dashboard",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Workspace",
          item: `${siteUrl}/video/workspace`,
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('summai_theme');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && supportDarkMode)) {
                    document.documentElement.classList.add('dark');
                  } else if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-surface font-body antialiased selection:bg-primary-action/30 selection:text-primary">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary-action text-white rounded-lg font-headline text-xs font-semibold shadow-xl ring-2 ring-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}

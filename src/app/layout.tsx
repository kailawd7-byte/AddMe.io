import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://addme-steel.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "AddMe.io — Donnez de l'attention. Recevez-en.",
    template: "%s | AddMe.io",
  },
  description:
    "Propulsez vos contenus sur vos réseaux (TikTok, Instagram, YouTube) en échange d'engagement 100% réel. Gagnez des points immédiatement, lancez vos campagnes sur-mesure.",
  keywords: [
    "AddMe",
    "AddMe.io",
    "engagement tiktok",
    "croissance youtube",
    "visibilité réseaux sociaux",
    "échange likes tiktok",
    "abonnés réels",
    "marketing influence",
  ],
  authors: [{ name: "AddMe.io Team" }],
  creator: "AddMe.io",
  publisher: "AddMe.io",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AddMe.io — Donnez de l'attention. Recevez-en.",
    description:
      "Propulsez vos contenus sur vos réseaux (TikTok, Instagram, YouTube) en échange d'engagement 100% réel et humain.",
    url: baseUrl,
    siteName: "AddMe.io",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Logo AddMe.io",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "AddMe.io — Donnez de l'attention. Recevez-en.",
    description:
      "La première plateforme d'échange d'attention équitable pour créateurs sur TikTok et YouTube.",
    images: ["/icon-512.png"],
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
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  verification: {
    google: "ZmE886oh7gl5SEg34B-jJtPisFVTbYEVK90cTHYOzEQ",
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta
          name="google-site-verification"
          content="ZmE886oh7gl5SEg34B-jJtPisFVTbYEVK90cTHYOzEQ"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        {/* Données structurées Google (Site Name & Logo officiel) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "AddMe.io",
              alternateName: ["AddMe", "AddMe App"],
              url: baseUrl,
              image: `${baseUrl}/icon-512.png`,
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "AddMe.io",
              url: baseUrl,
              logo: `${baseUrl}/icon-512.png`,
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const isLanding = window.location.pathname === '/' || window.location.pathname === '';
                  if (isLanding) {
                    document.documentElement.classList.remove('dark');
                  } else {
                    const saved = localStorage.getItem('addme-theme');
                    const isDark = saved === 'dark' || ((!saved || saved === 'system') && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    if (isDark) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  }
                } catch(e) {}
                if (typeof window === 'undefined') return;
                const origError = console.error;
                console.error = function(...args) {
                  const full = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
                  if (
                    full.includes('bis_skin_checked') ||
                    full.includes('bis_register')
                  ) {
                    return;
                  }
                  origError.apply(console, args);
                };
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-[#F7F7FB] text-[#12122A] min-h-screen antialiased selection:bg-[#5B3DF5] selection:text-white"
      >
        <div suppressHydrationWarning className="min-h-screen flex flex-col">
          <Navbar>{children}</Navbar>
        </div>
      </body>
    </html>
  );
}

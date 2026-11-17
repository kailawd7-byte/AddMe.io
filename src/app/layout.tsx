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
  },
  twitter: {
    card: "summary_large_image",
    title: "AddMe.io — Donnez de l'attention. Recevez-en.",
    description:
      "La première plateforme d'échange d'attention équitable pour créateurs sur TikTok et YouTube.",
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
    icon: "/icon.svg",
    shortcut: "/favicon.ico",
    apple: "/icon.svg",
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

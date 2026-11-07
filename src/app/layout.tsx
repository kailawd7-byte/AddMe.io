import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "AddMe.io — Donnez de l'attention. Recevez-en.",
  description:
    "Propulsez vos contenus sur vos réseaux (TikTok, Instagram, YouTube) en échange d'engagement 100% réel. Gagnez des points immédiatement, lancez vos campagnes sur-mesure.",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Playfair+Display:ital,wght@1,600;1,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
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

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

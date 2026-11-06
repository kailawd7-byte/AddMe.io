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
      <body
        suppressHydrationWarning
        className="bg-[#F7F7FB] text-[#12122A] min-h-screen antialiased selection:bg-[#5B3DF5] selection:text-white"
      >
        <Navbar>{children}</Navbar>
      </body>
    </html>
  );
}

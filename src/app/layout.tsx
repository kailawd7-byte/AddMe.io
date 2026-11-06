import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "AddMe.io — Échange d'engagement éthique TikTok & YouTube",
  description:
    "Plateforme d'échange d'engagement réel entre créateurs : gagnez des points en interagissant sur des publications, propulsez vos propres vidéos sans aucun bot.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-slate-800/60 bg-[#060911] py-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} AddMe.io — Plateforme d'échange d'engagement entre créateurs.</p>
            <div className="flex gap-4">
              <a href="/legal/terms" className="hover:text-slate-300 transition-colors">CGU</a>
              <a href="/legal/privacy" className="hover:text-slate-300 transition-colors">Confidentialité (RGPD)</a>
              <a href="/legal/disclaimer" className="hover:text-slate-300 transition-colors">Avertissement Réseaux</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}


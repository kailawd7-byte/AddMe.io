"use client";

import DiscordIcon from "./DiscordIcon";
import { DISCORD_INVITE_URL } from "@/lib/constants";

interface SocialCommunityIconsProps {
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
}

const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || DISCORD_INVITE_URL;

export default function SocialCommunityIcons({
  className = "",
  itemClassName = "",
  iconClassName = "h-4 w-4",
}: SocialCommunityIconsProps) {
  const networks = [
    {
      id: "discord",
      label: "Discord",
      title: "Rejoindre la communauté Discord officielle AddMe.io",
      href: DISCORD_URL,
      isExternal: true,
      hoverClass: "hover:text-[#8EA1FF] hover:border-[#5865F2] hover:bg-[#5865F2]/20",
      icon: <DiscordIcon className={`${iconClassName} text-[#5865F2]`} />,
    },
    {
      id: "telegram",
      label: "Telegram",
      title: "Canal Telegram AddMe.io",
      href: "#",
      isExternal: false,
      hoverClass: "hover:text-[#229ED9] hover:border-[#229ED9]/50 hover:bg-[#229ED9]/15",
      icon: (
        <svg className={iconClassName} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z" />
        </svg>
      ),
    },
    {
      id: "instagram",
      label: "Instagram",
      title: "Instagram officiel AddMe.io",
      href: "#",
      isExternal: false,
      hoverClass: "hover:text-[#E1306C] hover:border-[#E1306C]/50 hover:bg-[#E1306C]/15",
      icon: (
        <svg
          className={iconClassName}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "tiktok",
      label: "TikTok",
      title: "TikTok officiel AddMe.io",
      href: "#",
      isExternal: false,
      hoverClass: "hover:text-white hover:border-white/50 hover:bg-white/10",
      icon: (
        <svg className={iconClassName} fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.87-4.49V8.58a8.28 8.28 0 0 0 4.84 1.56V6.69h-.94z" />
        </svg>
      ),
    },
    {
      id: "facebook",
      label: "Facebook",
      title: "Facebook officiel AddMe.io",
      href: "#",
      isExternal: false,
      hoverClass: "hover:text-[#1877F2] hover:border-[#1877F2]/50 hover:bg-[#1877F2]/15",
      icon: (
        <svg className={iconClassName} fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {networks.map((net) => {
        if (net.isExternal) {
          return (
            <a
              key={net.id}
              href={net.href}
              target="_blank"
              rel="noopener noreferrer"
              title={net.title}
              aria-label={net.label}
              className={`inline-flex items-center justify-center min-h-[40px] min-w-[40px] sm:min-h-[42px] sm:min-w-[42px] p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-[#C9C6DB] transition-all duration-200 active:scale-95 ${net.hoverClass} ${itemClassName}`}
            >
              {net.icon}
            </a>
          );
        }

        return (
          <a
            key={net.id}
            href="#"
            onClick={(e) => {
              e.preventDefault();
            }}
            title={net.title}
            aria-label={net.label}
            className={`inline-flex items-center justify-center min-h-[40px] min-w-[40px] sm:min-h-[42px] sm:min-w-[42px] p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-[#C9C6DB] transition-all duration-200 active:scale-95 cursor-pointer ${net.hoverClass} ${itemClassName}`}
          >
            {net.icon}
          </a>
        );
      })}
    </div>
  );
}

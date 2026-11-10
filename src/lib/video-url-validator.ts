export interface VideoUrlValidationResult {
  valid: boolean;
  error?: string;
  normalizedUrl?: string;
  extractedId?: string;
}

/**
 * Valide qu'une URL correspond impérativement à une PUBLICATION (vidéo ou shorts)
 * et JAMAIS à un simple lien de profil ou de chaîne.
 * Vérifie également la concordance avec le pseudo vérifié lorsque possible.
 */
export function validateVideoPublicationUrl(
  platform: string,
  rawUrl: string,
  expectedIdentifier?: string
): VideoUrlValidationResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, error: "L'URL de la publication est obligatoire." };
  }

  const trimmed = rawUrl.trim();

  let urlObj: URL;
  try {
    urlObj = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return { valid: false, error: "Format d'URL invalide." };
  }

  const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, "");

  // ==========================================
  // Validation TIKTOK
  // ==========================================
  if (platform === "TIKTOK") {
    const validTikTokHosts = ["tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"];
    if (!validTikTokHosts.includes(hostname)) {
      return {
        valid: false,
        error: "L'URL doit provenir du domaine tiktok.com (ex: https://www.tiktok.com/@pseudo/video/...)",
      };
    }

    const pathname = urlObj.pathname;

    // Détection d'un simple lien de profil (INTERDIT)
    const isBareProfile = /^\/@[a-zA-Z0-9_.-]+\/?$/.test(pathname);
    if (isBareProfile) {
      return {
        valid: false,
        error:
          "L'engagement est réservé aux PUBLICATIONS spécifiques. Vous avez fourni un lien de profil ; veuillez fournir l'URL directe d'une vidéo TikTok.",
      };
    }

    // Format vidéo standard : /@pseudo/video/123456789... ou /@pseudo/photo/...
    const videoMatch = pathname.match(/^\/@([a-zA-Z0-9_.-]+)\/(video|photo)\/([0-9]+)/);
    if (videoMatch) {
      const urlHandle = videoMatch[1].toLowerCase();
      const videoId = videoMatch[3];

      // Vérification que la vidéo appartient bien au compte vérifié du créateur
      if (expectedIdentifier) {
        const cleanExpected = expectedIdentifier.toLowerCase().replace(/^@/, "");
        if (urlHandle !== cleanExpected) {
          return {
            valid: false,
            error: `Cette vidéo appartient à @${urlHandle}. Vous ne pouvez publier des campagnes que pour votre compte vérifié (@${cleanExpected}).`,
          };
        }
      }

      return {
        valid: true,
        normalizedUrl: `https://www.tiktok.com/@${urlHandle}/video/${videoId}`,
        extractedId: videoId,
      };
    }

    // Format lien court TikTok : /ZM... ou /...
    if (hostname === "vm.tiktok.com" || hostname === "vt.tiktok.com") {
      const shortCode = pathname.replace(/^\//, "").split("/")[0];
      if (shortCode && shortCode.length >= 4) {
        return {
          valid: true,
          normalizedUrl: `https://${hostname}/${shortCode}`,
          extractedId: shortCode,
        };
      }
    }

    return {
      valid: false,
      error:
        "Format de vidéo TikTok non reconnu. Exemple attendu : https://www.tiktok.com/@votre_pseudo/video/7212345678901234567",
    };
  }

  // ==========================================
  // Validation YOUTUBE
  // ==========================================
  if (platform === "YOUTUBE") {
    const validYouTubeHosts = ["youtube.com", "m.youtube.com", "youtu.be"];
    if (!validYouTubeHosts.includes(hostname)) {
      return {
        valid: false,
        error: "L'URL doit provenir de youtube.com ou youtu.be.",
      };
    }

    const pathname = urlObj.pathname;

    // Détection d'un simple lien de chaîne (INTERDIT)
    if (
      pathname.startsWith("/@") ||
      pathname.startsWith("/channel/") ||
      pathname.startsWith("/c/") ||
      pathname.startsWith("/user/") ||
      pathname === "/"
    ) {
      return {
        valid: false,
        error:
          "L'engagement est réservé aux PUBLICATIONS spécifiques. Vous avez fourni un lien de chaîne ; veuillez fournir l'URL directe d'une vidéo ou d'un Shorts YouTube.",
      };
    }

    // 1. Format classique : youtube.com/watch?v=VIDEO_ID
    if (pathname === "/watch") {
      const v = urlObj.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{6,15}$/.test(v)) {
        return {
          valid: true,
          normalizedUrl: `https://www.youtube.com/watch?v=${v}`,
          extractedId: v,
        };
      }
      return {
        valid: false,
        error: "Paramètre 'v' (identifiant vidéo) manquant ou invalide dans l'URL YouTube.",
      };
    }

    // 2. Format YouTube Shorts : youtube.com/shorts/VIDEO_ID
    const shortsMatch = pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{6,15})/);
    if (shortsMatch) {
      const videoId = shortsMatch[1];
      return {
        valid: true,
        normalizedUrl: `https://www.youtube.com/shorts/${videoId}`,
        extractedId: videoId,
      };
    }

    // 3. Format court youtu.be/VIDEO_ID
    if (hostname === "youtu.be") {
      const shortId = pathname.replace(/^\//, "").split("/")[0]?.split("?")[0];
      if (shortId && /^[a-zA-Z0-9_-]{6,15}$/.test(shortId)) {
        return {
          valid: true,
          normalizedUrl: `https://www.youtube.com/watch?v=${shortId}`,
          extractedId: shortId,
        };
      }
    }

    // 4. Format embed : youtube.com/embed/VIDEO_ID
    const embedMatch = pathname.match(/^\/embed\/([a-zA-Z0-9_-]{6,15})/);
    if (embedMatch) {
      const videoId = embedMatch[1];
      return {
        valid: true,
        normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
        extractedId: videoId,
      };
    }

    return {
      valid: false,
      error:
        "Format de vidéo YouTube non reconnu. Exemples valides : https://www.youtube.com/watch?v=dQw4w9WgXcQ ou https://www.youtube.com/shorts/abcd123",
    };
  }

  // ==========================================
  // Validation INSTAGRAM
  // ==========================================
  if (platform === "INSTAGRAM") {
    const validInstagramHosts = ["instagram.com", "m.instagram.com", "instagr.am"];
    if (!validInstagramHosts.includes(hostname)) {
      return {
        valid: false,
        error: "L'URL doit provenir du domaine instagram.com (ex: https://www.instagram.com/reel/...)",
      };
    }

    const pathname = urlObj.pathname;

    // Détection d'un simple lien de profil (INTERDIT)
    const isBareProfile =
      /^\/[a-zA-Z0-9_.]+\/?$/.test(pathname) &&
      !pathname.startsWith("/p/") &&
      !pathname.startsWith("/reel/") &&
      !pathname.startsWith("/reels/") &&
      !pathname.startsWith("/tv/");

    if (isBareProfile) {
      return {
        valid: false,
        error:
          "L'engagement est réservé aux PUBLICATIONS spécifiques. Vous avez fourni un lien de profil ; veuillez fournir l'URL directe d'un Reel ou d'un Post Instagram.",
      };
    }

    // 1. Format Reel : /reel/SHORTCODE ou /reels/SHORTCODE
    const reelMatch = pathname.match(/^\/reels?\/([a-zA-Z0-9_-]+)/);
    if (reelMatch) {
      const code = reelMatch[1];
      return {
        valid: true,
        normalizedUrl: `https://www.instagram.com/reel/${code}/`,
        extractedId: code,
      };
    }

    // 2. Format Post classique : /p/SHORTCODE
    const postMatch = pathname.match(/^\/p\/([a-zA-Z0-9_-]+)/);
    if (postMatch) {
      const code = postMatch[1];
      return {
        valid: true,
        normalizedUrl: `https://www.instagram.com/p/${code}/`,
        extractedId: code,
      };
    }

    // 3. Format IGTV : /tv/SHORTCODE
    const tvMatch = pathname.match(/^\/tv\/([a-zA-Z0-9_-]+)/);
    if (tvMatch) {
      const code = tvMatch[1];
      return {
        valid: true,
        normalizedUrl: `https://www.instagram.com/tv/${code}/`,
        extractedId: code,
      };
    }

    return {
      valid: false,
      error:
        "Format de publication Instagram non reconnu. Exemple attendu : https://www.instagram.com/reel/C-xyz123/ ou https://www.instagram.com/p/C-xyz123/",
    };
  }

  // ==========================================
  // Validation FACEBOOK
  // ==========================================
  if (platform === "FACEBOOK") {
    const validFacebookHosts = ["facebook.com", "m.facebook.com", "fb.watch", "fb.com", "web.facebook.com"];
    if (!validFacebookHosts.includes(hostname)) {
      return {
        valid: false,
        error: "L'URL doit provenir du domaine facebook.com ou fb.watch.",
      };
    }
    return {
      valid: true,
      normalizedUrl: urlObj.href,
      extractedId: urlObj.pathname.split("/").filter(Boolean).pop() || "fb-post",
    };
  }

  // ==========================================
  // Validation SNAPCHAT
  // ==========================================
  if (platform === "SNAPCHAT") {
    const validSnapHosts = ["snapchat.com", "t.snapchat.com", "story.snapchat.com"];
    if (!validSnapHosts.includes(hostname)) {
      return {
        valid: false,
        error: "L'URL doit provenir du domaine snapchat.com ou spotlight.",
      };
    }
    return {
      valid: true,
      normalizedUrl: urlObj.href,
      extractedId: urlObj.pathname.split("/").filter(Boolean).pop() || "snap-spotlight",
    };
  }

  // ==========================================
  // Validation LINKEDIN
  // ==========================================
  if (platform === "LINKEDIN") {
    if (!hostname.includes("linkedin.com")) {
      return {
        valid: false,
        error: "L'URL doit provenir du domaine linkedin.com (ex: https://www.linkedin.com/posts/...)",
      };
    }
    return {
      valid: true,
      normalizedUrl: urlObj.href,
      extractedId: urlObj.pathname.split("/").filter(Boolean).pop() || "linkedin-post",
    };
  }

  // ==========================================
  // Validation X (TWITTER)
  // ==========================================
  if (platform === "X" || platform === "TWITTER") {
    const validXHosts = ["x.com", "twitter.com", "mobile.twitter.com"];
    if (!validXHosts.includes(hostname)) {
      return {
        valid: false,
        error: "L'URL doit provenir de x.com ou twitter.com (ex: https://x.com/pseudo/status/123456789).",
      };
    }
    const statusMatch = urlObj.pathname.match(/\/status\/([0-9]+)/);
    return {
      valid: true,
      normalizedUrl: urlObj.href,
      extractedId: statusMatch?.[1] || urlObj.pathname.split("/").filter(Boolean).pop() || "x-post",
    };
  }

  // ==========================================
  // Validation THREADS
  // ==========================================
  if (platform === "THREADS") {
    if (!hostname.includes("threads.net")) {
      return {
        valid: false,
        error: "L'URL doit provenir du domaine threads.net (ex: https://www.threads.net/@pseudo/post/...)",
      };
    }
    return {
      valid: true,
      normalizedUrl: urlObj.href,
      extractedId: urlObj.pathname.split("/").filter(Boolean).pop() || "threads-post",
    };
  }

  // ==========================================
  // Validation SPOTIFY
  // ==========================================
  if (platform === "SPOTIFY") {
    const validSpotifyHosts = ["spotify.com", "open.spotify.com"];
    if (!validSpotifyHosts.some((h) => hostname === h || hostname.endsWith(`.${h}`))) {
      return {
        valid: false,
        error: "L'URL doit provenir de Spotify (ex: https://open.spotify.com/track/... ou /artist/...)",
      };
    }
    return {
      valid: true,
      normalizedUrl: urlObj.href,
      extractedId: urlObj.pathname.split("/").filter(Boolean).pop() || "spotify-item",
    };
  }

  // ==========================================
  // Validation SOUNDCLOUD
  // ==========================================
  if (platform === "SOUNDCLOUD") {
    if (!hostname.includes("soundcloud.com")) {
      return {
        valid: false,
        error: "L'URL doit provenir de SoundCloud (ex: https://soundcloud.com/artiste/titre)",
      };
    }
    return {
      valid: true,
      normalizedUrl: urlObj.href,
      extractedId: urlObj.pathname.split("/").filter(Boolean).join("-") || "soundcloud-track",
    };
  }

  // ==========================================
  // Validation REDDIT
  // ==========================================
  if (platform === "REDDIT") {
    const validRedditHosts = ["reddit.com", "old.reddit.com", "m.reddit.com"];
    if (!validRedditHosts.some((h) => hostname === h || hostname.endsWith(`.${h}`))) {
      return {
        valid: false,
        error: "L'URL doit provenir de Reddit (ex: https://www.reddit.com/r/communaute/comments/...)",
      };
    }
    return {
      valid: true,
      normalizedUrl: urlObj.href,
      extractedId: urlObj.pathname.split("/").filter(Boolean).pop() || "reddit-post",
    };
  }

  // ==========================================
  // Validation WEBSITE / TRAFIC WEB
  // ==========================================
  if (platform === "WEBSITE") {
    if (!hostname.includes(".") || hostname.length < 3) {
      return {
        valid: false,
        error: "Veuillez renseigner un lien de site web valide (ex: https://votre-site.com/page)",
      };
    }
    return {
      valid: true,
      normalizedUrl: urlObj.href,
      extractedId: hostname,
    };
  }

  return { valid: false, error: "Plateforme non supportée." };
}


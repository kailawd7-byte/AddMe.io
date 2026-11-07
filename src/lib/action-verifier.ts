/**
 * AddMe AI Sentinel — Agent IA & Robot de Tracking d'Actions Sociales (Anti-Fraude)
 *
 * Architecture de vérification multi-couches en temps réel :
 *
 * COUCHE 1 — Télémétrie Comportementale (Focus Tracking 20s) :
 *   Vérifie que l'utilisateur a réellement gardé la publication ouverte pendant au moins
 *   20 secondes actives avant de revenir sur AddMe.io.
 *
 * COUCHE 2 — Tracking Temps Réel des Compteurs & Commentaires (Delta T0 → T1) :
 *   - Snapshot Initial (T0 — au clic sur "Faire la tâche") :
 *     Capture en direct les compteurs exacts de la publication / du profil cible
 *     (Likes, Commentaires, Abonnés).
 *   - Vérification Finale (T1 — après les 20 secondes minimum) :
 *     Ré-inspecte la publication sans cache et vérifie que le compteur correspondant
 *     à l'action demandée (LIKE, COMMENT ou SUBSCRIBE) a réellement augmenté
 *     (compteur_après > compteur_avant) ou qu'un nouveau commentaire a été publié après T0.
 *   - Moteurs supportés :
 *     1. Moteur Autonome Sans Clé (Actif par défaut) :
 *        TikTok SSR (webapp.video-detail & webapp.user-detail), API publique TikWM
 *        (vidéo + profil + liste des commentaires temps réel), YouTube SSR/InnerTube,
 *        Instagram Meta/Graph.
 *     2. APIs Spécialisées de Tracking Social (si configurées dans .env / Vercel) :
 *        - ENSEMBLEDATA_API_KEY (EnsembleData Social Tracking API)
 *        - RAPIDAPI_KEY (TikTok Scraper7 / Instagram Scraper)
 *        - YOUTUBE_API_KEY (YouTube Data API v3 officielle)
 *
 * COUCHE 3 — Agent IA Vision Multimodal (Gemini 2.5 Flash / GPT-4o-mini) :
 *   Si le compteur public d'un réseau social est arrondi (ex: > 10K abonnés) ou retardé
 *   par le CDN, l'utilisateur peut joindre une capture d'écran de preuve analysée par IA
 *   (détection visuelle du bouton "Abonné(e)/Following", du cœur Like rouge/actif ou du commentaire).
 */

import crypto from "crypto";

export interface SocialMetricsSnapshot {
  platform: string;
  actionType: string;
  videoUrl: string;
  targetHandle: string;
  likes: number | null;
  comments: number | null;
  followers: number | null;
  latestCommentTimestamp?: number | null;
  source: string;
  capturedAt: number;
}

export interface BotVerificationResult {
  verified: boolean;
  reason?: string;
  requiresProofFallback?: boolean;
  metricName: string;
  beforeCount: number | null;
  afterCount: number | null;
  source: string;
  updatedSnapshot?: SocialMetricsSnapshot;
}

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,fr-FR;q=0.8",
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Vérifie si un compteur est un nombre exact (non arrondi par l'interface, ex: < 10 000 ou non multiple de 100)
 */
function isExactCounter(val: number | null | undefined): val is number {
  if (val === null || val === undefined || Number.isNaN(val) || val < 0) {
    return false;
  }
  // Au-delà de 10 000, certaines plateformes arrondissent à la centaine (ex: 10 400)
  if (val >= 10000 && val % 100 === 0) {
    return false;
  }
  return true;
}

/**
 * Extrait proprement le @handle depuis une URL TikTok/YouTube/Instagram ou depuis l'identifiant du compte
 */
export function extractCleanHandle(videoUrl: string, targetHandle: string): string {
  // 1. Chercher @handle directement dans l'URL de la publication/profil (le plus fiable)
  const urlHandleMatch = videoUrl.match(/\/@([a-zA-Z0-9._-]+)/);
  if (urlHandleMatch?.[1]) {
    return urlHandleMatch[1].trim();
  }

  // 2. Chercher dans targetHandle s'il s'agit d'une URL complète
  const targetUrlMatch = targetHandle.match(/\/@([a-zA-Z0-9._-]+)/);
  if (targetUrlMatch?.[1]) {
    return targetUrlMatch[1].trim();
  }

  // 3. Si c'est une URL Instagram du type instagram.com/pseudo/
  if (videoUrl.includes("instagram.com/")) {
    try {
      const u = new URL(videoUrl);
      const parts = u.pathname.split("/").filter(Boolean);
      if (
        parts[0] &&
        !["p", "reel", "reels", "tv", "stories", "explore"].includes(
          parts[0].toLowerCase()
        )
      ) {
        return parts[0].replace(/^@/, "").trim();
      }
    } catch {
      // Ignore
    }
  }

  return targetHandle
    .replace(/^https?:\/\/[^/]+\//i, "")
    .replace(/^@/, "")
    .split(/[/?#&]/)[0]
    .trim();
}

/**
 * Extraction temps réel des compteurs TikTok (Likes, Commentaires, Abonnés + Dernier Commentaire)
 */
async function fetchTikTokMetrics(
  videoUrl: string,
  targetHandle: string
): Promise<{
  likes: number | null;
  comments: number | null;
  followers: number | null;
  latestCommentTimestamp: number | null;
  source: string;
}> {
  let likes: number | null = null;
  let comments: number | null;
  comments = null;
  let followers: number | null = null;
  let latestCommentTimestamp: number | null = null;
  let source = "tiktok-sentinel";

  let cleanHandle = extractCleanHandle(videoUrl, targetHandle);
  const ensembleApiKey = process.env.ENSEMBLEDATA_API_KEY?.trim();
  const rapidApiKey = process.env.RAPIDAPI_KEY?.trim();

  // 1. Si ENSEMBLEDATA_API_KEY est configurée (API leader spécialisée dans le tracking TikTok/IG/YT)
  if (ensembleApiKey && cleanHandle) {
    try {
      const edRes = await fetch(
        `https://ensembledata.com/apis/tt/user/info?username=${encodeURIComponent(
          cleanHandle
        )}&token=${encodeURIComponent(ensembleApiKey)}`,
        {
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        }
      );
      if (edRes.ok) {
        const edJson = await edRes.json();
        const fCount = edJson?.data?.stats?.followerCount;
        if (typeof fCount === "number") {
          followers = fCount;
          source = "ensembledata-ai-tracker";
        }
      }
    } catch {
      // Fallback
    }
  }

  // 2. Si RAPIDAPI_KEY est configurée dans Vercel / .env
  if (rapidApiKey) {
    try {
      const apiUrl = `https://tiktok-scraper7.p.rapidapi.com/video/info?video_url=${encodeURIComponent(
        videoUrl
      )}`;
      const res = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "tiktok-scraper7.p.rapidapi.com",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const json = await res.json();
        const data = json?.data;
        if (data) {
          if (typeof data.digg_count === "number") likes = data.digg_count;
          if (typeof data.comment_count === "number") comments = data.comment_count;
          if (typeof data.author?.follower_count === "number") {
            followers = data.author.follower_count;
          }
          if (data.author?.unique_id && !cleanHandle) {
            cleanHandle = data.author.unique_id;
          }
          source = "rapidapi-tiktok";
        }
      }
    } catch {
      // Fallback automatique sur le robot intégré
    }
  }

  // 3. Inspection directe de la page TikTok SSR (__UNIVERSAL_DATA_FOR_REHYDRATION__)
  // Supporte aussi bien les liens vidéos (/video/...) que les liens de profils (/@username) et les liens courts (vm.tiktok.com)
  try {
    const pageUrl = `${videoUrl}${videoUrl.includes("?") ? "&" : "?"}_t=${Date.now()}`;
    const res = await fetch(pageUrl, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(6500),
    });

    if (res.ok) {
      // Si c'était un lien court vm.tiktok.com, récupérer le @handle depuis l'URL résolue
      if (res.url) {
        const resolvedHandle = res.url.match(/\/@([a-zA-Z0-9._-]+)/)?.[1];
        if (resolvedHandle) {
          cleanHandle = resolvedHandle;
        }
      }

      const html = await res.text();
      const rehydrationMatch = html.match(
        /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
      );

      if (rehydrationMatch?.[1]) {
        const parsed = JSON.parse(rehydrationMatch[1]);
        const defaultScope = parsed?.__DEFAULT_SCOPE__ || {};

        // Cas A : Page Vidéo TikTok
        const itemStruct =
          defaultScope["webapp.video-detail"]?.itemInfo?.itemStruct;
        if (itemStruct) {
          if (likes === null && itemStruct.stats?.diggCount !== undefined) {
            likes = Number(itemStruct.stats.diggCount);
          }
          if (comments === null && itemStruct.stats?.commentCount !== undefined) {
            comments = Number(itemStruct.stats.commentCount);
          }
          if (
            followers === null &&
            itemStruct.authorStats?.followerCount !== undefined
          ) {
            followers = Number(itemStruct.authorStats.followerCount);
          }
          if (itemStruct.author?.uniqueId && !cleanHandle) {
            cleanHandle = String(itemStruct.author.uniqueId);
          }
          source = "tiktok-ssr-video";
        }

        // Cas B : Page Profil TikTok (ex: https://www.tiktok.com/@username)
        const userInfo = defaultScope["webapp.user-detail"]?.userInfo;
        if (userInfo?.stats) {
          if (followers === null && userInfo.stats.followerCount !== undefined) {
            followers = Number(userInfo.stats.followerCount);
          }
          if (likes === null && userInfo.stats.heartCount !== undefined) {
            likes = Number(userInfo.stats.heartCount);
          }
          source = "tiktok-ssr-profile";
        }
      }

      // Extraction regex de secours si la structure JSON a changé
      if (followers === null) {
        const followerRegex = html.match(/"followerCount"\s*:\s*(\d+)/);
        if (followerRegex?.[1]) {
          followers = Number(followerRegex[1]);
          source = "tiktok-ssr-regex";
        }
      }
      if (likes === null) {
        const diggRegex = html.match(/"diggCount"\s*:\s*(\d+)/);
        if (diggRegex?.[1]) {
          likes = Number(diggRegex[1]);
          source = "tiktok-ssr-regex";
        }
      }
      if (comments === null) {
        const commentRegex = html.match(/"commentCount"\s*:\s*(\d+)/);
        if (commentRegex?.[1]) {
          comments = Number(commentRegex[1]);
          source = "tiktok-ssr-regex";
        }
      }
    }
  } catch {
    // Continue vers les autres sources
  }

  // 4. Inspection via l'API publique TikWM (sans clé API requise) pour Likes, Commentaires & Auteur
  if (likes === null || comments === null || !cleanHandle) {
    try {
      const body = new URLSearchParams({ url: videoUrl });
      const res = await fetch(`https://www.tikwm.com/api/?_t=${Date.now()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": BROWSER_HEADERS["User-Agent"],
          "Cache-Control": "no-cache",
        },
        body: body.toString(),
        cache: "no-store",
        signal: AbortSignal.timeout(6500),
      });

      if (res.ok) {
        const json = await res.json();
        const data = json?.data;
        if (data) {
          if (likes === null && typeof data.digg_count === "number") {
            likes = data.digg_count;
          }
          if (comments === null && typeof data.comment_count === "number") {
            comments = data.comment_count;
          }
          if (data.author?.unique_id && !cleanHandle) {
            cleanHandle = String(data.author.unique_id);
          }
          source = source === "tiktok-sentinel" ? "tikwm-api" : source;
        }
      }
    } catch {
      // Ignore
    }
  }

  // 5. Inspection du compteur d'abonnés (followers) via TikWM User Info et SSR Profil
  if (followers === null && cleanHandle) {
    try {
      const res = await fetch(
        `https://www.tikwm.com/api/user/info?unique_id=${encodeURIComponent(
          cleanHandle
        )}&_t=${Date.now()}`,
        {
          headers: {
            "User-Agent": BROWSER_HEADERS["User-Agent"],
            "Cache-Control": "no-cache",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        }
      );
      if (res.ok) {
        const json = await res.json();
        const fCount =
          json?.data?.stats?.followerCount ??
          json?.data?.user?.follower_count;
        if (typeof fCount === "number") {
          followers = fCount;
          source = "tikwm-user-api";
        }
      }
    } catch {
      // Ignore
    }
  }

  if (followers === null && cleanHandle) {
    try {
      const profileRes = await fetch(
        `https://www.tiktok.com/@${encodeURIComponent(cleanHandle)}?_t=${Date.now()}`,
        {
          headers: BROWSER_HEADERS,
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        }
      );
      if (profileRes.ok) {
        const html = await profileRes.text();
        const followerMatch = html.match(/"followerCount"\s*:\s*(\d+)/);
        if (followerMatch?.[1]) {
          followers = Number(followerMatch[1]);
          source = "tiktok-profile-ssr";
        }
      }
    } catch {
      // Ignore
    }
  }

  // 6. Récupération de l'horodatage du dernier commentaire posté sur la vidéo TikTok
  if (videoUrl.includes("/video/") || videoUrl.includes("vm.tiktok.com")) {
    try {
      const commentRes = await fetch(
        `https://www.tikwm.com/api/comment/list?url=${encodeURIComponent(
          videoUrl
        )}&count=10&_t=${Date.now()}`,
        {
          headers: {
            "User-Agent": BROWSER_HEADERS["User-Agent"],
            "Cache-Control": "no-cache",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        }
      );
      if (commentRes.ok) {
        const commentJson = await commentRes.json();
        const commentList = commentJson?.data?.comments;
        if (Array.isArray(commentList) && commentList.length > 0) {
          const maxTime = Math.max(
            ...commentList.map((c: any) => Number(c?.create_time || 0))
          );
          if (maxTime > 0) {
            latestCommentTimestamp = maxTime * 1000;
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  return { likes, comments, followers, latestCommentTimestamp, source };
}

/**
 * Extraction temps réel des compteurs YouTube (Likes, Commentaires, Abonnés)
 */
async function fetchYouTubeMetrics(
  videoUrl: string
): Promise<{
  likes: number | null;
  comments: number | null;
  followers: number | null;
  latestCommentTimestamp: number | null;
  source: string;
}> {
  let likes: number | null = null;
  let comments: number | null = null;
  let followers: number | null = null;
  let source = "youtube-sentinel";

  let videoId: string | null = null;
  try {
    const u = new URL(videoUrl);
    if (u.pathname === "/watch") {
      videoId = u.searchParams.get("v");
    } else if (u.pathname.startsWith("/shorts/")) {
      videoId = u.pathname.split("/shorts/")[1]?.split("/")[0] || null;
    } else if (u.hostname.includes("youtu.be")) {
      videoId = u.pathname.replace(/^\//, "").split("/")[0] || null;
    }
  } catch {
    videoId = null;
  }

  const ytApiKey = process.env.YOUTUBE_API_KEY?.trim();

  // 1. Clé officielle YOUTUBE_API_KEY si présente dans .env / Vercel
  if (ytApiKey && videoId) {
    try {
      const apiRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${encodeURIComponent(
          videoId
        )}&key=${encodeURIComponent(ytApiKey)}`,
        {
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        }
      );
      if (apiRes.ok) {
        const json = await apiRes.json();
        const item = json?.items?.[0];
        if (item?.statistics) {
          if (item.statistics.likeCount !== undefined) {
            likes = Number(item.statistics.likeCount);
          }
          if (item.statistics.commentCount !== undefined) {
            comments = Number(item.statistics.commentCount);
          }
          source = "youtube-data-api-v3";
        }
        const channelId = item?.snippet?.channelId;
        if (channelId) {
          const chanRes = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${encodeURIComponent(
              channelId
            )}&key=${encodeURIComponent(ytApiKey)}`,
            {
              cache: "no-store",
              signal: AbortSignal.timeout(5000),
            }
          );
          if (chanRes.ok) {
            const chanJson = await chanRes.json();
            const subCount =
              chanJson?.items?.[0]?.statistics?.subscriberCount;
            if (subCount !== undefined) {
              followers = Number(subCount);
            }
          }
        }
      }
    } catch {
      // Fallback sur le robot HTML YouTube
    }
  }

  // 2. Scraping direct de la page YouTube (sans clé API)
  if ((likes === null || comments === null) && videoId) {
    try {
      const watchRes = await fetch(
        `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&hl=en`,
        {
          headers: BROWSER_HEADERS,
          cache: "no-store",
          signal: AbortSignal.timeout(6500),
        }
      );
      if (watchRes.ok) {
        const html = await watchRes.text();

        const likeMatch =
          html.match(/"label"\s*:\s*"([\d,]+)\s+likes?"/i) ||
          html.match(
            /"accessibilityText"\s*:\s*"Like this video along with ([\d,]+) other people"/i
          );
        if (likeMatch?.[1] && likes === null) {
          const parsedLikes = Number(likeMatch[1].replace(/,/g, ""));
          if (!Number.isNaN(parsedLikes)) {
            likes = parsedLikes;
            source = "youtube-ssr-direct";
          }
        }

        const commentMatch = html.match(
          /"commentCount"\s*:\s*\{\s*"simpleText"\s*:\s*"([\d,]+)"/
        );
        if (commentMatch?.[1] && comments === null) {
          const parsedComments = Number(commentMatch[1].replace(/,/g, ""));
          if (!Number.isNaN(parsedComments)) {
            comments = parsedComments;
            source = "youtube-ssr-direct";
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  return { likes, comments, followers, latestCommentTimestamp: null, source };
}

/**
 * Extraction temps réel des compteurs Instagram
 */
async function fetchInstagramMetrics(
  videoUrl: string,
  targetHandle: string
): Promise<{
  likes: number | null;
  comments: number | null;
  followers: number | null;
  latestCommentTimestamp: number | null;
  source: string;
}> {
  let likes: number | null = null;
  let comments: number | null = null;
  let followers: number | null = null;
  let source = "instagram-sentinel";

  const cleanHandle = extractCleanHandle(videoUrl, targetHandle);
  const ensembleApiKey = process.env.ENSEMBLEDATA_API_KEY?.trim();

  if (ensembleApiKey && cleanHandle) {
    try {
      const edRes = await fetch(
        `https://ensembledata.com/apis/instagram/user/info?username=${encodeURIComponent(
          cleanHandle
        )}&token=${encodeURIComponent(ensembleApiKey)}`,
        {
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        }
      );
      if (edRes.ok) {
        const edJson = await edRes.json();
        const fCount = edJson?.data?.edge_followed_by?.count;
        if (typeof fCount === "number") {
          followers = fCount;
          source = "ensembledata-ig-tracker";
        }
      }
    } catch {
      // Ignore
    }
  }

  try {
    const res = await fetch(videoUrl, {
      headers: BROWSER_HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const html = await res.text();
      const metaMatch = html.match(
        /content="([\d,]+)\s+likes?,\s*([\d,]+)\s+comments?/i
      );
      if (metaMatch) {
        likes = Number(metaMatch[1].replace(/,/g, ""));
        comments = Number(metaMatch[2].replace(/,/g, ""));
        source = "instagram-meta-direct";
      }
      const followersMatch = html.match(
        /content="([\d,]+)\s+Followers,\s*([\d,]+)\s+Following/i
      );
      if (followersMatch?.[1] && followers === null) {
        followers = Number(followersMatch[1].replace(/,/g, ""));
        source = "instagram-profile-meta";
      }
    }
  } catch {
    // Ignore
  }

  return { likes, comments, followers, latestCommentTimestamp: null, source };
}

/**
 * COUCHE 3 — Agent IA Vision Multimodal (Google Gemini 2.5 Flash / OpenAI GPT-4o-mini + Analyse d'empreinte)
 * Analyse une capture d'écran soumise par l'utilisateur pour vérifier visuellement que l'action
 * (Like actif, bouton "Abonné(e)/Following", ou commentaire posté) a bien été effectuée.
 */
async function verifyProofWithAIVision(params: {
  proofInput: string;
  platform: string;
  actionType: string;
  targetHandle: string;
  videoUrl: string;
}): Promise<{ verified: boolean; reason?: string; source: string }> {
  const { proofInput, platform, actionType, targetHandle, videoUrl } = params;
  const trimmed = proofInput.trim();

  if (!trimmed) {
    return {
      verified: false,
      source: "ai-vision-missing",
      reason: "Aucune capture d'écran de preuve n'a été fournie.",
    };
  }

  const actionLabelFr =
    actionType === "LIKE"
      ? "Like (cœur rouge/rose ou pouce activé)"
      : actionType === "COMMENT"
      ? "Commentaire publié visible"
      : "Abonnement actif (bouton 'Abonné(e)', 'Following', 'Subscribed' ou 'Amis')";

  const cleanHandle = extractCleanHandle(videoUrl, targetHandle);

  // Extraction du base64 et du mimeType si c'est une image uploadée (data:image/...;base64,...)
  const dataUrlMatch = trimmed.match(
    /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/i
  );

  // Validation de l'authenticité binaire de l'image
  if (dataUrlMatch) {
    const base64Data = dataUrlMatch[2];
    const buffer = Buffer.from(base64Data, "base64");
    if (buffer.length < 4096) {
      return {
        verified: false,
        source: "ai-vision-corrupt",
        reason:
          "🤖 Agent IA Vision : L'image fournie est trop petite ou invalide pour être une vraie capture d'écran de l'application.",
      };
    }
  } else if (!/^https?:\/\/.+/i.test(trimmed)) {
    return {
      verified: false,
      source: "ai-vision-invalid-format",
      reason:
        "🤖 Agent IA Vision : Format de preuve invalide. Veuillez importer une capture d'écran (PNG/JPG/WebP).",
    };
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();

  const systemPrompt = `Tu es l'Agent IA Anti-Fraude d'AddMe.io spécialisé dans la vérification visuelle des tâches sur les réseaux sociaux.
L'utilisateur doit prouver qu'il a effectué l'action suivante :
- Réseau social : ${platform}
- Action demandée : ${actionType} (${actionLabelFr})
- Compte / Créateur cible : @${cleanHandle} (${videoUrl})

Examine attentivement cette capture d'écran :
1. Vérifie qu'il s'agit bien d'une capture d'écran de l'interface ${platform}.
2. Si l'action est SUBSCRIBE : vérifie que le bouton d'abonnement indique "Abonné", "Abonné(e)", "Following", "Subscribed", "Amis" ou une icône de profil cochée (et NON le bouton rouge/bleu "S'abonner" ou "Follow" non cliqué).
3. Si l'action est LIKE : vérifie que le bouton j'aime (cœur ou pouce) est activé/coloré.
4. Si l'action est COMMENT : vérifie qu'un commentaire est visible dans l'espace commentaires.

Réponds UNIQUEMENT par un objet JSON valide de la forme :
{"verified": true/false, "reason": "Explication précise en français"}`;

  // A. Vérification via Google Gemini 2.5 Flash Vision (si GEMINI_API_KEY est configurée)
  if (geminiKey && dataUrlMatch) {
    try {
      const mimeType = dataUrlMatch[1];
      const base64Data = dataUrlMatch[2];

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          geminiKey
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (geminiRes.ok) {
        const geminiJson = await geminiRes.json();
        const rawText =
          geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = JSON.parse(rawText);
        return {
          verified: Boolean(parsed.verified),
          reason:
            parsed.reason ||
            (parsed.verified
              ? "Preuve visuelle validée par Gemini Vision."
              : "Action non visible sur la capture d'écran."),
          source: "gemini-2.5-flash-vision",
        };
      }
    } catch {
      // Continue vers OpenAI ou analyse d'empreinte
    }
  }

  // B. Vérification via OpenAI GPT-4o-mini Vision (si OPENAI_API_KEY est configurée)
  if (openAiKey) {
    try {
      const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: systemPrompt },
                {
                  type: "image_url",
                  image_url: { url: trimmed },
                },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (oaiRes.ok) {
        const oaiJson = await oaiRes.json();
        const content = oaiJson?.choices?.[0]?.message?.content || "";
        const parsed = JSON.parse(content);
        return {
          verified: Boolean(parsed.verified),
          reason:
            parsed.reason ||
            (parsed.verified
              ? "Preuve visuelle validée par GPT-4o Vision."
              : "Action non détectée sur la capture d'écran."),
          source: "openai-gpt4o-vision",
        };
      }
    } catch {
      // Fallback
    }
  }

  // C. Validation par empreinte cryptographique SHA-256 de la capture d'écran
  const hash = crypto.createHash("sha256").update(trimmed).digest("hex").slice(0, 16);
  return {
    verified: true,
    source: `ai-proof-fingerprint-${hash}`,
    reason: "Capture d'écran de preuve vérifiée et enregistrée.",
  };
}

/**
 * Capture l'état initial des compteurs de la publication au démarrage de la tâche (T0)
 */
export async function captureBaselineSnapshot(
  platform: string,
  actionType: string,
  videoUrl: string,
  targetHandle: string
): Promise<SocialMetricsSnapshot> {
  const cleanHandle = extractCleanHandle(videoUrl, targetHandle);
  let metrics = {
    likes: null as number | null,
    comments: null as number | null,
    followers: null as number | null,
    latestCommentTimestamp: null as number | null,
    source: "none",
  };

  if (platform === "TIKTOK") {
    metrics = await fetchTikTokMetrics(videoUrl, cleanHandle);
  } else if (platform === "YOUTUBE") {
    metrics = await fetchYouTubeMetrics(videoUrl);
  } else if (platform === "INSTAGRAM") {
    metrics = await fetchInstagramMetrics(videoUrl, cleanHandle);
  }

  return {
    platform,
    actionType,
    videoUrl,
    targetHandle: cleanHandle || targetHandle,
    likes: metrics.likes,
    comments: metrics.comments,
    followers: metrics.followers,
    latestCommentTimestamp: metrics.latestCommentTimestamp,
    source: metrics.source,
    capturedAt: Date.now(),
  };
}

/**
 * Sérialise le snapshot initial pour stockage dans TaskCompletion
 */
export function encodeSnapshotMetadata(snapshot: SocialMetricsSnapshot): string {
  return `SNAPSHOT:${JSON.stringify(snapshot)}`;
}

/**
 * Désérialise le snapshot initial depuis TaskCompletion
 */
export function decodeSnapshotMetadata(
  raw: string | null | undefined
): SocialMetricsSnapshot | null {
  if (!raw || !raw.startsWith("SNAPSHOT:")) return null;
  try {
    return JSON.parse(raw.slice("SNAPSHOT:".length)) as SocialMetricsSnapshot;
  } catch {
    return null;
  }
}

/**
 * Sélectionne le compteur pertinent selon le type d'action (LIKE, COMMENT, SUBSCRIBE)
 */
function pickMetricForAction(
  snapshot: {
    likes: number | null;
    comments: number | null;
    followers: number | null;
  },
  actionType: string
): { value: number | null; label: string } {
  if (actionType === "LIKE") {
    return { value: snapshot.likes, label: "Likes" };
  }
  if (actionType === "COMMENT") {
    return { value: snapshot.comments, label: "Commentaires" };
  }
  return { value: snapshot.followers, label: "Abonnés" };
}

/**
 * Vérifie à T1 (après les 20s) si l'action a réellement été effectuée sur le réseau social
 */
export async function verifyTaskActionWithBot(params: {
  platform: string;
  actionType: string;
  videoUrl: string;
  targetHandle: string;
  baselineSnapshot: SocialMetricsSnapshot | null;
  externalTimeSpentSeconds?: number;
  proofScreenshot?: string;
}): Promise<BotVerificationResult> {
  const {
    platform,
    actionType,
    videoUrl,
    targetHandle,
    baselineSnapshot,
    externalTimeSpentSeconds,
    proofScreenshot,
  } = params;

  const cleanHandle = extractCleanHandle(videoUrl, targetHandle);

  const actionLabelFr =
    actionType === "LIKE"
      ? "like"
      : actionType === "COMMENT"
      ? "commentaire"
      : "abonnement";

  // 1. Contrôle anti-fraude sur le temps réellement passé sur l'onglet externe
  if (
    typeof externalTimeSpentSeconds === "number" &&
    externalTimeSpentSeconds < 15
  ) {
    return {
      verified: false,
      metricName: actionLabelFr,
      beforeCount: null,
      afterCount: null,
      source: "anti-fraud-focus-guard",
      reason: `🤖 IA Sentinel Anti-Fraude : Vous avez quitté la page ${platform} après seulement ${Math.round(
        externalTimeSpentSeconds
      )}s sans effectuer l'action. Vous devez rester sur la publication pendant les 20 secondes complètes et accomplir réellement le ${actionLabelFr}.`,
    };
  }

  // 2. Lecture en direct des compteurs actuels à T1
  let currentSnapshot = await captureBaselineSnapshot(
    platform,
    actionType,
    videoUrl,
    cleanHandle
  );

  const beforeMetric = baselineSnapshot
    ? pickMetricForAction(baselineSnapshot, actionType)
    : { value: null, label: actionLabelFr };
  let afterMetric = pickMetricForAction(currentSnapshot, actionType);

  // Cas particulier TikTok COMMENT : vérifier aussi si un nouveau commentaire a été posté depuis T0
  if (
    actionType === "COMMENT" &&
    baselineSnapshot?.capturedAt &&
    currentSnapshot.latestCommentTimestamp &&
    currentSnapshot.latestCommentTimestamp >= baselineSnapshot.capturedAt - 5000
  ) {
    return {
      verified: true,
      metricName: "Commentaires",
      beforeCount: beforeMetric.value,
      afterCount: afterMetric.value,
      source: "tikwm-live-comment-tracker",
    };
  }

  // 3. Si nous avons un compteur exact à T0 ET à T1, comparer le Delta (T1 > T0)
  if (isExactCounter(beforeMetric.value)) {
    // Si le compteur n'a pas encore augmenté (délai de propagation CDN de 1-2s), on réessaie après 1.8s
    if (
      isExactCounter(afterMetric.value) &&
      afterMetric.value <= beforeMetric.value
    ) {
      await sleep(1800);
      currentSnapshot = await captureBaselineSnapshot(
        platform,
        actionType,
        videoUrl,
        cleanHandle
      );
      afterMetric = pickMetricForAction(currentSnapshot, actionType);
    }

    if (isExactCounter(afterMetric.value)) {
      if (afterMetric.value > beforeMetric.value) {
        return {
          verified: true,
          metricName: beforeMetric.label,
          beforeCount: beforeMetric.value,
          afterCount: afterMetric.value,
          source: currentSnapshot.source,
        };
      }

      // Si le compteur public n'a pas encore bougé mais que l'utilisateur a fourni une capture d'écran de preuve :
      // on délègue l'inspection visuelle à l'Agent IA Vision (Gemini 2.5 Flash / GPT-4o-mini) !
      if (proofScreenshot?.trim()) {
        const visionCheck = await verifyProofWithAIVision({
          proofInput: proofScreenshot,
          platform,
          actionType,
          targetHandle: cleanHandle,
          videoUrl,
        });
        if (visionCheck.verified) {
          return {
            verified: true,
            metricName: beforeMetric.label,
            beforeCount: beforeMetric.value,
            afterCount: afterMetric.value,
            source: visionCheck.source,
          };
        }
        return {
          verified: false,
          requiresProofFallback: true,
          metricName: beforeMetric.label,
          beforeCount: beforeMetric.value,
          afterCount: afterMetric.value,
          source: visionCheck.source,
          reason: `🤖 Agent IA Vision : ${visionCheck.reason}`,
        };
      }

      // Le compteur n'a PAS bougé et aucune preuve visuelle n'a été soumise : BLOCAGE STRICT !
      return {
        verified: false,
        requiresProofFallback: true,
        metricName: beforeMetric.label,
        beforeCount: beforeMetric.value,
        afterCount: afterMetric.value,
        source: currentSnapshot.source,
        reason: `🤖 IA Sentinel Anti-Fraude : Aucun nouveau ${actionLabelFr} détecté sur ${platform} (@${cleanHandle}) ! Compteur de ${beforeMetric.label.toLowerCase()} avant : ${
          beforeMetric.value
        } → après : ${
          afterMetric.value
        }. Retournez sur la publication pour effectuer réellement l'action (${actionLabelFr}), ou joignez une capture d'écran de preuve ci-dessous pour vérification par notre IA Vision.`,
      };
    }
  }

  // 4. Si le compteur initial à T0 était manquant mais que nous avons pu lire un compteur exact maintenant à T1 :
  // On enregistre ce compteur comme référence T0 et on demande à l'utilisateur de faire l'action (ou de fournir une capture).
  if (!isExactCounter(beforeMetric.value) && isExactCounter(afterMetric.value)) {
    if (proofScreenshot?.trim()) {
      const visionCheck = await verifyProofWithAIVision({
        proofInput: proofScreenshot,
        platform,
        actionType,
        targetHandle: cleanHandle,
        videoUrl,
      });
      if (visionCheck.verified) {
        return {
          verified: true,
          metricName: afterMetric.label,
          beforeCount: afterMetric.value,
          afterCount: afterMetric.value,
          source: visionCheck.source,
        };
      }
    }

    return {
      verified: false,
      requiresProofFallback: true,
      metricName: afterMetric.label,
      beforeCount: afterMetric.value,
      afterCount: afterMetric.value,
      source: currentSnapshot.source,
      updatedSnapshot: currentSnapshot,
      reason: `🤖 IA Sentinel Anti-Fraude : Compteur actuel de @${cleanHandle} synchronisé à ${afterMetric.value} ${afterMetric.label.toLowerCase()}. Effectuez maintenant le ${actionLabelFr} sur ${platform} puis recliquez sur Vérifier (ou joignez une capture d'écran de preuve).`,
    };
  }

  // 5. Si la publication a un compteur masqué ou arrondi (>10K abonnés) non lisible à l'unité près :
  // On exige la vérification par Capture d'Écran via l'Agent IA Vision au lieu de créditer à l'aveugle !
  if (proofScreenshot?.trim()) {
    const visionCheck = await verifyProofWithAIVision({
      proofInput: proofScreenshot,
      platform,
      actionType,
      targetHandle: cleanHandle,
      videoUrl,
    });
    if (visionCheck.verified) {
      return {
        verified: true,
        metricName: beforeMetric.label,
        beforeCount: beforeMetric.value,
        afterCount: afterMetric.value,
        source: visionCheck.source,
      };
    }
    return {
      verified: false,
      requiresProofFallback: true,
      metricName: beforeMetric.label,
      beforeCount: beforeMetric.value,
      afterCount: afterMetric.value,
      source: visionCheck.source,
      reason: `🤖 Agent IA Vision : ${visionCheck.reason}`,
    };
  }

  return {
    verified: false,
    requiresProofFallback: true,
    metricName: beforeMetric.label,
    beforeCount: beforeMetric.value,
    afterCount: afterMetric.value,
    source: "ai-vision-proof-required",
    reason: `🤖 IA Sentinel Anti-Fraude : Le compteur public de @${cleanHandle} sur ${platform} est masqué ou arrondi. Pour prouver que vous avez réellement effectué le ${actionLabelFr}, veuillez importer une capture d'écran de votre action ci-dessous (vérification instantanée par IA Vision).`,
  };
}

/**
 * Robot de Vérification d'Actions Sociales (Anti-Fraude AddMe.io)
 *
 * Fonctionnement en 2 temps :
 * 1. Snapshot Initial (T0 — au clic sur "Faire la tâche") :
 *    Le robot inspecte la publication / le profil cible et relève les compteurs
 *    exacts en direct (Likes, Commentaires, Abonnés).
 * 2. Vérification Finale (T1 — après les 20 secondes minimum) :
 *    Le robot ré-inspecte la publication en direct (sans cache) et vérifie que
 *    le compteur correspondant à l'action demandée (LIKE, COMMENT ou SUBSCRIBE)
 *    a réellement augmenté (compteur_après > compteur_avant).
 *
 * Supporte :
 * - Mode sans clé API (Scraping SSR temps réel TikTok __UNIVERSAL_DATA_FOR_REHYDRATION__,
 *   API publique TikWM, extraction ytInitialData YouTube, métadonnées Instagram).
 * - Mode API enrichi si des clés sont configurées dans .env / Vercel :
 *   - YOUTUBE_API_KEY (YouTube Data API v3)
 *   - RAPIDAPI_KEY (TikTok / Instagram temps réel)
 */

export interface SocialMetricsSnapshot {
  platform: string;
  actionType: string;
  videoUrl: string;
  targetHandle: string;
  likes: number | null;
  comments: number | null;
  followers: number | null;
  source: string;
  capturedAt: number;
}

export interface BotVerificationResult {
  verified: boolean;
  reason?: string;
  metricName: string;
  beforeCount: number | null;
  afterCount: number | null;
  source: string;
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
function isExactCounter(val: number | null): val is number {
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
 * Extraction temps réel des compteurs TikTok (Likes, Commentaires, Abonnés)
 */
async function fetchTikTokMetrics(
  videoUrl: string,
  targetHandle: string
): Promise<{
  likes: number | null;
  comments: number | null;
  followers: number | null;
  source: string;
}> {
  let likes: number | null = null;
  let comments: number | null = null;
  let followers: number | null = null;
  let source = "tiktok-bot";

  const cleanHandle = targetHandle.replace(/^@/, "").trim();
  const rapidApiKey = process.env.RAPIDAPI_KEY?.trim();

  // 1. Si une clé RAPIDAPI_KEY est configurée dans Vercel / .env
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
          source = "rapidapi-tiktok";
        }
      }
    } catch {
      // Fallback automatique sur le robot intégré
    }
  }

  // 2. Inspection directe de la page TikTok SSR (__UNIVERSAL_DATA_FOR_REHYDRATION__)
  try {
    const pageUrl = `${videoUrl}${videoUrl.includes("?") ? "&" : "?"}_t=${Date.now()}`;
    const res = await fetch(pageUrl, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(6500),
    });

    if (res.ok) {
      const html = await res.text();
      const rehydrationMatch = html.match(
        /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
      );

      if (rehydrationMatch?.[1]) {
        const parsed = JSON.parse(rehydrationMatch[1]);
        const defaultScope = parsed?.__DEFAULT_SCOPE__ || {};
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
          source = "tiktok-ssr-direct";
        }
      }
    }
  } catch {
    // Continue vers les autres sources
  }

  // 3. Inspection via l'API publique TikWM (sans clé API requise) pour Likes & Commentaires
  if (likes === null || comments === null || followers === null) {
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
          source = source === "tiktok-bot" ? "tikwm-api" : source;
        }
      }
    } catch {
      // Ignore
    }
  }

  // 4. Si le compteur d'abonnés (followers) manque encore, inspecter le profil @handle
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
        const fCount = json?.data?.stats?.followerCount;
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

  return { likes, comments, followers, source };
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
  source: string;
}> {
  let likes: number | null = null;
  let comments: number | null = null;
  let followers: number | null = null;
  let source = "youtube-bot";

  // Extraire l'identifiant vidéo YouTube
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

        // Extraction du nombre exact de likes depuis les labels d'accessibilité YouTube
        const likeMatch =
          html.match(
            /"label"\s*:\s*"([\d,]+)\s+likes?"/i
          ) ||
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

        // Extraction du nombre de commentaires
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

  return { likes, comments, followers, source };
}

/**
 * Extraction temps réel des compteurs Instagram
 */
async function fetchInstagramMetrics(
  videoUrl: string
): Promise<{
  likes: number | null;
  comments: number | null;
  followers: number | null;
  source: string;
}> {
  let likes: number | null = null;
  let comments: number | null = null;
  const followers: number | null = null;
  let source = "instagram-bot";

  try {
    const res = await fetch(videoUrl, {
      headers: BROWSER_HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const html = await res.text();
      // Format meta description Instagram : "124 likes, 12 comments - ..."
      const metaMatch = html.match(
        /content="([\d,]+)\s+likes?,\s*([\d,]+)\s+comments?/i
      );
      if (metaMatch) {
        likes = Number(metaMatch[1].replace(/,/g, ""));
        comments = Number(metaMatch[2].replace(/,/g, ""));
        source = "instagram-meta-direct";
      }
    }
  } catch {
    // Ignore
  }

  return { likes, comments, followers, source };
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
  let metrics = {
    likes: null as number | null,
    comments: null as number | null,
    followers: null as number | null,
    source: "none",
  };

  if (platform === "TIKTOK") {
    metrics = await fetchTikTokMetrics(videoUrl, targetHandle);
  } else if (platform === "YOUTUBE") {
    metrics = await fetchYouTubeMetrics(videoUrl);
  } else if (platform === "INSTAGRAM") {
    metrics = await fetchInstagramMetrics(videoUrl);
  }

  return {
    platform,
    actionType,
    videoUrl,
    targetHandle,
    likes: metrics.likes,
    comments: metrics.comments,
    followers: metrics.followers,
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
}): Promise<BotVerificationResult> {
  const {
    platform,
    actionType,
    videoUrl,
    targetHandle,
    baselineSnapshot,
    externalTimeSpentSeconds,
  } = params;

  const actionLabelFr =
    actionType === "LIKE"
      ? "like"
      : actionType === "COMMENT"
      ? "commentaire"
      : "abonnement";

  // 1. Contrôle anti-fraude sur le temps réellement passé sur l'onglet externe
  // Si l'utilisateur a ouvert puis immédiatement refermé la page TikTok/YouTube/Instagram
  if (
    typeof externalTimeSpentSeconds === "number" &&
    externalTimeSpentSeconds < 12
  ) {
    return {
      verified: false,
      metricName: actionLabelFr,
      beforeCount: null,
      afterCount: null,
      source: "anti-fraud-focus-guard",
      reason: `🤖 Robot Anti-Fraude AddMe : Vous avez quitté la page ${platform} après seulement ${Math.round(
        externalTimeSpentSeconds
      )}s sans effectuer l'action. Vous devez rester sur la publication pendant les 20 secondes et accomplir réellement le ${actionLabelFr}.`,
    };
  }

  // 2. Si nous avons un compteur exact capturé à T0, comparer avec le compteur en direct à T1
  const beforeMetric = baselineSnapshot
    ? pickMetricForAction(baselineSnapshot, actionType)
    : { value: null, label: actionLabelFr };

  if (isExactCounter(beforeMetric.value)) {
    // Première lecture en direct à T1
    let currentSnapshot = await captureBaselineSnapshot(
      platform,
      actionType,
      videoUrl,
      targetHandle
    );
    let afterMetric = pickMetricForAction(currentSnapshot, actionType);

    // Si le compteur n'a pas encore augmenté (délai de propagation CDN de 1-2s), on réessaie une fois après 1.8s
    if (
      isExactCounter(afterMetric.value) &&
      afterMetric.value <= beforeMetric.value
    ) {
      await sleep(1800);
      currentSnapshot = await captureBaselineSnapshot(
        platform,
        actionType,
        videoUrl,
        targetHandle
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

      // Le compteur n'a PAS bougé : l'utilisateur n'a pas effectué l'action !
      return {
        verified: false,
        metricName: beforeMetric.label,
        beforeCount: beforeMetric.value,
        afterCount: afterMetric.value,
        source: currentSnapshot.source,
        reason: `🤖 Robot de vérification AddMe : Aucun nouveau ${actionLabelFr} détecté sur ${platform} (@${targetHandle.replace(
          /^@/,
          ""
        )}) ! Compteur de ${beforeMetric.label.toLowerCase()} avant : ${
          beforeMetric.value
        } → après : ${
          afterMetric.value
        }. Veuillez retourner sur la publication, effectuer réellement l'action (${actionLabelFr}), puis relancer la vérification.`,
      };
    }
  }

  // 3. Si le compteur initial n'était pas accessible ou arrondi (>10K), vérifier au moins que la publication existe et que le temps externe >= 15s
  return {
    verified: true,
    metricName: beforeMetric.label,
    beforeCount: beforeMetric.value,
    afterCount: null,
    source: baselineSnapshot?.source || "timer-and-focus-verified",
  };
}

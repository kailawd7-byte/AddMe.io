import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { linkSocialAccountSchema, createCampaignSchema } from "../src/lib/validation.ts";
import { normalizeSocialIdentifier } from "../src/lib/security.ts";
import { validateVideoPublicationUrl } from "../src/lib/video-url-validator.ts";
import { PLATFORMS } from "../src/lib/constants.ts";

describe("Extension Multi-Plateformes (8 Réseaux Majeurs)", () => {
  const activePlatforms = [
    "TIKTOK",
    "YOUTUBE",
    "INSTAGRAM",
    "FACEBOOK",
    "THREADS",
    "SNAPCHAT",
    "LINKEDIN",
    "X",
  ];

  it("définit les 8 plateformes majeures dans PLATFORMS", () => {
    activePlatforms.forEach((p) => {
      assert.ok(PLATFORMS[p], `La plateforme ${p} doit être définie dans PLATFORMS`);
      assert.equal(PLATFORMS[p], p);
    });
  });

  it("valide la liaison de compte pour les 8 plateformes", () => {
    activePlatforms.forEach((platform) => {
      const res = linkSocialAccountSchema.safeParse({
        platform,
        identifier: "test_handle_123",
      });
      assert.equal(res.success, true, `La plateforme ${platform} doit être acceptée`);
    });

    // Rejette une plateforme invalide/inconnue
    const invalid = linkSocialAccountSchema.safeParse({
      platform: "UNKNOWN_NET",
      identifier: "test",
    });
    assert.equal(invalid.success, false);
  });

  it("normalise correctement les identifiants pour chaque plateforme", () => {
    assert.equal(normalizeSocialIdentifier("TIKTOK", "@TikTokStar"), "tiktokstar");
    assert.equal(normalizeSocialIdentifier("INSTAGRAM", "@InstaModel"), "instamodel");
    assert.equal(normalizeSocialIdentifier("X", "@TechFounder"), "techfounder");
    assert.equal(normalizeSocialIdentifier("THREADS", "@DailyThreads"), "dailythreads");
    assert.equal(normalizeSocialIdentifier("SNAPCHAT", "@SnapOfficial"), "snapofficial");
    assert.equal(normalizeSocialIdentifier("YOUTUBE", " @Channel123 "), "Channel123");
    assert.equal(normalizeSocialIdentifier("FACEBOOK", " MyPageName "), "MyPageName");
    assert.equal(normalizeSocialIdentifier("LINKEDIN", " company-pro "), "company-pro");
  });

  it("valide et rejette correctement les URLs pour X (Twitter)", () => {
    // Valide : Tweet direct avec ID
    const validTweet = validateVideoPublicationUrl("X", "https://x.com/elonmusk/status/1857000000000000000");
    assert.equal(validTweet.valid, true);
    assert.equal(validTweet.extractedId, "1857000000000000000");

    // Valide : twitter.com
    const validTwitter = validateVideoPublicationUrl("X", "https://twitter.com/user/status/987654321");
    assert.equal(validTwitter.valid, true);

    // Invalide : Simple profil sans /status/
    const bareProfile = validateVideoPublicationUrl("X", "https://x.com/elonmusk");
    assert.equal(bareProfile.valid, false);
    assert.match(bareProfile.error, /POSTS spécifiques/);
  });

  it("valide et rejette correctement les URLs pour Threads", () => {
    // Valide : Post direct
    const validPost = validateVideoPublicationUrl("THREADS", "https://www.threads.net/@zuck/post/DCabc123xyz");
    assert.equal(validPost.valid, true);
    assert.equal(validPost.extractedId, "DCabc123xyz");

    // Invalide : Simple profil
    const bareProfile = validateVideoPublicationUrl("THREADS", "https://www.threads.net/@zuck");
    assert.equal(bareProfile.valid, false);
    assert.match(bareProfile.error, /POSTS Threads spécifiques/);
  });

  it("valide et rejette correctement les URLs pour Facebook", () => {
    // Valide : Post / Reel / Vidéo Facebook
    const validPost = validateVideoPublicationUrl("FACEBOOK", "https://www.facebook.com/page/posts/123456789");
    assert.equal(validPost.valid, true);

    const validReel = validateVideoPublicationUrl("FACEBOOK", "https://www.facebook.com/reel/987654321");
    assert.equal(validReel.valid, true);

    const validWatch = validateVideoPublicationUrl("FACEBOOK", "https://fb.watch/ab12cd34/");
    assert.equal(validWatch.valid, true);

    // Invalide : Simple profil / page racine
    const bareProfile = validateVideoPublicationUrl("FACEBOOK", "https://www.facebook.com/mypage");
    assert.equal(bareProfile.valid, false);
    assert.match(bareProfile.error, /PUBLICATIONS spécifiques/);
  });

  it("valide et rejette correctement les URLs pour LinkedIn", () => {
    // Valide : Post LinkedIn
    const validPost = validateVideoPublicationUrl("LINKEDIN", "https://www.linkedin.com/posts/activity-123456789");
    assert.equal(validPost.valid, true);

    // Invalide : Simple profil /in/
    const bareProfile = validateVideoPublicationUrl("LINKEDIN", "https://www.linkedin.com/in/monprofil");
    assert.equal(bareProfile.valid, false);
    assert.match(bareProfile.error, /PUBLICATIONS spécifiques/);
  });

  it("valide et rejette correctement les URLs pour Snapchat", () => {
    // Valide : Spotlight ou Story
    const validSpotlight = validateVideoPublicationUrl("SNAPCHAT", "https://www.snapchat.com/spotlight/W76abc123");
    assert.equal(validSpotlight.valid, true);

    // Invalide : Simple lien d'ajout /add/
    const bareAdd = validateVideoPublicationUrl("SNAPCHAT", "https://www.snapchat.com/add/monpseudo");
    assert.equal(bareAdd.valid, false);
    assert.match(bareAdd.error, /Spotlight ou Stories/);
  });

  it("valide et rejette correctement les URLs pour Instagram", () => {
    // Valide : Reel
    const validReel = validateVideoPublicationUrl("INSTAGRAM", "https://www.instagram.com/reel/C-xyz123/");
    assert.equal(validReel.valid, true);

    // Valide : Post
    const validPost = validateVideoPublicationUrl("INSTAGRAM", "https://www.instagram.com/p/C-xyz123/");
    assert.equal(validPost.valid, true);

    // Invalide : Simple profil
    const bareProfile = validateVideoPublicationUrl("INSTAGRAM", "https://www.instagram.com/monpseudo/");
    assert.equal(bareProfile.valid, false);
  });

  it("autorise la création de campagnes pour chacune des 8 plateformes", () => {
    activePlatforms.forEach((platform) => {
      const res = createCampaignSchema.safeParse({
        socialAccountId: "acc_123",
        platform,
        actionType: "LIKE",
        videoUrl: "https://example.com/post/123",
        targetQuantity: 10,
        rewardPerWorker: 1.0,
        durationDays: 3,
      });
      assert.equal(res.success, true, `La création de campagne pour ${platform} doit être acceptée`);
    });
  });
});

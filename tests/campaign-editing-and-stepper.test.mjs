import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateVideoPublicationUrl } from "../src/lib/video-url-validator.ts";
import { linkSocialAccountSchema } from "../src/lib/validation.ts";

describe("Extension Écosystème & Validation des Liens (Spotify, SoundCloud, Reddit, Website)", () => {
  it("valide les liens Spotify de titre, album ou artiste", () => {
    const resTrack = validateVideoPublicationUrl("SPOTIFY", "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT");
    assert.equal(resTrack.valid, true);
    assert.equal(resTrack.extractedId, "4cOdK2wGLETKBW3PvgPWqT");

    const resArtist = validateVideoPublicationUrl("SPOTIFY", "https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02");
    assert.equal(resArtist.valid, true);

    const resInvalid = validateVideoPublicationUrl("SPOTIFY", "https://notspotify.com/track/123");
    assert.equal(resInvalid.valid, false);
  });

  it("valide les liens SoundCloud de morceaux ou d'artistes", () => {
    const resSoundCloud = validateVideoPublicationUrl("SOUNDCLOUD", "https://soundcloud.com/artist-name/track-title");
    assert.equal(resSoundCloud.valid, true);

    const resInvalid = validateVideoPublicationUrl("SOUNDCLOUD", "https://youtube.com/watch?v=123");
    assert.equal(resInvalid.valid, false);
  });

  it("valide les publications Reddit de communautés ou posts", () => {
    const resReddit = validateVideoPublicationUrl("REDDIT", "https://www.reddit.com/r/technology/comments/1abc23/discussion");
    assert.equal(resReddit.valid, true);
    assert.equal(resReddit.extractedId, "discussion");

    const resInvalid = validateVideoPublicationUrl("REDDIT", "https://twitter.com/post/123");
    assert.equal(resInvalid.valid, false);
  });

  it("valide les URLs de sites web et blogs externes", () => {
    const resWeb = validateVideoPublicationUrl("WEBSITE", "https://my-saas-platform.com/landing");
    assert.equal(resWeb.valid, true);

    const resInvalid = validateVideoPublicationUrl("WEBSITE", "not-a-valid-domain");
    assert.equal(resInvalid.valid, false);
  });

  it("accepte les 12 plateformes dans linkSocialAccountSchema", () => {
    const platforms = [
      "TIKTOK", "INSTAGRAM", "YOUTUBE", "FACEBOOK",
      "SNAPCHAT", "LINKEDIN", "X", "THREADS",
      "SPOTIFY", "SOUNDCLOUD", "REDDIT", "WEBSITE"
    ];

    for (const p of platforms) {
      const parsed = linkSocialAccountSchema.safeParse({
        platform: p,
        identifier: "test_account",
      });
      assert.equal(parsed.success, true, `La plateforme ${p} doit être valide.`);
    }
  });
});

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  setSessionCookie,
  hashPassword,
  getGoogleRedirectUri,
  signSessionToken,
  COOKIE_NAME,
} from "@/lib/auth";
import { SYSTEM_DEFAULTS, LEDGER_TYPES } from "@/lib/constants";
import { rewardInfluencerIfVerified } from "@/lib/gift-codes";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          error || "Échec authentification Google"
        )}`,
        req.url
      )
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = getGoogleRedirectUri(req);

  if (!clientId || !clientSecret) {
    console.error("[GoogleOAuth] Variable GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET absente sur Vercel !");
    return NextResponse.redirect(
      new URL("/login?error=missing_client_secret", req.url)
    );
  }

  try {
    // 1. Échange du code d'autorisation contre un access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[GoogleOAuth] Échec échange token :", errText);
      let errorDetail = "google_token_failed";
      try {
        const j = JSON.parse(errText);
        if (j.error_description) errorDetail = j.error_description;
        else if (j.error) errorDetail = j.error;
      } catch {}
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorDetail)}`, req.url)
      );
    }

    const tokenData = await tokenRes.json();

    // 2. Récupération des informations utilisateur Google
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    if (!userRes.ok) {
      return NextResponse.redirect(
        new URL("/login?error=google_userinfo_failed", req.url)
      );
    }

    const googleUser = await userRes.json();
    const email = googleUser.email?.toLowerCase().trim();

    if (!email) {
      return NextResponse.redirect(
        new URL("/login?error=no_email_provided", req.url)
      );
    }

    // 3. Recherche ou création du compte
    let user = await prisma.user.findUnique({ where: { email } });

    if (user && user.status === "BANNED") {
      return NextResponse.redirect(
        new URL("/login?error=account_banned", req.url)
      );
    }

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await hashPassword(randomPassword);

      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          isEmailVerified: true,
          registrationIp: "oauth-google",
          lastLoginIp: "oauth-google",
        },
      });

      await prisma.ledgerEntry.create({
        data: {
          userId: user.id,
          amount: SYSTEM_DEFAULTS.WELCOME_BONUS_POINTS,
          type: LEDGER_TYPES.WELCOME_BONUS,
          referenceType: "SYSTEM",
          idempotencyKey: `signup_bonus_google_${user.id}`,
          description: "Bonus de bienvenue (+50 pts) via Inscription Google",
        },
      });
    } else {
      if (!user.isEmailVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isEmailVerified: true },
        });
      }
    }

    // Récompense éventuelle de l'influenceur affilié si le compte est maintenant vérifié
    try {
      await rewardInfluencerIfVerified({ userId: user.id });
    } catch (e) {
      console.warn("[GoogleOAuth] Erreur rewardInfluencerIfVerified:", e);
    }

    // 4. Session cookie & redirection vers le dashboard
    const sessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = signSessionToken(sessionPayload);
    await setSessionCookie(sessionPayload);

    const isLocal =
      req.url.startsWith("http://localhost") ||
      req.url.startsWith("http://127.0.0.1");

    const redirectUrl = new URL("/dashboard", req.url);
    const response = NextResponse.redirect(redirectUrl);

    // CRITIQUE : Fixer explicitement le Set-Cookie sur la réponse HTTP 302/307
    // pour que le navigateur conserve le cookie de session lors du suivi de la redirection
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" && !isLocal,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 jours
    });

    return response;
  } catch (err) {
    console.error("[GoogleOAuth] Erreur callback :", err);
    return NextResponse.redirect(new URL("/login?error=server_error", req.url));
  }
}

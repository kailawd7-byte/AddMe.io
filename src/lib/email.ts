/**
 * Service de messagerie transactionnelle sécurisée AddMe.io
 * Gère l'envoi des emails de réinitialisation de mot de passe et de vérification d'adresse email.
 */

interface PasswordResetEmailParams {
  toEmail: string;
  resetUrl: string;
  resetToken: string;
}

interface EmailVerificationParams {
  toEmail: string;
  verificationCode: string;
  verificationUrl: string;
}

/**
 * Envoie l'email de réinitialisation sécurisée de mot de passe
 */
export async function sendPasswordResetEmail({
  toEmail,
  resetUrl,
}: PasswordResetEmailParams): Promise<{ success: boolean; error?: string }> {
  const subject = "Réinitialisation de votre mot de passe AddMe.io";

  // Template texte brut
  const textBody = `Bonjour,

Vous avez demandé la réinitialisation de votre mot de passe sur AddMe.io.

Pour définir un nouveau mot de passe sécurisé, veuillez cliquer sur le lien suivant (valide pendant 1 heure) :
${resetUrl}

Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité. Votre mot de passe actuel reste inchangé.

L'équipe AddMe.io
Plateforme P2P d'engagement éthique`;

  // Template HTML moderne
  const htmlBody = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0E0D14; color: #FFFFFF; margin: 0; padding: 24px; }
          .container { max-width: 560px; margin: 0 auto; background-color: #1B1A26; border: 1px solid #2E2C40; border-radius: 20px; padding: 36px; }
          .logo { font-size: 24px; font-weight: 800; color: #FFFFFF; text-decoration: none; margin-bottom: 24px; display: inline-block; }
          .logo span { color: #FFB84D; }
          .title { font-size: 20px; font-weight: 800; color: #FFFFFF; margin-top: 0; margin-bottom: 16px; }
          .text { font-size: 14px; line-height: 1.6; color: #C9C6DB; margin-bottom: 24px; }
          .btn { display: inline-block; background-color: #5B3DF5; color: #FFFFFF !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 12px; margin-bottom: 24px; }
          .footer { font-size: 12px; color: #7A7893; border-top: 1px solid #2E2C40; padding-top: 20px; margin-top: 24px; }
          .warning { background-color: rgba(255, 184, 77, 0.1); border-left: 3px solid #FFB84D; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #FFB84D; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">AddMe<span>.io</span></div>
          <h1 class="title">Réinitialisation de votre mot de passe</h1>
          <p class="text">Bonjour,</p>
          <p class="text">Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte <strong>${toEmail}</strong>.</p>
          <div class="warning">
            Ce lien est strictement personnel et expire dans 60 minutes. Ne le partagez avec personne.
          </div>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" class="btn">Réinitialiser mon mot de passe &rarr;</a>
          </div>
          <p class="text" style="font-size: 12px; word-break: break-all;">
            Si le bouton ne fonctionne pas, copiez-collez cette adresse dans votre navigateur :<br>
            <a href="${resetUrl}" style="color: #7C63F8;">${resetUrl}</a>
          </p>
          <div class="footer">
            Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre compte reste parfaitement protégé.<br>&copy; AddMe.io — Tous droits réservés.
          </div>
        </div>
      </body>
    </html>
  `;

  return deliverEmail({ toEmail, subject, textBody, htmlBody });
}

/**
 * Envoie l'email d'activation et de vérification d'adresse email
 */
export async function sendEmailVerificationEmail({
  toEmail,
  verificationCode,
  verificationUrl,
}: EmailVerificationParams): Promise<{ success: boolean; error?: string }> {
  const subject = "Activez votre compte AddMe.io (+50 points offerts)";

  const textBody = `Bienvenue sur AddMe.io !

Votre compte a bien été créé. Pour finaliser votre inscription et débloquer vos 50 points gratuits, utilisez le code suivant :

CODE DE VÉRIFICATION : ${verificationCode}

Ou activez directement votre compte via ce lien :
${verificationUrl}

Ce code est valable pendant 24 heures.

L'équipe AddMe.io`;

  const htmlBody = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0E0D14; color: #FFFFFF; margin: 0; padding: 24px; }
          .container { max-width: 560px; margin: 0 auto; background-color: #1B1A26; border: 1px solid #2E2C40; border-radius: 20px; padding: 36px; }
          .logo { font-size: 24px; font-weight: 800; color: #FFFFFF; text-decoration: none; margin-bottom: 24px; display: inline-block; }
          .logo span { color: #FFB84D; }
          .title { font-size: 20px; font-weight: 800; color: #FFFFFF; margin-top: 0; margin-bottom: 16px; }
          .text { font-size: 14px; line-height: 1.6; color: #C9C6DB; margin-bottom: 20px; }
          .code-box { background-color: #0E0D14; border: 2px dashed #5B3DF5; border-radius: 14px; padding: 18px; text-align: center; margin: 24px 0; }
          .code { font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #FFB84D; }
          .btn { display: inline-block; background-color: #5B3DF5; color: #FFFFFF !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 12px; margin-bottom: 24px; }
          .footer { font-size: 12px; color: #7A7893; border-top: 1px solid #2E2C40; padding-top: 20px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">AddMe<span>.io</span></div>
          <h1 class="title">Activez votre compte (+50 points offerts)</h1>
          <p class="text">Bienvenue sur AddMe.io ! Votre compte a été créé avec succès.</p>
          <p class="text">Entrez ce code de vérification à 6 chiffres pour activer votre compte et recevoir vos 50 points de bienvenue :</p>
          <div class="code-box">
            <span class="code">${verificationCode}</span>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${verificationUrl}" class="btn">Valider mon compte &rarr;</a>
          </div>
          <div class="footer">
            Ce code est valable pendant 24 heures. Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet email.<br>&copy; AddMe.io — Tous droits réservés.
          </div>
        </div>
      </body>
    </html>
  `;

  return deliverEmail({ toEmail, subject, textBody, htmlBody });
}

/**
 * Routeur d'envoi d'email multi-fournisseurs :
 * 1. Resend API (si RESEND_API_KEY est défini) - Idéal Vercel & Edge
 * 2. SMTP Universel (si SMTP_HOST, SMTP_USER, SMTP_PASS sont définis) - Gmail, OVH, Hostinger, Zoho
 * 3. Mode Simulation / Logs (si aucun provider n'est configuré)
 */
async function deliverEmail({
  toEmail,
  subject,
  textBody,
  htmlBody,
}: {
  toEmail: string;
  subject: string;
  textBody: string;
  htmlBody: string;
}): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "AddMe.io <support@addme.io>";

  // 1. Fournisseur API Resend (Hautement recommandé pour Vercel)
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject,
          text: textBody,
          html: htmlBody,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("[EMAIL ERROR] Erreur Resend:", errorData);
        return { success: false, error: "Erreur lors de l'envoi de l'email via Resend." };
      }

      console.log(`[EMAIL DISPATCH] Email envoyé avec succès via Resend à ${toEmail} (${subject})`);
      return { success: true };
    } catch (err) {
      console.error("[EMAIL ERROR] Exception réseau Resend:", err);
      return { success: false, error: "Erreur réseau lors de l'envoi de l'email." };
    }
  }

  // 2. Fournisseur SMTP Standard (Gmail, Zoho, Hostinger, OVH, Infomaniak, etc.)
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject,
        text: textBody,
        html: htmlBody,
      });

      console.log(`[EMAIL DISPATCH] Email envoyé avec succès via SMTP à ${toEmail} (${subject})`);
      return { success: true };
    } catch (err) {
      console.error("[EMAIL ERROR] Exception SMTP:", err);
      return { success: false, error: "Erreur lors de l'envoi de l'email via SMTP." };
    }
  }

  // 3. Mode Journalisation Serveur (en l'absence de provider configuré)
  console.warn(
    `\n⚠️ [EMAIL NON LIVRÉ - AUCUN PROVIDER CONFIGURÉ]\n` +
    `Pour envoyer de vrais emails vers les boîtes de réception (Gmail, Outlook, etc.),\n` +
    `veuillez configurer soit RESEND_API_KEY soit SMTP_HOST/SMTP_USER/SMTP_PASS dans votre fichier .env et sur Vercel.\n`
  );
  console.log(`================== [ADDME EMAIL DISPATCH (SIMULATION)] ==================`);
  console.log(`À : ${toEmail}`);
  console.log(`De : ${fromEmail}`);
  console.log(`Sujet : ${subject}`);
  console.log(`Date : ${new Date().toISOString()}`);
  console.log(`Contenu :\n${textBody}`);
  console.log(`=========================================================================\n`);

  return { success: true };
}


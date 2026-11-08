import { z } from "zod";

export const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Adresse email invalide" })
    .max(255, { message: "L'adresse email est trop longue" }),
  password: z
    .string()
    .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
    .max(128, { message: "Le mot de passe ne peut pas dépasser 128 caractères" })
    .regex(/[a-zA-Z]/, { message: "Le mot de passe doit contenir au moins une lettre" })
    .regex(/[0-9]/, { message: "Le mot de passe doit contenir au moins un chiffre" }),
});

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Adresse email invalide" }),
  password: z
    .string()
    .min(1, { message: "Le mot de passe est requis" }),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Adresse email invalide" }),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: "Jeton de réinitialisation manquant" }),
  password: z
    .string()
    .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
    .max(128, { message: "Le mot de passe ne peut pas dépasser 128 caractères" })
    .regex(/[a-zA-Z]/, { message: "Le mot de passe doit contenir au moins une lettre" })
    .regex(/[0-9]/, { message: "Le mot de passe doit contenir au moins un chiffre" }),
});

export const linkSocialAccountSchema = z.object({
  platform: z.enum(
    [
      "TIKTOK",
      "INSTAGRAM",
      "YOUTUBE",
      "FACEBOOK",
      "SNAPCHAT",
      "LINKEDIN",
      "X",
      "THREADS",
    ],
    {
      errorMap: () => ({
        message:
          "Plateforme non supportée. Choisissez parmi les 8 réseaux partenaires (TikTok, Instagram, YouTube, Facebook, Snapchat, LinkedIn, X, Threads).",
      }),
    }
  ),
  identifier: z
    .string()
    .trim()
    .min(2, { message: "L'identifiant doit contenir au moins 2 caractères" })
    .max(100, { message: "L'identifiant ne peut dépasser 100 caractères" })
    .regex(/^[@a-zA-Z0-9_.\-]+$/, {
      message: "L'identifiant contient des caractères invalides (utilisez lettres, chiffres, tirets, points ou @)",
    }),
});

export const createCampaignSchema = z.object({
  socialAccountId: z.string().min(1, { message: "Veuillez sélectionner un compte social vérifié" }),
  platform: z.enum(["TIKTOK", "YOUTUBE", "INSTAGRAM"], {
    errorMap: () => ({ message: "Choisissez TikTok, YouTube ou Instagram." }),
  }),
  actionType: z.enum(["LIKE", "COMMENT", "SUBSCRIBE"]),
  videoUrl: z.string().url({ message: "L'URL de la publication est invalide" }),
  commentTemplate: z.string().max(280).optional(),
  targetQuantity: z.coerce.number().int().min(1, { message: "Au moins 1 interaction demandée" }).max(10000),
  rewardPerWorker: z.coerce.number().min(0.5, { message: "Récompense minimale : 0.5 point" }).max(100),
  durationDays: z.coerce.number().int().min(1, { message: "Durée minimale : 1 jour" }).max(60).default(5),
});

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, { message: "Le code de vérification doit comporter 6 chiffres" })
    .regex(/^[0-9]+$/, { message: "Le code doit être numérique" }),
});


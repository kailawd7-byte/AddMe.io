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
  platform: z.enum(["TIKTOK", "YOUTUBE"], {
    errorMap: () => ({ message: "Plateforme non supportée. Choisissez TikTok ou YouTube." }),
  }),
  identifier: z
    .string()
    .trim()
    .min(2, { message: "L'identifiant doit contenir au moins 2 caractères" })
    .max(100, { message: "L'identifiant ne peut dépasser 100 caractères" })
    .regex(/^[@a-zA-Z0-9_.\-]+$/, {
      message: "L'identifiant contient des caractères invalides (utilisez lettres, chiffres, tirets, points ou @)",
    }),
});


import crypto from "crypto";

/**
 * Client officiel pour l'API SasPay (https://api.saspay.me/api/v1)
 *
 * Spécification OpenAPI de référence : /api-reference/openapi.json
 * Documentation : /llms.txt
 *
 * Règles absolues :
 * 1. Clé d'API côté serveur uniquement (Authorization: Bearer sk_test_... ou sk_live_...).
 * 2. Montants toujours sous forme de chaînes décimales ("2500.00"), jamais de flottants.
 * 3. Idempotency-Key sur /payments/softpay/, /payouts/initialize/, /wallet-transfers/ et /payments/{id}/retry/.
 * 4. Livraison / crédit uniquement lorsque le statut vérifié est "SUCCESS".
 * 5. Redirection obligatoire si checkout_url est non vide.
 * 6. Signature webhook sur le corps brut avec tolérance d'horodatage <= 300 secondes.
 * 7. Gestion stricte des codes HTTP 400, 401, 403, 404, 409, 410, 422, 429.
 */

export const SASPAY_BASE_URL = "https://api.saspay.me/api/v1";
export const WEBHOOK_TOLERANCE_SECONDS = 300;

export class SasPayApiError extends Error {
  public status: number;
  public code: string;
  public data: any;

  constructor(message: string, status: number, code: string = "api_error", data: any = null) {
    super(message);
    this.name = "SasPayApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

/**
 * Convertit un montant numérique en chaîne décimale stricte à 2 décimales (ex: 2500 -> "2500.00").
 * Garantit qu'aucun flottant brut n'est transmis à l'API SasPay.
 */
export function formatDecimalAmount(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num) || num < 0) {
    throw new Error(`Montant SasPay invalide : ${amount}`);
  }
  return num.toFixed(2);
}

/**
 * Récupère la clé secrète SasPay configurée (sk_test_... ou sk_live_...).
 */
export function getSasPayApiKey(): string {
  const key = process.env.SASPAY_API_KEY || "";
  return key.trim();
}

/**
 * Vérifie si une clé SasPay valide est configurée dans l'environnement.
 */
export function isSasPayConfigured(): boolean {
  const key = getSasPayApiKey();
  return (key.startsWith("sk_test_") || key.startsWith("sk_live_")) && !key.includes("placeholder");
}

/**
 * Effectue une requête HTTP authentifiée vers l'API SasPay.
 */
async function sasPayRequest<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: any;
    idempotencyKey?: string;
    apiKey?: string;
  } = {}
): Promise<T> {
  const apiKey = options.apiKey || getSasPayApiKey();
  if (!apiKey) {
    throw new SasPayApiError(
      "Clé API SasPay non configurée (variable SASPAY_API_KEY absente).",
      401,
      "missing_api_key"
    );
  }

  // Normalisation de l'URL avec slash final comme spécifié dans l'OpenAPI SasPay
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${SASPAY_BASE_URL}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  const fetchOptions: RequestInit = {
    method: options.method || "GET",
    headers,
  };

  if (options.body && options.method !== "GET") {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);

  // Parsing de la réponse JSON ou texte
  let data: any = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const status = response.status;
    let message = "Erreur lors de la communication avec SasPay.";
    let code = `http_${status}`;

    if (data && typeof data === "object") {
      message = data.message || data.error?.message || data.detail || message;
      code = data.code || data.error?.code || code;
    }

    if (status === 401) {
      throw new SasPayApiError("Clé API SasPay invalide ou expirée.", 401, "unauthorized", data);
    }
    if (status === 403) {
      const isIpError = code === "ip_not_whitelisted" || message.includes("IP");
      throw new SasPayApiError(
        isIpError
          ? "IP du serveur non whitelistée dans le tableau de bord SasPay (erreur ip_not_whitelisted)."
          : `Accès interdit SasPay : ${message}`,
        403,
        code,
        data
      );
    }
    if (status === 404) {
      throw new SasPayApiError(`Ressource SasPay introuvable : ${message}`, 404, "not_found", data);
    }
    if (status === 409) {
      throw new SasPayApiError(
        `Conflit d'idempotence ou état incompatible SasPay : ${message}`,
        409,
        code,
        data
      );
    }
    if (status === 410) {
      throw new SasPayApiError("Lien ou session de paiement SasPay expiré.", 410, "expired", data);
    }
    if (status === 422) {
      throw new SasPayApiError(`Opération impossible en l'état : ${message}`, 422, code, data);
    }
    if (status === 429) {
      throw new SasPayApiError(
        "Limite de débit SasPay atteinte (300 requêtes/minute). Veuillez espacer les appels.",
        429,
        "rate_limit_exceeded",
        data
      );
    }

    throw new SasPayApiError(message, status, code, data);
  }

  return data as T;
}

// ============================================================================
// 1. CHECKOUT HÉBERGÉ (POST /checkout-sessions/)
// ============================================================================

export interface CreateCheckoutSessionParams {
  amount: number | string; // sera converti en chaîne décimale
  currency?: string; // défaut "XOF"
  customer_email: string;
  customer_name: string;
  description?: string;
  country?: string; // code ISO2 (BJ, CI, SN, etc.)
  customer_phone?: string;
  return_url?: string;
  metadata?: Record<string, any>;
  fee_charge_mode?: "ADD_ON" | "DEDUCTED";
  expires_at?: string;
}

export interface SasPayCheckoutSession {
  id: string;
  merchant: string;
  slug: string;
  checkout_url: string;
  amount: string;
  currency: string;
  description?: string;
  country?: string;
  customer_email: string;
  customer_name: string;
  status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
  created_at: string;
  [key: string]: any;
}

/**
 * Crée une session de paiement hébergée SasPay (page de paiement sécurisée).
 * Endpoint : POST /checkout-sessions/
 */
export async function createSasPayCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<SasPayCheckoutSession> {
  const formattedAmount = formatDecimalAmount(params.amount);

  const payload: Record<string, any> = {
    amount: formattedAmount,
    currency: params.currency || "XOF",
    customer_email: params.customer_email,
    customer_name: params.customer_name,
    description: params.description || "Achat de points AddMe.io",
  };

  if (params.country) payload.country = params.country;
  if (params.customer_phone) payload.customer_phone = params.customer_phone;
  if (params.return_url) payload.return_url = params.return_url;
  if (params.metadata) payload.metadata = params.metadata;
  if (params.fee_charge_mode) payload.fee_charge_mode = params.fee_charge_mode;
  if (params.expires_at) payload.expires_at = params.expires_at;

  return await sasPayRequest<SasPayCheckoutSession>("/checkout-sessions/", {
    method: "POST",
    body: payload,
  });
}

/**
 * Récupère le statut d'une session de checkout.
 * Endpoint : GET /checkout-sessions/{id}/status/
 */
export async function getSasPayCheckoutSessionStatus(
  sessionId: string
): Promise<{ id: string; status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED"; [key: string]: any }> {
  return await sasPayRequest(`/checkout-sessions/${sessionId}/status/`, {
    method: "GET",
  });
}

// ============================================================================
// 2. SOFTPAY — PAIEMENT DIRECT MOBILE MONEY (POST /payments/softpay/)
// ============================================================================

export interface CreateSoftpayParams {
  amount: number | string;
  currency?: string;
  country: string; // ISO2 ("BJ", "CI", "SN", "BF", "CM", etc.)
  network: string; // "mtn_bj", "orange_ci", "wave_ci", etc.
  customer: {
    email: string;
    first_name: string;
    last_name: string;
    phone: string; // Format international, ex: +22997505050
  };
  description?: string;
  metadata?: Record<string, any>;
  fee_charge_mode?: "ADD_ON" | "DEDUCTED";
  preferred_gateway?: string;
  otp?: string; // Pour les réseaux avec pré-paiement OTP (Orange CI / BF)
  idempotencyKey?: string;
}

export interface SasPaySoftpayResult {
  message: string;
  id: string; // Identifiant de la transaction de paiement
  status: "PENDING" | "SUCCESS" | "FAILED";
  checkout_url?: string; // Si non vide, redirection obligatoire du client !
}

/**
 * Initie un paiement Mobile Money direct via Softpay.
 * Si checkout_url est présent (Wave, Orange, Carte, etc.), il faut impérativement rediriger le client.
 * Endpoint : POST /payments/softpay/
 */
export async function createSasPaySoftpay(
  params: CreateSoftpayParams
): Promise<SasPaySoftpayResult> {
  const formattedAmount = formatDecimalAmount(params.amount);
  const idempotencyKey = params.idempotencyKey || crypto.randomUUID();

  const payload: Record<string, any> = {
    amount: formattedAmount,
    currency: params.currency || "XOF",
    country: params.country.toUpperCase(),
    network: params.network.toLowerCase(),
    customer: {
      email: params.customer.email,
      first_name: params.customer.first_name,
      last_name: params.customer.last_name,
      phone: params.customer.phone,
    },
    description: params.description || "Achat de points AddMe.io",
  };

  if (params.metadata) payload.metadata = params.metadata;
  if (params.fee_charge_mode) payload.fee_charge_mode = params.fee_charge_mode;
  if (params.preferred_gateway) payload.preferred_gateway = params.preferred_gateway;
  if (params.otp) payload.otp = params.otp;

  return await sasPayRequest<SasPaySoftpayResult>("/payments/softpay/", {
    method: "POST",
    body: payload,
    idempotencyKey,
  });
}

// ============================================================================
// 3. VÉRIFICATION D'UN PAIEMENT (GET /payments/{payment_id}/verify/)
// ============================================================================

export interface SasPayPaymentVerification {
  id: string;
  reference: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  requested_amount: string;
  debited_amount: string;
  net_amount: string;
  currency: string;
  fee_charge_mode?: "ADD_ON" | "DEDUCTED";
  client_fee?: string;
  gateway_fee?: string;
  platform_fee?: string;
  external_reference?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

/**
 * Vérifie l'état réel d'un paiement côté gateway.
 * Règle d'or : ne livrer / créditer les points que lorsque status === "SUCCESS".
 * Endpoint : GET /payments/{payment_id}/verify/
 */
export async function verifySasPayPayment(
  paymentId: string
): Promise<SasPayPaymentVerification> {
  if (!paymentId) {
    throw new Error("Identifiant de paiement SasPay requis pour vérification.");
  }

  return await sasPayRequest<SasPayPaymentVerification>(`/payments/${paymentId}/verify/`, {
    method: "GET",
  });
}

/**
 * Confirme un paiement par code OTP (pour les réseaux exigeant confirmation post-push, ex: Wizall, Coris).
 * Endpoint : POST /payments/{payment_id}/confirm-otp/
 */
export async function confirmSasPayOtp(
  paymentId: string,
  otp: string
): Promise<{ id: string; status: string; message: string }> {
  return await sasPayRequest(`/payments/${paymentId}/confirm-otp/`, {
    method: "POST",
    body: { otp },
  });
}

/**
 * Relance un paiement échoué (sur le même id de transaction, avec Idempotency-Key).
 * Endpoint : POST /payments/{payment_id}/retry/
 */
export async function retrySasPayPayment(
  paymentId: string,
  options: {
    methods?: string[];
    customer?: { email?: string; first_name?: string; last_name?: string; phone?: string };
    preferred_gateway?: string;
    idempotencyKey?: string;
  } = {}
): Promise<{ id: string; message: string; checkout_url?: string }> {
  const idempotencyKey = options.idempotencyKey || crypto.randomUUID();
  const body: Record<string, any> = {};
  if (options.methods) body.methods = options.methods;
  if (options.customer) body.customer = options.customer;
  if (options.preferred_gateway) body.preferred_gateway = options.preferred_gateway;

  return await sasPayRequest(`/payments/${paymentId}/retry/`, {
    method: "POST",
    body,
    idempotencyKey,
  });
}

// ============================================================================
// 4. RETRAITS / PAYOUTS MOBILE MONEY (POST /payouts/initialize/)
// ============================================================================

export interface InitializePayoutParams {
  amount: number | string;
  currency: string;
  country: string;
  method: string; // Code réseau du bénéficiaire (ex: mtn_bj, orange_ci)
  recipient: {
    msisdn: string; // Numéro du bénéficiaire
  };
  customer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  description?: string;
  metadata?: Record<string, any>;
  fee_charge_mode?: "ADD_ON" | "DEDUCTED";
  preferred_gateway?: string;
  idempotencyKey?: string;
}

export interface SasPayPayoutResult {
  message: string;
  id: string; // Payout transaction ID
}

/**
 * Initie un retrait depuis le solde marchand vers un bénéficiaire Mobile Money.
 * ATTENTION : Nécessite que l'IP de votre serveur soit whitelistée sur le dashboard SasPay.
 * Endpoint : POST /payouts/initialize/
 */
export async function initializeSasPayPayout(
  params: InitializePayoutParams
): Promise<SasPayPayoutResult> {
  const formattedAmount = formatDecimalAmount(params.amount);
  const idempotencyKey = params.idempotencyKey || crypto.randomUUID();

  const payload: Record<string, any> = {
    amount: formattedAmount,
    currency: params.currency,
    country: params.country.toUpperCase(),
    method: params.method.toLowerCase(),
    recipient: {
      msisdn: params.recipient.msisdn,
    },
    description: params.description || "Retrait de fonds AddMe.io",
  };

  if (params.customer) payload.customer = params.customer;
  if (params.metadata) payload.metadata = params.metadata;
  if (params.fee_charge_mode) payload.fee_charge_mode = params.fee_charge_mode;
  if (params.preferred_gateway) payload.preferred_gateway = params.preferred_gateway;

  return await sasPayRequest<SasPayPayoutResult>("/payouts/initialize/", {
    method: "POST",
    body: payload,
    idempotencyKey,
  });
}

/**
 * Vérifie le statut d'un payout.
 * Endpoint : GET /payouts/{payout_id}/verify/
 */
export async function verifySasPayPayout(
  payoutId: string
): Promise<{ id: string; status: "PENDING" | "SUCCESS" | "FAILED"; net_amount: string; debited_amount: string; [key: string]: any }> {
  return await sasPayRequest(`/payouts/${payoutId}/verify/`, {
    method: "GET",
  });
}

// ============================================================================
// 5. SÉCURITÉ & VÉRIFICATION DES WEBHOOKS
// ============================================================================

export interface WebhookValidationResult {
  isValid: boolean;
  reason?: "invalid_timestamp" | "invalid_signature" | "missing_headers" | "missing_secret";
  error?: string;
}

/**
 * Vérifie la signature cryptographique d'un webhook SasPay :
 * 1. Rejette si l'horodatage X-Webhook-Timestamp s'écarte de plus de 300 secondes de l'horloge système.
 * 2. Calcule HMAC-SHA256 sur le corps brut avec `{timestamp}.{rawBody}`.
 * 3. Compare en temps constant (crypto.timingSafeEqual) pour bloquer les attaques par timing.
 */
export function verifySasPayWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  timestampHeader: string | null | undefined,
  secretOverride?: string
): WebhookValidationResult {
  const secret = secretOverride || process.env.SASPAY_WEBHOOK_SECRET;

  if (!secret) {
    return {
      isValid: false,
      reason: "missing_secret",
      error: "Secret de signature webhook SasPay non configuré (SASPAY_WEBHOOK_SECRET).",
    };
  }

  if (!signatureHeader || !timestampHeader) {
    return {
      isValid: false,
      reason: "missing_headers",
      error: "Headers X-Webhook-Signature ou X-Webhook-Timestamp manquants.",
    };
  }

  const timestampNum = parseInt(timestampHeader, 10);
  if (isNaN(timestampNum)) {
    return {
      isValid: false,
      reason: "invalid_timestamp",
      error: "X-Webhook-Timestamp non numérique.",
    };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const timeDifference = Math.abs(nowSeconds - timestampNum);

  // 1. Contrôle strict de l'âge : rejet si > 300 secondes (5 minutes)
  if (timeDifference > WEBHOOK_TOLERANCE_SECONDS) {
    return {
      isValid: false,
      reason: "invalid_timestamp",
      error: `Horodatage du webhook hors tolérance (${timeDifference}s > 300s). Rejet anti-rejeu.`,
    };
  }

  // 2. Calcul du HMAC SHA256 sur le corps brut
  const rawBodyString = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const signedPayload = `${timestampHeader}.${rawBodyString}`;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex")
    .toLowerCase();

  const cleanSignature = signatureHeader.trim().toLowerCase();

  // 3. Comparaison en temps constant
  const sigBuffer = Buffer.from(cleanSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (sigBuffer.length !== expectedBuffer.length) {
    return {
      isValid: false,
      reason: "invalid_signature",
      error: "Signature du webhook SasPay non concordance de longueur.",
    };
  }

  const isMatching = crypto.timingSafeEqual(sigBuffer, expectedBuffer);

  if (!isMatching) {
    return {
      isValid: false,
      reason: "invalid_signature",
      error: "Signature HMAC du webhook SasPay non concordance.",
    };
  }

  return { isValid: true };
}

// ============================================================================
// 6. UTILITAIRE DE VÉRIFICATION DE CONFIGURATION
// ============================================================================

/**
 * Vérifie l'état de la configuration SasPay (diagnostic rapide sans fuite de secrets).
 */
export async function checkSasPayConfig(): Promise<{
  configured: boolean;
  environment: "production" | "test" | "none";
  webhookConfigured: boolean;
  apiReachable: boolean;
  message: string;
}> {
  const apiKey = getSasPayApiKey();
  const webhookSecret = process.env.SASPAY_WEBHOOK_SECRET || "";

  if (!apiKey) {
    return {
      configured: false,
      environment: "none",
      webhookConfigured: false,
      apiReachable: false,
      message: "Variable d'environnement SASPAY_API_KEY absente.",
    };
  }

  const environment = apiKey.startsWith("sk_live_") ? "production" : "test";
  const webhookConfigured = webhookSecret.length > 0;

  let apiReachable = false;
  try {
    const res = await fetch(`${SASPAY_BASE_URL}/countries/`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    apiReachable = res.ok;
  } catch {
    apiReachable = false;
  }

  return {
    configured: isSasPayConfigured(),
    environment,
    webhookConfigured,
    apiReachable,
    message: isSasPayConfigured()
      ? `SasPay opérationnel en mode ${environment}.`
      : "Clé SasPay présente mais format non reconnu.",
  };
}


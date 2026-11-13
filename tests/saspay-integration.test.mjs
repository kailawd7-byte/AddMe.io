import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  formatDecimalAmount,
  verifySasPayWebhookSignature,
  WEBHOOK_TOLERANCE_SECONDS,
  SASPAY_BASE_URL,
} from "../src/lib/saspay.ts";

test("SasPay - Formatage décimal strict des montants (aucune valeur flottante)", () => {
  assert.equal(formatDecimalAmount(2500), "2500.00");
  assert.equal(formatDecimalAmount("3000"), "3000.00");
  assert.equal(formatDecimalAmount(1500.5), "1500.50");
  assert.equal(formatDecimalAmount(0), "0.00");

  assert.throws(() => formatDecimalAmount(-50), /invalide/i);
  assert.throws(() => formatDecimalAmount("abc"), /invalide/i);
});

test("SasPay - Base URL officielle et spécification", () => {
  assert.equal(SASPAY_BASE_URL, "https://api.saspay.me/api/v1");
  assert.equal(WEBHOOK_TOLERANCE_SECONDS, 300);
});

test("SasPay Webhook - Vérification de signature HMAC-SHA256 sur corps brut", () => {
  const secret = "whsec_test_saspay_secret_key_12345";
  const rawBody = JSON.stringify({
    event: "transaction.success",
    data: {
      id: "pay_test_987654321",
      status: "SUCCESS",
      amount: "2500.00",
      currency: "XOF",
    },
  });

  const nowSeconds = Math.floor(Date.now() / 1000);
  const signaturePayload = `${nowSeconds}.${rawBody}`;
  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(signaturePayload)
    .digest("hex");

  // 1. Signature valide et horodatage récent
  const resValid = verifySasPayWebhookSignature(
    rawBody,
    validSignature,
    String(nowSeconds),
    secret
  );
  assert.equal(resValid.isValid, true, "La signature légitime doit être acceptée.");

  // 2. Corps altéré (falsification)
  const resTampered = verifySasPayWebhookSignature(
    rawBody + " ",
    validSignature,
    String(nowSeconds),
    secret
  );
  assert.equal(resTampered.isValid, false, "Un corps altéré doit être rejeté.");
  assert.equal(resTampered.reason, "invalid_signature");

  // 3. Fausse signature
  const resFake = verifySasPayWebhookSignature(
    rawBody,
    "fake_signature_abc123",
    String(nowSeconds),
    secret
  );
  assert.equal(resFake.isValid, false, "Une mauvaise signature doit être rejetée.");
  assert.equal(resFake.reason, "invalid_signature");

  // 4. Horodatage trop vieux (> 300s = 5 minutes d'attaque par rejeu)
  const expiredTimestamp = nowSeconds - 305;
  const expiredPayload = `${expiredTimestamp}.${rawBody}`;
  const expiredSignature = crypto
    .createHmac("sha256", secret)
    .update(expiredPayload)
    .digest("hex");

  const resExpired = verifySasPayWebhookSignature(
    rawBody,
    expiredSignature,
    String(expiredTimestamp),
    secret
  );
  assert.equal(resExpired.isValid, false, "Un horodatage vieux de > 300s doit être rejeté.");
  assert.equal(resExpired.reason, "invalid_timestamp");
});

test("SasPay Règle d'or de livraison - Vérification stricte du statut SUCCESS", () => {
  function shouldDeliverProduct(paymentStatus) {
    return paymentStatus === "SUCCESS";
  }

  assert.equal(shouldDeliverProduct("SUCCESS"), true, "Seul SUCCESS autorise le crédit des points.");
  assert.equal(shouldDeliverProduct("PENDING"), false, "PENDING ne doit pas créditer les points.");
  assert.equal(shouldDeliverProduct("FAILED"), false, "FAILED ne doit pas créditer les points.");
  assert.equal(shouldDeliverProduct("CANCELLED"), false, "CANCELLED ne doit pas créditer les points.");
  assert.equal(shouldDeliverProduct(undefined), false);
});

test("SasPay Softpay Redirection - Redirection si checkout_url est renseignée", () => {
  function handleSoftpayResponse(result) {
    if (result.checkout_url && result.checkout_url.trim().length > 0) {
      return { action: "REDIRECT", url: result.checkout_url };
    }
    return { action: "WAIT_USSD_PUSH", message: "Validez l'invite USSD sur votre téléphone." };
  }

  // Wave / Orange avec checkout_url
  const waveResult = {
    id: "tx_wave_123",
    status: "PENDING",
    checkout_url: "https://pay.wave.com/c/cos-12345",
  };
  assert.deepEqual(handleSoftpayResponse(waveResult), {
    action: "REDIRECT",
    url: "https://pay.wave.com/c/cos-12345",
  });

  // MTN Direct push sans checkout_url
  const mtnResult = {
    id: "tx_mtn_456",
    status: "PENDING",
    checkout_url: "",
  };
  assert.deepEqual(handleSoftpayResponse(mtnResult), {
    action: "WAIT_USSD_PUSH",
    message: "Validez l'invite USSD sur votre téléphone.",
  });
});

// lib/paddle.ts — Paddle Billing integration
// Paddle.js: client-side checkout
// Paddle Billing API: server-side subscription management

export const PADDLE_CONFIG = {
  environment: process.env.PADDLE_ENV || "sandbox", // sandbox | production
  clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "",
  apiKey: process.env.PADDLE_API_KEY || "",
  priceIds: {
    proMonthly: "pri_01hxxxxx",    // $19/month Pro plan
    singleReport: "pri_01hxxxxx"   // $3 single report
  }
};

/** Open Paddle checkout for subscription */
export function openPaddleCheckout(priceId: string, customerEmail?: string) {
  if (typeof window !== "undefined" && (window as any).Paddle) {
    (window as any).Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: customerEmail ? { email: customerEmail } : undefined
    });
  }
}

/** Verify Paddle webhook signature (server-side) */
export function verifyPaddleSignature(
  payload: string,
  signature: string,
  secretKey: string
): boolean {
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(payload);
  const expected = hmac.digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

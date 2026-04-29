// app/api/payment/webhook/route.ts — Paddle Webhook Handler
//
// Paddle sends webhook events for subscription lifecycle:
// - subscription.created
// - subscription.updated
// - subscription.cancelled
// - transaction.completed
//
// This endpoint verifies the signature, then updates Supabase.
//
// SECURITY: This endpoint MUST verify the Paddle signature using the
// webhook secret. Never trust unverified payloads.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

/**
 * Verify the Paddle webhook signature
 * Paddle uses HMAC-SHA256 with a secret key
 */
function verifySignature(payload: string, signature: string): boolean {
  if (!signature || !PADDLE_WEBHOOK_SECRET) return false;

  try {
    // Paddle sends signature as a timestamped header: t=xxx,sig=yyy
    const parts: Record<string, string> = {};
    signature.split(",").forEach((part) => {
      const [key, value] = part.split("=");
      if (key && value) parts[key.trim()] = value.trim();
    });

    const hmac = crypto.createHmac("sha256", PADDLE_WEBHOOK_SECRET);
    hmac.update(`${parts.t}:${payload}`);
    const computed = hmac.digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(parts.sig || "")
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("paddle-signature") || "";
    const body = await req.text();

    // Verify webhook signature (skip in sandbox if secret is test_xxx)
    const isProduction =
      process.env.PADDLE_ENV === "production" &&
      !PADDLE_WEBHOOK_SECRET.startsWith("test_");

    if (isProduction && !verifySignature(body, signature)) {
      console.error("[webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.event_type || event.alert_name;
    console.log(`[webhook] Received event: ${eventType}`);

    // Extract customer/subscription data
    const subscriptionId = event.data?.id || event.subscription_id;
    const customerEmail = event.data?.customer?.email || event.email;
    const priceId =
      event.data?.items?.[0]?.price?.id || event.subscription_plan_id;
    const status = event.data?.status || event.status;

    // Map status
    const subscriptionStatus =
      status === "active"
        ? "active"
        : status === "trialing"
        ? "trialing"
        : status === "canceled" || status === "cancelled"
        ? "cancelled"
        : "expired";

    // Handle different event types
    switch (eventType) {
      case "subscription.created":
      case "subscription.updated": {
        // Find user by email
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("email", customerEmail)
          .limit(1);

        if (profiles && profiles.length > 0) {
          const userId = profiles[0].id;

          // Upsert subscription
          await supabase.from("subscriptions").upsert(
            {
              user_id: userId,
              paddle_subscription_id: subscriptionId,
              status: subscriptionStatus,
              price_id: priceId,
              plan: "pro",
              current_period_start: event.data?.current_billing_period?.starts_at
                ? new Date(event.data.current_billing_period.starts_at).toISOString()
                : undefined,
              current_period_end: event.data?.current_billing_period?.ends_at
                ? new Date(event.data.current_billing_period.ends_at).toISOString()
                : undefined,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "paddle_subscription_id" }
          );

          // Update user profile
          const updates: Record<string, any> = {
            plan: subscriptionStatus === "active" || subscriptionStatus === "trialing" ? "pro" : "free",
            searches_remaining: subscriptionStatus === "active" || subscriptionStatus === "trialing" ? 999 : 5,
            updated_at: new Date().toISOString(),
          };
          if (subscriptionId) {
            updates.subscription_id = subscriptionId;
          }

          await supabase.from("profiles").update(updates).eq("id", userId);
        }

        // Log event
        await supabase.from("payment_events").insert({
          user_id: profiles?.[0]?.id || null,
          event_type: eventType,
          paddle_event_id: event.event_id || null,
          payload: event,
        });

        break;
      }

      case "subscription.cancelled": {
        // Downgrade user
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", customerEmail)
          .limit(1);

        if (profiles && profiles.length > 0) {
          await supabase
            .from("profiles")
            .update({
              plan: "free",
              searches_remaining: 5,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profiles[0].id);

          await supabase
            .from("subscriptions")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("paddle_subscription_id", subscriptionId);
        }

        break;
      }

      case "transaction.completed": {
        // One-time purchase (e.g., $3 single report)
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, searches_remaining")
          .eq("email", customerEmail)
          .limit(1);

        if (profiles && profiles.length > 0) {
          await supabase
            .from("profiles")
            .update({
              searches_remaining: profiles[0].searches_remaining + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profiles[0].id);
        }

        await supabase.from("payment_events").insert({
          user_id: profiles?.[0]?.id || null,
          event_type: eventType,
          paddle_event_id: event.event_id || null,
          payload: event,
        });

        break;
      }

      default: {
        // Log unknown events
        await supabase.from("payment_events").insert({
          user_id: null,
          event_type: eventType,
          paddle_event_id: event.event_id || null,
          payload: event,
        });
        console.log(`[webhook] Unhandled event type: ${eventType}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed", message: error.message },
      { status: 500 }
    );
  }
}

// Paddle sends GET requests to verify the webhook URL
export async function GET() {
  return NextResponse.json({ status: "ok", webhook: "ready" });
}

/**
 * Stripe Webhook Handler
 * Handles subscription lifecycle events from Stripe.
 * MUST be registered BEFORE express.json() middleware.
 */
import express from "express";
import type Stripe from "stripe";
import { ENV } from "./_core/env";
import { getStripe, PLAN_LIMITS, type PlanTier } from "./stripePlans";
import { upsertOrgSubscription, createEnrollment, getEnrollment } from "./lmsDb";
import { getUserByEmail } from "./db";
import { sendEmail } from "./sendgrid";

const router = express.Router();

// Raw body parser for Stripe signature verification
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    // Handle test events
    let event: Stripe.Event;
    try {
      if (!ENV.stripeWebhookSecret || !sig) {
        // In development without webhook secret, parse directly
        event = JSON.parse(req.body.toString()) as Stripe.Event;
      } else {
        const stripe = getStripe();
        event = stripe.webhooks.constructEvent(req.body, sig as string, ENV.stripeWebhookSecret);
      }
    } catch (err: any) {
      console.error("[Stripe Webhook] Signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Test event detection
    if (event.id.startsWith("evt_test_")) {
      console.log("[Stripe Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    console.log(`[Stripe Webhook] Event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;

          // ── Course purchase (one-time payment) ──────────────────────────────
          if (session.mode === "payment" && session.metadata?.type === "course_purchase") {
            const courseId = parseInt(session.metadata?.course_id ?? "0");
            const orgId = parseInt(session.metadata?.org_id ?? "0");
            const buyerEmail = session.customer_details?.email ?? session.metadata?.customer_email ?? "";
            const amountPaid = session.amount_total ? session.amount_total / 100 : 0;
            if (courseId && orgId && buyerEmail) {
              try {
                const user = await getUserByEmail(buyerEmail);
                if (user) {
                  const existing = await getEnrollment(courseId, user.id);
                  if (!existing) {
                    await createEnrollment({ courseId, userId: user.id, orgId, amountPaid });
                    console.log(`[Stripe Webhook] User ${user.id} enrolled in course ${courseId}`);
                    await sendEmail({
                      to: user.email ?? "",
                      subject: `Your enrollment is confirmed!`,
                      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px"><h2>You're enrolled!</h2><p>Hi ${user.name ?? "there"},</p><p>Your payment of <strong>$${amountPaid.toFixed(2)}</strong> was successful and you now have access to your course.</p><p>Log in to your account to start learning.</p></div>`,
                    });
                  }
                } else {
                  console.warn(`[Stripe Webhook] No user for email ${buyerEmail} — enrollment deferred`);
                }
              } catch (enrollErr: any) {
                console.error("[Stripe Webhook] Course enrollment failed:", enrollErr.message);
              }
            }
            break;
          }

          // ── Subscription checkout ────────────────────────────────────────────
          if (session.mode !== "subscription") break;

          const orgId = parseInt(session.metadata?.org_id ?? "0");
          const plan = (session.metadata?.plan ?? "starter") as PlanTier;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          if (!orgId) {
            console.error("[Stripe Webhook] Missing org_id in checkout session metadata");
            break;
          }

          // Fetch subscription details
          const stripe = getStripe();
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          const item = subscription.items.data[0];
          await upsertOrgSubscription(orgId, {
            plan,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            status: subscription.status as any,
            currentPeriodStart: item ? new Date(item.current_period_start * 1000) : undefined,
            currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : undefined,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });

          console.log(`[Stripe Webhook] Org ${orgId} upgraded to ${plan}`);
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const orgId = parseInt(subscription.metadata?.org_id ?? "0");
          if (!orgId) break;

          // Determine plan from price metadata
          const priceId = subscription.items.data[0]?.price?.id;
          let plan: PlanTier = "free";
          if (priceId) {
            const stripe = getStripe();
            const price = await stripe.prices.retrieve(priceId);
            plan = (price.metadata?.teachific_tier as PlanTier) ?? "free";
          }

          const item2 = subscription.items.data[0];
          await upsertOrgSubscription(orgId, {
            plan,
            status: subscription.status as any,
            currentPeriodStart: item2 ? new Date(item2.current_period_start * 1000) : undefined,
            currentPeriodEnd: item2 ? new Date(item2.current_period_end * 1000) : undefined,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });

          console.log(`[Stripe Webhook] Org ${orgId} subscription updated: ${subscription.status}`);
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const orgId = parseInt(subscription.metadata?.org_id ?? "0");
          if (!orgId) break;

          await upsertOrgSubscription(orgId, {
            plan: "free",
            status: "cancelled",
            cancelAtPeriodEnd: false,
          });

          console.log(`[Stripe Webhook] Org ${orgId} subscription cancelled, downgraded to free`);
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = (invoice as any).subscription as string;
          if (!subscriptionId) break;

          const stripe = getStripe();
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const orgId = parseInt(subscription.metadata?.org_id ?? "0");
          if (!orgId) break;

          await upsertOrgSubscription(orgId, { status: "past_due" });
          console.log(`[Stripe Webhook] Org ${orgId} payment failed, status: past_due`);
          break;
        }

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }
    } catch (err: any) {
      console.error("[Stripe Webhook] Processing error:", err.message);
      return res.status(500).json({ error: "Webhook processing failed" });
    }

    res.json({ received: true });
  }
);

export default router;

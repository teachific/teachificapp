/**
 * Stripe Billing Router for Teachific
 * Handles org subscription checkout, customer portal, and payment settings.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getStripe, STRIPE_PRICE_IDS, PLAN_LIMITS, type PlanTier } from "./stripePlans";
import { getOrgSubscription, upsertOrgSubscription } from "./lmsDb";
import { ENV } from "./_core/env";

async function getDb() {
  const { getDb: _getDb } = await import("./db");
  const db = await _getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return db;
}

// ─── Helper: get org context for the current user ─────────────────────────────
async function getOrgContext(userId: number) {
  const db = await getDb();
  const { orgMembers, organizations } = await import("../drizzle/schema");
  const rows = await db
    .select({
      orgId: orgMembers.orgId,
      role: orgMembers.role,
      orgName: organizations.name,
      orgSlug: organizations.slug,
    })
    .from(orgMembers)
    .innerJoin(organizations, eq(organizations.id, orgMembers.orgId))
    .where(eq(orgMembers.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

// ─── Helper: ensure org payment settings row ──────────────────────────────────
async function getOrCreateOrgPaymentSettings(orgId: number) {
  const db = await getDb();
  const { orgPaymentSettings } = await import("../drizzle/schema");
  const rows = await db
    .select()
    .from(orgPaymentSettings)
    .where(eq(orgPaymentSettings.orgId, orgId))
    .limit(1);
  if (rows[0]) return rows[0];
  await db.insert(orgPaymentSettings).values({ orgId });
  const newRows = await db
    .select()
    .from(orgPaymentSettings)
    .where(eq(orgPaymentSettings.orgId, orgId))
    .limit(1);
  return newRows[0]!;
}

export const stripeRouter = router({
  // ── Get current subscription ───────────────────────────────────────────────
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const orgCtx = await getOrgContext(ctx.user.id);
    if (!orgCtx) return null;
    const sub = await getOrgSubscription(orgCtx.orgId);
    const plan = sub?.plan ?? "free";
    const limits = PLAN_LIMITS[plan as PlanTier];
    return {
      orgId: orgCtx.orgId,
      orgName: orgCtx.orgName,
      plan: plan as PlanTier,
      limits,
      status: sub?.status ?? "active",
      stripeSubscriptionId: sub?.stripeSubscriptionId ?? null,
      stripeCustomerId: sub?.stripeCustomerId ?? null,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
      customPriceLabel: sub?.customPriceLabel ?? null,
    };
  }),

  // ── Create checkout session ────────────────────────────────────────────────
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        plan: z.enum(["starter", "builder", "pro"]),
        interval: z.enum(["monthly", "annual"]),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ENV.stripeSecretKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });
      }
      const orgCtx = await getOrgContext(ctx.user.id);
      if (!orgCtx) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No organization found" });
      }
      if (!["org_super_admin", "org_admin"].includes(orgCtx.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only org admins can manage billing" });
      }

      const priceKey = `${input.plan}_${input.interval}`;
      const priceId = STRIPE_PRICE_IDS[priceKey];
      if (!priceId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Price not found for ${priceKey}. Stripe plans may not be initialized yet.`,
        });
      }

      const stripe = getStripe();
      const sub = await getOrgSubscription(orgCtx.orgId);

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        customer: sub?.stripeCustomerId ?? undefined,
        customer_email: sub?.stripeCustomerId ? undefined : ctx.user.email ?? undefined,
        client_reference_id: String(ctx.user.id),
        metadata: {
          user_id: String(ctx.user.id),
          org_id: String(orgCtx.orgId),
          plan: input.plan,
          interval: input.interval,
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
        },
        subscription_data: {
          metadata: {
            org_id: String(orgCtx.orgId),
            plan: input.plan,
          },
        },
        success_url: `${input.origin}/lms/billing?success=1&plan=${input.plan}`,
        cancel_url: `${input.origin}/lms/billing?cancelled=1`,
      });

      return { url: session.url };
    }),

  // ── Create customer portal session ────────────────────────────────────────
  createPortalSession: protectedProcedure
    .input(z.object({ origin: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      if (!ENV.stripeSecretKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });
      }
      const orgCtx = await getOrgContext(ctx.user.id);
      if (!orgCtx) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No organization found" });
      }
      const sub = await getOrgSubscription(orgCtx.orgId);
      if (!sub?.stripeCustomerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No Stripe customer found. Please subscribe first." });
      }
      const stripe = getStripe();
      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: `${input.origin}/lms/billing`,
      });
      return { url: session.url };
    }),

  // ── Get org payment settings ───────────────────────────────────────────────
  getPaymentSettings: protectedProcedure.query(async ({ ctx }) => {
    const orgCtx = await getOrgContext(ctx.user.id);
    if (!orgCtx) return null;
    if (!["org_super_admin", "org_admin"].includes(orgCtx.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const settings = await getOrCreateOrgPaymentSettings(orgCtx.orgId);
    // Never expose secrets to frontend
    return {
      ...settings,
      paypalClientSecret: settings.paypalClientSecret ? "••••••••" : null,
    };
  }),

  // ── Update org payment settings ───────────────────────────────────────────
  updatePaymentSettings: protectedProcedure
    .input(
      z.object({
        paypalEmail: z.string().email().optional().nullable(),
        paypalEnabled: z.boolean().optional(),
        paypalClientId: z.string().optional().nullable(),
        paypalClientSecret: z.string().optional().nullable(),
        currency: z.string().length(3).optional(),
        autoEnrollNewMembers: z.boolean().optional(),
        revenueShareJson: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgCtx = await getOrgContext(ctx.user.id);
      if (!orgCtx) throw new TRPCError({ code: "FORBIDDEN" });
      if (!["org_super_admin", "org_admin"].includes(orgCtx.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();
      const { orgPaymentSettings } = await import("../drizzle/schema");
      await getOrCreateOrgPaymentSettings(orgCtx.orgId);
      const updateData: Record<string, unknown> = {};
      if (input.paypalEmail !== undefined) updateData.paypalEmail = input.paypalEmail;
      if (input.paypalEnabled !== undefined) updateData.paypalEnabled = input.paypalEnabled;
      if (input.paypalClientId !== undefined) updateData.paypalClientId = input.paypalClientId;
      if (input.paypalClientSecret !== undefined && input.paypalClientSecret !== "••••••••") {
        updateData.paypalClientSecret = input.paypalClientSecret;
      }
      if (input.currency !== undefined) updateData.currency = input.currency;
      if (input.autoEnrollNewMembers !== undefined) updateData.autoEnrollNewMembers = input.autoEnrollNewMembers;
      if (input.revenueShareJson !== undefined) updateData.revenueShareJson = input.revenueShareJson;
      await db
        .update(orgPaymentSettings)
        .set(updateData as any)
        .where(eq(orgPaymentSettings.orgId, orgCtx.orgId));
      return { success: true };
    }),

  // ── Get org payment settings (by orgId, for org admin) ─────────────────────
  getOrgPaymentSettings: protectedProcedure
    .input(z.object({ orgId: z.number() }))
    .query(async ({ ctx, input }) => {
      const orgCtx = await getOrgContext(ctx.user.id);
      if (!orgCtx || orgCtx.orgId !== input.orgId) throw new TRPCError({ code: "FORBIDDEN" });
      if (!["org_super_admin", "org_admin"].includes(orgCtx.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const settings = await getOrCreateOrgPaymentSettings(input.orgId);
      return {
        ...settings,
        stripeSecretKey: settings.stripeSecretKey ? "••••••••••••••••" : null,
        paypalClientSecret: settings.paypalClientSecret ? "••••••••" : null,
        autoEnrollment: settings.autoEnrollNewMembers,
      };
    }),

  // ── Update org payment settings (by orgId, for org admin) ────────────────────
  updateOrgPaymentSettings: protectedProcedure
    .input(
      z.object({
        orgId: z.number(),
        stripePublishableKey: z.string().optional().nullable(),
        stripeSecretKey: z.string().optional().nullable(),
        paypalClientId: z.string().optional().nullable(),
        paypalClientSecret: z.string().optional().nullable(),
        autoEnrollment: z.boolean().optional(),
        autoEnrollCourseIds: z.string().optional(), // JSON array of course IDs
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgCtx = await getOrgContext(ctx.user.id);
      if (!orgCtx || orgCtx.orgId !== input.orgId) throw new TRPCError({ code: "FORBIDDEN" });
      if (!["org_super_admin", "org_admin"].includes(orgCtx.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      const { orgPaymentSettings } = await import("../drizzle/schema");
      await getOrCreateOrgPaymentSettings(input.orgId);
      const updateData: Record<string, unknown> = {};
      if (input.stripePublishableKey !== undefined) updateData.stripePublishableKey = input.stripePublishableKey;
      if (input.stripeSecretKey !== undefined && !input.stripeSecretKey?.startsWith("•")) {
        updateData.stripeSecretKey = input.stripeSecretKey;
      }
      if (input.paypalClientId !== undefined) updateData.paypalClientId = input.paypalClientId;
      if (input.paypalClientSecret !== undefined && !input.paypalClientSecret?.startsWith("•")) {
        updateData.paypalClientSecret = input.paypalClientSecret;
      }
      if (input.autoEnrollment !== undefined) updateData.autoEnrollNewMembers = input.autoEnrollment;
      if (input.autoEnrollCourseIds !== undefined) updateData.autoEnrollCourseIds = input.autoEnrollCourseIds;
      if (Object.keys(updateData).length > 0) {
        await db
          .update(orgPaymentSettings)
          .set(updateData as any)
          .where(eq(orgPaymentSettings.orgId, input.orgId));
      }
      return { success: true };
    }),

  // ── Create course/product checkout session (with transaction fee) ──────────
  createCourseCheckout: publicProcedure
    .input(
      z.object({
        orgId: z.number(),
        productId: z.number(),
        priceId: z.number(),
        buyerEmail: z.string().email(),
        buyerName: z.string().optional(),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      // Get org payment settings (org's own Stripe key)
      const db = await getDb();
      const { orgPaymentSettings, orgSubscriptions } = await import("../drizzle/schema");
      const [paySettings] = await db
        .select()
        .from(orgPaymentSettings)
        .where(eq(orgPaymentSettings.orgId, input.orgId))
        .limit(1);

      if (!paySettings?.stripeSecretKey) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "This organization has not configured Stripe payments.",
        });
      }

      // Get org's Teachific plan to determine transaction fee
      const [orgSub] = await db
        .select()
        .from(orgSubscriptions)
        .where(eq(orgSubscriptions.orgId, input.orgId))
        .limit(1);
      const planTier = (orgSub?.plan ?? "free") as PlanTier;
      const planLimits = PLAN_LIMITS[planTier];
      const feePercent = planLimits.transactionFeePercent; // 0, 1, or 3

      // Get product and price details
      const { getDigitalProduct, listProductPrices, createDigitalOrder } = await import("./lmsDb");
      const product = await getDigitalProduct(input.productId);
      if (!product || product.orgId !== input.orgId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }
      const prices = await listProductPrices(input.productId);
      const price = prices.find((p) => p.id === input.priceId);
      if (!price) throw new TRPCError({ code: "NOT_FOUND", message: "Price not found" });

      // Use the org's own Stripe secret key
      const orgStripe = new (await import("stripe")).default(paySettings.stripeSecretKey, {
        apiVersion: "2025-02-24.acacia" as any,
      });

      const amountCents = Math.round(Number(price.amount) * 100);
      const applicationFeeCents = feePercent > 0 ? Math.round(amountCents * feePercent / 100) : undefined;

      // Create a pre-order record so we can link back on webhook
      const order = await createDigitalOrder({
        productId: input.productId,
        priceId: input.priceId,
        orgId: input.orgId,
        buyerEmail: input.buyerEmail,
        buyerName: input.buyerName,
        amount: price.amount,
        currency: price.currency ?? "USD",
        paymentRef: undefined,
        accessExpiresAt: product.defaultAccessDays
          ? new Date(Date.now() + product.defaultAccessDays * 86400000)
          : null,
        maxDownloads: product.defaultMaxDownloads ?? null,
      });

      const session = await orgStripe.checkout.sessions.create({
        mode: "payment",
        customer_email: input.buyerEmail,
        line_items: [
          {
            price_data: {
              currency: (price.currency ?? "USD").toLowerCase(),
              unit_amount: amountCents,
              product_data: {
                name: product.title,
                description: product.description ?? undefined,
                images: product.thumbnailUrl ? [product.thumbnailUrl] : [],
              },
            },
            quantity: 1,
          },
        ],
        ...(applicationFeeCents ? { payment_intent_data: { application_fee_amount: applicationFeeCents } } : {}),
        metadata: {
          teachific_order_id: String(order.id),
          teachific_org_id: String(input.orgId),
          teachific_product_id: String(input.productId),
          teachific_fee_percent: String(feePercent),
          buyer_email: input.buyerEmail,
          buyer_name: input.buyerName ?? "",
        },
        success_url: `${input.origin}/school/${product.orgId}/thank-you?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${input.origin}/school/${product.orgId}/courses/${input.productId}`,
        allow_promotion_codes: true,
      });

      return { checkoutUrl: session.url, orderId: order.id };
    }),

  // ── Get all plan limits (public) ──────────────────────────────────────────
  getPlanLimits: protectedProcedure.query(() => {
    return PLAN_LIMITS;
  }),
});

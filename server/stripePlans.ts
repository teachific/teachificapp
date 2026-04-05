/**
 * Teachific Platform Subscription Plans
 * Defines plan limits and manages Stripe products/prices.
 */
import Stripe from "stripe";
import { ENV } from "./_core/env";

// ─── Plan Limits ─────────────────────────────────────────────────────────────
export type PlanTier = "free" | "starter" | "builder" | "pro" | "enterprise";
export type StudioTier = "free" | "creator" | "pro" | "team";
export type CreatorTier = "none" | "starter" | "pro" | "team";

export interface PlanLimits {
  name: string;
  tier: PlanTier;
  // Pricing (USD cents)
  monthlyPrice: number | null; // null = contact sales
  annualPrice: number | null;
  // Limits (-1 = unlimited, 0 = not available)
  maxAdmins: number;
  maxMembers: number;
  maxCourses: number;
  maxCommunities: number;
  maxInstructors: number;
  maxStorageBytes: number; // -1 = unlimited
  maxMembershipTiers: number;
  // Features (boolean)
  whiteLabel: boolean;
  emailMarketing: boolean;
  transactionFeePercent: number; // legacy — kept for reference
  teachificPayFeePercent: number; // platform fee on TeachificPay transactions
  customGateway: boolean; // can use own Stripe/payment gateway
  groupRegistrations: boolean;
  deepAnalytics: boolean;
  affiliatePlatform: boolean;
  sso: boolean;
  customCss: boolean;
  customDomain: boolean;
  communityAccess: boolean;
  revenueShare: boolean;
  onboardingTeam: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    name: "Free",
    tier: "free",
    monthlyPrice: 0,
    annualPrice: 0,
    maxAdmins: 1,
    maxMembers: 10,
    maxCourses: 1,
    maxCommunities: 0,
    maxInstructors: 0, // admin is only instructor
    maxStorageBytes: 100 * 1024 * 1024 * 1024, // 100 GB
    maxMembershipTiers: 0,
    whiteLabel: false,
    emailMarketing: false,
    transactionFeePercent: 0,
    teachificPayFeePercent: 2, // 2% TeachificPay fee
    customGateway: false, // must use TeachificPay
    groupRegistrations: false,
    deepAnalytics: false,
    affiliatePlatform: false,
    sso: false,
    customCss: false,
    customDomain: false,
    communityAccess: false,
    revenueShare: false,
    onboardingTeam: false,
  },
  starter: {
    name: "Starter",
    tier: "starter",
    monthlyPrice: 3900, // $39
    annualPrice: 39900, // $399
    maxAdmins: 1,
    maxMembers: 1000,
    maxCourses: 5,
    maxCommunities: 0,
    maxInstructors: 1,
    maxStorageBytes: 1024 * 1024 * 1024 * 1024, // 1 TB
    maxMembershipTiers: 1,
    whiteLabel: false,
    emailMarketing: false,
    transactionFeePercent: 3,
    teachificPayFeePercent: 2, // 2% TeachificPay fee
    customGateway: false, // must use TeachificPay
    groupRegistrations: false,
    deepAnalytics: false,
    affiliatePlatform: false,
    sso: false,
    customCss: false,
    customDomain: false,
    communityAccess: false,
    revenueShare: false,
    onboardingTeam: false,
  },
  builder: {
    name: "Builder",
    tier: "builder",
    monthlyPrice: 9900, // $99
    annualPrice: 99900, // $999
    maxAdmins: 1,
    maxMembers: 5000,
    maxCourses: 20,
    maxCommunities: 1,
    maxInstructors: 3,
    maxStorageBytes: 2 * 1024 * 1024 * 1024 * 1024, // 2 TB
    maxMembershipTiers: 3,
    whiteLabel: true,
    emailMarketing: false,
    transactionFeePercent: 1,
    teachificPayFeePercent: 0.5, // 0.5% TeachificPay fee if they choose TeachificPay
    customGateway: true, // can use own gateway or TeachificPay
    groupRegistrations: false,
    deepAnalytics: false, // basic analytics only
    affiliatePlatform: false,
    sso: false,
    customCss: false,
    customDomain: true,
    communityAccess: true,
    revenueShare: false,
    onboardingTeam: false,
  },
  pro: {
    name: "Pro",
    tier: "pro",
    monthlyPrice: 19900, // $199
    annualPrice: 199900, // $1999
    maxAdmins: 3,
    maxMembers: 15000,
    maxCourses: 50,
    maxCommunities: 3,
    maxInstructors: 10,
    maxStorageBytes: 5 * 1024 * 1024 * 1024 * 1024, // 5 TB
    maxMembershipTiers: 10,
    whiteLabel: true,
    emailMarketing: true,
    transactionFeePercent: 0,
    teachificPayFeePercent: 0.5, // 0.5% TeachificPay fee if they choose TeachificPay
    customGateway: true, // can use own gateway or TeachificPay
    groupRegistrations: true,
    deepAnalytics: true,
    affiliatePlatform: true,
    sso: true,
    customCss: true,
    customDomain: true,
    communityAccess: true,
    revenueShare: true,
    onboardingTeam: false,
  },
  enterprise: {
    name: "Enterprise",
    tier: "enterprise",
    monthlyPrice: null, // contact sales
    annualPrice: null,
    maxAdmins: -1,
    maxMembers: -1,
    maxCourses: -1,
    maxCommunities: -1,
    maxInstructors: -1,
    maxStorageBytes: -1, // Unlimited
    maxMembershipTiers: -1,
    whiteLabel: true,
    emailMarketing: true,
    transactionFeePercent: 0,
    teachificPayFeePercent: 0.5, // 0.5% TeachificPay fee if they choose TeachificPay
    customGateway: true, // can use own gateway or TeachificPay
    groupRegistrations: true,
    deepAnalytics: true,
    affiliatePlatform: true,
    sso: true,
    customCss: true,
    customDomain: true,
    communityAccess: true,
    revenueShare: true,
    onboardingTeam: true,
  },
};

// ─── Stripe Client ────────────────────────────────────────────────────────────
let stripeClient: Stripe | null = null;
export function getStripe(): Stripe {
  if (!stripeClient) {
    if (!ENV.stripeSecretKey) throw new Error("STRIPE_SECRET_KEY not configured");
    stripeClient = new Stripe(ENV.stripeSecretKey, { apiVersion: "2025-03-31.basil" });
  }
  return stripeClient;
}

// ─── Stripe Price IDs ─────────────────────────────────────────────────────────
// These are populated at server startup via ensureStripePlans()
export const STRIPE_PRICE_IDS: Record<string, string> = {};

/**
 * Idempotently create Stripe products and prices for all paid plans.
 * Stores price IDs in STRIPE_PRICE_IDS for use in checkout sessions.
 */
export async function ensureStripePlans(): Promise<void> {
  if (!ENV.stripeSecretKey) {
    console.log("[Stripe] No secret key configured, skipping plan setup");
    return;
  }
  const stripe = getStripe();
  const paidPlans: PlanTier[] = ["starter", "builder", "pro"];

  for (const tier of paidPlans) {
    const plan = PLAN_LIMITS[tier];
    if (!plan.monthlyPrice || !plan.annualPrice) continue;

    // Find or create product
    const products = await stripe.products.list({ limit: 100 });
    let product = products.data.find((p) => p.metadata?.teachific_tier === tier);
    if (!product) {
      product = await stripe.products.create({
        name: `Teachific ${plan.name}`,
        description: `Teachific ${plan.name} plan`,
        metadata: { teachific_tier: tier },
      });
    }

    // Monthly price
    const monthlyKey = `${tier}_monthly`;
    const existingPrices = await stripe.prices.list({ product: product.id, limit: 100 });
    let monthlyPrice = existingPrices.data.find(
      (p) => p.recurring?.interval === "month" && p.metadata?.teachific_tier === tier && p.active
    );
    if (!monthlyPrice) {
      monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthlyPrice,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { teachific_tier: tier, interval: "monthly" },
      });
    }
    STRIPE_PRICE_IDS[monthlyKey] = monthlyPrice.id;

    // Annual price
    const annualKey = `${tier}_annual`;
    let annualPrice = existingPrices.data.find(
      (p) => p.recurring?.interval === "year" && p.metadata?.teachific_tier === tier && p.active
    );
    if (!annualPrice) {
      annualPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.annualPrice,
        currency: "usd",
        recurring: { interval: "year" },
        metadata: { teachific_tier: tier, interval: "annual" },
      });
    }
    STRIPE_PRICE_IDS[annualKey] = annualPrice.id;
  }

  // Studio plans
  const studioPaidTiers: StudioTier[] = ["creator", "pro", "team"];
  const studioPlans: Record<StudioTier, { name: string; monthlyPrice: number; annualPrice: number }> = {
    free: { name: "Studio Free", monthlyPrice: 0, annualPrice: 0 },
    creator: { name: "Studio Creator", monthlyPrice: 1900, annualPrice: 17900 },
    pro: { name: "Studio Pro", monthlyPrice: 4900, annualPrice: 44900 },
    team: { name: "Studio Team", monthlyPrice: 9900, annualPrice: 89900 },
  };

  for (const tier of studioPaidTiers) {
    const plan = studioPlans[tier];
    const products = await stripe.products.list({ limit: 100 });
    let product = products.data.find((p) => p.metadata?.studio_tier === tier);
    if (!product) {
      product = await stripe.products.create({
        name: plan.name,
        description: `Teachific Studio ${tier} plan`,
        metadata: { studio_tier: tier, product_type: "studio" },
      });
    }
    const existingPrices = await stripe.prices.list({ product: product.id, limit: 100 });
    let monthlyPrice = existingPrices.data.find(
      (p) => p.recurring?.interval === "month" && p.metadata?.studio_tier === tier && p.active
    );
    if (!monthlyPrice) {
      monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthlyPrice,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { studio_tier: tier, interval: "monthly", product_type: "studio" },
      });
    }
    STRIPE_PRICE_IDS[`studio_${tier}_monthly`] = monthlyPrice.id;

    let annualPrice = existingPrices.data.find(
      (p) => p.recurring?.interval === "year" && p.metadata?.studio_tier === tier && p.active
    );
    if (!annualPrice) {
      annualPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.annualPrice,
        currency: "usd",
        recurring: { interval: "year" },
        metadata: { studio_tier: tier, interval: "annual", product_type: "studio" },
      });
    }
    STRIPE_PRICE_IDS[`studio_${tier}_annual`] = annualPrice.id;
  }

  // TeachificCreator™ plans
  const creatorPaidTiers: Array<"starter" | "pro" | "team"> = ["starter", "pro", "team"];
  const creatorPlans: Record<"starter" | "pro" | "team", { name: string; monthlyPrice: number; annualPrice: number }> = {
    starter: { name: "TeachificCreator Starter", monthlyPrice: 2900, annualPrice: 27900 },
    pro: { name: "TeachificCreator Pro", monthlyPrice: 5900, annualPrice: 56900 },
    team: { name: "TeachificCreator Team", monthlyPrice: 14900, annualPrice: 143900 },
  };

  for (const tier of creatorPaidTiers) {
    const plan = creatorPlans[tier];
    const products = await stripe.products.list({ limit: 100 });
    let product = products.data.find((p) => p.metadata?.creator_tier === tier);
    if (!product) {
      product = await stripe.products.create({
        name: plan.name,
        description: `TeachificCreator™ ${tier} plan`,
        metadata: { creator_tier: tier, product_type: "creator" },
      });
    }
    const existingPrices = await stripe.prices.list({ product: product.id, limit: 100 });
    let monthlyPrice = existingPrices.data.find(
      (p) => p.recurring?.interval === "month" && p.metadata?.creator_tier === tier && p.active
    );
    if (!monthlyPrice) {
      monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthlyPrice,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { creator_tier: tier, interval: "monthly", product_type: "creator" },
      });
    }
    STRIPE_PRICE_IDS[`creator_${tier}_monthly`] = monthlyPrice.id;

    let annualPrice = existingPrices.data.find(
      (p) => p.recurring?.interval === "year" && p.metadata?.creator_tier === tier && p.active
    );
    if (!annualPrice) {
      annualPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.annualPrice,
        currency: "usd",
        recurring: { interval: "year" },
        metadata: { creator_tier: tier, interval: "annual", product_type: "creator" },
      });
    }
    STRIPE_PRICE_IDS[`creator_${tier}_annual`] = annualPrice.id;
  }

  console.log("[Stripe] Plans initialized:", Object.keys(STRIPE_PRICE_IDS));
}

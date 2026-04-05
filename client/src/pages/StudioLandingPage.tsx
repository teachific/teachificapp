import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Check, Zap, Video, BookOpen, FileCode2, Brain, Palette, Users,
  ArrowRight, Star, Play, Upload, Layers, Sparkles
} from "lucide-react";

const PLANS = [
  {
    tier: "free" as const,
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Get started for free",
    badge: null,
    features: [
      "1 course project",
      "5 lessons",
      "100 MB storage",
      "Basic quiz builder",
      "SCORM export",
      "Community support",
    ],
    cta: "Start Free",
    highlight: false,
  },
  {
    tier: "creator" as const,
    name: "Creator",
    monthlyPrice: 19,
    annualPrice: 179,
    description: "For solo course creators",
    badge: null,
    features: [
      "10 course projects",
      "100 lessons",
      "5 GB storage",
      "All lesson types",
      "Quiz & assessment builder",
      "Media library",
      "SCORM & xAPI export",
      "Email support",
    ],
    cta: "Start Creating",
    highlight: false,
  },
  {
    tier: "pro" as const,
    name: "Pro",
    monthlyPrice: 49,
    annualPrice: 449,
    description: "For serious content creators",
    badge: "Most Popular",
    features: [
      "Unlimited course projects",
      "Unlimited lessons",
      "50 GB storage",
      "AI content assistant",
      "Video hosting & player",
      "Custom branding",
      "Advanced quiz analytics",
      "Priority support",
    ],
    cta: "Go Pro",
    highlight: true,
  },
  {
    tier: "team" as const,
    name: "Team",
    monthlyPrice: 99,
    annualPrice: 899,
    description: "For teams & agencies",
    badge: null,
    features: [
      "Everything in Pro",
      "5 team seats",
      "Shared media library",
      "Team collaboration tools",
      "Version history",
      "Dedicated onboarding",
      "SLA support",
    ],
    cta: "Get Team",
    highlight: false,
  },
];

const FEATURES = [
  {
    icon: Video,
    title: "Video Lessons",
    desc: "Upload, host, and stream HD video with built-in player and chapter markers.",
  },
  {
    icon: Brain,
    title: "AI Content Assist",
    desc: "Generate lesson outlines, quiz questions, and course descriptions with AI.",
  },
  {
    icon: FileCode2,
    title: "SCORM & xAPI Export",
    desc: "Export any course as SCORM 1.2, SCORM 2004, or xAPI for any LMS.",
  },
  {
    icon: BookOpen,
    title: "Rich Lesson Editor",
    desc: "Text, video, audio, PDF, embed, quiz, and interactive content blocks.",
  },
  {
    icon: Palette,
    title: "Custom Branding",
    desc: "White-label your courses with your own logo, colors, and domain.",
  },
  {
    icon: Layers,
    title: "Media Library",
    desc: "Centralized asset management — images, videos, audio, and documents.",
  },
];

export default function StudioLandingPage() {
  const { user } = useAuth();
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const checkoutMutation = trpc.billing.createStudioCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
        toast.success("Redirecting to checkout…", { description: "A new tab has been opened." });
      }
    },
    onError: (err) => {
      toast.error("Checkout failed", { description: err.message });
      setLoadingTier(null);
    },
  });

  function handleCTA(tier: "free" | "creator" | "pro" | "team") {
    if (tier === "free") {
      if (!user) { window.location.href = "/register"; return; }
      window.location.href = "/studio";
      return;
    }
    if (!user) { window.location.href = "/register"; return; }
    setLoadingTier(tier);
    checkoutMutation.mutate({
      tier,
      interval,
      origin: window.location.origin,
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-[#0a0f1e]/90 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="text-xl font-black tracking-tight cursor-pointer">
              <span className="text-white">Teachific</span>
              <span className="text-violet-400"> Studio</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-white/60 hover:text-white text-sm hidden sm:block transition-colors">Features</a>
            <a href="#pricing" className="text-white/60 hover:text-white text-sm hidden sm:block transition-colors">Pricing</a>
            {user ? (
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700" asChild>
                <Link href="/studio">Open Studio</Link>
              </Button>
            ) : (
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={() => { window.location.href = "/login"; }}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative py-28 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-transparent to-indigo-900/20 pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <Badge className="mb-6 bg-violet-500/20 text-violet-300 border-violet-500/30 text-sm px-4 py-1">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Now with AI Content Assistant
          </Badge>
          <h1 className="text-5xl sm:text-7xl font-black mb-6 leading-tight">
            Build Better Courses,{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Faster
            </span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Teachific Studio is a powerful standalone course authoring tool. Create, host, and export
            professional eLearning content — no LMS required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 h-12"
              onClick={() => handleCTA("free")}
            >
              Start Free <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 h-12 px-8"
              onClick={() => { document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" }); }}
            >
              <Play className="mr-2 w-4 h-4" /> See Pricing
            </Button>
          </div>
          <p className="mt-4 text-sm text-white/40">No credit card required • Free forever plan available</p>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Everything You Need to Create</h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Professional course authoring tools without the complexity.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-violet-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="py-16 px-6 border-y border-white/10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-10 text-center">
          {[
            { stat: "10,000+", label: "Courses Created" },
            { stat: "500K+", label: "Learners Reached" },
            { stat: "4.9/5", label: "Average Rating" },
            { stat: "99.9%", label: "Uptime SLA" },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-3xl font-black text-violet-400">{item.stat}</div>
              <div className="text-white/50 text-sm mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">Simple, Transparent Pricing</h2>
            <p className="text-white/50 text-lg mb-8">Start free, upgrade when you're ready.</p>
            {/* Interval toggle */}
            <div className="inline-flex items-center bg-white/10 rounded-full p-1 gap-1">
              <button
                onClick={() => setInterval("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  interval === "monthly" ? "bg-violet-600 text-white shadow" : "text-white/60 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setInterval("annual")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  interval === "annual" ? "bg-violet-600 text-white shadow" : "text-white/60 hover:text-white"
                }`}
              >
                Annual <span className="ml-1 text-xs text-green-400 font-semibold">Save ~20%</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.tier}
                className={`relative rounded-2xl p-6 flex flex-col border transition-all ${
                  plan.highlight
                    ? "bg-violet-600/20 border-violet-500 shadow-lg shadow-violet-500/20"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-violet-500 text-white border-0 text-xs px-3 py-0.5">
                      <Star className="w-3 h-3 mr-1" />
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <p className="text-white/50 text-sm">{plan.description}</p>
                </div>
                <div className="mb-6">
                  {plan.monthlyPrice === 0 ? (
                    <span className="text-4xl font-black">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-black">
                        ${interval === "monthly" ? plan.monthlyPrice : Math.round(plan.annualPrice / 12)}
                      </span>
                      <span className="text-white/40 text-sm ml-1">/mo</span>
                      {interval === "annual" && (
                        <div className="text-xs text-green-400 mt-1">
                          Billed ${plan.annualPrice}/yr
                        </div>
                      )}
                    </>
                  )}
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <Check className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleCTA(plan.tier)}
                  disabled={loadingTier === plan.tier}
                  className={`w-full font-semibold ${
                    plan.highlight
                      ? "bg-violet-600 hover:bg-violet-700 text-white"
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  }`}
                >
                  {loadingTier === plan.tier ? "Loading…" : plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 px-6 bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-4">Ready to Create?</h2>
          <p className="text-white/60 text-lg mb-8">
            Join thousands of creators building world-class eLearning content with Teachific Studio.
          </p>
          <Button
            size="lg"
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-10 h-12"
            onClick={() => handleCTA("free")}
          >
            Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-white/10 text-center text-white/30 text-sm">
        <p>© {new Date().getFullYear()} Teachific. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-3">
          <Link href="/lms" className="hover:text-white/60 transition-colors">Teachific LMS</Link>
          <Link href="/quiz-creator-pro" className="hover:text-white/60 transition-colors">QuizCreator</Link>
          <a href="mailto:support@teachific.com" className="hover:text-white/60 transition-colors">Support</a>
        </div>
      </footer>
    </div>
  );
}

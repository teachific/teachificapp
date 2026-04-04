import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";

// ─── Data ─────────────────────────────────────────────────────────────────────

const QUESTION_TYPES = [
  {
    icon: "☑",
    name: "Multiple Choice",
    description:
      "Single or multi-select options with optional image attachments. Supports partial scoring and randomized answer order.",
  },
  {
    icon: "⊙",
    name: "True / False",
    description:
      "Fast binary questions with optional explanation feedback shown after submission.",
  },
  {
    icon: "🔥",
    name: "Hotspot",
    description:
      "Upload any image and define clickable regions. Perfect for anatomy diagrams, equipment labeling, and map-based questions.",
  },
  {
    icon: "⇄",
    name: "Matching",
    description:
      "Drag-and-drop pair builder. Students match terms to definitions, images to labels, or concepts to categories.",
  },
  {
    icon: "___",
    name: "Fill in the Blank",
    description:
      "Inline blanks inside a sentence or paragraph. Supports exact match, case-insensitive, or keyword-based grading.",
  },
  {
    icon: "✏",
    name: "Short Answer",
    description:
      "Open-ended text responses with optional model answer for instructor review or AI-assisted grading.",
  },
  {
    icon: "🖼",
    name: "Image Choice",
    description:
      "Replace text options with images. Ideal for visual identification, specimen recognition, and clinical image interpretation.",
  },
];

const FEATURES = [
  {
    title: "Proprietary .quiz Format",
    description:
      "Every quiz you build is saved in Teachific's encrypted .quiz format — a portable, tamper-resistant file you own. Share it, archive it, or import it into any Teachific LMS course with one click.",
  },
  {
    title: "AES-256 Encryption",
    description:
      "Premium .quiz files are encrypted end-to-end so your question banks can't be extracted or copied without your license key. Protect years of content development.",
  },
  {
    title: "Instant Preview Mode",
    description:
      "Switch to Student View at any time to experience your quiz exactly as a learner would — before you publish a single file.",
  },
  {
    title: "Drag-to-Reorder",
    description:
      "Restructure your quiz in seconds by dragging questions up or down the list. No cutting and pasting, no re-numbering.",
  },
  {
    title: "Detailed Scoring Controls",
    description:
      "Assign custom point values per question, set passing thresholds, enable partial credit, and configure time limits — all from one settings panel.",
  },
  {
    title: "Teachific LMS Integration",
    description:
      "Publish any .quiz file directly to a Teachific course lesson. Student attempts, scores, and completion data flow back to your LMS gradebook automatically.",
  },
];

const PLANS = [
  {
    name: "Lite",
    price: "$9",
    period: "/month",
    tagline: "For individual educators getting started",
    highlight: false,
    cta: "Start Free Trial",
    features: [
      "Up to 10 quizzes",
      "Up to 20 questions per quiz",
      "All 7 question types",
      "Standard .quiz export (unencrypted)",
      "Student preview mode",
      "Teachific LMS import",
      "Email support",
    ],
    missing: [
      "Encrypted .quiz export",
      "Unlimited quizzes",
      "Priority support",
      "Team collaboration",
    ],
  },
  {
    name: "Premium",
    price: "$19",
    period: "/month",
    tagline: "For serious content creators and teams",
    highlight: true,
    cta: "Start Free Trial",
    features: [
      "Unlimited quizzes",
      "Unlimited questions per quiz",
      "All 7 question types",
      "AES-256 encrypted .quiz export",
      "Student preview mode",
      "Teachific LMS import",
      "Hotspot region drawing tools",
      "Matching drag-and-drop builder",
      "Priority support",
      "Team collaboration (coming soon)",
    ],
    missing: [],
  },
  {
    name: "Enterprise",
    price: "Included",
    period: "with LMS",
    tagline: "Full QuizCreator Premium bundled with Teachific LMS",
    highlight: false,
    cta: "View LMS Plans",
    ctaHref: "/#pricing",
    features: [
      "Everything in Premium",
      "Bundled with Teachific LMS",
      "White-label quiz player",
      "SSO / SAML support",
      "Dedicated account manager",
      "Custom SLA",
    ],
    missing: [],
  },
];

const COMPARISON_ROWS = [
  { label: "Question types", lite: "7 types", premium: "7 types", enterprise: "7 types" },
  { label: "Quizzes", lite: "10", premium: "Unlimited", enterprise: "Unlimited" },
  { label: "Questions per quiz", lite: "20", premium: "Unlimited", enterprise: "Unlimited" },
  { label: ".quiz file export", lite: "✓ (standard)", premium: "✓ (encrypted)", enterprise: "✓ (encrypted)" },
  { label: "AES-256 encryption", lite: "✗", premium: "✓", enterprise: "✓" },
  { label: "Hotspot editor", lite: "✓", premium: "✓", enterprise: "✓" },
  { label: "Matching editor", lite: "✓", premium: "✓", enterprise: "✓" },
  { label: "Student preview mode", lite: "✓", premium: "✓", enterprise: "✓" },
  { label: "Teachific LMS import", lite: "✓", premium: "✓", enterprise: "✓" },
  { label: "White-label quiz player", lite: "✗", premium: "✗", enterprise: "✓" },
  { label: "Team collaboration", lite: "✗", premium: "Coming soon", enterprise: "Coming soon" },
  { label: "Priority support", lite: "✗", premium: "✓", enterprise: "✓" },
  { label: "Dedicated account manager", lite: "✗", premium: "✗", enterprise: "✓" },
];

const TESTIMONIALS = [
  {
    quote:
      "The hotspot question editor is unlike anything else on the market. I can annotate any diagram or image and turn it into an interactive question in under two minutes.",
    name: "Dr. M. Chen",
    title: "Clinical Educator, Medical Sciences",
  },
  {
    quote:
      "I've tried every quiz builder out there. QuizCreator is the only one that gives me a portable file I actually own — not locked inside someone else's platform.",
    name: "Prof. A. Okonkwo",
    title: "Medical Education Faculty",
  },
  {
    quote:
      "The matching drag-and-drop builder made creating anatomy pairing exercises trivially easy. My students love it and my completion rates went up 40%.",
    name: "T. Nakamura",
    title: "Allied Health Instructor",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuizCreatorLandingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b1d35] text-white font-sans">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-[#0b1d35]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight">
              <span className="text-white">Quiz</span>
              <span className="text-teal-400">Creator</span>
            </span>
            <span className="text-white/30 text-sm hidden sm:block">by Teachific</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#pricing" className="text-white/60 hover:text-white text-sm hidden sm:block transition-colors">
              Pricing
            </a>
            <a href="#features" className="text-white/60 hover:text-white text-sm hidden sm:block transition-colors">
              Features
            </a>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-lg px-4">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-20 px-6">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-teal-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 mb-6 text-sm px-4 py-1">
            7 Question Types · Encrypted .quiz Files · Teachific LMS Integration
          </Badge>

          <h1 className="text-5xl sm:text-6xl font-black leading-tight mb-6">
            Build Professional Quizzes.
            <br />
            <span className="text-teal-400">Own Every Question.</span>
          </h1>

          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            QuizCreator is the standalone quiz authoring tool built for educators who demand more than a
            basic form builder. Create hotspot, matching, and 5 other question types — then export to a
            portable, encrypted .quiz file that belongs to you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button className="bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg px-10 py-4 rounded-xl h-auto">
                Start Free Trial — No Card Required
              </Button>
            </Link>
            <Link href="/quiz-creator-app">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 text-lg px-10 py-4 rounded-xl h-auto"
              >
                Open the App
              </Button>
            </Link>
          </div>

          <p className="text-white/30 text-sm mt-6">
            14-day free trial on all plans. No credit card required.
          </p>
        </div>
      </section>

      {/* ── Social proof bar ── */}
      <section className="border-y border-white/10 py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: "7", label: "Question Types" },
            { value: "AES-256", label: "Encryption Standard" },
            { value: ".quiz", label: "Portable File Format" },
            { value: "LMS Ready", label: "Teachific Integration" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-black text-teal-400 mb-1">{s.value}</div>
              <div className="text-white/50 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Question Types ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Every Question Type You'll Ever Need
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              From simple multiple choice to complex image hotspots — QuizCreator gives you the full toolkit
              to build assessments that actually measure understanding.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {QUESTION_TYPES.map((qt) => (
              <div
                key={qt.name}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-teal-500/40 hover:bg-white/8 transition-all"
              >
                <div className="text-3xl mb-4">{qt.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{qt.name}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{qt.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature deep-dives ── */}
      <section className="py-24 px-6 bg-white/[0.02] border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Built for Serious Content Creators
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              QuizCreator isn't a form builder with a quiz skin. It's purpose-built authoring software
              for educators who create content professionally.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-teal-400" />
                </div>
                <h3 className="text-lg font-bold text-white">{f.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hotspot spotlight ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-teal-900/40 to-[#0b1d35] border border-teal-500/20 rounded-3xl p-10 sm:p-14">
            <div className="max-w-2xl">
              <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 mb-6">
                Signature Feature
              </Badge>
              <h2 className="text-4xl font-black mb-6 leading-tight">
                The Hotspot Editor That Changes Everything
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-8">
                Upload any image — an anatomy diagram, a piece of medical equipment, a map, a screenshot —
                and draw clickable regions directly on it. Define which regions are correct, add feedback
                for each zone, and set partial scoring. No coding. No external tools. Just click, draw, done.
              </p>
              <p className="text-white/50 text-base leading-relaxed mb-10">
                Hotspot questions are the gold standard for visual assessment in healthcare education,
                engineering training, and technical certification programs. QuizCreator is the only
                standalone tool that makes them this easy to build.
              </p>
              <Link href="/register">
                <Button className="bg-teal-500 hover:bg-teal-400 text-white font-bold px-8 py-3 rounded-xl h-auto">
                  Try the Hotspot Editor Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6 bg-white/[0.02] border-y border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-16">
            Trusted by Educators Who Create at Scale
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white/5 border border-white/10 rounded-2xl p-7 flex flex-col gap-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed italic">"{t.quote}"</p>
                <div className="mt-auto">
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-white/40 text-xs">{t.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">Simple, Transparent Pricing</h2>
            <p className="text-white/60 text-lg mb-8">
              Start free. Upgrade when you're ready. Cancel anytime.
            </p>
            {/* Toggle */}
            <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full p-1">
              <button
                onClick={() => setAnnual(false)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  !annual ? "bg-teal-500 text-white" : "text-white/50 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  annual ? "bg-teal-500 text-white" : "text-white/50 hover:text-white"
                }`}
              >
                Annual <span className="text-teal-300 text-xs ml-1">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-16">
            {PLANS.map((plan) => {
              const price =
                plan.price === "Included"
                  ? "Included"
                  : annual
                  ? `$${Math.round(parseInt(plan.price.replace("$", "")) * 0.8)}`
                  : plan.price;

              return (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl p-8 flex flex-col gap-6 border transition-all ${
                    plan.highlight
                      ? "bg-teal-500/10 border-teal-500/40 shadow-lg shadow-teal-500/10"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-teal-500 text-white border-0 px-4 text-xs font-bold">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-black text-white mb-1">{plan.name}</h3>
                    <p className="text-white/50 text-sm">{plan.tagline}</p>
                  </div>

                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-white">{price}</span>
                    <span className="text-white/40 text-sm mb-1">{plan.period}</span>
                  </div>

                  <Link href={plan.ctaHref ?? "/register"}>
                    <Button
                      className={`w-full font-semibold rounded-xl py-3 h-auto ${
                        plan.highlight
                          ? "bg-teal-500 hover:bg-teal-400 text-white"
                          : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>

                  <ul className="flex flex-col gap-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                        <svg className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {f}
                      </li>
                    ))}
                    {plan.missing.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-white/25">
                        <svg className="w-4 h-4 text-white/20 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Comparison table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-6 py-4 text-white/60 font-medium">Feature</th>
                  <th className="text-center px-4 py-4 text-white font-bold">Lite</th>
                  <th className="text-center px-4 py-4 text-teal-400 font-bold">Premium</th>
                  <th className="text-center px-4 py-4 text-white font-bold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}
                  >
                    <td className="px-6 py-3 text-white/70">{row.label}</td>
                    <td className="px-4 py-3 text-center text-white/60">{row.lite}</td>
                    <td className="px-4 py-3 text-center text-teal-300 font-medium">{row.premium}</td>
                    <td className="px-4 py-3 text-center text-white/60">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent to-teal-900/20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Start Building Better Assessments Today
          </h2>
          <p className="text-white/60 text-lg mb-10 leading-relaxed">
            Join educators who have moved beyond basic quiz forms. QuizCreator gives you the authoring
            power to build assessments that are as sophisticated as the subjects you teach.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button className="bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg px-10 py-4 rounded-xl h-auto">
                Start Your Free Trial
              </Button>
            </Link>
            <Link href="/quiz-creator-app">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 text-lg px-10 py-4 rounded-xl h-auto"
              >
                Try the App First
              </Button>
            </Link>
          </div>
          <p className="text-white/30 text-sm mt-6">14-day free trial · No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black">
              <span className="text-white">Quiz</span>
              <span className="text-teal-400">Creator</span>
            </span>
            <span className="text-white/30 text-sm">by Teachific</span>
          </div>
          <div className="flex items-center gap-6 text-white/40 text-sm">
            <Link href="/">Teachific LMS</Link>
            <Link href="/login">Sign In</Link>
            <Link href="/register">Register</Link>
          </div>
          <p className="text-white/30 text-xs">© {new Date().getFullYear()} Teachific. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

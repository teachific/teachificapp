import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Video, BarChart3, Globe, Shield, Zap,
  Users, CheckCircle, ArrowRight, Play, Award, Upload,
} from "lucide-react";

const FEATURES = [
  {
    icon: Upload,
    title: "SCORM & HTML5 Hosting",
    description:
      "Upload SCORM 1.2, SCORM 2004, Articulate, iSpring, and plain HTML5 packages in seconds. No technical setup required.",
  },
  {
    icon: BookOpen,
    title: "Full-Featured LMS",
    description:
      "Build courses, manage enrollments, issue certificates, and track learner progress — all in one platform.",
  },
  {
    icon: Video,
    title: "Branded Video Player",
    description:
      "Deliver video content with your organization's colors, logo watermark, and custom player controls.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Track completions, quiz scores, engagement time, and revenue with real-time dashboards and exportable reports.",
  },
  {
    icon: Globe,
    title: "Custom Domains",
    description:
      "White-label your learning portal with a custom domain and branded experience for every organization.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Role-based access control, SSO support, content permissions, and audit logs keep your content safe.",
  },
];

const PLANS = [
  { name: "Free", price: "$0", features: ["1 organization", "Basic hosting", "Community support"] },
  { name: "Starter", price: "$29/mo", features: ["Custom branding", "5 courses", "Email support"] },
  { name: "Builder", price: "$79/mo", features: ["Unlimited courses", "Webinars", "Priority support"] },
  { name: "Pro", price: "$149/mo", features: ["Custom domain", "Advanced analytics", "API access"] },
  { name: "Enterprise", price: "Custom", features: ["Dedicated support", "SLA guarantee", "Custom integrations"] },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  // Set SEO title (30–60 characters)
  useEffect(() => {
    document.title = "Teachific™ — Online Learning & LMS Platform";
  }, []);

  // Redirect authenticated users to the dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/lms");
    }
  }, [user, loading, navigate]);

  if (loading) return null;
  if (user) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ── SEO meta keywords injected via useEffect on document.title ── */}

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Teachific™</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-teal-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-teal-600 transition-colors">Pricing</a>
            <a href="#about" className="hover:text-teal-600 transition-colors">About</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href={getLoginUrl()} className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">
              Sign in
            </a>
            <a href={getLoginUrl()}>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2">
                Get Started Free
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-cyan-50 pt-20 pb-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold mb-6 border border-teal-200">
            <Zap className="w-3 h-3" /> The all-in-one LMS for modern educators
          </div>

          {/* H1 — primary SEO heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
            Host, Manage &amp; Deliver{" "}
            <span className="text-teal-600">Online Courses</span>{" "}
            at Scale
          </h1>

          {/* H2 — secondary SEO heading */}
          <h2 className="text-xl sm:text-2xl text-slate-600 font-normal max-w-2xl mx-auto mb-10 leading-relaxed">
            Teachific™ is a powerful learning management system for hosting SCORM packages,
            HTML5 content, video courses, webinars, and quizzes — with full analytics and
            white-label branding.
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={getLoginUrl()}>
              <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 text-base font-semibold shadow-lg shadow-teal-200">
                Start for Free <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
            <a href="#features">
              <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 px-8 py-3 text-base font-semibold">
                <Play className="mr-2 w-4 h-4 text-teal-600" /> See Features
              </Button>
            </a>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            {[
              { icon: Users, label: "Multi-org support" },
              { icon: Award, label: "Certificate issuance" },
              { icon: Shield, label: "Enterprise security" },
              { icon: Globe, label: "Custom domains" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4 text-teal-500" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to run a world-class online school
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              From SCORM hosting and course building to webinars, quizzes, and revenue tracking —
              Teachific™ covers every aspect of online education delivery.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="group p-6 rounded-2xl border border-slate-100 bg-white hover:border-teal-200 hover:shadow-lg hover:shadow-teal-50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
                  <f.icon className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing for every team size
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Start free and scale as your organization grows. No hidden fees, no long-term contracts.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PLANS.map((plan, i) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 flex flex-col gap-4 ${
                  i === 2
                    ? "border-teal-400 bg-teal-600 text-white shadow-xl shadow-teal-200 scale-105"
                    : "border-slate-200 bg-white text-slate-900"
                }`}
              >
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${i === 2 ? "text-teal-200" : "text-teal-600"}`}>
                    {plan.name}
                  </p>
                  <p className={`text-2xl font-bold ${i === 2 ? "text-white" : "text-slate-900"}`}>{plan.price}</p>
                </div>
                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${i === 2 ? "text-teal-200" : "text-teal-500"}`} />
                      <span className={i === 2 ? "text-teal-50" : "text-slate-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a href={getLoginUrl()}>
                  <Button
                    className={`w-full text-sm font-semibold ${
                      i === 2
                        ? "bg-white text-teal-700 hover:bg-teal-50"
                        : "bg-teal-600 hover:bg-teal-700 text-white"
                    }`}
                  >
                    Get Started
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About / CTA ── */}
      <section id="about" className="py-24 px-4 bg-gradient-to-br from-teal-600 to-cyan-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to launch your online learning platform?
          </h2>
          <p className="text-lg text-teal-100 mb-10 leading-relaxed">
            Join thousands of educators, training teams, and businesses using Teachific™ to deliver
            engaging online courses, SCORM content, and live webinars — all from one place.
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50 px-10 py-3 text-base font-bold shadow-lg">
              Create Your Free Account <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-teal-600 flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Teachific™</span>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Teachific™. All rights reserved. Online LMS &amp; SCORM hosting platform.
          </p>
          <div className="flex gap-4 text-xs">
            <a href="/login" className="hover:text-teal-400 transition-colors">Sign In</a>
            <a href="/register" className="hover:text-teal-400 transition-colors">Register</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

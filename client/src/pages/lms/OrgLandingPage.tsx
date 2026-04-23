import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useOrgBranding } from "@/hooks/useOrgBranding";
import { renderBlockPreview } from "@/components/PageBuilder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  BookOpen,
  Clock,
  Play,
  ChevronRight,
  GraduationCap,
  Star,
  Users,
  Award,
  Zap,
  CheckCircle,
  ArrowRight,
  type LucideProps,
} from "lucide-react";

// ─── Course Card ─────────────────────────────────────────────────────────────
function CourseCard({
  course,
  accentColor,
  onClick,
}: {
  course: any;
  accentColor: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-black/20 transition-all hover:-translate-y-1 backdrop-blur-sm"
    >
      <div className="aspect-video bg-white/5 relative overflow-hidden">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: accentColor + "20" }}
          >
            <BookOpen className="h-10 w-10" style={{ color: accentColor }} />
          </div>
        )}
        {course.isFeatured && (
          <Badge
            className="absolute top-2 left-2 text-xs text-white border-0"
            style={{ backgroundColor: accentColor }}
          >
            Featured
          </Badge>
        )}
        {course.level && (
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 text-xs capitalize bg-black/50 text-white border-0"
          >
            {course.level}
          </Badge>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-white group-hover:opacity-80 transition-opacity">
          {course.title}
        </h3>
        {course.shortDescription && (
          <p className="text-xs text-white/60 mt-1.5 line-clamp-2">{course.shortDescription}</p>
        )}
        <div className="flex items-center gap-3 mt-3 text-xs text-white/50">
          {course.totalLessons > 0 && (
            <span className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              {course.totalLessons} lessons
            </span>
          )}
          {course.estimatedHours && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {course.estimatedHours}h
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
          <div>
            {course.isFree ? (
              <span className="font-bold text-sm text-emerald-400">Free</span>
            ) : course.startingPrice ? (
              <span className="font-bold text-sm text-white">${course.startingPrice}</span>
            ) : (
              <span className="font-bold text-sm" style={{ color: accentColor }}>
                Enroll
              </span>
            )}
          </div>
          <button
            className="text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-80 flex items-center gap-1"
            style={{ backgroundColor: accentColor }}
          >
            View Course <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Feature Icon Map ─────────────────────────────────────────────────────────
const FEATURE_ICONS: Record<string, React.FC<LucideProps>> = {
  star: Star,
  users: Users,
  award: Award,
  zap: Zap,
  check: CheckCircle,
  book: BookOpen,
  graduation: GraduationCap,
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OrgLandingPage({ subdomainOrg, fallback }: { subdomainOrg: string; fallback?: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showAllCourses, setShowAllCourses] = useState(false);

  // Fetch landing page data (public)
  const { data: landingData, isLoading } = trpc.orgs.getLandingPage.useQuery(
    { slug: subdomainOrg },
    { staleTime: 60_000 }
  );

  // Fetch public courses for this org using the publicSchool router
  const { data: courses } = trpc.lms.publicSchool.coursesBySlug.useQuery(
    { slug: subdomainOrg },
    { enabled: !!landingData?.org?.id && (landingData?.showCourses ?? true), staleTime: 60_000 }
  );

  // Fetch page-builder school_home page if one exists
  const { data: homePage } = trpc.lms.publicSchool.homePageBySlug.useQuery(
    { slug: subdomainOrg },
    { staleTime: 60_000 }
  );

  // Fetch org theme for favicon/logo injection
  const { data: orgTheme } = trpc.lms.publicSchool.themeBySlug.useQuery(
    { slug: subdomainOrg },
    { staleTime: 60_000 }
  );

  // Inject org favicon, SEO meta tags, and custom CSS into document <head>
  useOrgBranding({
    faviconUrl: orgTheme?.faviconUrl,
    schoolName: landingData?.org?.name ?? undefined,
    logoUrl: orgTheme?.adminLogoUrl,
    seoTitle: (orgTheme as any)?.seoTitle,
    seoDescription: (orgTheme as any)?.seoDescription,
    seoKeywords: (orgTheme as any)?.seoKeywords,
    seoOgImageUrl: (orgTheme as any)?.seoOgImageUrl,
    seoRobotsIndex: (orgTheme as any)?.seoRobotsIndex,
    customCss: (orgTheme as any)?.customCss,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-2xl px-4">
          <Skeleton className="h-12 w-3/4 bg-white/10" />
          <Skeleton className="h-6 w-1/2 bg-white/10" />
          <Skeleton className="h-10 w-40 bg-white/10" />
        </div>
      </div>
    );
  }

  // If a published page-builder school_home page exists, render it instead
  if (homePage && homePage.blocks && homePage.blocks.length > 0) {
    return (
      <div className="min-h-screen">
        {homePage.blocks
          .filter((b: any) => b.visible !== false)
          .map((block: any) => (
            <div key={block.id}>{renderBlockPreview(block)}</div>
          ))}
      </div>
    );
  }

  // If no landing page or not published, render fallback (SchoolPage) if provided
  if (!landingData || !landingData.isPublished) {
    return fallback ? <>{fallback}</> : null;
  }

  const {
    org,
    heroHeadline,
    heroSubheadline,
    heroCtaText,
    heroCtaUrl,
    heroBgColor,
    heroTextColor,
    aboutTitle,
    aboutBody,
    features,
    accentColor,
    showCourses,
    footerText,
  } = landingData;

  const accent = accentColor || "#0ea5e9";
  const bgColor = heroBgColor || "#0f172a";
  const textColor = heroTextColor || "#ffffff";

  let parsedFeatures: Array<{ icon: string; title: string; description: string }> = [];
  try {
    if (features) parsedFeatures = JSON.parse(features);
  } catch {
    // ignore parse errors
  }

  const displayedCourses = showAllCourses ? (courses ?? []) : (courses ?? []).slice(0, 6);

  const handleCourseClick = (courseId: number) => {
    setLocation(`/courses/${courseId}`);
  };

  const handleCta = () => {
    if (heroCtaUrl) {
      window.location.href = heroCtaUrl;
    } else {
      // Scroll to courses section
      document.getElementById("courses-section")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor, color: textColor }}>
      {/* ── Nav Bar ── */}
      <nav
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ borderColor: textColor + "15", backgroundColor: bgColor + "e0" }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: accent }}
            >
              {org.name[0]}
            </div>
            <span className="font-semibold text-sm" style={{ color: textColor }}>
              {org.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button
                size="sm"
                onClick={() => setLocation("/lms/dashboard")}
                style={{ backgroundColor: accent, color: "#fff", border: "none" }}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <a
                  href={getLoginUrl()}
                  className="text-sm font-medium hover:opacity-80 transition-opacity"
                  style={{ color: textColor + "cc" }}
                >
                  Sign in
                </a>
                <Button
                  size="sm"
                  onClick={() => setLocation("/courses")}
                  style={{ backgroundColor: accent, color: "#fff", border: "none" }}
                >
                  Browse Courses
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden">
        {/* Background gradient overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at 60% 40%, ${accent}40 0%, transparent 70%)`,
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-36">
          <div className="max-w-3xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 border"
              style={{ borderColor: accent + "40", backgroundColor: accent + "15", color: accent }}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Online Learning Platform
            </div>
            <h1
              className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight mb-6"
              style={{ color: textColor }}
            >
              {heroHeadline || `Welcome to ${org.name}`}
            </h1>
            {heroSubheadline && (
              <p
                className="text-lg md:text-xl leading-relaxed mb-8 max-w-2xl"
                style={{ color: textColor + "bb" }}
              >
                {heroSubheadline}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={handleCta}
                className="text-white font-semibold px-8 shadow-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: accent, border: "none" }}
              >
                {heroCtaText || "Browse Courses"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              {user && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation("/lms/my-courses")}
                  className="font-semibold"
                  style={{ borderColor: textColor + "30", color: textColor, backgroundColor: "transparent" }}
                >
                  My Courses
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Highlights ── */}
      {parsedFeatures.length > 0 && (
        <section
          className="border-y"
          style={{ borderColor: textColor + "10", backgroundColor: textColor + "05" }}
        >
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {parsedFeatures.map((f, i) => {
                const Icon = FEATURE_ICONS[f.icon] ?? Star;
                return (
                  <div key={i} className="flex gap-4">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: accent + "20" }}
                    >
                      <Icon className="h-5 w-5" style={{ color: accent }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1" style={{ color: textColor }}>
                        {f.title}
                      </h3>
                      <p className="text-sm" style={{ color: textColor + "80" }}>
                        {f.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── About Section ── */}
      {(aboutTitle || aboutBody) && (
        <section className="max-w-6xl mx-auto px-4 py-20">
          <div className="max-w-2xl">
            {aboutTitle && (
              <h2 className="text-3xl font-bold mb-4" style={{ color: textColor }}>
                {aboutTitle}
              </h2>
            )}
            {aboutBody && (
              <p className="text-base leading-relaxed" style={{ color: textColor + "aa" }}>
                {aboutBody}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── Courses Section ── */}
      {showCourses && (
        <section id="courses-section" className="max-w-6xl mx-auto px-4 py-20">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold" style={{ color: textColor }}>
                Our Courses
              </h2>
              <p className="text-sm mt-1" style={{ color: textColor + "70" }}>
                {(courses ?? []).length} course{(courses ?? []).length !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>

          {!courses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-72 rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 rounded-2xl border"
              style={{ borderColor: textColor + "10", backgroundColor: textColor + "05" }}
            >
              <GraduationCap className="h-12 w-12 mb-4" style={{ color: accent }} />
              <p className="font-medium" style={{ color: textColor }}>
                No courses published yet
              </p>
              <p className="text-sm mt-1" style={{ color: textColor + "60" }}>
                Check back soon for new content
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedCourses.map((course: any) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    accentColor={accent}
                    onClick={() => handleCourseClick(course.id)}
                  />
                ))}
              </div>
              {(courses ?? []).length > 6 && !showAllCourses && (
                <div className="flex justify-center mt-10">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllCourses(true)}
                    className="font-medium"
                    style={{ borderColor: accent + "50", color: accent, backgroundColor: "transparent" }}
                  >
                    View All {courses.length} Courses
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ── CTA Banner ── */}
      {!user && (
        <section className="max-w-6xl mx-auto px-4 py-10 mb-10">
          <div
            className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden"
            style={{ backgroundColor: accent + "15", border: `1px solid ${accent}30` }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `radial-gradient(ellipse at center, ${accent}60 0%, transparent 70%)`,
              }}
            />
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: textColor }}>
                Ready to start learning?
              </h2>
              <p className="text-sm mb-6" style={{ color: textColor + "80" }}>
                Join {org.name} and access all our courses.
              </p>
              <Button
                size="lg"
                onClick={() => setLocation("/courses")}
                className="text-white font-semibold px-8"
                style={{ backgroundColor: accent, border: "none" }}
              >
                Get Started Today
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer
        className="border-t mt-4"
        style={{ borderColor: textColor + "10", backgroundColor: textColor + "05" }}
      >
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded-md flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: accent }}
            >
              {org.name[0]}
            </div>
            <span className="text-sm font-medium" style={{ color: textColor }}>
              {org.name}
            </span>
          </div>
          <p className="text-xs" style={{ color: textColor + "50" }}>
            {footerText || `© ${new Date().getFullYear()} ${org.name}. All rights reserved.`}
          </p>
          <p className="text-xs" style={{ color: textColor + "30" }}>
            Powered by{" "}
            <span className="font-semibold">
              <span style={{ color: textColor + "50" }}>teach</span>
              <span style={{ color: accent }}>ific</span>
              <span style={{ color: textColor + "50" }}>™</span>
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}

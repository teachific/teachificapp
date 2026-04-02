import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  ChevronLeft,
  Star,
  Clock,
  BookOpen,
  Play,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Lock,
  Users,
  Award,
} from "lucide-react";

// ─── Block Renderer (student-facing, read-only) ───────────────────────────────

function RenderBlock({ block, primaryColor, curriculum, pricing }: {
  block: any;
  primaryColor: string;
  curriculum: any[];
  pricing: any[];
}) {
  const d = block.data;
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  switch (block.type) {
    case "banner":
      return (
        <div
          className="relative w-full min-h-[320px] flex flex-col items-center justify-center text-center px-8 py-16"
          style={{ backgroundColor: d.bgColor || primaryColor, color: d.textColor || "#fff" }}
        >
          {d.imageUrl && (
            <img src={d.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          )}
          <div className="relative z-10 flex flex-col items-center gap-5 max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">{d.headline}</h1>
            {d.subheadline && <p className="text-xl opacity-90">{d.subheadline}</p>}
            {d.ctaText && (
              <a href={d.ctaUrl || "#pricing"}>
                <button
                  className="mt-2 px-8 py-3 rounded-full font-semibold text-base"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.7)" }}
                >
                  {d.ctaText}
                </button>
              </a>
            )}
          </div>
        </div>
      );

    case "text":
      return (
        <div className={`flex gap-8 items-start ${d.imagePosition === "left" ? "flex-row-reverse" : "flex-row"}`}>
          <div className="flex-1">
            {d.heading && <h2 className="text-2xl font-bold mb-3">{d.heading}</h2>}
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{d.body}</p>
          </div>
          {d.imageUrl && (
            <div className="w-64 shrink-0">
              <img src={d.imageUrl} alt="" className="rounded-xl w-full object-cover shadow-md" />
            </div>
          )}
        </div>
      );

    case "video":
      return (
        <div className="flex flex-col gap-3">
          <div className="aspect-video bg-muted rounded-xl overflow-hidden shadow-md">
            {d.url ? (
              <iframe src={d.url} className="w-full h-full" allowFullScreen />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Play className="h-12 w-12" />
              </div>
            )}
          </div>
          {d.caption && <p className="text-sm text-muted-foreground text-center">{d.caption}</p>}
        </div>
      );

    case "curriculum": {
      return (
        <div>
          <h2 className="text-2xl font-bold mb-6">{d.heading || "Course Curriculum"}</h2>
          {curriculum.length === 0 ? (
            <p className="text-muted-foreground text-sm">Curriculum coming soon.</p>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
              {curriculum.map((section: any, si: number) => (
                <div key={section.id}>
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => setExpandedSections((s) => ({ ...s, [si]: !s[si] }))}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{section.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {section.lessons?.length || 0} lessons
                      </span>
                    </div>
                    {expandedSections[si] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {expandedSections[si] && (
                    <div className="bg-muted/20 divide-y divide-border/50">
                      {(section.lessons || []).map((lesson: any) => (
                        <div key={lesson.id} className="flex items-center gap-3 px-5 py-3">
                          {lesson.isFreePreview ? (
                            <Play className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
                          ) : (
                            <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className="text-sm flex-1">{lesson.title}</span>
                          {lesson.isFreePreview && (
                            <Badge variant="outline" className="text-xs" style={{ borderColor: primaryColor, color: primaryColor }}>
                              Free Preview
                            </Badge>
                          )}
                          {lesson.durationMinutes && (
                            <span className="text-xs text-muted-foreground">{lesson.durationMinutes}m</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    case "pricing":
      return (
        <div id="pricing">
          <h2 className="text-2xl font-bold mb-2">{d.heading || "Pricing Options"}</h2>
          {d.subheading && <p className="text-muted-foreground mb-6">{d.subheading}</p>}
          {pricing.length === 0 ? (
            <p className="text-muted-foreground text-sm">Pricing options coming soon.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pricing.map((p: any) => (
                <div key={p.id} className="border-2 border-border rounded-xl p-6 hover:border-primary transition-colors">
                  <p className="font-semibold text-lg">{p.name || "Standard"}</p>
                  <div className="mt-2 mb-4">
                    <span className="text-3xl font-bold" style={{ color: primaryColor }}>
                      ${p.price}
                    </span>
                    {p.billingInterval && (
                      <span className="text-muted-foreground text-sm ml-1">/{p.billingInterval}</span>
                    )}
                  </div>
                  {p.description && <p className="text-sm text-muted-foreground mb-4">{p.description}</p>}
                  <Button
                    className="w-full text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Get Started
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case "testimonials":
      return (
        <div>
          <h2 className="text-2xl font-bold mb-6">{d.heading || "What Students Say"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(d.testimonials || []).map((t: any, i: number) => (
              <div key={i} className="border border-border rounded-xl p-5">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(t.rating || 5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-muted-foreground italic leading-relaxed">"{t.text}"</p>
                <p className="text-sm font-semibold mt-3">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case "cta":
      return (
        <div
          className="rounded-2xl p-10 text-center text-white"
          style={{ backgroundColor: d.bgColor || primaryColor }}
        >
          <h2 className="text-3xl font-bold">{d.heading || "Ready to get started?"}</h2>
          {d.subheading && <p className="mt-3 text-lg opacity-90">{d.subheading}</p>}
          <a href={d.ctaUrl || "#pricing"}>
            <button
              className="mt-6 px-10 py-3 bg-white rounded-full font-semibold text-base"
              style={{ color: d.bgColor || primaryColor }}
            >
              {d.ctaText || "Enroll Now"}
            </button>
          </a>
        </div>
      );

    case "instructor":
      return (
        <div className="flex gap-6 items-start">
          <div className="h-20 w-20 rounded-full bg-muted shrink-0 overflow-hidden">
            {d.avatarUrl ? (
              <img src={d.avatarUrl} alt={d.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-muted-foreground">
                {(d.name || "I")[0]}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{d.heading || "Your Instructor"}</p>
            <h3 className="text-xl font-bold">{d.name}</h3>
            {d.title && <p className="text-sm text-muted-foreground">{d.title}</p>}
            {d.bio && <p className="text-muted-foreground mt-3 leading-relaxed">{d.bio}</p>}
          </div>
        </div>
      );

    case "checklist":
      return (
        <div>
          <h2 className="text-2xl font-bold mb-5">{d.heading || "What's Included"}</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(d.items || []).map((item: string, i: number) => (
              <li key={i} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: primaryColor }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "columns":
      return (
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: `repeat(${(d.columns || []).length}, 1fr)` }}
        >
          {(d.columns || []).map((col: any, i: number) => (
            <div key={i}>
              <h3 className="font-bold text-lg mb-2">{col.heading}</h3>
              <p className="text-muted-foreground leading-relaxed">{col.body}</p>
            </div>
          ))}
        </div>
      );

    case "spacer":
      return <div style={{ height: d.height || 40 }} />;

    default:
      return null;
  }
}

// ─── Course Sales Page ─────────────────────────────────────────────────────────

export default function CourseSalesPage() {
  const params = useParams<{ courseId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const courseId = parseInt(params.courseId);

  const { data: orgs } = trpc.orgs.myOrgs.useQuery();
  const orgId = orgs?.[0]?.id;

  const { data: course, isLoading: courseLoading } = trpc.lms.courses.get.useQuery({ id: courseId });
  const { data: curriculum } = trpc.lms.curriculum.get.useQuery({ courseId });
  const { data: pricing } = trpc.lms.pricing.list.useQuery({ courseId });
  const { data: page } = trpc.lms.pages.getByCourse.useQuery({ courseId });
  const { data: theme } = trpc.lms.themes.get.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );
  const { data: enrollments } = trpc.lms.enrollments.myEnrollments.useQuery(
    undefined,
    { enabled: !!user }
  );
  const enrollment = enrollments?.find((e: any) => e.courseId === courseId);

  const primaryColor = theme?.studentPrimaryColor || theme?.primaryColor || "#189aa1";

  let blocks: any[] = [];
  if (page?.blocksJson) {
    try { blocks = JSON.parse(page.blocksJson); } catch { blocks = []; }
  }

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setLocation("/school")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Courses
          </button>
          <div className="flex items-center gap-3">
            {enrollment ? (
              <Button
                size="sm"
                style={{ backgroundColor: primaryColor }}
                onClick={() => setLocation(`/learn/${courseId}`)}
              >
                Continue Learning
              </Button>
            ) : (
              <Button
                size="sm"
                style={{ backgroundColor: primaryColor }}
                onClick={() => {
                  if (!user) { window.location.href = getLoginUrl(); return; }
                  document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {pricing && pricing.length > 0 && pricing[0].price > 0 ? `Enroll from $${pricing[0].price}` : "Enroll Free"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Page builder blocks OR default layout */}
      {blocks.length > 0 ? (
        <div>
          {blocks.map((block: any) => (
            <div key={block.id} className={block.type === "banner" ? "" : "max-w-4xl mx-auto px-4 py-10"}>
              <RenderBlock
                block={block}
                primaryColor={primaryColor}
                curriculum={curriculum || []}
                pricing={pricing || []}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Default layout when no page builder content */
        <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-10">
          {/* Course header */}
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h1 className="text-3xl font-bold leading-tight">{course.title}</h1>
              {course.shortDescription && (
                <p className="text-muted-foreground mt-3 text-lg leading-relaxed">{course.shortDescription}</p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                {course.status && <Badge variant="outline" className="capitalize">{course.status}</Badge>}
              </div>
            </div>
            {course.thumbnailUrl && (
              <div className="w-full md:w-72 shrink-0">
                <img src={course.thumbnailUrl} alt={course.title} className="w-full rounded-xl shadow-md object-cover aspect-video" />
              </div>
            )}
          </div>

          {/* Curriculum */}
          {curriculum && curriculum.length > 0 && (
            <RenderBlock
              block={{ type: "curriculum", data: { heading: "Course Curriculum", showPreview: true } }}
              primaryColor={primaryColor}
              curriculum={curriculum}
              pricing={pricing || []}
            />
          )}

          {/* Pricing */}
          {pricing && pricing.length > 0 && (
            <RenderBlock
              block={{ type: "pricing", data: { heading: "Pricing Options" } }}
              primaryColor={primaryColor}
              curriculum={curriculum || []}
              pricing={pricing}
            />
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {course?.title}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

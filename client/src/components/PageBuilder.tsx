import { useState, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GripVertical,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Image,
  Type,
  Layout,
  MousePointer,
  BookOpen,
  Video,
  Star,
  DollarSign,
  CheckSquare,
  Code,
  AlignLeft,
  Eye,
  EyeOff,
  Copy,
  Clipboard,
  ClipboardPaste,
} from "lucide-react";
import { nanoid } from "nanoid";

// ─── Block Types ─────────────────────────────────────────────────────────────

export type BlockType =
  | "banner"
  | "text_media"
  | "image"
  | "cta"
  | "course_outline"
  | "video"
  | "testimonials"
  | "pricing"
  | "checklist"
  | "html"
  | "spacer"
  | "divider"
  | "bg_section"
  | "button"
  | "icon_list"
  | "numbered_steps"
  | "feature_grid";

export interface Block {
  id: string;
  type: BlockType;
  visible: boolean;
  data: Record<string, any>;
}

// ─── Block Defaults ───────────────────────────────────────────────────────────

const BLOCK_DEFAULTS: Record<BlockType, Record<string, any>> = {
  banner: {
    headline: "Welcome to Our Course",
    subtext: "Start learning today and transform your skills.",
    ctaText: "Enroll Now",
    ctaUrl: "#",
    ctaSecondaryText: "",
    ctaSecondaryUrl: "",
    backgroundType: "color",
    backgroundColor: "#1e293b",
    backgroundImageUrl: "",
    textColor: "#ffffff",
    height: "large",
    alignment: "center",
    overlay: true,
    overlayOpacity: 0.5,
  },
  text_media: {
    headline: "Why Choose This Course?",
    body: "Our curriculum is designed by industry experts to give you the most relevant and up-to-date knowledge.",
    imageUrl: "",
    imagePosition: "right",
    imageAlt: "",
    ctaText: "",
    ctaUrl: "",
    backgroundColor: "#ffffff",
    textColor: "#1e293b",
  },
  image: {
    imageUrl: "",
    imageAlt: "",
    caption: "",
    width: "full",
    alignment: "center",
    linkUrl: "",
    backgroundColor: "#ffffff",
  },
  cta: {
    headline: "Ready to Get Started?",
    subtext: "Join thousands of students already learning.",
    ctaText: "Start Learning",
    ctaUrl: "#",
    ctaStyle: "primary",
    backgroundColor: "#0f172a",
    textColor: "#ffffff",
    alignment: "center",
  },
  course_outline: {
    headline: "What You'll Learn",
    courseId: null,
    showLessonCount: true,
    showDuration: true,
    backgroundColor: "#f8fafc",
    textColor: "#1e293b",
  },
  video: {
    headline: "",
    videoUrl: "",
    videoType: "youtube",
    autoplay: false,
    showControls: true,
    backgroundColor: "#000000",
    maxWidth: "800",
  },
  testimonials: {
    headline: "What Our Students Say",
    testimonials: [
      { id: nanoid(4), quote: "This course changed my career!", author: "Jane D.", role: "Software Engineer", avatarUrl: "" },
      { id: nanoid(4), quote: "Incredibly well structured and practical.", author: "Mark T.", role: "Product Manager", avatarUrl: "" },
    ],
    backgroundColor: "#f8fafc",
    textColor: "#1e293b",
    layout: "grid",
  },
  pricing: {
    headline: "Choose Your Plan",
    courseId: null,
    backgroundColor: "#ffffff",
    textColor: "#1e293b",
    accentColor: "#6366f1",
  },
  checklist: {
    headline: "Course Includes",
    items: [
      { id: nanoid(4), text: "Lifetime access to all materials" },
      { id: nanoid(4), text: "Certificate of completion" },
      { id: nanoid(4), text: "Community support" },
    ],
    icon: "check",
    iconColor: "#22c55e",
    backgroundColor: "#ffffff",
    textColor: "#1e293b",
    columns: 2,
  },
  html: {
    html: "<p>Custom HTML content here</p>",
    backgroundColor: "#ffffff",
  },
  spacer: {
    height: 60,
    backgroundColor: "#ffffff",
  },
  divider: {
    style: "solid",
    color: "#e2e8f0",
    thickness: 1,
    margin: 40,
    backgroundColor: "#ffffff",
  },
  bg_section: {
    headline: "Our Mission",
    body: "We believe in empowering learners with the best education possible.",
    backgroundImageUrl: "",
    overlay: true,
    overlayOpacity: 0.6,
    textColor: "#ffffff",
    alignment: "center",
    paddingY: 80,
  },
  button: {
    text: "Get Started",
    url: "#",
    variant: "primary",
    size: "medium",
    alignment: "center",
    backgroundColor: "#ffffff",
  },
  icon_list: {
    headline: "Key Features",
    items: [
      { id: nanoid(4), icon: "check", text: "Easy to use interface" },
      { id: nanoid(4), icon: "star", text: "Expert instructors" },
      { id: nanoid(4), icon: "zap", text: "Fast and efficient" },
    ],
    iconColor: "#6366f1",
    backgroundColor: "#ffffff",
    textColor: "#1e293b",
    columns: 1,
  },
  numbered_steps: {
    headline: "How It Works",
    steps: [
      { id: nanoid(4), title: "Sign Up", description: "Create your free account in seconds" },
      { id: nanoid(4), title: "Choose a Course", description: "Browse our catalog and pick what interests you" },
      { id: nanoid(4), title: "Start Learning", description: "Access your course materials immediately" },
    ],
    numberColor: "#6366f1",
    backgroundColor: "#f8fafc",
    textColor: "#1e293b",
  },
  feature_grid: {
    headline: "Why Choose Us",
    features: [
      { id: nanoid(4), icon: "book", title: "Comprehensive Content", description: "Everything you need to succeed" },
      { id: nanoid(4), icon: "users", title: "Community Support", description: "Learn alongside thousands of students" },
      { id: nanoid(4), icon: "award", title: "Certification", description: "Earn recognized certificates" },
      { id: nanoid(4), icon: "clock", title: "Lifetime Access", description: "Learn at your own pace, forever" },
    ],
    iconColor: "#6366f1",
    backgroundColor: "#ffffff",
    textColor: "#1e293b",
    columns: 2,
  },
};

// ─── Block Library ────────────────────────────────────────────────────────────

const BLOCK_LIBRARY: { type: BlockType; label: string; icon: React.ComponentType<any>; description: string }[] = [
  { type: "banner", label: "Banner / Hero", icon: Layout, description: "Full-width hero with headline and CTA" },
  { type: "text_media", label: "Text & Media", icon: AlignLeft, description: "Text alongside an image" },
  { type: "image", label: "Image Block", icon: Image, description: "Single image or gallery" },
  { type: "cta", label: "Call to Action", icon: MousePointer, description: "Centered headline with button" },
  { type: "course_outline", label: "Course Outline", icon: BookOpen, description: "Display course curriculum" },
  { type: "video", label: "Video", icon: Video, description: "Embed YouTube, Vimeo, or upload" },
  { type: "testimonials", label: "Testimonials", icon: Star, description: "Student quote cards" },
  { type: "pricing", label: "Pricing", icon: DollarSign, description: "Course pricing options" },
  { type: "checklist", label: "Checklist", icon: CheckSquare, description: "Feature list with icons" },
  { type: "html", label: "HTML Block", icon: Code, description: "Raw HTML / custom code" },
  { type: "spacer", label: "Spacer", icon: Type, description: "Vertical whitespace" },
  { type: "divider", label: "Divider", icon: Type, description: "Horizontal rule" },
  { type: "bg_section", label: "Background Image Section", icon: Image, description: "Full-width section with background image and text overlay" },
  { type: "button", label: "Button", icon: MousePointer, description: "Standalone styled button with link" },
  { type: "icon_list", label: "Icon List", icon: AlignLeft, description: "Pre-formatted list with custom icons" },
  { type: "numbered_steps", label: "Numbered Steps", icon: Type, description: "Ordered steps with styled numbers" },
  { type: "feature_grid", label: "Feature Grid", icon: Layout, description: "Grid of feature cards with icons" },
];

// ─── Block Preview Renderers ──────────────────────────────────────────────────

function BannerPreview({ data }: { data: Record<string, any> }) {
  const bg = data.backgroundType === "image" && data.backgroundImageUrl
    ? { backgroundImage: `url(${data.backgroundImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: data.backgroundColor || "#1e293b" };
  const heights: Record<string, string> = { small: "160px", medium: "240px", large: "360px" };
  return (
    <div style={{ ...bg, minHeight: heights[data.height] || "240px", position: "relative", display: "flex", alignItems: "center", justifyContent: data.alignment === "left" ? "flex-start" : data.alignment === "right" ? "flex-end" : "center" }}>
      {data.overlay && data.backgroundType === "image" && (
        <div style={{ position: "absolute", inset: 0, backgroundColor: `rgba(0,0,0,${data.overlayOpacity || 0.5})` }} />
      )}
      <div style={{ position: "relative", zIndex: 1, textAlign: data.alignment || "center", padding: "40px 60px", maxWidth: "800px" }}>
        <h1 style={{ color: data.textColor || "#fff", fontSize: "2.5rem", fontWeight: 700, margin: "0 0 16px" }}>{data.headline}</h1>
        {data.subtext && <p style={{ color: data.textColor || "#fff", fontSize: "1.125rem", margin: "0 0 24px", opacity: 0.9 }}>{data.subtext}</p>}
        <div style={{ display: "flex", gap: "12px", justifyContent: data.alignment === "center" ? "center" : "flex-start", flexWrap: "wrap" }}>
          {data.ctaText && <a href={data.ctaUrl || "#"} style={{ backgroundColor: "#6366f1", color: "#fff", padding: "12px 28px", borderRadius: "8px", textDecoration: "none", fontWeight: 600, fontSize: "1rem" }}>{data.ctaText}</a>}
          {data.ctaSecondaryText && <a href={data.ctaSecondaryUrl || "#"} style={{ backgroundColor: "transparent", color: data.textColor || "#fff", padding: "12px 28px", borderRadius: "8px", textDecoration: "none", fontWeight: 600, fontSize: "1rem", border: `2px solid ${data.textColor || "#fff"}` }}>{data.ctaSecondaryText}</a>}
        </div>
      </div>
    </div>
  );
}

function TextMediaPreview({ data }: { data: Record<string, any> }) {
  const isRight = data.imagePosition === "right";
  return (
    <div style={{ backgroundColor: data.backgroundColor || "#fff", padding: "60px 40px" }}>
      <div style={{ display: "flex", gap: "48px", alignItems: "center", flexDirection: isRight ? "row" : "row-reverse", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ flex: 1 }}>
          {data.headline && <h2 style={{ color: data.textColor || "#1e293b", fontSize: "1.875rem", fontWeight: 700, marginBottom: "16px" }}>{data.headline}</h2>}
          {data.body && <p style={{ color: data.textColor || "#1e293b", lineHeight: 1.7, opacity: 0.85 }}>{data.body}</p>}
          {data.ctaText && <a href={data.ctaUrl || "#"} style={{ display: "inline-block", marginTop: "24px", backgroundColor: "#6366f1", color: "#fff", padding: "10px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: 600 }}>{data.ctaText}</a>}
        </div>
        <div style={{ flex: 1 }}>
          {data.imageUrl ? (
            <img src={data.imageUrl} alt={data.imageAlt || ""} style={{ width: "100%", borderRadius: "12px", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", aspectRatio: "16/9", backgroundColor: "#e2e8f0", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Image size={48} color="#94a3b8" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImagePreview({ data }: { data: Record<string, any> }) {
  const widths: Record<string, string> = { full: "100%", wide: "80%", medium: "60%", small: "40%" };
  return (
    <div style={{ backgroundColor: data.backgroundColor || "#fff", padding: "40px 20px", textAlign: data.alignment || "center" }}>
      <div style={{ display: "inline-block", width: widths[data.width] || "100%", maxWidth: "100%" }}>
        {data.imageUrl ? (
          <img src={data.imageUrl} alt={data.imageAlt || ""} style={{ width: "100%", borderRadius: "8px" }} />
        ) : (
          <div style={{ width: "100%", aspectRatio: "16/9", backgroundColor: "#e2e8f0", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Image size={48} color="#94a3b8" />
          </div>
        )}
        {data.caption && <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "8px" }}>{data.caption}</p>}
      </div>
    </div>
  );
}

function CTAPreview({ data }: { data: Record<string, any> }) {
  return (
    <div style={{ backgroundColor: data.backgroundColor || "#0f172a", padding: "80px 40px", textAlign: data.alignment || "center" }}>
      <h2 style={{ color: data.textColor || "#fff", fontSize: "2rem", fontWeight: 700, marginBottom: "12px" }}>{data.headline}</h2>
      {data.subtext && <p style={{ color: data.textColor || "#fff", opacity: 0.8, marginBottom: "32px", fontSize: "1.125rem" }}>{data.subtext}</p>}
      {data.ctaText && <a href={data.ctaUrl || "#"} style={{ backgroundColor: "#6366f1", color: "#fff", padding: "14px 36px", borderRadius: "8px", textDecoration: "none", fontWeight: 700, fontSize: "1.125rem" }}>{data.ctaText}</a>}
    </div>
  );
}

function VideoPreview({ data }: { data: Record<string, any> }) {
  const getEmbedUrl = (url: string, type: string) => {
    if (!url) return "";
    if (type === "youtube") {
      const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
      return match ? `https://www.youtube.com/embed/${match[1]}` : url;
    }
    if (type === "vimeo") {
      const match = url.match(/vimeo\.com\/(\d+)/);
      return match ? `https://player.vimeo.com/video/${match[1]}` : url;
    }
    return url;
  };
  const embedUrl = getEmbedUrl(data.videoUrl, data.videoType);
  return (
    <div style={{ backgroundColor: data.backgroundColor || "#000", padding: "40px 20px", textAlign: "center" }}>
      {data.headline && <h2 style={{ color: "#fff", marginBottom: "24px", fontSize: "1.5rem", fontWeight: 700 }}>{data.headline}</h2>}
      <div style={{ maxWidth: `${data.maxWidth || 800}px`, margin: "0 auto", aspectRatio: "16/9", backgroundColor: "#1e293b", borderRadius: "8px", overflow: "hidden" }}>
        {embedUrl ? (
          <iframe src={embedUrl} style={{ width: "100%", height: "100%", border: "none" }} allowFullScreen title="Video" />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Video size={64} color="#475569" />
          </div>
        )}
      </div>
    </div>
  );
}

function TestimonialsPreview({ data }: { data: Record<string, any> }) {
  return (
    <div style={{ backgroundColor: data.backgroundColor || "#f8fafc", padding: "60px 40px" }}>
      {data.headline && <h2 style={{ color: data.textColor || "#1e293b", fontSize: "1.875rem", fontWeight: 700, textAlign: "center", marginBottom: "40px" }}>{data.headline}</h2>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", maxWidth: "1100px", margin: "0 auto" }}>
        {(data.testimonials || []).map((t: any) => (
          <div key={t.id} style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <p style={{ color: "#475569", lineHeight: 1.7, marginBottom: "20px", fontStyle: "italic" }}>"{t.quote}"</p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {t.avatarUrl ? (
                <img src={t.avatarUrl} alt={t.author} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>{t.author?.[0] || "?"}</div>
              )}
              <div>
                <div style={{ fontWeight: 600, color: data.textColor || "#1e293b" }}>{t.author}</div>
                {t.role && <div style={{ fontSize: "0.875rem", color: "#64748b" }}>{t.role}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistPreview({ data }: { data: Record<string, any> }) {
  return (
    <div style={{ backgroundColor: data.backgroundColor || "#fff", padding: "60px 40px" }}>
      {data.headline && <h2 style={{ color: data.textColor || "#1e293b", fontSize: "1.875rem", fontWeight: 700, textAlign: "center", marginBottom: "32px" }}>{data.headline}</h2>}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${data.columns || 2}, 1fr)`, gap: "16px", maxWidth: "900px", margin: "0 auto" }}>
        {(data.items || []).map((item: any) => (
          <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: data.iconColor || "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <span style={{ color: data.textColor || "#1e293b", lineHeight: 1.5 }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HtmlPreview({ data }: { data: Record<string, any> }) {
  return (
    <div style={{ backgroundColor: data.backgroundColor || "#fff", padding: "20px" }}>
      <div dangerouslySetInnerHTML={{ __html: data.html || "" }} />
    </div>
  );
}

function SpacerPreview({ data }: { data: Record<string, any> }) {
  return <div style={{ height: `${data.height || 60}px`, backgroundColor: data.backgroundColor || "#fff" }} />;
}

function DividerPreview({ data }: { data: Record<string, any> }) {
  return (
    <div style={{ backgroundColor: data.backgroundColor || "#fff", padding: `${data.margin || 40}px 40px` }}>
      <hr style={{ border: "none", borderTop: `${data.thickness || 1}px ${data.style || "solid"} ${data.color || "#e2e8f0"}` }} />
    </div>
  );
}

function CourseOutlinePreview({ data }: { data: Record<string, any> }) {
  return (
    <div style={{ backgroundColor: data.backgroundColor || "#f8fafc", padding: "60px 40px" }}>
      {data.headline && <h2 style={{ color: data.textColor || "#1e293b", fontSize: "1.875rem", fontWeight: 700, textAlign: "center", marginBottom: "32px" }}>{data.headline}</h2>}
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {data.courseId ? (
          <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0", textAlign: "center", color: "#64748b" }}>
            Course curriculum will appear here (Course ID: {data.courseId})
          </div>
        ) : (
          <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "40px", border: "2px dashed #e2e8f0", textAlign: "center", color: "#94a3b8" }}>
            <BookOpen size={40} style={{ margin: "0 auto 12px" }} />
            <p>Select a course in the settings panel to display its curriculum</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PricingPreview({ data }: { data: Record<string, any> }) {
  return (
    <div style={{ backgroundColor: data.backgroundColor || "#fff", padding: "60px 40px" }}>
      {data.headline && <h2 style={{ color: data.textColor || "#1e293b", fontSize: "1.875rem", fontWeight: 700, textAlign: "center", marginBottom: "32px" }}>{data.headline}</h2>}
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {data.courseId ? (
          <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0", textAlign: "center", color: "#64748b" }}>
            Pricing options will appear here (Course ID: {data.courseId})
          </div>
        ) : (
          <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "40px", border: "2px dashed #e2e8f0", textAlign: "center", color: "#94a3b8" }}>
            <DollarSign size={40} style={{ margin: "0 auto 12px" }} />
            <p>Select a course in the settings panel to display its pricing</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── New Block Previews ───────────────────────────────────────────────────────

function BgSectionPreview({ data }: { data: Record<string, any> }) {
  const bg = data.backgroundImageUrl
    ? { backgroundImage: `url(${data.backgroundImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: "#334155" };
  return (
    <div style={{ ...bg, position: "relative", padding: `${data.paddingY || 80}px 60px`, textAlign: data.alignment || "center" }}>
      {data.overlay && data.backgroundImageUrl && (
        <div style={{ position: "absolute", inset: 0, backgroundColor: `rgba(0,0,0,${data.overlayOpacity || 0.6})` }} />
      )}
      <div style={{ position: "relative", zIndex: 1, maxWidth: "800px", margin: "0 auto" }}>
        {data.headline && <h2 style={{ color: data.textColor || "#fff", fontSize: "2rem", fontWeight: 700, marginBottom: "16px" }}>{data.headline}</h2>}
        {data.body && <p style={{ color: data.textColor || "#fff", fontSize: "1.125rem", lineHeight: 1.7, opacity: 0.9 }}>{data.body}</p>}
      </div>
    </div>
  );
}

function ButtonPreview({ data }: { data: Record<string, any> }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: "#6366f1", color: "#fff", border: "none" },
    secondary: { backgroundColor: "#e2e8f0", color: "#1e293b", border: "none" },
    outline: { backgroundColor: "transparent", color: "#6366f1", border: "2px solid #6366f1" },
    ghost: { backgroundColor: "transparent", color: "#6366f1", border: "none" },
  };
  const sizes: Record<string, React.CSSProperties> = {
    small: { padding: "8px 20px", fontSize: "0.875rem" },
    medium: { padding: "12px 28px", fontSize: "1rem" },
    large: { padding: "16px 40px", fontSize: "1.125rem" },
  };
  const align = data.alignment === "left" ? "flex-start" : data.alignment === "right" ? "flex-end" : "center";
  return (
    <div style={{ backgroundColor: data.backgroundColor || "#fff", padding: "40px", display: "flex", justifyContent: align }}>
      <a href={data.url || "#"} style={{ ...styles[data.variant || "primary"], ...sizes[data.size || "medium"], borderRadius: "8px", textDecoration: "none", fontWeight: 600, display: "inline-block", cursor: "pointer" }}>
        {data.text || "Button"}
      </a>
    </div>
  );
}

const ICON_SVG: Record<string, string> = {
  check: "M20 6 9 17 4 12",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
  award: "M12 15l-2 5 2-1 2 1-2-5",
  clock: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z",
  arrow: "M5 12h14M12 5l7 7-7 7",
};

function IconListPreview({ data }: { data: Record<string, any> }) {
  return (
    <div style={{ backgroundColor: data.backgroundColor || "#fff", padding: "60px 40px" }}>
      {data.headline && <h2 style={{ color: data.textColor || "#1e293b", fontSize: "1.875rem", fontWeight: 700, textAlign: "center", marginBottom: "32px" }}>{data.headline}</h2>}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${data.columns || 1}, 1fr)`, gap: "20px", maxWidth: "900px", margin: "0 auto" }}>
        {(data.items || []).map((item: any) => (
          <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: data.iconColor || "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points={ICON_SVG[item.icon || "check"] || ICON_SVG.check} />
              </svg>
            </div>
            <span style={{ color: data.textColor || "#1e293b", lineHeight: 1.6, paddingTop: "6px" }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NumberedStepsPreview({ data }: { data: Record<string, any> }) {
  return (
    <div style={{ backgroundColor: data.backgroundColor || "#f8fafc", padding: "60px 40px" }}>
      {data.headline && <h2 style={{ color: data.textColor || "#1e293b", fontSize: "1.875rem", fontWeight: 700, textAlign: "center", marginBottom: "40px" }}>{data.headline}</h2>}
      <div style={{ maxWidth: "700px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "32px" }}>
        {(data.steps || []).map((step: any, i: number) => (
          <div key={step.id} style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: data.numberColor || "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.25rem", flexShrink: 0 }}>{i + 1}</div>
            <div>
              <h3 style={{ color: data.textColor || "#1e293b", fontWeight: 700, fontSize: "1.125rem", marginBottom: "6px" }}>{step.title}</h3>
              <p style={{ color: data.textColor || "#1e293b", opacity: 0.75, lineHeight: 1.6 }}>{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureGridPreview({ data }: { data: Record<string, any> }) {
  return (
    <div style={{ backgroundColor: data.backgroundColor || "#fff", padding: "60px 40px" }}>
      {data.headline && <h2 style={{ color: data.textColor || "#1e293b", fontSize: "1.875rem", fontWeight: 700, textAlign: "center", marginBottom: "40px" }}>{data.headline}</h2>}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${data.columns || 2}, 1fr)`, gap: "24px", maxWidth: "1000px", margin: "0 auto" }}>
        {(data.features || []).map((f: any) => (
          <div key={f.id} style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "28px", border: "1px solid #e2e8f0" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "10px", backgroundColor: data.iconColor || "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points={ICON_SVG[f.icon || "star"] || ICON_SVG.star} />
              </svg>
            </div>
            <h3 style={{ color: data.textColor || "#1e293b", fontWeight: 700, fontSize: "1.0625rem", marginBottom: "8px" }}>{f.title}</h3>
            <p style={{ color: data.textColor || "#1e293b", opacity: 0.75, lineHeight: 1.6, fontSize: "0.9375rem" }}>{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function renderBlockPreview(block: Block) {
  switch (block.type) {
    case "banner": return <BannerPreview data={block.data} />;
    case "text_media": return <TextMediaPreview data={block.data} />;
    case "image": return <ImagePreview data={block.data} />;
    case "cta": return <CTAPreview data={block.data} />;
    case "course_outline": return <CourseOutlinePreview data={block.data} />;
    case "video": return <VideoPreview data={block.data} />;
    case "testimonials": return <TestimonialsPreview data={block.data} />;
    case "pricing": return <PricingPreview data={block.data} />;
    case "checklist": return <ChecklistPreview data={block.data} />;
    case "html": return <HtmlPreview data={block.data} />;
    case "spacer": return <SpacerPreview data={block.data} />;
    case "divider": return <DividerPreview data={block.data} />;
    case "bg_section": return <BgSectionPreview data={block.data} />;
    case "button": return <ButtonPreview data={block.data} />;
    case "icon_list": return <IconListPreview data={block.data} />;
    case "numbered_steps": return <NumberedStepsPreview data={block.data} />;
    case "feature_grid": return <FeatureGridPreview data={block.data} />;
    default: return null;
  }
}

// ─── Block Settings Panel ─────────────────────────────────────────────────────

function BlockSettings({ block, onChange, courses }: {
  block: Block;
  onChange: (data: Record<string, any>) => void;
  courses: { id: number; title: string }[];
}) {
  const d = block.data;
  const set = (key: string, val: any) => onChange({ ...d, [key]: val });

  const ColorField = ({ label, field }: { label: string; field: string }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2 items-center">
        <input type="color" value={d[field] || "#ffffff"} onChange={e => set(field, e.target.value)} className="w-8 h-8 rounded cursor-pointer border" />
        <Input value={d[field] || ""} onChange={e => set(field, e.target.value)} className="h-8 text-xs font-mono" placeholder="#ffffff" />
      </div>
    </div>
  );

  const TextField = ({ label, field, multiline = false, placeholder = "" }: { label: string; field: string; multiline?: boolean; placeholder?: string }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {multiline
        ? <Textarea value={d[field] || ""} onChange={e => set(field, e.target.value)} className="text-xs min-h-[80px]" placeholder={placeholder} />
        : <Input value={d[field] || ""} onChange={e => set(field, e.target.value)} className="h-8 text-xs" placeholder={placeholder} />
      }
    </div>
  );

  const SelectField = ({ label, field, options }: { label: string; field: string; options: { value: string; label: string }[] }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <select value={d[field] || ""} onChange={e => set(field, e.target.value)} className="w-full h-8 text-xs border rounded px-2 bg-background">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const NumberField = ({ label, field, min = 0, max = 9999 }: { label: string; field: string; min?: number; max?: number }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input type="number" value={d[field] ?? 0} onChange={e => set(field, Number(e.target.value))} className="h-8 text-xs" min={min} max={max} />
    </div>
  );

  const CourseSelect = ({ field }: { field: string }) => (
    <div className="space-y-1">
      <Label className="text-xs">Course</Label>
      <select value={d[field] ?? ""} onChange={e => set(field, e.target.value ? Number(e.target.value) : null)} className="w-full h-8 text-xs border rounded px-2 bg-background">
        <option value="">— Select a course —</option>
        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
      </select>
    </div>
  );

  switch (block.type) {
    case "banner":
      return (
        <div className="space-y-3">
          <TextField label="Headline" field="headline" />
          <TextField label="Subtext" field="subtext" multiline />
          <TextField label="Primary CTA Text" field="ctaText" />
          <TextField label="Primary CTA URL" field="ctaUrl" />
          <TextField label="Secondary CTA Text" field="ctaSecondaryText" />
          <TextField label="Secondary CTA URL" field="ctaSecondaryUrl" />
          <Separator />
          <SelectField label="Background Type" field="backgroundType" options={[{ value: "color", label: "Color" }, { value: "image", label: "Image" }]} />
          {d.backgroundType === "image" ? (
            <TextField label="Background Image URL" field="backgroundImageUrl" placeholder="https://..." />
          ) : (
            <ColorField label="Background Color" field="backgroundColor" />
          )}
          {d.backgroundType === "image" && (
            <div className="space-y-1">
              <Label className="text-xs">Overlay Opacity</Label>
              <input type="range" min={0} max={1} step={0.05} value={d.overlayOpacity ?? 0.5} onChange={e => set("overlayOpacity", Number(e.target.value))} className="w-full" />
              <span className="text-xs text-muted-foreground">{Math.round((d.overlayOpacity ?? 0.5) * 100)}%</span>
            </div>
          )}
          <ColorField label="Text Color" field="textColor" />
          <SelectField label="Height" field="height" options={[{ value: "small", label: "Small" }, { value: "medium", label: "Medium" }, { value: "large", label: "Large" }]} />
          <SelectField label="Alignment" field="alignment" options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} />
        </div>
      );
    case "text_media":
      return (
        <div className="space-y-3">
          <TextField label="Headline" field="headline" />
          <TextField label="Body Text" field="body" multiline />
          <TextField label="Image URL" field="imageUrl" placeholder="https://..." />
          <TextField label="Image Alt Text" field="imageAlt" />
          <SelectField label="Image Position" field="imagePosition" options={[{ value: "right", label: "Right" }, { value: "left", label: "Left" }]} />
          <TextField label="CTA Button Text" field="ctaText" />
          <TextField label="CTA Button URL" field="ctaUrl" />
          <Separator />
          <ColorField label="Background Color" field="backgroundColor" />
          <ColorField label="Text Color" field="textColor" />
        </div>
      );
    case "image":
      return (
        <div className="space-y-3">
          <TextField label="Image URL" field="imageUrl" placeholder="https://..." />
          <TextField label="Alt Text" field="imageAlt" />
          <TextField label="Caption" field="caption" />
          <TextField label="Link URL" field="linkUrl" placeholder="https://..." />
          <SelectField label="Width" field="width" options={[{ value: "full", label: "Full" }, { value: "wide", label: "Wide (80%)" }, { value: "medium", label: "Medium (60%)" }, { value: "small", label: "Small (40%)" }]} />
          <SelectField label="Alignment" field="alignment" options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} />
          <ColorField label="Background Color" field="backgroundColor" />
        </div>
      );
    case "cta":
      return (
        <div className="space-y-3">
          <TextField label="Headline" field="headline" />
          <TextField label="Subtext" field="subtext" />
          <TextField label="Button Text" field="ctaText" />
          <TextField label="Button URL" field="ctaUrl" />
          <SelectField label="Alignment" field="alignment" options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} />
          <Separator />
          <ColorField label="Background Color" field="backgroundColor" />
          <ColorField label="Text Color" field="textColor" />
        </div>
      );
    case "course_outline":
      return (
        <div className="space-y-3">
          <TextField label="Headline" field="headline" />
          <CourseSelect field="courseId" />
          <div className="flex items-center justify-between">
            <Label className="text-xs">Show Lesson Count</Label>
            <Switch checked={d.showLessonCount} onCheckedChange={v => set("showLessonCount", v)} />
          </div>
          <Separator />
          <ColorField label="Background Color" field="backgroundColor" />
          <ColorField label="Text Color" field="textColor" />
        </div>
      );
    case "video":
      return (
        <div className="space-y-3">
          <TextField label="Headline" field="headline" />
          <SelectField label="Video Type" field="videoType" options={[{ value: "youtube", label: "YouTube" }, { value: "vimeo", label: "Vimeo" }, { value: "direct", label: "Direct URL" }]} />
          <TextField label="Video URL" field="videoUrl" placeholder="https://youtube.com/watch?v=..." />
          <NumberField label="Max Width (px)" field="maxWidth" min={200} max={1400} />
          <ColorField label="Background Color" field="backgroundColor" />
        </div>
      );
    case "testimonials":
      return (
        <div className="space-y-3">
          <TextField label="Headline" field="headline" />
          <Separator />
          <Label className="text-xs font-semibold">Testimonials</Label>
          {(d.testimonials || []).map((t: any, i: number) => (
            <div key={t.id} className="border rounded p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Testimonial {i + 1}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => set("testimonials", d.testimonials.filter((_: any, j: number) => j !== i))}>
                  <Trash2 size={12} />
                </Button>
              </div>
              <Textarea value={t.quote} onChange={e => set("testimonials", d.testimonials.map((x: any, j: number) => j === i ? { ...x, quote: e.target.value } : x))} className="text-xs min-h-[60px]" placeholder="Quote..." />
              <Input value={t.author} onChange={e => set("testimonials", d.testimonials.map((x: any, j: number) => j === i ? { ...x, author: e.target.value } : x))} className="h-7 text-xs" placeholder="Author name" />
              <Input value={t.role} onChange={e => set("testimonials", d.testimonials.map((x: any, j: number) => j === i ? { ...x, role: e.target.value } : x))} className="h-7 text-xs" placeholder="Role / Title" />
              <Input value={t.avatarUrl} onChange={e => set("testimonials", d.testimonials.map((x: any, j: number) => j === i ? { ...x, avatarUrl: e.target.value } : x))} className="h-7 text-xs" placeholder="Avatar URL (optional)" />
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full" onClick={() => set("testimonials", [...(d.testimonials || []), { id: nanoid(4), quote: "", author: "", role: "", avatarUrl: "" }])}>
            <Plus size={14} className="mr-1" /> Add Testimonial
          </Button>
          <Separator />
          <ColorField label="Background Color" field="backgroundColor" />
          <ColorField label="Text Color" field="textColor" />
        </div>
      );
    case "pricing":
      return (
        <div className="space-y-3">
          <TextField label="Headline" field="headline" />
          <CourseSelect field="courseId" />
          <Separator />
          <ColorField label="Background Color" field="backgroundColor" />
          <ColorField label="Text Color" field="textColor" />
          <ColorField label="Accent Color" field="accentColor" />
        </div>
      );
    case "checklist":
      return (
        <div className="space-y-3">
          <TextField label="Headline" field="headline" />
          <NumberField label="Columns" field="columns" min={1} max={4} />
          <ColorField label="Check Icon Color" field="iconColor" />
          <Separator />
          <Label className="text-xs font-semibold">Items</Label>
          {(d.items || []).map((item: any, i: number) => (
            <div key={item.id} className="flex gap-2 items-center">
              <Input value={item.text} onChange={e => set("items", d.items.map((x: any, j: number) => j === i ? { ...x, text: e.target.value } : x))} className="h-7 text-xs flex-1" />
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => set("items", d.items.filter((_: any, j: number) => j !== i))}>
                <Trash2 size={12} />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full" onClick={() => set("items", [...(d.items || []), { id: nanoid(4), text: "New item" }])}>
            <Plus size={14} className="mr-1" /> Add Item
          </Button>
          <Separator />
          <ColorField label="Background Color" field="backgroundColor" />
          <ColorField label="Text Color" field="textColor" />
        </div>
      );
    case "html":
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">HTML / CSS / JavaScript</Label>
            <Textarea value={d.html || ""} onChange={e => set("html", e.target.value)} className="text-xs min-h-[200px] font-mono" placeholder="<div>Your HTML here</div>" />
          </div>
          <ColorField label="Background Color" field="backgroundColor" />
        </div>
      );
    case "spacer":
      return (
        <div className="space-y-3">
          <NumberField label="Height (px)" field="height" min={10} max={400} />
          <ColorField label="Background Color" field="backgroundColor" />
        </div>
      );
    case "divider":
      return (
        <div className="space-y-3">
          <SelectField label="Style" field="style" options={[{ value: "solid", label: "Solid" }, { value: "dashed", label: "Dashed" }, { value: "dotted", label: "Dotted" }]} />
          <ColorField label="Line Color" field="color" />
          <NumberField label="Thickness (px)" field="thickness" min={1} max={10} />
          <NumberField label="Margin (px)" field="margin" min={0} max={200} />
          <ColorField label="Background Color" field="backgroundColor" />
        </div>
      );
    case "bg_section":
      return (
        <div className="space-y-3">
          <TextField label="Headline" field="headline" />
          <TextField label="Body Text" field="body" multiline />
          <TextField label="Background Image URL" field="backgroundImageUrl" placeholder="https://..." />
          <div className="flex items-center gap-2">
            <Switch checked={!!d.overlay} onCheckedChange={v => set("overlay", v)} />
            <Label className="text-xs">Dark overlay on image</Label>
          </div>
          {d.overlay && <NumberField label="Overlay Opacity (0-1)" field="overlayOpacity" min={0} max={1} />}
          <SelectField label="Text Alignment" field="alignment" options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} />
          <NumberField label="Vertical Padding (px)" field="paddingY" min={20} max={300} />
          <ColorField label="Text Color" field="textColor" />
        </div>
      );
    case "button":
      return (
        <div className="space-y-3">
          <TextField label="Button Text" field="text" />
          <TextField label="URL" field="url" placeholder="https://..." />
          <SelectField label="Style" field="variant" options={[
            { value: "primary", label: "Primary (filled)" },
            { value: "secondary", label: "Secondary" },
            { value: "outline", label: "Outline" },
            { value: "ghost", label: "Ghost" },
          ]} />
          <SelectField label="Size" field="size" options={[
            { value: "small", label: "Small" },
            { value: "medium", label: "Medium" },
            { value: "large", label: "Large" },
          ]} />
          <SelectField label="Alignment" field="alignment" options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]} />
          <ColorField label="Section Background" field="backgroundColor" />
        </div>
      );
    case "icon_list":
      return (
        <div className="space-y-3">
          <TextField label="Headline" field="headline" />
          <SelectField label="Columns" field="columns" options={[
            { value: "1", label: "1 column" },
            { value: "2", label: "2 columns" },
            { value: "3", label: "3 columns" },
          ]} />
          <ColorField label="Icon Color" field="iconColor" />
          <Separator />
          <Label className="text-xs font-semibold">List Items</Label>
          {(d.items || []).map((item: any, i: number) => (
            <div key={item.id} className="flex gap-2 items-start">
              <select value={item.icon || "check"} onChange={e => { const items = [...d.items]; items[i] = { ...item, icon: e.target.value }; set("items", items); }} className="h-8 text-xs border rounded px-1 bg-background w-24">
                {["check", "star", "zap", "book", "users", "award", "clock", "arrow"].map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
              <Input value={item.text} onChange={e => { const items = [...d.items]; items[i] = { ...item, text: e.target.value }; set("items", items); }} className="h-8 text-xs flex-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => set("items", d.items.filter((_: any, j: number) => j !== i))}><Trash2 size={12} /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full" onClick={() => set("items", [...(d.items || []), { id: nanoid(4), icon: "check", text: "New item" }])}>
            <Plus size={14} className="mr-1" /> Add Item
          </Button>
          <Separator />
          <ColorField label="Background Color" field="backgroundColor" />
          <ColorField label="Text Color" field="textColor" />
        </div>
      );
    case "numbered_steps":
      return (
        <div className="space-y-3">
          <TextField label="Headline" field="headline" />
          <ColorField label="Number Color" field="numberColor" />
          <Separator />
          <Label className="text-xs font-semibold">Steps</Label>
          {(d.steps || []).map((step: any, i: number) => (
            <div key={step.id} className="space-y-1 border rounded p-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                <Input value={step.title} onChange={e => { const steps = [...d.steps]; steps[i] = { ...step, title: e.target.value }; set("steps", steps); }} className="h-7 text-xs flex-1" placeholder="Step title" />
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => set("steps", d.steps.filter((_: any, j: number) => j !== i))}><Trash2 size={12} /></Button>
              </div>
              <Textarea value={step.description} onChange={e => { const steps = [...d.steps]; steps[i] = { ...step, description: e.target.value }; set("steps", steps); }} className="text-xs min-h-[56px]" placeholder="Step description" />
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full" onClick={() => set("steps", [...(d.steps || []), { id: nanoid(4), title: "New Step", description: "" }])}>
            <Plus size={14} className="mr-1" /> Add Step
          </Button>
          <Separator />
          <ColorField label="Background Color" field="backgroundColor" />
          <ColorField label="Text Color" field="textColor" />
        </div>
      );
    case "feature_grid":
      return (
        <div className="space-y-3">
          <TextField label="Headline" field="headline" />
          <SelectField label="Columns" field="columns" options={[
            { value: "2", label: "2 columns" },
            { value: "3", label: "3 columns" },
            { value: "4", label: "4 columns" },
          ]} />
          <ColorField label="Icon Color" field="iconColor" />
          <Separator />
          <Label className="text-xs font-semibold">Features</Label>
          {(d.features || []).map((f: any, i: number) => (
            <div key={f.id} className="space-y-1 border rounded p-2">
              <div className="flex items-center gap-1">
                <select value={f.icon || "star"} onChange={e => { const features = [...d.features]; features[i] = { ...f, icon: e.target.value }; set("features", features); }} className="h-7 text-xs border rounded px-1 bg-background w-20">
                  {["check", "star", "zap", "book", "users", "award", "clock", "arrow"].map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
                <Input value={f.title} onChange={e => { const features = [...d.features]; features[i] = { ...f, title: e.target.value }; set("features", features); }} className="h-7 text-xs flex-1" placeholder="Feature title" />
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => set("features", d.features.filter((_: any, j: number) => j !== i))}><Trash2 size={12} /></Button>
              </div>
              <Input value={f.description} onChange={e => { const features = [...d.features]; features[i] = { ...f, description: e.target.value }; set("features", features); }} className="h-7 text-xs" placeholder="Short description" />
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full" onClick={() => set("features", [...(d.features || []), { id: nanoid(4), icon: "star", title: "New Feature", description: "" }])}>
            <Plus size={14} className="mr-1" /> Add Feature
          </Button>
          <Separator />
          <ColorField label="Background Color" field="backgroundColor" />
          <ColorField label="Text Color" field="textColor" />
        </div>
      );
    default:
      return <p className="text-xs text-muted-foreground">No settings available.</p>;
  }
}

// ─── Sortable Block Row ───────────────────────────────────────────────────────

function SortableBlock({ block, isSelected, onSelect, onDelete, onDuplicate, onCopyToClipboard, onToggleVisible, onChange, courses }: {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onCopyToClipboard: () => void;
  onToggleVisible: () => void;
  onChange: (data: Record<string, any>) => void;
  courses: { id: number; title: string }[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const libEntry = BLOCK_LIBRARY.find(b => b.type === block.type);

  return (
    <div ref={setNodeRef} style={style} className={`border-2 rounded-lg overflow-hidden transition-all ${isSelected ? "border-primary shadow-md" : "border-transparent hover:border-muted-foreground/30"} ${!block.visible ? "opacity-50" : ""}`}>
      {/* Block toolbar */}
      <div
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer select-none ${isSelected ? "bg-primary/10" : "bg-muted/50 hover:bg-muted"}`}
        onClick={onSelect}
      >
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
          <GripVertical size={16} />
        </div>
        {libEntry && <libEntry.icon size={14} className="text-muted-foreground" />}
        <span className="text-sm font-medium flex-1">{libEntry?.label || block.type}</span>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggleVisible} title={block.visible ? "Hide" : "Show"}>
            {block.visible ? <Eye size={12} /> : <EyeOff size={12} />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDuplicate} title="Duplicate within page">
            <Copy size={12} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCopyToClipboard} title="Copy to clipboard (paste on any page)">
            <Clipboard size={12} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onDelete} title="Delete">
            <Trash2 size={12} />
          </Button>
        </div>
      </div>

      {/* Block preview */}
      {block.visible && (
        <div className="pointer-events-none overflow-hidden" style={{ maxHeight: "300px" }}>
          <div style={{ transform: "scale(0.7)", transformOrigin: "top left", width: "143%", pointerEvents: "none" }}>
            {renderBlockPreview(block)}
          </div>
        </div>
      )}

      {/* Settings panel */}
      {isSelected && (
        <div className="border-t bg-background p-4">
          <BlockSettings block={block} onChange={onChange} courses={courses} />
        </div>
      )}
    </div>
  );
}

// ─── Main PageBuilder Component ───────────────────────────────────────────────

export interface PageBuilderProps {
  initialBlocks?: Block[];
  onChange: (blocks: Block[]) => void;
  courses?: { id: number; title: string }[];
}

export function PageBuilder({ initialBlocks = [], onChange, courses = [] }: PageBuilderProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateBlocks = useCallback((newBlocks: Block[]) => {
    setBlocks(newBlocks);
    onChange(newBlocks);
  }, [onChange]);

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: nanoid(8),
      type,
      visible: true,
      data: { ...BLOCK_DEFAULTS[type] },
    };
    const newBlocks = [...blocks, newBlock];
    updateBlocks(newBlocks);
    setSelectedId(newBlock.id);
  };

  const deleteBlock = (id: string) => {
    updateBlocks(blocks.filter(b => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateBlock = (id: string) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx === -1) return;
    const original = blocks[idx];
    const copy: Block = { ...original, id: nanoid(8), data: { ...original.data } };
    const newBlocks = [...blocks.slice(0, idx + 1), copy, ...blocks.slice(idx + 1)];
    updateBlocks(newBlocks);
    setSelectedId(copy.id);
  };

  // ── Cross-page block clipboard via localStorage ─────────────────────────────────────────────
  const CLIPBOARD_KEY = "teachific_block_clipboard";
  const [clipboardLabel, setClipboardLabel] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem(CLIPBOARD_KEY);
      if (!raw) return null;
      const b: Block = JSON.parse(raw);
      return BLOCK_LIBRARY.find(x => x.type === b.type)?.label ?? b.type;
    } catch { return null; }
  });

  const copyBlockToClipboard = (id: string) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    try {
      localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(block));
      const label = BLOCK_LIBRARY.find(x => x.type === block.type)?.label ?? block.type;
      setClipboardLabel(label);
    } catch {}
  };

  const pasteBlockFromClipboard = () => {
    try {
      const raw = localStorage.getItem(CLIPBOARD_KEY);
      if (!raw) return;
      const block: Block = JSON.parse(raw);
      const pasted: Block = { ...block, id: nanoid(8), data: { ...block.data } };
      const newBlocks = selectedId
        ? (() => {
            const idx = blocks.findIndex(b => b.id === selectedId);
            if (idx === -1) return [...blocks, pasted];
            return [...blocks.slice(0, idx + 1), pasted, ...blocks.slice(idx + 1)];
          })()
        : [...blocks, pasted];
      updateBlocks(newBlocks);
      setSelectedId(pasted.id);
    } catch {}
  };

  const toggleVisible = (id: string) => {
    updateBlocks(blocks.map(b => b.id === id ? { ...b, visible: !b.visible } : b));
  };

  const updateBlockData = (id: string, data: Record<string, any>) => {
    updateBlocks(blocks.map(b => b.id === id ? { ...b, data } : b));
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIdx = blocks.findIndex(b => b.id === active.id);
    const newIdx = blocks.findIndex(b => b.id === over.id);
    updateBlocks(arrayMove(blocks, oldIdx, newIdx));
  };

  const activeBlock = blocks.find(b => b.id === activeId);

  return (
    <div className="flex h-full gap-0">
      {/* Left: Block Library */}
      <div className={`border-r bg-muted/30 flex flex-col transition-all ${showLibrary ? "w-56" : "w-10"}`}>
        <div className="flex items-center justify-between p-3 border-b">
          {showLibrary && <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blocks</span>}
          <div className="flex items-center gap-1 ml-auto">
            {showLibrary && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={pasteBlockFromClipboard}
                title={clipboardLabel ? `Paste "${clipboardLabel}" from clipboard` : "No block in clipboard"}
                disabled={!clipboardLabel}
              >
                <ClipboardPaste size={14} />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowLibrary(v => !v)}>
              {showLibrary ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </Button>
          </div>
        </div>
        {showLibrary && (
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {BLOCK_LIBRARY.map(item => (
                <button
                  key={item.type}
                  onClick={() => addBlock(item.type)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left hover:bg-accent hover:text-accent-foreground transition-colors group"
                >
                  <item.icon size={14} className="text-muted-foreground group-hover:text-accent-foreground shrink-0" />
                  <div>
                    <div className="text-xs font-medium leading-tight">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">{item.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Center: Canvas */}
      <div className="flex-1 overflow-auto bg-slate-100">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="p-4 space-y-3 min-h-full">
              {blocks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-muted-foreground/30 rounded-xl text-muted-foreground">
                  <Plus size={32} className="mb-3 opacity-50" />
                  <p className="text-sm font-medium">Add your first block</p>
                  <p className="text-xs mt-1">Click any block type in the left panel</p>
                </div>
              )}
              {blocks.map(block => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  isSelected={selectedId === block.id}
                  onSelect={() => setSelectedId(selectedId === block.id ? null : block.id)}
                  onDelete={() => deleteBlock(block.id)}
                  onDuplicate={() => duplicateBlock(block.id)}
                  onCopyToClipboard={() => copyBlockToClipboard(block.id)}
                  onToggleVisible={() => toggleVisible(block.id)}
                  onChange={data => updateBlockData(block.id, data)}
                  courses={courses}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeBlock && (
              <div className="border-2 border-primary rounded-lg bg-background shadow-2xl opacity-90 overflow-hidden" style={{ width: "400px" }}>
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10">
                  <GripVertical size={16} />
                  <span className="text-sm font-medium">{BLOCK_LIBRARY.find(b => b.type === activeBlock.type)?.label}</span>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

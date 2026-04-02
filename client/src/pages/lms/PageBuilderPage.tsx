import { useState, useCallback, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Monitor,
  Smartphone,
  Maximize2,
  Save,
  X,
  GripVertical,
  Plus,
  Trash2,
  ChevronLeft,
  Image,
  Type,
  Video,
  Star,
  DollarSign,
  List,
  MessageSquare,
  ArrowRight,
  LayoutTemplate,
  Eye,
  Settings,
  AlignLeft,
  Columns,
} from "lucide-react";

// ─── Block Types ─────────────────────────────────────────────────────────────

type BlockType =
  | "banner"
  | "text"
  | "image"
  | "video"
  | "curriculum"
  | "pricing"
  | "testimonials"
  | "cta"
  | "instructor"
  | "checklist"
  | "columns"
  | "spacer";

interface Block {
  id: string;
  type: BlockType;
  data: Record<string, any>;
}

const BLOCK_CATALOG: {
  type: BlockType;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  defaultData: Record<string, any>;
}[] = [
  {
    type: "banner",
    label: "Banner",
    icon: LayoutTemplate,
    description: "Full-width hero with headline and CTA",
    defaultData: {
      headline: "Your Course Title",
      subheadline: "A compelling description of what students will learn",
      ctaText: "Enroll Now",
      ctaUrl: "#pricing",
      bgColor: "#189aa1",
      textColor: "#ffffff",
      imageUrl: "",
    },
  },
  {
    type: "text",
    label: "Text & Media",
    icon: Type,
    description: "Rich text block with optional image",
    defaultData: {
      heading: "What You'll Learn",
      body: "Describe the key outcomes and benefits of your course.",
      imageUrl: "",
      imagePosition: "right",
    },
  },
  {
    type: "image",
    label: "Images Block",
    icon: Image,
    description: "Single or grid of images",
    defaultData: { images: [], columns: 3 },
  },
  {
    type: "video",
    label: "Video",
    icon: Video,
    description: "Embed a YouTube, Vimeo, or direct video",
    defaultData: { url: "", caption: "" },
  },
  {
    type: "curriculum",
    label: "Curriculum",
    icon: List,
    description: "Auto-pulled course curriculum outline",
    defaultData: { showPreview: true, heading: "Course Curriculum" },
  },
  {
    type: "pricing",
    label: "Pricing Options",
    icon: DollarSign,
    description: "Display pricing plans with CTA buttons",
    defaultData: { heading: "Pricing Options", subheading: "Multiple pricing options for every budget" },
  },
  {
    type: "testimonials",
    label: "Testimonials",
    icon: MessageSquare,
    description: "Student reviews and social proof",
    defaultData: {
      heading: "What Students Say",
      testimonials: [
        { name: "Student Name", text: "This course was incredibly helpful!", rating: 5 },
      ],
    },
  },
  {
    type: "cta",
    label: "Call to Action",
    icon: ArrowRight,
    description: "Prominent CTA section",
    defaultData: {
      heading: "Ready to get started?",
      subheading: "Join thousands of students today.",
      ctaText: "Enroll Now",
      ctaUrl: "#pricing",
      bgColor: "#189aa1",
    },
  },
  {
    type: "instructor",
    label: "Instructor Bio",
    icon: Star,
    description: "Instructor profile and credentials",
    defaultData: { heading: "Your Instructor", bio: "", name: "", title: "", avatarUrl: "" },
  },
  {
    type: "checklist",
    label: "Checklist",
    icon: AlignLeft,
    description: "Bullet list of features or outcomes",
    defaultData: {
      heading: "What's Included",
      items: ["Feature one", "Feature two", "Feature three"],
    },
  },
  {
    type: "columns",
    label: "Columns",
    icon: Columns,
    description: "Two or three column layout",
    defaultData: {
      columns: [
        { heading: "Column 1", body: "Content here" },
        { heading: "Column 2", body: "Content here" },
      ],
    },
  },
  {
    type: "spacer",
    label: "Spacer",
    icon: AlignLeft,
    description: "Vertical spacing between sections",
    defaultData: { height: 40 },
  },
];

// ─── Block Renderer (preview) ─────────────────────────────────────────────────

function BlockPreview({ block, primaryColor }: { block: Block; primaryColor: string }) {
  const d = block.data;
  switch (block.type) {
    case "banner":
      return (
        <div
          className="relative w-full min-h-[220px] flex flex-col items-center justify-center text-center px-8 py-12 rounded-lg overflow-hidden"
          style={{ backgroundColor: d.bgColor || primaryColor, color: d.textColor || "#fff" }}
        >
          {d.imageUrl && (
            <img src={d.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          )}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <h1 className="text-3xl font-bold leading-tight">{d.headline || "Your Course Title"}</h1>
            {d.subheadline && <p className="text-lg opacity-90 max-w-xl">{d.subheadline}</p>}
            {d.ctaText && (
              <button
                className="mt-2 px-6 py-2.5 rounded-full font-semibold text-sm"
                style={{ backgroundColor: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.6)" }}
              >
                {d.ctaText}
              </button>
            )}
          </div>
        </div>
      );
    case "text":
      return (
        <div className={`flex gap-6 ${d.imagePosition === "left" ? "flex-row-reverse" : "flex-row"}`}>
          <div className="flex-1">
            {d.heading && <h2 className="text-xl font-bold mb-2">{d.heading}</h2>}
            <p className="text-sm text-muted-foreground leading-relaxed">{d.body || "Your content here..."}</p>
          </div>
          {d.imageUrl && (
            <div className="w-48 shrink-0">
              <img src={d.imageUrl} alt="" className="rounded-lg w-full object-cover" />
            </div>
          )}
        </div>
      );
    case "video":
      return (
        <div className="flex flex-col gap-2">
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            {d.url ? (
              <iframe src={d.url} className="w-full h-full rounded-lg" allowFullScreen />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Video className="h-10 w-10" />
                <span className="text-sm">Video URL not set</span>
              </div>
            )}
          </div>
          {d.caption && <p className="text-xs text-muted-foreground text-center">{d.caption}</p>}
        </div>
      );
    case "curriculum":
      return (
        <div>
          <h2 className="text-xl font-bold mb-4">{d.heading || "Course Curriculum"}</h2>
          <div className="border border-border rounded-lg divide-y divide-border">
            {["Module 1: Introduction", "Module 2: Core Concepts", "Module 3: Advanced Topics"].map((m) => (
              <div key={m} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium">{m}</span>
                <span className="text-xs text-muted-foreground">3 lessons</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Curriculum auto-populates from your course content
          </p>
        </div>
      );
    case "pricing":
      return (
        <div>
          <h2 className="text-xl font-bold mb-1">{d.heading || "Pricing Options"}</h2>
          {d.subheading && <p className="text-sm text-muted-foreground mb-4">{d.subheading}</p>}
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: "Monthly", price: "$29.99/mo" },
              { name: "Annual", price: "$199/yr" },
            ].map((p) => (
              <div key={p.name} className="border border-border rounded-xl p-4 text-center">
                <p className="font-semibold text-sm">{p.name}</p>
                <p className="text-xl font-bold mt-1" style={{ color: primaryColor }}>{p.price}</p>
                <button
                  className="mt-3 w-full py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Pricing auto-populates from your course pricing settings
          </p>
        </div>
      );
    case "testimonials":
      return (
        <div>
          <h2 className="text-xl font-bold mb-4">{d.heading || "What Students Say"}</h2>
          <div className="grid grid-cols-1 gap-3">
            {(d.testimonials || []).map((t: any, i: number) => (
              <div key={i} className="border border-border rounded-xl p-4">
                <div className="flex gap-0.5 mb-2">
                  {[...Array(t.rating || 5)].map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic">"{t.text}"</p>
                <p className="text-xs font-medium mt-2">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "cta":
      return (
        <div
          className="rounded-xl p-8 text-center text-white"
          style={{ backgroundColor: d.bgColor || primaryColor }}
        >
          <h2 className="text-2xl font-bold">{d.heading || "Ready to get started?"}</h2>
          {d.subheading && <p className="mt-2 opacity-90">{d.subheading}</p>}
          <button className="mt-4 px-8 py-3 bg-white rounded-full font-semibold text-sm" style={{ color: d.bgColor || primaryColor }}>
            {d.ctaText || "Enroll Now"}
          </button>
        </div>
      );
    case "instructor":
      return (
        <div className="flex gap-4 items-start">
          <div className="h-16 w-16 rounded-full bg-muted shrink-0 overflow-hidden">
            {d.avatarUrl ? (
              <img src={d.avatarUrl} alt={d.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl font-bold">
                {(d.name || "I")[0]}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-bold">{d.heading || "Your Instructor"}</h2>
            <p className="text-sm font-medium">{d.name}</p>
            {d.title && <p className="text-xs text-muted-foreground">{d.title}</p>}
            {d.bio && <p className="text-sm text-muted-foreground mt-2">{d.bio}</p>}
          </div>
        </div>
      );
    case "checklist":
      return (
        <div>
          <h2 className="text-xl font-bold mb-3">{d.heading || "What's Included"}</h2>
          <ul className="flex flex-col gap-2">
            {(d.items || []).map((item: string, i: number) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor }}>
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    case "columns":
      return (
        <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${(d.columns || []).length}, 1fr)` }}>
          {(d.columns || []).map((col: any, i: number) => (
            <div key={i} className="border border-border rounded-xl p-4">
              <h3 className="font-semibold mb-2">{col.heading}</h3>
              <p className="text-sm text-muted-foreground">{col.body}</p>
            </div>
          ))}
        </div>
      );
    case "spacer":
      return <div style={{ height: d.height || 40 }} className="w-full" />;
    default:
      return <div className="p-4 text-sm text-muted-foreground">Unknown block type</div>;
  }
}

// ─── Block Editor (right panel) ───────────────────────────────────────────────

function BlockEditor({
  block,
  onChange,
  onClose,
}: {
  block: Block;
  onChange: (data: Record<string, any>) => void;
  onClose: () => void;
}) {
  const d = block.data;
  const set = (k: string, v: any) => onChange({ ...d, [k]: v });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="font-semibold text-sm capitalize">Edit: {block.type.replace("_", " ")}</p>
        <button onClick={onClose} className="h-7 w-7 rounded-lg hover:bg-accent flex items-center justify-center">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {block.type === "banner" && (
          <>
            <div><Label className="text-xs">Headline</Label><Input value={d.headline || ""} onChange={(e) => set("headline", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Subheadline</Label><Textarea value={d.subheadline || ""} onChange={(e) => set("subheadline", e.target.value)} className="mt-1 resize-none" rows={2} /></div>
            <div><Label className="text-xs">CTA Button Text</Label><Input value={d.ctaText || ""} onChange={(e) => set("ctaText", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Background Color</Label><div className="flex gap-2 mt-1"><input type="color" value={d.bgColor || "#189aa1"} onChange={(e) => set("bgColor", e.target.value)} className="h-9 w-12 rounded border border-border cursor-pointer" /><Input value={d.bgColor || "#189aa1"} onChange={(e) => set("bgColor", e.target.value)} className="font-mono text-sm" /></div></div>
            <div><Label className="text-xs">Text Color</Label><div className="flex gap-2 mt-1"><input type="color" value={d.textColor || "#ffffff"} onChange={(e) => set("textColor", e.target.value)} className="h-9 w-12 rounded border border-border cursor-pointer" /><Input value={d.textColor || "#ffffff"} onChange={(e) => set("textColor", e.target.value)} className="font-mono text-sm" /></div></div>
            <div><Label className="text-xs">Background Image URL</Label><Input value={d.imageUrl || ""} onChange={(e) => set("imageUrl", e.target.value)} className="mt-1" placeholder="https://..." /></div>
          </>
        )}
        {block.type === "text" && (
          <>
            <div><Label className="text-xs">Heading</Label><Input value={d.heading || ""} onChange={(e) => set("heading", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Body Text</Label><Textarea value={d.body || ""} onChange={(e) => set("body", e.target.value)} className="mt-1 resize-none" rows={5} /></div>
            <div><Label className="text-xs">Image URL (optional)</Label><Input value={d.imageUrl || ""} onChange={(e) => set("imageUrl", e.target.value)} className="mt-1" placeholder="https://..." /></div>
          </>
        )}
        {block.type === "video" && (
          <>
            <div><Label className="text-xs">Video URL (YouTube, Vimeo, or direct)</Label><Input value={d.url || ""} onChange={(e) => set("url", e.target.value)} className="mt-1" placeholder="https://youtube.com/embed/..." /></div>
            <div><Label className="text-xs">Caption</Label><Input value={d.caption || ""} onChange={(e) => set("caption", e.target.value)} className="mt-1" /></div>
          </>
        )}
        {block.type === "curriculum" && (
          <>
            <div><Label className="text-xs">Section Heading</Label><Input value={d.heading || ""} onChange={(e) => set("heading", e.target.value)} className="mt-1" /></div>
            <p className="text-xs text-muted-foreground">Curriculum content is automatically pulled from your course sections and lessons.</p>
          </>
        )}
        {block.type === "pricing" && (
          <>
            <div><Label className="text-xs">Section Heading</Label><Input value={d.heading || ""} onChange={(e) => set("heading", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Subheading</Label><Input value={d.subheading || ""} onChange={(e) => set("subheading", e.target.value)} className="mt-1" /></div>
            <p className="text-xs text-muted-foreground">Pricing options are automatically pulled from your course pricing settings.</p>
          </>
        )}
        {block.type === "testimonials" && (
          <>
            <div><Label className="text-xs">Section Heading</Label><Input value={d.heading || ""} onChange={(e) => set("heading", e.target.value)} className="mt-1" /></div>
            <div className="flex flex-col gap-3">
              {(d.testimonials || []).map((t: any, i: number) => (
                <div key={i} className="border border-border rounded-lg p-3 flex flex-col gap-2">
                  <div><Label className="text-xs">Name</Label><Input value={t.name || ""} onChange={(e) => { const ts = [...d.testimonials]; ts[i] = { ...ts[i], name: e.target.value }; set("testimonials", ts); }} className="mt-1 h-7 text-xs" /></div>
                  <div><Label className="text-xs">Quote</Label><Textarea value={t.text || ""} onChange={(e) => { const ts = [...d.testimonials]; ts[i] = { ...ts[i], text: e.target.value }; set("testimonials", ts); }} className="mt-1 resize-none text-xs" rows={2} /></div>
                  <Button variant="ghost" size="sm" className="self-end text-destructive h-7 text-xs" onClick={() => set("testimonials", d.testimonials.filter((_: any, j: number) => j !== i))}>Remove</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="text-xs" onClick={() => set("testimonials", [...(d.testimonials || []), { name: "", text: "", rating: 5 }])}>
                <Plus className="h-3 w-3 mr-1" /> Add Testimonial
              </Button>
            </div>
          </>
        )}
        {block.type === "cta" && (
          <>
            <div><Label className="text-xs">Heading</Label><Input value={d.heading || ""} onChange={(e) => set("heading", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Subheading</Label><Input value={d.subheading || ""} onChange={(e) => set("subheading", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Button Text</Label><Input value={d.ctaText || ""} onChange={(e) => set("ctaText", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Background Color</Label><div className="flex gap-2 mt-1"><input type="color" value={d.bgColor || "#189aa1"} onChange={(e) => set("bgColor", e.target.value)} className="h-9 w-12 rounded border border-border cursor-pointer" /><Input value={d.bgColor || "#189aa1"} onChange={(e) => set("bgColor", e.target.value)} className="font-mono text-sm" /></div></div>
          </>
        )}
        {block.type === "instructor" && (
          <>
            <div><Label className="text-xs">Section Heading</Label><Input value={d.heading || ""} onChange={(e) => set("heading", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Instructor Name</Label><Input value={d.name || ""} onChange={(e) => set("name", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Title / Credentials</Label><Input value={d.title || ""} onChange={(e) => set("title", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Bio</Label><Textarea value={d.bio || ""} onChange={(e) => set("bio", e.target.value)} className="mt-1 resize-none" rows={4} /></div>
            <div><Label className="text-xs">Avatar URL</Label><Input value={d.avatarUrl || ""} onChange={(e) => set("avatarUrl", e.target.value)} className="mt-1" placeholder="https://..." /></div>
          </>
        )}
        {block.type === "checklist" && (
          <>
            <div><Label className="text-xs">Heading</Label><Input value={d.heading || ""} onChange={(e) => set("heading", e.target.value)} className="mt-1" /></div>
            <div className="flex flex-col gap-2">
              {(d.items || []).map((item: string, i: number) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input value={item} onChange={(e) => { const items = [...d.items]; items[i] = e.target.value; set("items", items); }} className="h-7 text-xs flex-1" />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => set("items", d.items.filter((_: any, j: number) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="text-xs" onClick={() => set("items", [...(d.items || []), "New item"])}>
                <Plus className="h-3 w-3 mr-1" /> Add Item
              </Button>
            </div>
          </>
        )}
        {block.type === "spacer" && (
          <div>
            <Label className="text-xs">Height (px)</Label>
            <Input type="number" value={d.height || 40} onChange={(e) => set("height", parseInt(e.target.value) || 40)} className="mt-1" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sortable Block Item ───────────────────────────────────────────────────────

function SortableBlock({
  block,
  isSelected,
  onSelect,
  onDelete,
  primaryColor,
}: {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  primaryColor: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const catalog = BLOCK_CATALOG.find((b) => b.type === block.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative border-2 rounded-xl transition-all cursor-pointer ${
        isSelected ? "border-primary shadow-md" : "border-transparent hover:border-border"
      }`}
      onClick={onSelect}
    >
      {/* Block label */}
      <div className={`absolute -top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        style={{ backgroundColor: isSelected ? "#189aa1" : "#64748b", color: "white" }}>
        {catalog?.label}
      </div>

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={`absolute -left-8 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 rounded transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Delete button */}
      <button
        className={`absolute -right-3 -top-3 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center transition-opacity z-10 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
      >
        <X className="h-3 w-3" />
      </button>

      {/* Block content */}
      <div className="p-4 pointer-events-none select-none">
        <BlockPreview block={block} primaryColor={primaryColor} />
      </div>
    </div>
  );
}

// ─── Main Page Builder ─────────────────────────────────────────────────────────

export default function PageBuilderPage() {
  const params = useParams<{ courseId?: string; pageId?: string }>();
  const [, setLocation] = useLocation();
  const courseId = params.courseId ? parseInt(params.courseId) : undefined;
  const pageId = params.pageId ? parseInt(params.pageId) : undefined;

  const { data: orgs } = trpc.orgs.myOrgs.useQuery();
  const orgId = orgs?.[0]?.id;

  const { data: page, isLoading } = trpc.lms.pages.get.useQuery(
    { id: pageId! },
    { enabled: !!pageId }
  );

  const { data: theme } = trpc.lms.themes.get.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const primaryColor = theme?.studentPrimaryColor || theme?.primaryColor || "#189aa1";

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [isDirty, setIsDirty] = useState(false);
  const [pageTitle, setPageTitle] = useState("Course Sales Page");

  useEffect(() => {
    if (page) {
      setPageTitle(page.title || "Course Sales Page");
      try {
        const parsed = JSON.parse(page.blocksJson || "[]");
        setBlocks(parsed);
      } catch {
        setBlocks([]);
      }
    }
  }, [page]);

  const updatePage = trpc.lms.pages.update.useMutation({
    onSuccess: () => {
      toast.success("Page saved");
      setIsDirty(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const createPage = trpc.lms.pages.create.useMutation({
    onSuccess: (newPage) => {
      toast.success("Page created");
      setIsDirty(false);
      setLocation(`/lms/page-builder/${newPage.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((bs) => {
        const oldIdx = bs.findIndex((b) => b.id === active.id);
        const newIdx = bs.findIndex((b) => b.id === over.id);
        return arrayMove(bs, oldIdx, newIdx);
      });
      setIsDirty(true);
    }
  };

  const addBlock = (type: BlockType) => {
    const catalog = BLOCK_CATALOG.find((b) => b.type === type)!;
    const newBlock: Block = {
      id: `${type}-${Date.now()}`,
      type,
      data: { ...catalog.defaultData },
    };
    setBlocks((bs) => [...bs, newBlock]);
    setSelectedBlockId(newBlock.id);
    setIsDirty(true);
  };

  const updateBlock = (id: string, data: Record<string, any>) => {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, data } : b)));
    setIsDirty(true);
  };

  const deleteBlock = (id: string) => {
    setBlocks((bs) => bs.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
    setIsDirty(true);
  };

  const handleSave = () => {
    const blocksJson = JSON.stringify(blocks);
    if (pageId) {
      updatePage.mutate({ id: pageId, blocksJson, title: pageTitle });
    } else if (orgId) {
      createPage.mutate({
        orgId,
        courseId,
        pageType: "course_sales",
        title: pageTitle,
        blocksJson,
      } as any);
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top bar */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation(courseId ? `/lms/courses/${courseId}` : "/lms/courses")}
            className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Page Builder</span>
            <span className="text-muted-foreground text-sm">—</span>
            <Input
              value={pageTitle}
              onChange={(e) => { setPageTitle(e.target.value); setIsDirty(true); }}
              className="h-7 text-sm border-0 bg-transparent focus-visible:ring-0 p-0 w-48 font-medium"
            />
            {isDirty && <Badge variant="secondary" className="text-xs">Unsaved</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Viewport toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("desktop")}
              className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${viewMode === "desktop" ? "bg-background shadow-sm" : "hover:bg-background/50"}`}
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${viewMode === "mobile" ? "bg-background shadow-sm" : "hover:bg-background/50"}`}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button variant="outline" size="sm" className="gap-1.5 h-8">
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
          <Button
            size="sm"
            className="gap-1.5 h-8"
            onClick={handleSave}
            disabled={updatePage.isPending || createPage.isPending}
          >
            <Save className="h-3.5 w-3.5" />
            {updatePage.isPending || createPage.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — block catalog */}
        <div className="w-64 border-r border-border flex flex-col shrink-0 bg-background overflow-y-auto">
          <div className="p-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Page Blocks</p>
          </div>
          <div className="p-2 flex flex-col gap-1">
            {BLOCK_CATALOG.map((item) => (
              <button
                key={item.type}
                onClick={() => addBlock(item.type)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left group"
              >
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10">
                  <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
                <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
          <div className="p-3 mt-auto border-t border-border">
            <button
              onClick={() => addBlock("banner")}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-dashed border-border hover:border-primary hover:text-primary transition-colors text-sm text-muted-foreground"
            >
              <Plus className="h-4 w-4" />
              Add New Block
            </button>
          </div>
        </div>

        {/* Center — canvas */}
        <div className="flex-1 overflow-y-auto bg-muted/30 p-8">
          <div
            className={`mx-auto bg-background rounded-xl shadow-sm min-h-[600px] transition-all ${
              viewMode === "mobile" ? "max-w-sm" : "max-w-4xl"
            }`}
          >
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
                <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center">
                  <LayoutTemplate className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold">Start building your page</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click any block type on the left to add it to your page
                  </p>
                </div>
                <Button onClick={() => addBlock("banner")} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Banner Block
                </Button>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="p-8 flex flex-col gap-6 pl-14">
                    {blocks.map((block) => (
                      <SortableBlock
                        key={block.id}
                        block={block}
                        isSelected={selectedBlockId === block.id}
                        onSelect={() => setSelectedBlockId(block.id === selectedBlockId ? null : block.id)}
                        onDelete={() => deleteBlock(block.id)}
                        primaryColor={primaryColor}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Right panel — block editor */}
        {selectedBlock && (
          <div className="w-72 border-l border-border bg-background shrink-0 overflow-hidden flex flex-col">
            <BlockEditor
              block={selectedBlock}
              onChange={(data) => updateBlock(selectedBlock.id, data)}
              onClose={() => setSelectedBlockId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

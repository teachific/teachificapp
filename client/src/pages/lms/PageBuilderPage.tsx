import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PageBuilder, Block } from "@/components/PageBuilder";
import {
  Monitor,
  Smartphone,
  Maximize2,
  Save,
  X,
  ChevronLeft,
  ExternalLink,
  Eye,
  Globe,
} from "lucide-react";

// ─── Main Page ─────────────────────────────────────────────────────────────────

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

  const { data: courses } = trpc.lms.courses.list.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile" | "fullscreen">("desktop");
  const [isDirty, setIsDirty] = useState(false);
  const [pageTitle, setPageTitle] = useState("Course Sales Page");
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (page) {
      setPageTitle(page.title || "Course Sales Page");
      setIsPublished(page.isPublished || false);
      try {
        const parsed = JSON.parse(page.blocksJson || "[]");
        setBlocks(Array.isArray(parsed) ? parsed : []);
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

  const handleBlocksChange = useCallback((newBlocks: Block[]) => {
    setBlocks(newBlocks);
    setIsDirty(true);
  }, []);

  const handleSave = (publish?: boolean) => {
    const blocksJson = JSON.stringify(blocks);
    const newPublished = publish !== undefined ? publish : isPublished;
    if (pageId) {
      updatePage.mutate({ id: pageId, blocksJson, title: pageTitle, isPublished: newPublished });
      if (publish !== undefined) setIsPublished(newPublished);
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

  const handleDiscard = () => {
    if (page) {
      try {
        const parsed = JSON.parse(page.blocksJson || "[]");
        setBlocks(Array.isArray(parsed) ? parsed : []);
      } catch {
        setBlocks([]);
      }
      setPageTitle(page.title || "Course Sales Page");
      setIsDirty(false);
      toast.info("Changes discarded");
    }
  };

  const isSaving = updatePage.isPending || createPage.isPending;

  const courseList = (courses || []).map((c: any) => ({ id: c.id, title: c.title }));

  // Preview URL for public page
  const previewUrl = page?.slug ? `/p/${page.slug}` : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* ─── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background z-20 shadow-sm">
        {/* Left: Back + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setLocation(courseId ? `/lms/courses/${courseId}` : "/lms/courses")}
            className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Input
              value={pageTitle}
              onChange={(e) => { setPageTitle(e.target.value); setIsDirty(true); }}
              className="h-8 text-sm font-semibold border-transparent bg-transparent hover:border-border focus:border-border w-48 truncate"
            />
            {isDirty && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 shrink-0">
                Unsaved
              </Badge>
            )}
            {!isDirty && isPublished && (
              <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0">
                <Globe className="h-3 w-3 mr-1" /> Published
              </Badge>
            )}
            {!isDirty && !isPublished && pageId && (
              <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">
                Draft
              </Badge>
            )}
          </div>
        </div>

        {/* Center: Device toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setViewMode("desktop")}
            className={`h-7 w-8 rounded-md flex items-center justify-center transition-colors ${viewMode === "desktop" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="Desktop"
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("mobile")}
            className={`h-7 w-8 rounded-md flex items-center justify-center transition-colors ${viewMode === "mobile" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="Mobile"
          >
            <Smartphone className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("fullscreen")}
            className={`h-7 w-8 rounded-md flex items-center justify-center transition-colors ${viewMode === "fullscreen" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {previewUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => window.open(previewUrl, "_blank")}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </Button>
          )}
          {isDirty && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground"
              onClick={handleDiscard}
            >
              <X className="h-3.5 w-3.5" />
              Discard
            </Button>
          )}
          {!isPublished && pageId && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => handleSave(true)}
              disabled={isSaving}
            >
              <Globe className="h-3.5 w-3.5" />
              Publish
            </Button>
          )}
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => handleSave()}
            disabled={isSaving || !isDirty}
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* ─── Editor Body ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Loading page…
        </div>
      ) : (
        <div
          className={`flex-1 overflow-hidden transition-all ${
            viewMode === "fullscreen" ? "p-0" : viewMode === "mobile" ? "flex justify-center bg-slate-100 py-6" : ""
          }`}
        >
          {viewMode === "mobile" ? (
            <div className="w-[390px] h-full bg-background rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col">
              <div className="h-8 bg-slate-900 rounded-t-2xl flex items-center justify-center">
                <div className="w-24 h-1.5 bg-slate-600 rounded-full" />
              </div>
              <div className="flex-1 overflow-hidden">
                <PageBuilder
                  initialBlocks={blocks}
                  onChange={handleBlocksChange}
                  courses={courseList}
                />
              </div>
            </div>
          ) : (
            <div className="h-full">
              <PageBuilder
                initialBlocks={blocks}
                onChange={handleBlocksChange}
                courses={courseList}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

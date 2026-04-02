import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import UpgradePromptDialog from "@/components/UpgradePromptDialog";
import { useOrgPlan } from "@/hooks/useOrgPlan";
import {
  BookOpen,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Users,
  TrendingUp,
  GraduationCap,
  Sparkles,
  Loader2,
  Copy,
  Archive,
  Settings,
} from "lucide-react";

export default function CoursesPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiModules, setAiModules] = useState(3);
  const [aiLessons, setAiLessons] = useState(4);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Get user's orgs
  const { data: orgs } = trpc.orgs.myOrgs.useQuery();
  const orgId = orgs?.[0]?.id;
  const { can } = useOrgPlan(orgId);

  const { data: courses, isLoading } = trpc.lms.courses.list.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const createMutation = trpc.lms.courses.create.useMutation({
    onSuccess: (course) => {
      utils.lms.courses.list.invalidate();
      setCreateOpen(false);
      setNewTitle("");
      toast.success("Course created");
      if (course?.id) setLocation(`/lms/courses/${course.id}/curriculum`);
    },
    onError: (e) => toast.error(e.message),
  });

  const aiGenerateMutation = trpc.lms.ai.generateCourse.useMutation({
    onSuccess: async (outline) => {
      if (!orgId || !outline?.title) { setAiGenerating(false); return; }
      try {
        const course = await createMutation.mutateAsync({ orgId, title: outline.title });
        if (course?.id) {
          toast.success(`AI generated "${outline.title}" — opening curriculum builder`);
          setAiOpen(false);
          setAiTopic("");
          setLocation(`/lms/courses/${course.id}/curriculum`);
        }
      } finally {
        setAiGenerating(false);
      }
    },
    onError: (e) => { toast.error(e.message); setAiGenerating(false); },
  });

  const copyMutation = trpc.lms.copy.course.useMutation({
    onSuccess: (course) => {
      utils.lms.courses.list.invalidate();
      toast.success("Course copied");
      if (course?.id) setLocation(`/lms/courses/${course.id}/curriculum`);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.lms.courses.update.useMutation({
    onSuccess: () => {
      utils.lms.courses.list.invalidate();
      toast.success("Course updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.lms.courses.delete.useMutation({
    onSuccess: () => {
      utils.lms.courses.list.invalidate();
      toast.success("Course deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = async () => {
    if (!newTitle.trim() || !orgId) return;
    setCreating(true);
    try {
      await createMutation.mutateAsync({ orgId, title: newTitle.trim() });
    } finally {
      setCreating(false);
    }
  };

  const filtered = courses?.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    archived: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create and manage your online courses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              if (!can("aiGeneration")) { setUpgradeOpen(true); return; }
              setAiOpen(true);
            }}
          >
            <Sparkles className="h-4 w-4 text-purple-500" />
            AI Generate
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Course
          </Button>
        </div>
      </div>

      {/* Stats row */}
      {courses && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses.length}</p>
                <p className="text-xs text-muted-foreground">Total Courses</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {courses.filter((c) => c.status === "published").length}
                </p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {courses.reduce((s, c) => s + (c.totalEnrollments ?? 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Enrollments</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Course list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 gap-3 flex flex-col">
                <Skeleton className="h-36 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No courses yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first course to get started
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                if (!can("aiGeneration")) { setUpgradeOpen(true); return; }
                setAiOpen(true);
              }}
            >
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI Generate
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Course
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered?.map((course) => (
            <Card
              key={course.id}
              className="group overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setLocation(`/lms/courses/${course.id}/curriculum`)}
            >
              {/* Thumbnail */}
              <div className="relative h-36 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="h-12 w-12 text-primary/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[course.status]}`}
                  >
                    {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                  </span>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-tight truncate">
                      {course.title}
                    </h3>
                    {course.shortDescription && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {course.shortDescription}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/lms/courses/${course.id}/curriculum`);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Curriculum
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/lms/courses/${course.id}/settings`);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/learn/${course.id}?preview=1`, "_blank");
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          copyMutation.mutate({ courseId: course.id });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          updateMutation.mutate({ id: course.id, status: "archived" });
                        }}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${course.title}"? This cannot be undone.`)) {
                            deleteMutation.mutate({ id: course.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {course.totalEnrollments ?? 0} enrolled
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Generate Dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI Course Generator
            </DialogTitle>
            <DialogDescription>
              Enter a topic and AI will generate a full course outline with modules and lessons.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div>
              <Label>Course Topic</Label>
              <Textarea
                placeholder="e.g. Advanced Cardiac Sonography for Beginners"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="mt-1.5 resize-none"
                rows={2}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Number of Modules</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={aiModules}
                  onChange={(e) => setAiModules(parseInt(e.target.value) || 3)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Lessons per Module</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={aiLessons}
                  onChange={(e) => setAiLessons(parseInt(e.target.value) || 4)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiOpen(false)} disabled={aiGenerating}>
              Cancel
            </Button>
            <Button
              disabled={!aiTopic.trim() || aiGenerating || !orgId}
              onClick={() => {
                if (!orgId) return;
                setAiGenerating(true);
                aiGenerateMutation.mutate({
                  orgId,
                  topic: aiTopic.trim(),
                  numModules: aiModules,
                  numLessonsPerModule: aiLessons,
                });
              }}
              className="gap-2"
            >
              {aiGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {aiGenerating ? "Generating..." : "Generate Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Prompt */}
      <UpgradePromptDialog
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        requiredPlan="starter"
        featureName="AI Course Generation"
        featureDescription="Automatically generate a full course outline with modules and lessons from a single topic using AI."
      />

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="course-title">Course Title</Label>
            <Input
              id="course-title"
              placeholder="e.g. Advanced Cardiac Sonography"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="mt-1.5"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newTitle.trim() || creating}>
              {creating ? "Creating..." : "Create Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

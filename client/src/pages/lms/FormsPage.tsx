import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreVertical,
  FileText,
  Copy,
  Trash2,
  ExternalLink,
  BarChart2,
  Edit,
  Globe,
  Lock,
  ClipboardList,
  TrendingUp,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export default function FormsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const { data: orgCtx } = trpc.orgs.myContext.useQuery();
  const orgId = orgCtx?.org?.id;

  const { data: forms, isLoading, refetch } = trpc.forms.list.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const createMutation = trpc.forms.create.useMutation({
    onSuccess: (form) => {
      setCreateOpen(false);
      setNewTitle("");
      setNewDesc("");
      setLocation(`/lms/forms/${form.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.forms.delete.useMutation({
    onSuccess: () => { toast.success("Form deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const duplicateMutation = trpc.forms.duplicate.useMutation({
    onSuccess: (form) => {
      toast.success("Form duplicated");
      setLocation(`/lms/forms/${form.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (forms ?? []).filter((f) =>
    !search || f.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!newTitle.trim() || !orgId) return;
    createMutation.mutate({ orgId, title: newTitle.trim(), description: newDesc.trim() || undefined });
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Forms
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create surveys, quizzes, and data-collection forms
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Form
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search forms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{search ? "No forms match your search" : "No forms yet"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {!search && "Create your first form to start collecting responses."}
            </p>
          </div>
          {!search && (
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Form
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((form) => (
            <Card key={form.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {form.title}
                    </h3>
                    {form.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{form.description}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setLocation(`/lms/forms/${form.id}`)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateMutation.mutate({ id: form.id })}>
                        <Copy className="h-4 w-4 mr-2" /> Duplicate
                      </DropdownMenuItem>
                      {form.status === "published" && (
                        <DropdownMenuItem onClick={() => window.open(`/forms/${form.slug}`, "_blank")}>
                          <ExternalLink className="h-4 w-4 mr-2" /> View Live
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          if (confirm(`Delete "${form.title}"? This cannot be undone.`)) {
                            deleteMutation.mutate({ id: form.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <Badge className={`text-xs px-2 py-0.5 font-medium border-0 ${STATUS_COLORS[form.status]}`}>
                    {form.status === "published" ? (
                      <Globe className="h-3 w-3 mr-1 inline" />
                    ) : form.status === "closed" ? (
                      <Lock className="h-3 w-3 mr-1 inline" />
                    ) : null}
                    {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <BarChart2 className="h-3 w-3" />
                    {form.submissionCount} response{form.submissionCount !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8"
                    onClick={() => setLocation(`/lms/forms/${form.id}`)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8"
                    onClick={() => setLocation(`/lms/forms/${form.id}/responses`)}
                  >
                    <BarChart2 className="h-3 w-3 mr-1" />
                    Responses
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8"
                    onClick={() => setLocation(`/lms/forms/${form.id}/analytics`)}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Form Title *</label>
              <Input
                placeholder="e.g. Customer Feedback Survey"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Description (optional)</label>
              <Input
                placeholder="Brief description of this form"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={!newTitle.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create & Edit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

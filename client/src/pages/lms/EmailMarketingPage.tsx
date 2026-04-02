import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Mail,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  BarChart2,
  Users,
  MousePointerClick,
  Eye,
  Search,
  Calendar,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

type Campaign = {
  id: number;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string | null;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  scheduledAt?: Date | null;
  sentAt?: Date | null;
  recipientCount: number;
  sentCount: number;
  openCount: number;
  clickCount: number;
  createdAt: Date;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  sending: "bg-yellow-100 text-yellow-700",
  sent: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default function EmailMarketingPage() {
  const { data: orgs } = trpc.orgs.myOrgs.useQuery();
  const orgId = orgs?.[0]?.id ?? 0;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formHtml, setFormHtml] = useState("");
  const [formText, setFormText] = useState("");

  const utils = trpc.useUtils();

  const { data: campaigns, isLoading } = trpc.lms.emailMarketing.list.useQuery(
    { orgId },
    { enabled: !!orgId }
  );

  const { data: stats } = trpc.lms.emailMarketing.stats.useQuery(
    { orgId },
    { enabled: !!orgId }
  );

  const createMutation = trpc.lms.emailMarketing.create.useMutation({
    onSuccess: () => {
      utils.lms.emailMarketing.list.invalidate({ orgId });
      utils.lms.emailMarketing.stats.invalidate({ orgId });
      toast.success("Campaign created");
      setShowCreate(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.lms.emailMarketing.update.useMutation({
    onSuccess: () => {
      utils.lms.emailMarketing.list.invalidate({ orgId });
      toast.success("Campaign updated");
      setEditCampaign(null);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.lms.emailMarketing.delete.useMutation({
    onSuccess: () => {
      utils.lms.emailMarketing.list.invalidate({ orgId });
      utils.lms.emailMarketing.stats.invalidate({ orgId });
      toast.success("Campaign deleted");
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setFormName("");
    setFormSubject("");
    setFormHtml("");
    setFormText("");
  }

  function openEdit(c: Campaign) {
    setEditCampaign(c);
    setFormName(c.name);
    setFormSubject(c.subject);
    setFormHtml(c.htmlBody);
    setFormText(c.textBody ?? "");
  }

  function handleCreate() {
    if (!formName.trim() || !formSubject.trim()) {
      toast.error("Name and subject are required");
      return;
    }
    createMutation.mutate({
      orgId,
      name: formName.trim(),
      subject: formSubject.trim(),
      htmlBody: formHtml,
      textBody: formText || undefined,
    });
  }

  function handleUpdate() {
    if (!editCampaign) return;
    updateMutation.mutate({
      id: editCampaign.id,
      name: formName.trim(),
      subject: formSubject.trim(),
      htmlBody: formHtml,
      textBody: formText || undefined,
    });
  }

  const filtered = useMemo(() => {
    if (!campaigns) return [];
    return campaigns.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.subject.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [campaigns, search, statusFilter]);

  const openRate = stats?.openRate ?? 0;
  const clickRate = stats?.clickRate ?? 0;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Marketing</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Create and manage email campaigns for your students
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreate(true); }} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Campaigns", value: stats?.totalCampaigns ?? 0, icon: Mail },
          { label: "Emails Sent", value: stats?.totalSent ?? 0, icon: Send },
          { label: "Open Rate", value: `${openRate}%`, icon: Eye },
          { label: "Click Rate", value: `${clickRate}%`, icon: MousePointerClick },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <p className="text-xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "draft", "scheduled", "sent", "failed"].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Campaign List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !filtered.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Mail className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-medium text-muted-foreground">
              {search || statusFilter !== "all" ? "No campaigns match your filters" : "No campaigns yet"}
            </p>
            {!search && statusFilter === "all" && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => { resetForm(); setShowCreate(true); }}
              >
                Create your first campaign
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Card key={c.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-sm truncate">{c.name}</p>
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${STATUS_COLORS[c.status] ?? ""}`}
                      >
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      Subject: {c.subject}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {c.status === "sent" && (
                        <>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {c.sentCount} sent
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {c.openCount} opens
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointerClick className="h-3 w-3" />
                            {c.clickCount} clicks
                          </span>
                        </>
                      )}
                      {c.status === "scheduled" && c.scheduledAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Scheduled: {new Date(c.scheduledAt).toLocaleString()}
                        </span>
                      )}
                      {c.status === "sent" && c.sentAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Sent: {new Date(c.sentAt).toLocaleDateString()}
                        </span>
                      )}
                      {c.status === "draft" && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Created: {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {c.status === "draft" && (
                        <DropdownMenuItem onClick={() => openEdit(c)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setDeleteId(c.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Email Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Campaign Name *</Label>
                <Input
                  placeholder="e.g. Welcome Series #1"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email Subject *</Label>
                <Input
                  placeholder="e.g. Welcome to the course!"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                />
              </div>
            </div>
            <Tabs defaultValue="html">
              <TabsList>
                <TabsTrigger value="html">HTML Body</TabsTrigger>
                <TabsTrigger value="text">Plain Text</TabsTrigger>
              </TabsList>
              <TabsContent value="html" className="mt-2">
                <Label className="text-xs text-muted-foreground mb-1 block">
                  HTML email body (supports full HTML/CSS)
                </Label>
                <Textarea
                  placeholder="<p>Hello {{first_name}},</p><p>Welcome to the course!</p>"
                  value={formHtml}
                  onChange={(e) => setFormHtml(e.target.value)}
                  className="font-mono text-xs min-h-[200px]"
                />
              </TabsContent>
              <TabsContent value="text" className="mt-2">
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Plain text fallback (for email clients that don't support HTML)
                </Label>
                <Textarea
                  placeholder="Hello {{first_name}}, Welcome to the course!"
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  className="min-h-[200px]"
                />
              </TabsContent>
            </Tabs>
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Available merge tags:</p>
              <p>
                <code className="bg-background px-1 rounded">{"{{first_name}}"}</code>{" "}
                <code className="bg-background px-1 rounded">{"{{last_name}}"}</code>{" "}
                <code className="bg-background px-1 rounded">{"{{email}}"}</code>{" "}
                <code className="bg-background px-1 rounded">{"{{unsubscribe_url}}"}</code>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editCampaign} onOpenChange={(o) => { if (!o) { setEditCampaign(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Campaign Name *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email Subject *</Label>
                <Input
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                />
              </div>
            </div>
            <Tabs defaultValue="html">
              <TabsList>
                <TabsTrigger value="html">HTML Body</TabsTrigger>
                <TabsTrigger value="text">Plain Text</TabsTrigger>
              </TabsList>
              <TabsContent value="html" className="mt-2">
                <Textarea
                  value={formHtml}
                  onChange={(e) => setFormHtml(e.target.value)}
                  className="font-mono text-xs min-h-[200px]"
                />
              </TabsContent>
              <TabsContent value="text" className="mt-2">
                <Textarea
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  className="min-h-[200px]"
                />
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditCampaign(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the campaign and all its recipient data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              disabled={deleteMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

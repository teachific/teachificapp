import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useOrgScope } from "@/hooks/useOrgScope";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Award, Plus, MoreVertical, Edit, Trash2, Star } from "lucide-react";

const DEFAULT_TEMPLATE = `<div style="width:800px;height:600px;border:8px solid #0ea5e9;padding:60px;font-family:Georgia,serif;text-align:center;background:#fff;">
  <h1 style="color:#0ea5e9;font-size:36px;margin-bottom:8px;">Certificate of Completion</h1>
  <p style="color:#666;font-size:16px;">This certifies that</p>
  <h2 style="font-size:28px;margin:16px 0;">{{student_name}}</h2>
  <p style="color:#666;font-size:16px;">has successfully completed</p>
  <h3 style="font-size:22px;color:#333;margin:16px 0;">{{course_name}}</h3>
  <p style="color:#666;font-size:14px;margin-top:40px;">Issued on {{date}}</p>
</div>`;

export default function MemberCertificatesPage() {
  const { orgId, ready } = useOrgScope();
  const utils = trpc.useUtils();
  const { data: templates, isLoading } = trpc.lms.certificateTemplates.list.useQuery({ orgId: orgId! }, { enabled: ready && !!orgId });
  const createMut = trpc.lms.certificateTemplates.create.useMutation({
    onSuccess: () => { utils.lms.certificateTemplates.list.invalidate(); toast.success("Template created"); setCreateOpen(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.lms.certificateTemplates.update.useMutation({
    onSuccess: () => { utils.lms.certificateTemplates.list.invalidate(); toast.success("Updated"); setEditOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.lms.certificateTemplates.delete.useMutation({
    onSuccess: () => { utils.lms.certificateTemplates.list.invalidate(); toast.success("Deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState(""); const [htmlTemplate, setHtmlTemplate] = useState(DEFAULT_TEMPLATE); const [isDefault, setIsDefault] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  const resetForm = () => { setName(""); setHtmlTemplate(DEFAULT_TEMPLATE); setIsDefault(false); };

  const openEdit = (t: any) => { setEditId(t.id); setName(t.name); setHtmlTemplate(t.htmlTemplate ?? DEFAULT_TEMPLATE); setIsDefault(t.isDefault); setEditOpen(true); };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Award className="h-6 w-6 text-primary" />Certificate Templates</h1><p className="text-muted-foreground mt-0.5">Design and manage certificate templates for course completions</p></div>
        <Button className="gap-2" onClick={() => { resetForm(); setCreateOpen(true); }}><Plus className="h-4 w-4" />New Template</Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Templates</p><p className="text-3xl font-bold">{templates?.length ?? 0}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Default Template</p><p className="text-base font-medium mt-1">{templates?.find(t => t.isDefault)?.name ?? "None set"}</p></CardContent></Card>
      </div>
      {isLoading ? <div className="grid gap-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        : !templates?.length ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Award className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">No certificate templates yet.</p>
            <Button onClick={() => { resetForm(); setCreateOpen(true); }}><Plus className="h-4 w-4 mr-2" />Create Template</Button>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {templates.map(t => (
              <Card key={t.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <Award className="h-8 w-8 text-primary/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="font-medium">{t.name}</span>{t.isDefault && <Badge className="text-xs">Default</Badge>}</div>
                    <p className="text-xs text-muted-foreground">Created {new Date(t.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setPreviewHtml(t.htmlTemplate?.replace("{{student_name}}", "Jane Smith").replace("{{course_name}}", "Advanced Echo").replace("{{date}}", new Date().toLocaleDateString()) ?? ""); setPreviewOpen(true); }}>Preview</Button>
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(t)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                        {!t.isDefault && <DropdownMenuItem onClick={() => updateMut.mutate({ id: t.id, isDefault: true })}><Star className="h-4 w-4 mr-2" />Set as Default</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: t.id }); }} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>New Certificate Template</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Template Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Standard Completion Certificate" /></div>
            <div className="space-y-2"><Label>HTML Template</Label><p className="text-xs text-muted-foreground">Use {"{{student_name}}"}, {"{{course_name}}"}, {"{{date}}"} as placeholders.</p><Textarea value={htmlTemplate} onChange={e => setHtmlTemplate(e.target.value)} rows={10} className="font-mono text-xs" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="isDefault" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} /><Label htmlFor="isDefault">Set as default template</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={() => { if (!name.trim()) { toast.error("Name required"); return; } createMut.mutate({ orgId: orgId!, name, htmlTemplate, isDefault }); }} disabled={createMut.isPending}>{createMut.isPending ? "Creating..." : "Create Template"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Edit Certificate Template</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Template Name *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>HTML Template</Label><Textarea value={htmlTemplate} onChange={e => setHtmlTemplate(e.target.value)} rows={10} className="font-mono text-xs" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="isDefaultEdit" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} /><Label htmlFor="isDefaultEdit">Set as default template</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={() => { if (!editId) return; updateMut.mutate({ id: editId, name, htmlTemplate, isDefault }); }} disabled={updateMut.isPending}>{updateMut.isPending ? "Saving..." : "Save Changes"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Certificate Preview</DialogTitle></DialogHeader>
          <div className="overflow-auto max-h-[60vh]"><div dangerouslySetInnerHTML={{ __html: previewHtml }} /></div>
          <DialogFooter><Button onClick={() => setPreviewOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

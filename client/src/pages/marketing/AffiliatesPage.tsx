import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useOrgScope } from "@/hooks/useOrgScope";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Share2, Plus, MoreVertical, Edit, Trash2, Copy } from "lucide-react";

export default function AffiliatesPage() {
  const { orgId, ready } = useOrgScope();
  const utils = trpc.useUtils();
  const { data: affiliates, isLoading } = trpc.lms.affiliates.list.useQuery({ orgId: orgId! }, { enabled: ready && !!orgId });
  const createMut = trpc.lms.affiliates.create.useMutation({
    onSuccess: () => { utils.lms.affiliates.list.invalidate(); toast.success("Affiliate created"); setCreateOpen(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.lms.affiliates.update.useMutation({
    onSuccess: () => { utils.lms.affiliates.list.invalidate(); toast.success("Updated"); setEditOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.lms.affiliates.delete.useMutation({
    onSuccess: () => { utils.lms.affiliates.list.invalidate(); toast.success("Deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [commissionType, setCommissionType] = useState<"percentage"|"fixed">("percentage"); const [commissionValue, setCommissionValue] = useState(""); const [isActive, setIsActive] = useState(true);
  const resetForm = () => { setName(""); setEmail(""); setCommissionType("percentage"); setCommissionValue(""); setIsActive(true); };
  const openEdit = (a: any) => { setEditId(a.id); setName(a.name); setEmail(a.email ?? ""); setCommissionType(a.commissionType ?? "percentage"); setCommissionValue(String(a.commissionValue ?? "")); setIsActive(a.isActive !== false); setEditOpen(true); };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Share2 className="h-6 w-6 text-primary" />Affiliates</h1><p className="text-muted-foreground mt-0.5">Manage affiliate partners who promote your courses</p></div>
        <Button className="gap-2" onClick={() => { resetForm(); setCreateOpen(true); }}><Plus className="h-4 w-4" />Add Affiliate</Button>
      </div>

      {isLoading ? <div className="grid gap-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        : !affiliates?.length ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Share2 className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">No affiliates yet. Add your first affiliate partner.</p>
            <Button onClick={() => { resetForm(); setCreateOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Affiliate</Button>
          </CardContent></Card>
        ) : (
          <Card><CardContent className="p-0">
            <div className="divide-y">
              {affiliates.map((a: any) => (
                <div key={a.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="font-medium text-sm">{a.name}</span><Badge variant={a.isActive !== false ? "default" : "outline"} className="text-xs">{a.isActive !== false ? "Active" : "Inactive"}</Badge></div>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                    <p className="text-xs text-muted-foreground">{a.commissionType === "percentage" ? `${a.commissionValue}% commission` : `$${a.commissionValue} per sale`}</p>
                  </div>
                  {a.referralCode && (
                    <button className="text-xs text-muted-foreground font-mono hover:text-foreground flex items-center gap-1" onClick={() => { navigator.clipboard.writeText(a.referralCode); toast.success("Code copied"); }}>
                      {a.referralCode}<Copy className="h-3 w-3" />
                    </button>
                  )}
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(a)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: a.id }); }} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent></Card>
        )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Affiliate</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="John Smith" /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Commission Type</Label>
                <Select value={commissionType} onValueChange={(v) => setCommissionType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed">Fixed Amount</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Value {commissionType === "percentage" ? "(%)" : "($)"}</Label><Input type="number" min="0" value={commissionValue} onChange={e => setCommissionValue(e.target.value)} placeholder={commissionType === "percentage" ? "20" : "50"} /></div>
            </div>
            <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={isActive} onCheckedChange={setIsActive} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (!name.trim()) { toast.error("Name required"); return; } createMut.mutate({ orgId: orgId!, name, email, commissionType, commissionValue: commissionValue ? parseFloat(commissionValue) : undefined }); }} disabled={createMut.isPending}>{createMut.isPending ? "Adding..." : "Add Affiliate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent><DialogHeader><DialogTitle>Edit Affiliate</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Commission Type</Label>
                <Select value={commissionType} onValueChange={(v) => setCommissionType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed">Fixed Amount</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Value</Label><Input type="number" min="0" value={commissionValue} onChange={e => setCommissionValue(e.target.value)} /></div>
            </div>
            <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={isActive} onCheckedChange={setIsActive} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (!editId) return; updateMut.mutate({ id: editId, name, commissionType, commissionValue: commissionValue ? parseFloat(commissionValue) : undefined, isActive }); }} disabled={updateMut.isPending}>{updateMut.isPending ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

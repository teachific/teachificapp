import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useOrgScope } from "@/hooks/useOrgScope";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Plus, MoreVertical, Edit, Trash2, UserPlus, GraduationCap } from "lucide-react";

export default function GroupsPage() {
  const { orgId, ready } = useOrgScope();
  const utils = trpc.useUtils();
  const { data: groups, isLoading } = trpc.lms.groups.list.useQuery({ orgId: orgId! }, { enabled: ready && !!orgId });
  const { data: courses } = trpc.lms.courses.list.useQuery({ orgId: orgId! }, { enabled: ready && !!orgId });

  const createMut = trpc.lms.groups.create.useMutation({
    onSuccess: () => { utils.lms.groups.list.invalidate(); toast.success("Group created"); setCreateOpen(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.lms.groups.update.useMutation({
    onSuccess: () => { utils.lms.groups.list.invalidate(); toast.success("Group updated"); setEditOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.lms.groups.delete.useMutation({
    onSuccess: () => { utils.lms.groups.list.invalidate(); toast.success("Group deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const addMemberMut = trpc.lms.groups.addMember.useMutation({
    onSuccess: () => { utils.lms.groups.list.invalidate(); toast.success("Member added"); setAddMemberOpen(false); setMemberEmail(""); setMemberName(""); },
    onError: (e) => toast.error(e.message),
  });
  const bulkEnrollMut = trpc.lms.groups.bulkEnroll.useMutation({
    onSuccess: (res) => {
      toast.success(`Enrolled ${res.enrolled} member${res.enrolled !== 1 ? "s" : ""}${res.skipped > 0 ? ` (${res.skipped} already enrolled)` : ""}`);
      setBulkEnrollOpen(false);
      setBulkCourseId("");
      setBulkEnrollGroupId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [bulkEnrollOpen, setBulkEnrollOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [addMemberGroupId, setAddMemberGroupId] = useState<number | null>(null);
  const [bulkEnrollGroupId, setBulkEnrollGroupId] = useState<number | null>(null);
  const [bulkCourseId, setBulkCourseId] = useState("");
  const [name, setName] = useState(""); const [managerName, setManagerName] = useState(""); const [seats, setSeats] = useState("10"); const [notes, setNotes] = useState("");
  const [memberEmail, setMemberEmail] = useState(""); const [memberName, setMemberName] = useState("");

  const resetForm = () => { setName(""); setManagerName(""); setSeats("10"); setNotes(""); };
  const handleCreate = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    createMut.mutate({ orgId: orgId!, name, managerName: managerName || undefined, seats: parseInt(seats) || 10, notes: notes || undefined });
  };
  const openEdit = (g: any) => { setEditId(g.id); setName(g.name); setManagerName(g.managerName ?? ""); setSeats(String(g.seats)); setNotes(g.notes ?? ""); setEditOpen(true); };
  const handleUpdate = () => {
    if (!editId || !name.trim()) return;
    updateMut.mutate({ id: editId, name, managerName: managerName || undefined, seats: parseInt(seats) || 10, notes: notes || undefined });
  };
  const totalSeats = groups?.reduce((s, g) => s + g.seats, 0) ?? 0;
  const usedSeats = groups?.reduce((s, g) => s + g.usedSeats, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" />Groups</h1><p className="text-muted-foreground mt-0.5">Manage group seat registrations and bulk course enrollments</p></div>
        <Button className="gap-2" onClick={() => { resetForm(); setCreateOpen(true); }}><Plus className="h-4 w-4" />New Group</Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[{ l: "Total Groups", v: groups?.length ?? 0 }, { l: "Total Seats", v: totalSeats }, { l: "Seats Used", v: usedSeats }].map(s => (
          <Card key={s.l}><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{s.l}</p><p className="text-3xl font-bold">{s.v}</p></CardContent></Card>
        ))}
      </div>
      {isLoading ? <div className="grid gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
        : !groups?.length ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Users className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">No groups yet. Create a group to manage seat-based enrollments.</p>
            <Button onClick={() => { resetForm(); setCreateOpen(true); }}><Plus className="h-4 w-4 mr-2" />Create Group</Button>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {groups.map(g => (
              <Card key={g.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1"><CardTitle className="text-base">{g.name}</CardTitle>{g.managerName && <p className="text-xs text-muted-foreground mt-0.5">Manager: {g.managerName}</p>}</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => { setAddMemberGroupId(g.id); setAddMemberOpen(true); }}>
                        <UserPlus className="h-3.5 w-3.5" />Add Member
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => { setBulkEnrollGroupId(g.id); setBulkEnrollOpen(true); }}>
                        <GraduationCap className="h-3.5 w-3.5" />Enroll in Course
                      </Button>
                      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(g)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { if (confirm("Delete this group?")) deleteMut.mutate({ id: g.id }); }} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm mb-2"><span className="text-muted-foreground">Seat usage</span><span className="font-medium">{g.usedSeats} / {g.seats} seats</span></div>
                  <Progress value={g.seats > 0 ? (g.usedSeats / g.seats) * 100 : 0} className="h-2" />
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant={g.usedSeats >= g.seats ? "destructive" : "secondary"} className="text-xs">{g.usedSeats >= g.seats ? "Full" : `${g.seats - g.usedSeats} seats available`}</Badge>
                    {g.expiresAt && <span className="text-xs text-muted-foreground">Expires {new Date(g.expiresAt).toLocaleDateString()}</span>}
                  </div>
                  {g.notes && <p className="text-xs text-muted-foreground mt-2 italic">{g.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      {/* Create Group Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent><DialogHeader><DialogTitle>New Group</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Group Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Echo Fundamentals — Batch 1" /></div>
            <div className="space-y-2"><Label>Group Manager</Label><Input value={managerName} onChange={e => setManagerName(e.target.value)} placeholder="HR Department" /></div>
            <div className="space-y-2"><Label>Number of Seats</Label><Input type="number" min="1" value={seats} onChange={e => setSeats(e.target.value)} /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={createMut.isPending}>{createMut.isPending ? "Creating..." : "Create Group"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent><DialogHeader><DialogTitle>Edit Group</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Group Name *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Group Manager</Label><Input value={managerName} onChange={e => setManagerName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Number of Seats</Label><Input type="number" min="1" value={seats} onChange={e => setSeats(e.target.value)} /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={handleUpdate} disabled={updateMut.isPending}>{updateMut.isPending ? "Saving..." : "Save Changes"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Member to Group</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="member@example.com" /></div>
            <div className="space-y-2"><Label>Name</Label><Input value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="Optional" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button><Button onClick={() => { if (!memberEmail.trim() || !addMemberGroupId) return; addMemberMut.mutate({ groupId: addMemberGroupId, email: memberEmail, name: memberName || undefined }); }} disabled={addMemberMut.isPending}>{addMemberMut.isPending ? "Adding..." : "Add Member"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Enroll Dialog */}
      <Dialog open={bulkEnrollOpen} onOpenChange={(open) => { setBulkEnrollOpen(open); if (!open) { setBulkCourseId(""); setBulkEnrollGroupId(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Bulk Enroll Group in Course
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              All members of this group will be enrolled in the selected course. Members who are already enrolled will be skipped automatically.
            </p>
            <div className="space-y-2">
              <Label>Select Course *</Label>
              <Select value={bulkCourseId} onValueChange={setBulkCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course..." />
                </SelectTrigger>
                <SelectContent>
                  {(courses || []).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!courses?.length && (
                <p className="text-xs text-muted-foreground">No courses available. Create a course first.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEnrollOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!bulkEnrollGroupId || !bulkCourseId) { toast.error("Please select a course"); return; }
                bulkEnrollMut.mutate({ groupId: bulkEnrollGroupId, courseId: parseInt(bulkCourseId) });
              }}
              disabled={bulkEnrollMut.isPending || !bulkCourseId}
            >
              {bulkEnrollMut.isPending ? "Enrolling..." : "Enroll All Members"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

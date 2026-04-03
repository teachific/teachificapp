import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Users, UserPlus, Trash2, UserCheck, Mail, Phone, Briefcase, Package } from "lucide-react";

export default function GroupManagerPortalPage() {
  const utils = trpc.useUtils();
  const { data: groups, isLoading } = trpc.lms.groups.listManaged.useQuery();

  const assignSeatMut = trpc.lms.groups.assignSeat.useMutation({
    onSuccess: () => {
      utils.lms.groups.listManaged.invalidate();
      toast.success("Seat assigned");
      setAssignOpen(false);
      setEmail(""); setName("");
    },
    onError: (e) => toast.error(e.message),
  });
  const revokeSeatMut = trpc.lms.groups.revokeSeat.useMutation({
    onSuccess: () => { utils.lms.groups.listManaged.invalidate(); toast.success("Seat revoked"); },
    onError: (e) => toast.error(e.message),
  });

  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const openAssign = (groupId: number) => {
    setSelectedGroupId(groupId);
    setEmail(""); setName("");
    setAssignOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!groups?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Users className="h-12 w-12 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold">No Groups Assigned</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          You have not been assigned as a manager for any groups yet. Contact your platform administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-primary" />Group Manager Portal
        </h1>
        <p className="text-muted-foreground mt-0.5">
          Manage seat assignments for your assigned groups
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Groups Managed</p>
          <p className="text-3xl font-bold">{(groups as any[]).length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Total Seats</p>
          <p className="text-3xl font-bold">{(groups as any[]).reduce((s: number, g: any) => s + g.seats, 0)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Seats Used</p>
          <p className="text-3xl font-bold">{(groups as any[]).reduce((s: number, g: any) => s + g.usedSeats, 0)}</p>
        </CardContent></Card>
      </div>

      {/* Groups */}
      <div className="space-y-6">
        {(groups as any[]).map((g: any) => (
          <Card key={g.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{g.name}</CardTitle>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {g.managerTitle && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />{g.managerTitle}
                      </span>
                    )}
                    {g.managerEmail && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />{g.managerEmail}
                      </span>
                    )}
                    {g.managerPhone && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />{g.managerPhone}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={g.usedSeats >= g.seats}
                  onClick={() => openAssign(g.id)}
                >
                  <UserPlus className="h-4 w-4" />
                  {g.usedSeats >= g.seats ? "No Seats Left" : "Assign Seat"}
                </Button>
              </div>
              {/* Seat progress */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">Seat usage</span>
                  <span className="font-medium">{g.usedSeats} / {g.seats}</span>
                </div>
                <Progress value={g.seats > 0 ? (g.usedSeats / g.seats) * 100 : 0} className="h-2" />
                <div className="flex items-center justify-between mt-1.5">
                  <Badge variant={g.usedSeats >= g.seats ? "destructive" : "secondary"} className="text-xs">
                    {g.usedSeats >= g.seats ? "Full" : `${g.seats - g.usedSeats} seats available`}
                  </Badge>
                </div>
              </div>
              {/* Assigned products */}
              {g.productIds && (() => {
                try {
                  const ids: number[] = JSON.parse(g.productIds);
                  if (!ids.length) return null;
                  return (
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Enrolled in:</span>
                      {ids.map((id: number) => (
                        <Badge key={id} variant="outline" className="text-xs">Course #{id}</Badge>
                      ))}
                    </div>
                  );
                } catch { return null; }
              })()}
            </CardHeader>
            <CardContent>
              {/* Members list */}
              {!g.members?.length ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No members yet. Use "Assign Seat" to add members.</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Members</p>
                  <div className="divide-y border rounded-lg">
                    {g.members.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium">{m.name || m.email}</p>
                          {m.name && <p className="text-xs text-muted-foreground">{m.email}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={m.status === "active" ? "default" : "secondary"} className="text-xs">
                            {m.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm(`Revoke seat for ${m.name || m.email}?`)) {
                                revokeSeatMut.mutate({ memberId: m.id });
                              }
                            }}
                            disabled={revokeSeatMut.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assign Seat Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />Assign Seat
            </DialogTitle>
            <DialogDescription>
              Enter the learner's email to assign them a seat in this group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="learner@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!email.trim() || !selectedGroupId) { toast.error("Email is required"); return; }
                assignSeatMut.mutate({ groupId: selectedGroupId, email, name: name || undefined });
              }}
              disabled={assignSeatMut.isPending}
            >
              {assignSeatMut.isPending ? "Assigning..." : "Assign Seat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Users, Plus, Settings, UserPlus } from "lucide-react";

interface Group { id: number; name: string; manager: string; seats: number; used: number; org: string; expires: string; }

const MOCK: Group[] = [
  { id: 1, name: "Echo Fundamentals — Batch 1", manager: "Dr. Lara Williams", seats: 25, used: 18, org: "All About Ultrasound", expires: "2026-12-31" },
  { id: 2, name: "POCUS Essentials — City Med", manager: "Admin Team", seats: 10, used: 10, org: "City Medical Center", expires: "2026-06-30" },
  { id: 3, name: "Advanced Echo — Regional", manager: "HR Dept", seats: 50, used: 12, org: "Regional Hospital", expires: "2027-01-01" },
];

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>(MOCK);
  const [show, setShow] = useState(false);
  const [name, setName] = useState(""); const [manager, setManager] = useState(""); const [seats, setSeats] = useState(""); const [org, setOrg] = useState(""); const [expires, setExpires] = useState("");
  const create = () => {
    if (!name.trim() || !seats) { toast.error("Name and seats required"); return; }
    setGroups(p => [{ id: Date.now(), name, manager, seats: parseInt(seats), used: 0, org, expires }, ...p]);
    setShow(false); setName(""); setManager(""); setSeats(""); setOrg(""); setExpires("");
    toast.success("Group created");
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" />Groups</h1>
          <p className="text-muted-foreground mt-0.5">Manage group seat registrations and seat assignments</p>
        </div>
        <Button className="gap-2" onClick={() => setShow(true)}><Plus className="h-4 w-4" />New Group</Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[{ l: "Total Groups", v: groups.length }, { l: "Total Seats", v: groups.reduce((s, g) => s + g.seats, 0) }, { l: "Seats Used", v: groups.reduce((s, g) => s + g.used, 0) }].map(s => (
          <Card key={s.l}><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{s.l}</p><p className="text-3xl font-bold">{s.v}</p></CardContent></Card>
        ))}
      </div>
      <div className="grid gap-4">
        {groups.map(g => (
          <Card key={g.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{g.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{g.org} · Manager: {g.manager}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.info("Assign seats coming soon")}><UserPlus className="h-3.5 w-3.5" />Assign Seats</Button>
                  <Button variant="ghost" size="sm" onClick={() => toast.info("Settings coming soon")}><Settings className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Seat usage</span>
                <span className="font-medium">{g.used} / {g.seats} seats</span>
              </div>
              <Progress value={(g.used / g.seats) * 100} className="h-2" />
              <div className="flex items-center justify-between mt-3">
                <Badge variant={g.used >= g.seats ? "destructive" : "secondary"} className="text-xs">{g.used >= g.seats ? "Full" : `${g.seats - g.used} seats available`}</Badge>
                <span className="text-xs text-muted-foreground">Expires {g.expires}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent><DialogHeader><DialogTitle>New Group</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Group Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Echo Fundamentals — Batch 1" /></div>
            <div className="space-y-2"><Label>Organization</Label><Input value={org} onChange={e => setOrg(e.target.value)} placeholder="City Medical Center" /></div>
            <div className="space-y-2"><Label>Group Seat Manager</Label><Input value={manager} onChange={e => setManager(e.target.value)} placeholder="HR Department" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Number of Seats</Label><Input type="number" min="1" value={seats} onChange={e => setSeats(e.target.value)} placeholder="25" /></div>
              <div className="space-y-2"><Label>Expiry Date</Label><Input type="date" value={expires} onChange={e => setExpires(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShow(false)}>Cancel</Button><Button onClick={create}>Create Group</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

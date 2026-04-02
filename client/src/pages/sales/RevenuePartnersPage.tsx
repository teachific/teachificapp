import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Handshake, Plus, Percent, DollarSign } from "lucide-react";

interface Partner { id: number; name: string; email: string; share: number; courses: string[]; totalEarned: number; status: "active" | "inactive"; }

const MOCK: Partner[] = [
  { id: 1, name: "Dr. Sarah Chen", email: "sarah@example.com", share: 30, courses: ["Advanced Cardiology", "ECG Mastery"], totalEarned: 4820, status: "active" },
  { id: 2, name: "Prof. James Wright", email: "james@example.com", share: 25, courses: ["Leadership Fundamentals"], totalEarned: 1250, status: "active" },
  { id: 3, name: "Maria Lopez", email: "maria@example.com", share: 20, courses: ["Spanish for Healthcare"], totalEarned: 680, status: "inactive" },
];

export default function RevenuePartnersPage() {
  const [partners, setPartners] = useState<Partner[]>(MOCK);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [share, setShare] = useState("");

  const handleCreate = () => {
    if (!name || !email || !share) { toast.error("All fields required"); return; }
    setPartners(prev => [...prev, { id: Date.now(), name, email, share: Number(share), courses: [], totalEarned: 0, status: "active" }]);
    setName(""); setEmail(""); setShare(""); setShowAdd(false);
    toast.success("Revenue partner added");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Handshake className="w-6 h-6 text-teal-600" /> Revenue Partners</h1>
          <p className="text-muted-foreground mt-1">Share revenue with instructors and content partners on specific course sales</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-teal-600 hover:bg-teal-700 text-white"><Plus className="w-4 h-4 mr-2" /> Add Partner</Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{partners.filter(p => p.status === "active").length}</p><p className="text-sm text-muted-foreground">Active Partners</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">${partners.reduce((s, p) => s + p.totalEarned, 0).toLocaleString()}</p><p className="text-sm text-muted-foreground">Total Paid Out</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{partners.reduce((s, p) => s + p.courses.length, 0)}</p><p className="text-sm text-muted-foreground">Courses Shared</p></CardContent></Card>
      </div>
      <div className="grid gap-4">
        {partners.map(p => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{p.name}</span>
                    <Badge className={p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>{p.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.email}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.courses.map(c => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                    {p.courses.length === 0 && <span className="text-xs text-muted-foreground">No courses assigned</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-lg font-bold text-teal-600"><Percent className="w-4 h-4" />{p.share}% share</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground"><DollarSign className="w-3 h-3" />${p.totalEarned.toLocaleString()} earned</div>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => toast.info("Opening partner settings...")}>Manage</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Revenue Partner</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Jane Smith" className="mt-1" /></div>
            <div><Label>Email Address</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" className="mt-1" /></div>
            <div><Label>Revenue Share (%)</Label><Input type="number" min="1" max="99" value={share} onChange={e => setShare(e.target.value)} placeholder="30" className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="bg-teal-600 hover:bg-teal-700 text-white">Add Partner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

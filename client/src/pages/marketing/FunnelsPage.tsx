import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { GitBranch, Plus, Eye, ArrowRight } from "lucide-react";

interface Funnel { id: number; name: string; steps: number; visitors: number; conversions: number; active: boolean; }

const MOCK: Funnel[] = [
  { id: 1, name: "Echo Fundamentals Launch", steps: 4, visitors: 342, conversions: 28, active: true },
  { id: 2, name: "Free POCUS Webinar Signup", steps: 3, visitors: 189, conversions: 67, active: true },
  { id: 3, name: "Pro Membership Upsell", steps: 2, visitors: 98, conversions: 12, active: false },
];

export default function FunnelsPage() {
  const [funnels, setFunnels] = useState<Funnel[]>(MOCK);
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><GitBranch className="h-6 w-6 text-primary" />Funnels</h1><p className="text-muted-foreground mt-0.5">Build conversion funnels with landing pages and automated follow-ups</p></div>
        <Button className="gap-2" onClick={() => setShow(true)}><Plus className="h-4 w-4" />New Funnel</Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[{ l: "Funnels", v: funnels.length }, { l: "Total Visitors", v: funnels.reduce((s, f) => s + f.visitors, 0) }, { l: "Total Conversions", v: funnels.reduce((s, f) => s + f.conversions, 0) }].map(s => (
          <Card key={s.l}><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{s.l}</p><p className="text-3xl font-bold">{s.v}</p></CardContent></Card>
        ))}
      </div>
      <div className="grid gap-4">
        {funnels.map(f => (
          <Card key={f.id} className={!f.active ? "opacity-60" : ""}>
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.steps} steps · {f.visitors} visitors · {f.conversions} conversions ({f.visitors > 0 ? Math.round((f.conversions / f.visitors) * 100) : 0}%)</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={f.active ? "default" : "secondary"} className="text-xs">{f.active ? "Active" : "Paused"}</Badge>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.info("Funnel builder coming soon")}><Eye className="h-3.5 w-3.5" />View</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent><DialogHeader><DialogTitle>New Funnel</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Funnel Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Echo Fundamentals Launch" /></div>
            <p className="text-xs text-muted-foreground">After creating the funnel, use the funnel builder to add landing pages, opt-in forms, and follow-up sequences.</p>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShow(false)}>Cancel</Button><Button onClick={() => { if (!name.trim()) { toast.error("Name required"); return; } setFunnels(p => [{ id: Date.now(), name, steps: 0, visitors: 0, conversions: 0, active: true }, ...p]); setShow(false); setName(""); toast.success("Funnel created"); }}>Create Funnel</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

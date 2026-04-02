import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CreditCard, Plus, Users } from "lucide-react";

interface Plan { id: number; name: string; price: number; interval: string; members: number; active: boolean; description: string; }

const MOCK: Plan[] = [
  { id: 1, name: "Basic Access", price: 29, interval: "monthly", members: 45, active: true, description: "Access to all beginner courses" },
  { id: 2, name: "Pro Membership", price: 79, interval: "monthly", members: 128, active: true, description: "Full access to all courses and downloads" },
  { id: 3, name: "Annual All-Access", price: 599, interval: "yearly", members: 34, active: true, description: "Best value — all content for a full year" },
];

export default function MembershipsPage() {
  const [plans, setPlans] = useState<Plan[]>(MOCK);
  const [show, setShow] = useState(false);
  const [name, setName] = useState(""); const [price, setPrice] = useState(""); const [interval, setInterval] = useState("monthly"); const [desc, setDesc] = useState("");
  const create = () => {
    if (!name.trim() || !price) { toast.error("Name and price required"); return; }
    setPlans(p => [{ id: Date.now(), name, price: parseFloat(price), interval, members: 0, active: true, description: desc }, ...p]);
    setShow(false); setName(""); setPrice(""); setInterval("monthly"); setDesc(""); toast.success("Membership plan created");
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="h-6 w-6 text-primary" />Memberships</h1><p className="text-muted-foreground mt-0.5">Create and manage recurring membership plans</p></div>
        <Button className="gap-2" onClick={() => setShow(true)}><Plus className="h-4 w-4" />New Plan</Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[{ l: "Plans", v: plans.length }, { l: "Active Members", v: plans.reduce((s, p) => s + p.members, 0) }, { l: "Est. MRR", v: "$" + plans.filter(p => p.interval === "monthly").reduce((s, p) => s + p.price * p.members, 0).toLocaleString() }].map(s => (
          <Card key={s.l}><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{s.l}</p><p className="text-3xl font-bold">{s.v}</p></CardContent></Card>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map(p => (
          <Card key={p.id} className={!p.active ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                </div>
                <Switch checked={p.active} onCheckedChange={() => { setPlans(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x)); toast.success("Updated"); }} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${p.price}<span className="text-sm font-normal text-muted-foreground">/{p.interval}</span></div>
              <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground"><Users className="h-4 w-4" />{p.members} members</div>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => toast.info("Edit plan coming soon")}>Edit Plan</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent><DialogHeader><DialogTitle>New Membership Plan</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Plan Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Pro Membership" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="What's included..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Price</Label><Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="79" /></div>
              <div className="space-y-2"><Label>Billing Interval</Label><Select value={interval} onValueChange={setInterval}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem><SelectItem value="weekly">Weekly</SelectItem></SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShow(false)}>Cancel</Button><Button onClick={create}>Create Plan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

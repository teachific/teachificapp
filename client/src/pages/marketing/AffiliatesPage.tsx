import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Share2, Plus, Copy, DollarSign } from "lucide-react";

interface Affiliate { id: number; name: string; email: string; commission: number; clicks: number; conversions: number; earned: number; status: "active" | "pending"; }

const MOCK: Affiliate[] = [
  { id: 1, name: "Dr. Sarah Chen", email: "sarah@example.com", commission: 20, clicks: 234, conversions: 18, earned: 2340, status: "active" },
  { id: 2, name: "Echo Academy", email: "info@echoacademy.com", commission: 15, clicks: 89, conversions: 7, earned: 735, status: "active" },
  { id: 3, name: "James Wilson", email: "james@example.com", commission: 20, clicks: 12, conversions: 0, earned: 0, status: "pending" },
];

export default function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>(MOCK);
  const [show, setShow] = useState(false);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [commission, setCommission] = useState("20");
  const create = () => {
    if (!name.trim() || !email.trim()) { toast.error("Name and email required"); return; }
    setAffiliates(p => [{ id: Date.now(), name, email, commission: parseInt(commission), clicks: 0, conversions: 0, earned: 0, status: "pending" }, ...p]);
    setShow(false); setName(""); setEmail(""); setCommission("20"); toast.success("Affiliate added");
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Share2 className="h-6 w-6 text-primary" />Affiliates</h1><p className="text-muted-foreground mt-0.5">Manage affiliate partners and track referral performance</p></div>
        <Button className="gap-2" onClick={() => setShow(true)}><Plus className="h-4 w-4" />Add Affiliate</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ l: "Affiliates", v: affiliates.length }, { l: "Total Clicks", v: affiliates.reduce((s, a) => s + a.clicks, 0) }, { l: "Conversions", v: affiliates.reduce((s, a) => s + a.conversions, 0) }, { l: "Total Paid", v: "$" + affiliates.reduce((s, a) => s + a.earned, 0).toLocaleString() }].map(s => (
          <Card key={s.l}><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{s.l}</p><p className="text-3xl font-bold">{s.v}</p></CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Affiliate</TableHead><TableHead>Commission</TableHead><TableHead>Clicks</TableHead><TableHead>Conversions</TableHead><TableHead>Earned</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>{affiliates.map(a => (
            <TableRow key={a.id}>
              <TableCell><div><p className="font-medium text-sm">{a.name}</p><p className="text-xs text-muted-foreground">{a.email}</p></div></TableCell>
              <TableCell className="font-medium">{a.commission}%</TableCell>
              <TableCell className="text-sm">{a.clicks}</TableCell>
              <TableCell className="text-sm">{a.conversions}</TableCell>
              <TableCell className="font-medium">${a.earned.toLocaleString()}</TableCell>
              <TableCell><Badge variant={a.status === "active" ? "default" : "secondary"} className="text-xs capitalize">{a.status}</Badge></TableCell>
              <TableCell><div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(`https://teachific.app/?ref=${a.id}`); toast.success("Link copied!"); }}><Copy className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => toast.info("Payout coming soon")}><DollarSign className="h-4 w-4" /></Button>
              </div></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </CardContent></Card>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent><DialogHeader><DialogTitle>Add Affiliate</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Sarah Chen" /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@example.com" /></div>
            <div className="space-y-2"><Label>Commission Rate (%)</Label><Input type="number" min="1" max="99" value={commission} onChange={e => setCommission(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShow(false)}>Cancel</Button><Button onClick={create}>Add Affiliate</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

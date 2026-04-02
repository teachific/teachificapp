import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Package, Plus, ShoppingCart } from "lucide-react";

interface Bundle { id: number; name: string; price: number; items: string[]; sales: number; active: boolean; description: string; }

const MOCK: Bundle[] = [
  { id: 1, name: "Echo Mastery Bundle", price: 299, items: ["Echo Fundamentals", "Advanced Echo", "Echo Certification Prep"], sales: 42, active: true, description: "Complete echo training path" },
  { id: 2, name: "POCUS Starter Pack", price: 149, items: ["POCUS Essentials", "Probe Guide PDF"], sales: 28, active: true, description: "Everything to get started with POCUS" },
];

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>(MOCK);
  const [show, setShow] = useState(false);
  const [name, setName] = useState(""); const [price, setPrice] = useState(""); const [desc, setDesc] = useState("");
  const create = () => {
    if (!name.trim() || !price) { toast.error("Name and price required"); return; }
    setBundles(p => [{ id: Date.now(), name, price: parseFloat(price), items: [], sales: 0, active: true, description: desc }, ...p]);
    setShow(false); setName(""); setPrice(""); setDesc(""); toast.success("Bundle created");
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6 text-primary" />Bundles</h1><p className="text-muted-foreground mt-0.5">Group courses and products into discounted bundles</p></div>
        <Button className="gap-2" onClick={() => setShow(true)}><Plus className="h-4 w-4" />New Bundle</Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[{ l: "Bundles", v: bundles.length }, { l: "Total Sales", v: bundles.reduce((s, b) => s + b.sales, 0) }, { l: "Revenue", v: "$" + bundles.reduce((s, b) => s + b.price * b.sales, 0).toLocaleString() }].map(s => (
          <Card key={s.l}><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{s.l}</p><p className="text-3xl font-bold">{s.v}</p></CardContent></Card>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {bundles.map(b => (
          <Card key={b.id} className={!b.active ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div><CardTitle className="text-base">{b.name}</CardTitle><CardDescription>{b.description}</CardDescription></div>
                <Switch checked={b.active} onCheckedChange={() => { setBundles(p => p.map(x => x.id === b.id ? { ...x, active: !x.active } : x)); toast.success("Updated"); }} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-3">${b.price}</div>
              <div className="flex flex-wrap gap-1 mb-3">{b.items.map(item => <Badge key={item} variant="secondary" className="text-xs">{item}</Badge>)}</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><ShoppingCart className="h-4 w-4" />{b.sales} sales</div>
                <Button variant="outline" size="sm" onClick={() => toast.info("Bundle editor coming soon")}>Edit Bundle</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent><DialogHeader><DialogTitle>New Bundle</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Bundle Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Echo Mastery Bundle" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="What's included..." /></div>
            <div className="space-y-2"><Label>Bundle Price ($)</Label><Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="299" /></div>
            <p className="text-xs text-muted-foreground">After creating the bundle, add courses and products from the bundle editor.</p>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShow(false)}>Cancel</Button><Button onClick={create}>Create Bundle</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

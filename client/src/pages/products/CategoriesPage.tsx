import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FolderOpen, Plus, GripVertical, Pencil, Trash2 } from "lucide-react";

interface Category { id: number; name: string; slug: string; courses: number; color: string; }

const MOCK: Category[] = [
  { id: 1, name: "Echocardiography", slug: "echocardiography", courses: 5, color: "#0ea5e9" },
  { id: 2, name: "POCUS", slug: "pocus", courses: 3, color: "#10b981" },
  { id: 3, name: "Advanced Imaging", slug: "advanced-imaging", courses: 2, color: "#8b5cf6" },
  { id: 4, name: "Certification Prep", slug: "certification-prep", courses: 4, color: "#f59e0b" },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(MOCK);
  const [show, setShow] = useState(false);
  const [name, setName] = useState(""); const [color, setColor] = useState("#0ea5e9");
  const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const create = () => {
    if (!name.trim()) { toast.error("Name required"); return; }
    setCategories(p => [...p, { id: Date.now(), name, slug: toSlug(name), courses: 0, color }]);
    setShow(false); setName(""); setColor("#0ea5e9"); toast.success("Category created");
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><FolderOpen className="h-6 w-6 text-primary" />Categories</h1><p className="text-muted-foreground mt-0.5">Organize your courses and content into categories for the storefront catalog</p></div>
        <Button className="gap-2" onClick={() => setShow(true)}><Plus className="h-4 w-4" />New Category</Button>
      </div>
      <Card><CardContent className="p-0">
        <div className="divide-y">
          {categories.map((cat, i) => (
            <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{cat.name}</p>
                <p className="text-xs text-muted-foreground">/{cat.slug} · {cat.courses} courses</p>
              </div>
              <Badge variant="secondary" className="text-xs">{cat.courses} courses</Badge>
              <Button variant="ghost" size="sm" onClick={() => toast.info("Edit coming soon")}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setCategories(p => p.filter(c => c.id !== cat.id)); toast.success("Deleted"); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {categories.length === 0 && <div className="text-center py-12 text-muted-foreground">No categories yet. Create one to organize your catalog.</div>}
        </div>
      </CardContent></Card>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent><DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Category Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Echocardiography" /></div>
            {name && <p className="text-xs text-muted-foreground">Slug: /{toSlug(name)}</p>}
            <div className="space-y-2"><Label>Color</Label><div className="flex items-center gap-3"><input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-9 w-16 rounded border cursor-pointer" /><span className="text-sm text-muted-foreground">{color}</span></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShow(false)}>Cancel</Button><Button onClick={create}>Create Category</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

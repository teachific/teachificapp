import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Award, Plus, Download, Eye } from "lucide-react";

interface Template { id: number; name: string; courses: number; issued: number; active: boolean; }

const TEMPLATES: Template[] = [
  { id: 1, name: "Course Completion Certificate", courses: 5, issued: 142, active: true },
  { id: 2, name: "Advanced Echo Certification", courses: 2, issued: 38, active: true },
  { id: 3, name: "POCUS Competency Certificate", courses: 1, issued: 12, active: false },
];

const ISSUED = [
  { id: 1, member: "Alice Martin", course: "Echo Fundamentals", template: "Course Completion Certificate", date: "2026-04-01" },
  { id: 2, member: "Bob Kim", course: "POCUS Essentials", template: "POCUS Competency Certificate", date: "2026-03-28" },
  { id: 3, member: "Carol Torres", course: "Advanced Echo", template: "Advanced Echo Certification", date: "2026-03-15" },
];

export default function MemberCertificatesPage() {
  const [templates, setTemplates] = useState<Template[]>(TEMPLATES);
  const [show, setShow] = useState(false);
  const [tName, setTName] = useState("");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Award className="h-6 w-6 text-primary" />Certificates</h1><p className="text-muted-foreground mt-0.5">Create certificate templates and manage automated completion flows</p></div>
        <Button className="gap-2" onClick={() => setShow(true)}><Plus className="h-4 w-4" />New Template</Button>
      </div>
      <Tabs defaultValue="templates">
        <TabsList><TabsTrigger value="templates">Templates</TabsTrigger><TabsTrigger value="issued">Issued Certificates</TabsTrigger></TabsList>
        <TabsContent value="templates" className="mt-4">
          <div className="grid gap-4">
            {templates.map(t => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{t.name}</CardTitle>
                      <CardDescription>{t.courses} course{t.courses !== 1 ? "s" : ""} linked · {t.issued} issued</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={t.active} onCheckedChange={() => { setTemplates(p => p.map(x => x.id === t.id ? { ...x, active: !x.active } : x)); toast.success("Updated"); }} />
                      <Button variant="outline" size="sm" onClick={() => toast.info("Template editor coming soon")}><Eye className="h-4 w-4 mr-1" />Preview</Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="issued" className="mt-4">
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b"><tr className="text-left">{["Member", "Course", "Template", "Date", ""].map(h => <th key={h} className="px-4 py-3 font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody>{ISSUED.map(c => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{c.member}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.course}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{c.template}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{c.date}</td>
                  <td className="px-4 py-3"><Button variant="ghost" size="sm" onClick={() => toast.info("Download coming soon")}><Download className="h-4 w-4" /></Button></td>
                </tr>
              ))}</tbody>
            </table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent><DialogHeader><DialogTitle>New Certificate Template</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Template Name</Label><Input value={tName} onChange={e => setTName(e.target.value)} placeholder="Course Completion Certificate" /></div>
            <p className="text-xs text-muted-foreground">After creating the template, you can link it to courses in the Course Builder settings tab.</p>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShow(false)}>Cancel</Button><Button onClick={() => { if (!tName.trim()) { toast.error("Name required"); return; } setTemplates(p => [{ id: Date.now(), name: tName, courses: 0, issued: 0, active: true }, ...p]); setShow(false); setTName(""); toast.success("Template created"); }}>Create Template</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

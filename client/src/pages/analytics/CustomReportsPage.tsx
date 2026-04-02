import { useState } from "react";
import { useOrgScope } from "@/hooks/useOrgScope";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Plus, Play, Download, Trash2, Clock } from "lucide-react";

const SAMPLE_REPORTS = [
  { id: 1, name: "Monthly Revenue Summary", type: "Revenue", lastRun: "2 hours ago", status: "ready" },
  { id: 2, name: "Student Progress Overview", type: "Engagement", lastRun: "1 day ago", status: "ready" },
  { id: 3, name: "Course Completion Funnel", type: "Engagement", lastRun: "3 days ago", status: "ready" },
];

export default function CustomReportsPage() {
  const [reports, setReports] = useState(SAMPLE_REPORTS);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Revenue");
  const { showOrgSelector, orgId, orgs, setSelectedOrgId } = useOrgScope();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-primary" />Custom Reports</h1>
          <p className="text-muted-foreground mt-0.5">Build and schedule custom reports for your organization</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {showOrgSelector && (
            <Select value={String(orgId ?? "")} onValueChange={(v) => setSelectedOrgId(v ? Number(v) : null)}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select org" /></SelectTrigger>
              <SelectContent>{orgs.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Button className="gap-2" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" />New Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.map(r => (
          <Card key={r.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{r.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-xs">{r.type}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Last run: {r.lastRun}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.success(`Running "${r.name}"…`)}>
                  <Play className="h-3.5 w-3.5" />Run
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.info("Download coming soon")}>
                  <Download className="h-3.5 w-3.5" />Export
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setReports(prev => prev.filter(x => x.id !== r.id))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Custom Report</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Report Name</Label>
              <Input placeholder="e.g. Q2 Revenue Summary" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Report Type</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Revenue">Revenue</SelectItem>
                  <SelectItem value="Engagement">Engagement</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Enrollment">Enrollment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!newName.trim()) { toast.error("Report name is required"); return; }
              setReports(prev => [...prev, { id: Date.now(), name: newName, type: newType, lastRun: "Never", status: "ready" }]);
              setNewName(""); setCreateOpen(false);
              toast.success("Report created");
            }}>Create Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

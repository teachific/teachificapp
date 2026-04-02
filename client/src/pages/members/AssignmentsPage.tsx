import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ClipboardList, Plus, Eye, CheckCircle } from "lucide-react";

interface Assignment { id: number; title: string; course: string; dueDate: string; submissions: number; status: "active" | "draft" | "closed"; }

const MOCK: Assignment[] = [
  { id: 1, title: "Echo Image Interpretation — Module 3", course: "Echo Fundamentals", dueDate: "2026-04-15", submissions: 12, status: "active" },
  { id: 2, title: "POCUS Probe Placement Quiz", course: "POCUS Essentials", dueDate: "2026-04-20", submissions: 5, status: "active" },
  { id: 3, title: "Doppler Waveform Analysis", course: "Advanced Echo", dueDate: "2026-03-31", submissions: 8, status: "closed" },
];

const SUBMISSIONS = [
  { id: 1, member: "Alice Martin", assignment: "Echo Image Interpretation — Module 3", submitted: "2026-04-10", grade: "A", status: "graded" },
  { id: 2, member: "Bob Kim", assignment: "POCUS Probe Placement Quiz", submitted: "2026-04-12", grade: null, status: "pending" },
  { id: 3, member: "Carol Torres", assignment: "Echo Image Interpretation — Module 3", submitted: "2026-04-11", grade: "B+", status: "graded" },
];

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>(MOCK);
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState(""); const [course, setCourse] = useState(""); const [dueDate, setDueDate] = useState(""); const [desc, setDesc] = useState("");
  const create = () => {
    if (!title.trim() || !course) { toast.error("Title and course required"); return; }
    setAssignments(p => [{ id: Date.now(), title, course, dueDate, submissions: 0, status: "active" }, ...p]);
    setShow(false); setTitle(""); setCourse(""); setDueDate(""); setDesc(""); toast.success("Assignment created");
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="h-6 w-6 text-primary" />Assignments</h1><p className="text-muted-foreground mt-0.5">Create and manage course assignments and review submissions</p></div>
        <Button className="gap-2" onClick={() => setShow(true)}><Plus className="h-4 w-4" />New Assignment</Button>
      </div>
      <Tabs defaultValue="assignments">
        <TabsList><TabsTrigger value="assignments">Assignments</TabsTrigger><TabsTrigger value="submissions">Submissions</TabsTrigger></TabsList>
        <TabsContent value="assignments" className="mt-4">
          <div className="grid gap-4">
            {assignments.map(a => (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{a.title}</CardTitle>
                      <CardDescription>{a.course} · Due: {a.dueDate || "No due date"} · {a.submissions} submissions</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={a.status === "active" ? "default" : a.status === "draft" ? "secondary" : "outline"} className="text-xs capitalize">{a.status}</Badge>
                      <Button variant="outline" size="sm" onClick={() => toast.info("Assignment editor coming soon")}><Eye className="h-4 w-4 mr-1" />View</Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="submissions" className="mt-4">
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b"><tr className="text-left">{["Member", "Assignment", "Submitted", "Grade", "Status", ""].map(h => <th key={h} className="px-4 py-3 font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody>{SUBMISSIONS.map(s => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{s.member}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{s.assignment}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.submitted}</td>
                  <td className="px-4 py-3 font-medium">{s.grade || "—"}</td>
                  <td className="px-4 py-3"><Badge variant={s.status === "graded" ? "default" : "secondary"} className="text-xs capitalize">{s.status}</Badge></td>
                  <td className="px-4 py-3"><Button variant="ghost" size="sm" onClick={() => toast.info("Grade submission coming soon")}><CheckCircle className="h-4 w-4" /></Button></td>
                </tr>
              ))}</tbody>
            </table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent><DialogHeader><DialogTitle>New Assignment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Assignment Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Echo Image Interpretation" /></div>
            <div className="space-y-2"><Label>Course</Label><Select value={course} onValueChange={setCourse}><SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger><SelectContent><SelectItem value="Echo Fundamentals">Echo Fundamentals</SelectItem><SelectItem value="POCUS Essentials">POCUS Essentials</SelectItem><SelectItem value="Advanced Echo">Advanced Echo</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Due Date (optional)</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Instructions</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Describe the assignment..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShow(false)}>Cancel</Button><Button onClick={create}>Create Assignment</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

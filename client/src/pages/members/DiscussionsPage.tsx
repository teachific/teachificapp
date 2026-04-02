import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { MessageSquare, Search, Pin, Trash2, Eye } from "lucide-react";

const DISCUSSIONS = [
  { id: 1, course: "Echo Fundamentals", topic: "Question about parasternal long axis view", author: "Alice Martin", replies: 5, pinned: true, status: "open", date: "2026-04-01" },
  { id: 2, course: "POCUS Essentials", topic: "Probe selection for cardiac views", author: "Bob Kim", replies: 2, pinned: false, status: "open", date: "2026-04-01" },
  { id: 3, course: "Advanced Echo", topic: "Doppler waveform interpretation tips", author: "Carol Torres", replies: 8, pinned: false, status: "resolved", date: "2026-03-28" },
  { id: 4, course: "Echo Fundamentals", topic: "Module 3 quiz clarification", author: "David Lee", replies: 1, pinned: false, status: "open", date: "2026-04-02" },
];

export default function DiscussionsPage() {
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const filtered = DISCUSSIONS.filter(d =>
    (d.topic.toLowerCase().includes(search.toLowerCase()) || d.author.toLowerCase().includes(search.toLowerCase())) &&
    (courseFilter === "all" || d.course === courseFilter)
  );
  const courses = Array.from(new Set(DISCUSSIONS.map(d => d.course)));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="h-6 w-6 text-primary" />Discussions</h1><p className="text-muted-foreground mt-0.5">Manage course discussion forums across all courses</p></div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><span>Enable discussions site-wide</span><Switch defaultChecked onCheckedChange={v => toast.success(v ? "Discussions enabled" : "Discussions disabled")} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[{ l: "Total Threads", v: DISCUSSIONS.length }, { l: "Open", v: DISCUSSIONS.filter(d => d.status === "open").length }, { l: "Total Replies", v: DISCUSSIONS.reduce((s, d) => s + d.replies, 0) }].map(s => (
          <Card key={s.l}><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{s.l}</p><p className="text-3xl font-bold">{s.v}</p></CardContent></Card>
        ))}
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search discussions..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={courseFilter} onValueChange={setCourseFilter}><SelectTrigger className="w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Courses</SelectItem>{courses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="flex flex-col gap-3">
        {filtered.map(d => (
          <Card key={d.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="py-4 px-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {d.pinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
                    <p className="font-medium text-sm truncate">{d.topic}</p>
                    <Badge variant={d.status === "resolved" ? "secondary" : "default"} className="text-xs shrink-0">{d.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{d.course} · {d.author} · {d.replies} replies · {d.date}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => toast.info("Thread view coming soon")}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => toast.info("Delete coming soon")}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">No discussions found</div>}
      </div>
    </div>
  );
}

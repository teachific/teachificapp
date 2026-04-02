import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Mail, Plus, Send, Zap } from "lucide-react";

const CAMPAIGNS = [
  { id: 1, name: "April Newsletter", subject: "New courses this month!", status: "sent", sent: 342, opens: 198, clicks: 45, date: "2026-04-01" },
  { id: 2, name: "POCUS Launch Announcement", subject: "Introducing POCUS Essentials", status: "draft", sent: 0, opens: 0, clicks: 0, date: "2026-04-05" },
];

const AUTOMATIONS = [
  { id: 1, name: "Welcome Email", trigger: "New member signup", active: true, sent: 89 },
  { id: 2, name: "Course Enrollment Confirmation", trigger: "Course enrollment", active: true, sent: 234 },
  { id: 3, name: "Course Completion", trigger: "Course completed", active: true, sent: 142 },
  { id: 4, name: "Abandoned Cart", trigger: "Cart abandoned 24h", active: false, sent: 12 },
];

const TEMPLATES = [
  { id: 1, name: "Welcome Email", category: "Transactional" },
  { id: 2, name: "Course Enrollment", category: "Transactional" },
  { id: 3, name: "Newsletter", category: "Marketing" },
  { id: 4, name: "Promotional", category: "Marketing" },
];

export default function EmailCampaignsPage() {
  const [automations, setAutomations] = useState(AUTOMATIONS);
  const [showNew, setShowNew] = useState(false);
  const [campaignName, setCampaignName] = useState(""); const [subject, setSubject] = useState(""); const [body, setBody] = useState("");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Mail className="h-6 w-6 text-primary" />Email Campaigns</h1><p className="text-muted-foreground mt-0.5">Send campaigns, manage templates, and set up automation workflows</p></div>
        <Button className="gap-2" onClick={() => setShowNew(true)}><Plus className="h-4 w-4" />New Campaign</Button>
      </div>
      <Tabs defaultValue="campaigns">
        <TabsList><TabsTrigger value="campaigns">Campaigns</TabsTrigger><TabsTrigger value="automations">Automations</TabsTrigger><TabsTrigger value="templates">Templates</TabsTrigger></TabsList>
        <TabsContent value="campaigns" className="mt-4">
          <div className="grid gap-4">
            {CAMPAIGNS.map(c => (
              <Card key={c.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.subject} · {c.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {c.status === "sent" && <div className="text-right text-xs text-muted-foreground"><p>{c.sent} sent · {c.opens} opens</p><p>{c.clicks} clicks</p></div>}
                    <Badge variant={c.status === "sent" ? "default" : "secondary"} className="text-xs capitalize">{c.status}</Badge>
                    <Button variant="outline" size="sm" onClick={() => toast.info(c.status === "draft" ? "Campaign editor coming soon" : "Campaign report coming soon")}>{c.status === "draft" ? "Edit" : "Report"}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="automations" className="mt-4">
          <div className="grid gap-3">
            {automations.map(a => (
              <Card key={a.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{a.name}</p>
                      <p className="text-xs text-muted-foreground">Trigger: {a.trigger} · {a.sent} sent</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={a.active} onCheckedChange={() => { setAutomations(p => p.map(x => x.id === a.id ? { ...x, active: !x.active } : x)); toast.success("Updated"); }} />
                    <Button variant="outline" size="sm" onClick={() => toast.info("Workflow editor coming soon")}>Edit</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {TEMPLATES.map(t => (
              <Card key={t.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <Badge variant="outline" className="text-xs mt-1">{t.category}</Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast.info("Template editor coming soon")}>Edit</Button>
                </CardContent>
              </Card>
            ))}
            <Card className="border-dashed"><CardContent className="py-4 flex items-center justify-center">
              <Button variant="ghost" className="gap-2" onClick={() => toast.info("New template coming soon")}><Plus className="h-4 w-4" />New Template</Button>
            </CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>New Email Campaign</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Campaign Name</Label><Input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="April Newsletter" /></div>
            <div className="space-y-2"><Label>Subject Line</Label><Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="New courses this month!" /></div>
            <div className="space-y-2"><Label>Email Body</Label><Textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="Write your email content..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button variant="secondary" onClick={() => { if (!campaignName.trim()) { toast.error("Name required"); return; } setShowNew(false); toast.success("Saved as draft"); }}>Save Draft</Button>
            <Button className="gap-2" onClick={() => { if (!campaignName.trim() || !subject.trim()) { toast.error("Name and subject required"); return; } setShowNew(false); toast.success("Campaign sent!"); }}><Send className="h-4 w-4" />Send Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

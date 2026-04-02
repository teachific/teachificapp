import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Globe, Users, MessageSquare, Save } from "lucide-react";

export default function CommunityPage() {
  const [enabled, setEnabled] = useState(true);
  const [name, setName] = useState("Echo Learning Community");
  const [tagline, setTagline] = useState("Connect with fellow learners and instructors");
  const [desc, setDesc] = useState("A supportive space for healthcare professionals learning echocardiography and POCUS.");
  const [spaces] = useState([
    { id: 1, name: "General Discussion", members: 142, posts: 38 },
    { id: 2, name: "Course Q&A", members: 98, posts: 124 },
    { id: 3, name: "Case Studies", members: 67, posts: 22 },
    { id: 4, name: "Resources & Tips", members: 89, posts: 15 },
  ]);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Globe className="h-6 w-6 text-primary" />Community</h1><p className="text-muted-foreground mt-0.5">Build and manage your learning community</p></div>
        <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Community enabled</span><Switch checked={enabled} onCheckedChange={setEnabled} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[{ l: "Total Members", v: 142 }, { l: "Active Spaces", v: spaces.length }, { l: "Total Posts", v: spaces.reduce((s, sp) => s + sp.posts, 0) }].map(s => (
          <Card key={s.l}><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{s.l}</p><p className="text-3xl font-bold">{s.v}</p></CardContent></Card>
        ))}
      </div>
      <Tabs defaultValue="settings">
        <TabsList><TabsTrigger value="settings">Community Settings</TabsTrigger><TabsTrigger value="spaces">Spaces</TabsTrigger></TabsList>
        <TabsContent value="settings" className="mt-4">
          <Card><CardContent className="space-y-4 pt-6">
            <div className="space-y-2"><Label>Community Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Tagline</Label><Input value={tagline} onChange={e => setTagline(e.target.value)} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} /></div>
            <Button className="gap-2" onClick={() => toast.success("Community settings saved")}><Save className="h-4 w-4" />Save Settings</Button>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="spaces" className="mt-4">
          <div className="grid gap-3">
            {spaces.map(sp => (
              <Card key={sp.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{sp.name}</p>
                    <p className="text-xs text-muted-foreground">{sp.members} members · {sp.posts} posts</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toast.info("Space editor coming soon")}>Edit</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" className="gap-2" onClick={() => toast.info("Add space coming soon")}><MessageSquare className="h-4 w-4" />Add Space</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

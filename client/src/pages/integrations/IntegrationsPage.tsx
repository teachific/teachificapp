import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { Puzzle, Search } from "lucide-react";

const INTEGRATIONS = [
  { id: 1, name: "Stripe", category: "Payments", description: "Accept credit card payments and manage subscriptions", connected: true, logo: "💳" },
  { id: 2, name: "Zoom", category: "Webinars", description: "Host live webinars and virtual classes", connected: false, logo: "📹" },
  { id: 3, name: "Mailchimp", category: "Email", description: "Sync members to Mailchimp lists", connected: false, logo: "📧" },
  { id: 4, name: "Google Analytics", category: "Analytics", description: "Track website traffic and conversions", connected: false, logo: "📊" },
  { id: 5, name: "Zapier", category: "Automation", description: "Connect with 5,000+ apps via Zapier", connected: false, logo: "⚡" },
  { id: 6, name: "Slack", category: "Notifications", description: "Send notifications to Slack channels", connected: false, logo: "💬" },
  { id: 7, name: "HubSpot", category: "CRM", description: "Sync contacts and deals with HubSpot CRM", connected: false, logo: "🔶" },
  { id: 8, name: "ConvertKit", category: "Email", description: "Sync subscribers to ConvertKit sequences", connected: false, logo: "📨" },
];

export default function IntegrationsPage() {
  const [search, setSearch] = useState("");
  const filtered = INTEGRATIONS.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Puzzle className="h-6 w-6 text-primary" />Integrations</h1><p className="text-muted-foreground mt-0.5">Connect your school with third-party apps and services</p></div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search integrations..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(i => (
          <Card key={i.id} className="hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xl">{i.logo}</div>
                  <div>
                    <CardTitle className="text-base">{i.name}</CardTitle>
                    <Badge variant="outline" className="text-xs mt-0.5">{i.category}</Badge>
                  </div>
                </div>
                {i.connected && <Badge className="text-xs">Connected</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs mb-3">{i.description}</CardDescription>
              <Button variant={i.connected ? "outline" : "default"} size="sm" className="w-full" onClick={() => toast.info(i.connected ? `${i.name} settings coming soon` : `${i.name} connection coming soon`)}>{i.connected ? "Configure" : "Connect"}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

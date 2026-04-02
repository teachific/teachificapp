import { useOrgScope } from "@/hooks/useOrgScope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { BarChart2, Globe, Mail, Share2, Download } from "lucide-react";

export default function MarketingAnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const { showOrgSelector, orgId, orgs, setSelectedOrgId } = useOrgScope();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart2 className="h-6 w-6 text-primary" />Marketing Analytics</h1>
          <p className="text-muted-foreground mt-0.5">Track traffic sources, email performance, and affiliate conversions</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {showOrgSelector && (
            <Select value={String(orgId ?? "")} onValueChange={(v) => setSelectedOrgId(v ? Number(v) : null)}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select org" /></SelectTrigger>
              <SelectContent>{orgs.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={() => toast.info("Export coming soon")}><Download className="h-4 w-4" />Export</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: "Site Visitors", v: "1,234", icon: Globe },
          { l: "Email Open Rate", v: "42%", icon: Mail },
          { l: "Affiliate Clicks", v: 335, icon: Share2 },
          { l: "Conversion Rate", v: "8.2%", icon: BarChart2 }
        ].map(s => (
          <Card key={s.l}><CardContent className="pt-6 pb-4">
            <s.icon className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">{s.l}</p>
            <p className="text-3xl font-bold">{s.v}</p>
          </CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Traffic Sources</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { source: "Organic Search", pct: 45 }, { source: "Direct", pct: 28 },
                { source: "Email", pct: 18 }, { source: "Social", pct: 9 }
              ].map(t => (
                <div key={t.source} className="flex items-center gap-3">
                  <span className="text-sm w-32">{t.source}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${t.pct}%` }} />
                  </div>
                  <span className="text-sm text-muted-foreground w-10 text-right">{t.pct}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Email Campaign Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Welcome Series", opens: "58%", clicks: "12%" },
                { name: "Course Launch", opens: "44%", clicks: "9%" },
                { name: "Re-engagement", opens: "31%", clicks: "6%" },
              ].map(e => (
                <div key={e.name} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                  <span className="font-medium">{e.name}</span>
                  <span className="text-muted-foreground">Opens: {e.opens} · Clicks: {e.clicks}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

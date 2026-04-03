import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useOrgScope } from "@/hooks/useOrgScope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Megaphone, Mail, Users, TrendingUp, Download } from "lucide-react";

export default function MarketingAnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const { showOrgSelector, orgId, orgs, setSelectedOrgId, ready } = useOrgScope();

  const { data: emailStats, isLoading } = trpc.lms.emailMarketing.stats.useQuery(
    { orgId: orgId! }, { enabled: ready && !!orgId }
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="h-6 w-6 text-primary" />Marketing Analytics</h1>
          <p className="text-muted-foreground mt-0.5">Track email campaigns, affiliate performance, and marketing ROI</p>
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

      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2"><Mail className="h-4 w-4" />Email Campaigns</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { l: "Total Campaigns", v: emailStats?.totalCampaigns ?? 0 },
              { l: "Emails Sent", v: emailStats?.totalSent ?? 0 },
              { l: "Total Opens", v: emailStats?.totalOpens ?? 0 },
              { l: "Open Rate", v: emailStats?.openRate ? `${emailStats.openRate.toFixed(1)}%` : "—" },
            ].map(s => (
              <Card key={s.l}><CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{s.l}</p>
                <p className="text-2xl font-bold">{s.v}</p>
              </CardContent></Card>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Click-Through Rate</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">Total Clicks</p><p className="font-semibold text-lg">{emailStats?.totalClicks ?? 0}</p></div>
            <div><p className="text-muted-foreground">Click Rate</p><p className="font-semibold text-lg">{emailStats?.clickRate ? `${emailStats.clickRate.toFixed(1)}%` : "—"}</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

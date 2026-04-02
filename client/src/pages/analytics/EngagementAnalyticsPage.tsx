import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useOrgScope } from "@/hooks/useOrgScope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Activity, Users, BookOpen, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PERIOD_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };

export default function EngagementAnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const { showOrgSelector, orgId, orgs, setSelectedOrgId, ready } = useOrgScope();
  const days = PERIOD_DAYS[period] ?? 30;
  const groupBy = (days <= 30 ? "day" : days <= 90 ? "week" : "month") as "day" | "week" | "month";

  const { data: summary, isLoading: summaryLoading } = trpc.lms.analytics.summary.useQuery(
    { orgId: orgId! }, { enabled: ready && !!orgId }
  );
  const { data: chartData, isLoading: chartLoading } = trpc.lms.dashboard.chartData.useQuery(
    { orgId: orgId!, days, groupBy },
    { enabled: ready && !!orgId }
  );

  const chartFormatted = useMemo(() =>
    (chartData ?? []).map(d => ({ date: d.date ?? "", enrollments: Number(d.enrollments ?? 0) })),
    [chartData]
  );
  const completionRate = summary && summary.totalEnrollments > 0
    ? Math.round((summary.totalCompletions / summary.totalEnrollments) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="h-6 w-6 text-primary" />Engagement Analytics</h1>
          <p className="text-muted-foreground mt-0.5">Track learner engagement, completion rates, and progress</p>
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
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={() => toast.info("Export coming soon")}><Download className="h-4 w-4" />Export</Button>
        </div>
      </div>
      {summaryLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { l: "Total Enrollments", v: summary?.totalEnrollments ?? 0, icon: Users },
            { l: "Completions", v: summary?.totalCompletions ?? 0, icon: BookOpen },
            { l: "Completion Rate", v: `${completionRate}%`, icon: Activity },
            { l: "Total Courses", v: summary?.totalCourses ?? 0, icon: BookOpen },
          ].map(s => (
            <Card key={s.l}><CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.l}</p>
              <p className="text-2xl font-bold">{s.v}</p>
            </CardContent></Card>
          ))}
        </div>
      )}
      <Card>
        <CardHeader><CardTitle className="text-base">Enrollment Activity</CardTitle></CardHeader>
        <CardContent>
          {chartLoading ? <Skeleton className="h-64 w-full" /> : chartFormatted.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">No enrollment data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartFormatted} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="enrollments" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

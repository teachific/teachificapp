import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useOrgScope } from "@/hooks/useOrgScope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { DollarSign, ShoppingCart, TrendingUp, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PERIOD_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };

export default function RevenueAnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const { orgId, ready } = useOrgScope();
  const days = PERIOD_DAYS[period] ?? 30;
  const groupBy = (days <= 30 ? "day" : days <= 90 ? "week" : "month") as "day" | "week" | "month";

  const { data: chartData, isLoading: chartLoading } = trpc.lms.dashboard.chartData.useQuery(
    { orgId: orgId!, days, groupBy },
    { enabled: ready && !!orgId }
  );
  const { data: stats } = trpc.lms.courseOrders.stats.useQuery({ orgId: orgId! }, { enabled: ready && !!orgId });

  const chartFormatted = useMemo(() =>
    (chartData ?? []).map(d => ({ date: d.date ?? "", revenue: Number(d.revenue ?? 0) })),
    [chartData]
  );
  const totalRevenue = chartFormatted.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = stats?.total ?? 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary" />Revenue Analytics</h1>
          <p className="text-muted-foreground mt-0.5">Track revenue, orders, and financial performance</p>
        </div>
        <div className="flex gap-2 flex-wrap">

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: "Total Revenue", v: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { l: "Total Orders", v: totalOrders },
          { l: "Avg Order Value", v: `$${avgOrderValue.toFixed(2)}` },
          { l: "Completed", v: stats?.completed ?? 0 },
        ].map(s => (
          <Card key={s.l}><CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{s.l}</p>
            <p className="text-2xl font-bold">{s.v}</p>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Revenue Over Time</CardTitle></CardHeader>
        <CardContent>
          {chartLoading ? <Skeleton className="h-64 w-full" /> : chartFormatted.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">No revenue data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartFormatted} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Order Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><p className="text-muted-foreground">Total Orders</p><p className="font-semibold text-lg">{stats?.total ?? 0}</p></div>
            <div><p className="text-muted-foreground">Completed</p><p className="font-semibold text-lg">{stats?.completed ?? 0}</p></div>
            <div><p className="text-muted-foreground">Refunded</p><p className="font-semibold text-lg">{stats?.refunded ?? 0}</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

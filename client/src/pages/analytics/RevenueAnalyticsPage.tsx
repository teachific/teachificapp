import { useOrgScope } from "@/hooks/useOrgScope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { DollarSign, TrendingUp, ShoppingCart, Download } from "lucide-react";

const MONTHLY = [
  { month: "Jan", revenue: 2340, orders: 18 }, { month: "Feb", revenue: 3120, orders: 24 },
  { month: "Mar", revenue: 2890, orders: 22 }, { month: "Apr", revenue: 4210, orders: 31 },
];

export default function RevenueAnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const { showOrgSelector, orgId, orgs, setSelectedOrgId } = useOrgScope();
  const total = MONTHLY.reduce((s, m) => s + m.revenue, 0);
  const orders = MONTHLY.reduce((s, m) => s + m.orders, 0);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary" />Revenue Analytics</h1>
          <p className="text-muted-foreground mt-0.5">Track revenue, orders, and financial performance</p>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: "Total Revenue", v: "$" + total.toLocaleString(), icon: DollarSign },
          { l: "Total Orders", v: orders, icon: ShoppingCart },
          { l: "Avg Order Value", v: "$" + Math.round(total / orders), icon: TrendingUp },
          { l: "Growth", v: "+18%", icon: TrendingUp }
        ].map(s => (
          <Card key={s.l}><CardContent className="pt-6 pb-4">
            <s.icon className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">{s.l}</p>
            <p className="text-3xl font-bold">{s.v}</p>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Monthly Revenue</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MONTHLY.map(m => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="w-8 text-sm text-muted-foreground">{m.month}</span>
                <div className="flex-1 bg-muted rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(m.revenue / 5000) * 100}%` }} />
                </div>
                <span className="text-sm font-medium w-20 text-right">${m.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

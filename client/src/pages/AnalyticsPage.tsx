import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Activity, BarChart3, BookOpen, CheckCircle2, Clock,
  Download, FileArchive, Play, TrendingUp, Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function StatCard({
  title, value, sub, icon: Icon, colorClass = "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
}: { title: string; value: string | number; sub?: string; icon: React.ElementType; colorClass?: string }) {
  return (
    <Card className="shadow-sm border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [, setLocation] = useLocation();
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);

  const { data: summary, isLoading: summaryLoading } = trpc.analytics.summary.useQuery({});
  const { data: packages, isLoading: pkgsLoading } = trpc.packages.list.useQuery(undefined);
  const { data: pkgAnalytics } = trpc.analytics.byPackage.useQuery(
    { packageId: selectedPackageId! },
    { enabled: !!selectedPackageId }
  );

  const isLoading = summaryLoading || pkgsLoading;

  const topPackages = useMemo(() => {
    return [...(packages ?? [])].sort((a, b) => (b.totalPlayCount ?? 0) - (a.totalPlayCount ?? 0)).slice(0, 10);
  }, [packages]);

  const playsChartData = useMemo(() => {
    return topPackages.map((p) => ({
      name: p.title.length > 18 ? p.title.slice(0, 18) + "…" : p.title,
      plays: p.totalPlayCount ?? 0,
      downloads: p.totalDownloadCount ?? 0,
    }));
  }, [topPackages]);

  const contentTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    (packages ?? []).forEach((p) => {
      counts[p.contentType] = (counts[p.contentType] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [packages]);

  const completionRate = (summary as any)?.completionRate ?? 0;
  const totalPlays = (summary as any)?.totalPlays ?? 0;
  const totalDownloads = (summary as any)?.totalDownloads ?? 0;
  const avgDuration = (summary as any)?.avgDurationSeconds ?? 0;

  const handleExportCSV = () => {
    const rows = [
      ["Title", "Content Type", "SCORM Version", "Plays", "Downloads", "Uploaded"],
      ...(packages ?? []).map((p) => [
        p.title,
        p.contentType,
        p.scormVersion,
        p.totalPlayCount ?? 0,
        p.totalDownloadCount ?? 0,
        new Date(p.createdAt).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teachific-analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Content engagement, usage statistics, and learner progress</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} className="gap-2">
          <Download className="h-4 w-4" />Export CSV
        </Button>
      </div>

      {/* Summary Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Packages"
            value={packages?.length ?? 0}
            sub={`${(packages ?? []).filter((p) => p.status === "ready").length} ready`}
            icon={FileArchive}
            colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
          />
          <StatCard
            title="Total Plays"
            value={totalPlays.toLocaleString()}
            sub="all time"
            icon={Play}
            colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
          />
          <StatCard
            title="Total Downloads"
            value={totalDownloads.toLocaleString()}
            icon={Download}
            colorClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
          />
          <StatCard
            title="Completion Rate"
            value={`${completionRate}%`}
            sub={avgDuration > 0 ? `Avg ${Math.round(avgDuration / 60)}m per session` : undefined}
            icon={CheckCircle2}
            colorClass="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
          />
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="content" className="gap-1.5"><FileArchive className="h-3.5 w-3.5" />Content</TabsTrigger>
          <TabsTrigger value="quizzes" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />Quizzes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="shadow-sm border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />Top Content by Plays
                </CardTitle>
              </CardHeader>
              <CardContent>
                {playsChartData.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={playsChartData} margin={{ left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="plays" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Plays" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />Downloads vs Plays
                </CardTitle>
              </CardHeader>
              <CardContent>
                {playsChartData.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={playsChartData} margin={{ left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="plays" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Plays" />
                      <Bar dataKey="downloads" fill="#10b981" radius={[4, 4, 0, 0]} name="Downloads" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="shadow-sm border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileArchive className="h-4 w-4 text-blue-500" />Content Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contentTypeData.length === 0 ? (
                  <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={contentTypeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                        {contentTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/60 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(packages ?? []).slice(0, 6).map((pkg) => (
                    <div key={pkg.id} className="flex items-center gap-3 py-1.5">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileArchive className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{pkg.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(pkg.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                        <span className="flex items-center gap-1"><Play className="h-3 w-3" />{pkg.totalPlayCount ?? 0}</span>
                        <span className="flex items-center gap-1"><Download className="h-3 w-3" />{pkg.totalDownloadCount ?? 0}</span>
                      </div>
                    </div>
                  ))}
                  {(!packages || packages.length === 0) && (
                    <p className="text-sm text-muted-foreground py-4 text-center">No content uploaded yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="mt-5">
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">All Content Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Package</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SCORM</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plays</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Downloads</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {pkgsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}><td colSpan={7} className="px-5 py-3"><Skeleton className="h-8 w-full" /></td></tr>
                      ))
                    ) : (packages ?? []).length === 0 ? (
                      <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No packages uploaded yet</td></tr>
                    ) : (
                      (packages ?? []).map((pkg) => (
                        <tr key={pkg.id} className="hover:bg-accent/20 transition-colors">
                          <td className="px-5 py-3">
                            <div>
                              <p className="font-medium">{pkg.title}</p>
                              <p className="text-xs text-muted-foreground">{new Date(pkg.createdAt).toLocaleDateString()}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="secondary" className="text-xs">{pkg.contentType}</Badge>
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                            {pkg.scormVersion !== "none" ? pkg.scormVersion : "—"}
                          </td>
                          <td className="px-4 py-3 text-center font-medium">{pkg.totalPlayCount ?? 0}</td>
                          <td className="px-4 py-3 text-center font-medium">{pkg.totalDownloadCount ?? 0}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={`text-xs ${
                              pkg.status === "ready" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                              pkg.status === "processing" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}>{pkg.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setLocation(`/play/${pkg.id}`)}>
                                <Play className="h-3 w-3 mr-1" />Play
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setLocation(`/files/${pkg.id}`)}>
                                Manage
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="mt-5">
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-500" />Quiz Performance
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setLocation("/quizzes")} className="gap-1.5 text-xs">
                  <BookOpen className="h-3.5 w-3.5" />Manage Quizzes
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Quiz analytics coming soon</p>
                <p className="text-xs mt-1">Per-question stats, pass rates, and attempt history will appear here</p>
                <Button size="sm" variant="outline" className="mt-4" onClick={() => setLocation("/quizzes/new")}>
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" />Create Your First Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

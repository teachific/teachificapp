import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, BookOpen, GraduationCap, DollarSign, BarChart3 } from "lucide-react";

export default function LmsAnalyticsPage() {
  const { data: orgs } = trpc.orgs.myOrgs.useQuery();
  const orgId = orgs?.[0]?.id;

  const { data: analytics, isLoading } = trpc.lms.analytics.summary.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const stats = [
    {
      label: "Total Courses",
      value: (analytics as any)?.totalCourses ?? 0,
      icon: BookOpen,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total Students",
      value: (analytics as any)?.totalStudents ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    {
      label: "Total Enrollments",
      value: (analytics as any)?.totalEnrollments ?? 0,
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-500/10",
    },
    {
      label: "Completions",
      value: (analytics as any)?.totalCompletions ?? 0,
      icon: GraduationCap,
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
    {
      label: "Completion Rate",
      value: `${(analytics as any)?.completionRate ?? 0}%`,
      icon: BarChart3,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
    {
      label: "Revenue",
      value: `$${((analytics as any)?.totalRevenue ?? 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">LMS Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview of your school's performance
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {isLoading
          ? [...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                  <Skeleton className="h-6 w-16 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))
          : stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enrollment Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Detailed charts coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Search, Users, BookOpen, TrendingUp, Download, UserPlus,
  ChevronDown, ChevronUp, MoreVertical
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "enrollments" | "progress" | "joined">("joined");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollCourseId, setEnrollCourseId] = useState<string>("");

  const { data: orgs } = trpc.orgs.myOrgs.useQuery();
  const orgId = orgs?.[0]?.id;

  const { data: members, isLoading, refetch } = trpc.lms.members.listWithEnrollments.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const { data: courses } = trpc.lms.courses.list.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const manualEnroll = trpc.lms.members.manualEnroll.useMutation({
    onSuccess: () => {
      toast.success("Enrolled successfully");
      setEnrollDialogOpen(false);
      setEnrollEmail("");
      setEnrollCourseId("");
      refetch();
    },
    onError: (err) => {
      toast.error("Enrollment failed", { description: err.message });
    },
  });

  const totalMembers = members?.length ?? 0;
  const totalEnrollments = members?.reduce((s, m) => s + m.totalEnrollments, 0) ?? 0;
  const avgProgress = members && members.length > 0
    ? Math.round(members.reduce((s, m) => s + m.avgProgress, 0) / members.length)
    : 0;

  const filtered = useMemo(() => {
    let list = members ?? [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = (a.name ?? "").localeCompare(b.name ?? "");
      else if (sortField === "enrollments") cmp = a.totalEnrollments - b.totalEnrollments;
      else if (sortField === "progress") cmp = a.avgProgress - b.avgProgress;
      else if (sortField === "joined") cmp = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [members, search, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField !== field ? null :
      sortDir === "asc" ? <ChevronUp className="h-3 w-3 ml-1 inline" /> : <ChevronDown className="h-3 w-3 ml-1 inline" />;

  const exportCSV = () => {
    const rows = [
      ["Name", "Email", "Role", "Enrollments", "Completed", "Avg Progress %", "Joined"],
      ...(members ?? []).map(m => [
        m.name ?? "",
        m.email ?? "",
        m.role,
        m.totalEnrollments,
        m.completedCourses,
        m.avgProgress,
        new Date(m.joinedAt).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "members.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground mt-0.5">View and manage students enrolled in your courses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => setEnrollDialogOpen(true)} className="gap-1.5">
            <UserPlus className="h-4 w-4" /> Enroll Student
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Total Members", value: totalMembers, color: "text-primary", bg: "bg-primary/10" },
          { icon: BookOpen, label: "Total Enrollments", value: totalEnrollments, color: "text-blue-600", bg: "bg-blue-500/10" },
          { icon: TrendingUp, label: "Avg Progress", value: `${avgProgress}%`, color: "text-green-600", bg: "bg-green-500/10" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button className="flex items-center font-medium" onClick={() => toggleSort("name")}>
                  Member <SortIcon field="name" />
                </button>
              </TableHead>
              <TableHead>Role</TableHead>
              <TableHead>
                <button className="flex items-center font-medium" onClick={() => toggleSort("enrollments")}>
                  Enrollments <SortIcon field="enrollments" />
                </button>
              </TableHead>
              <TableHead>
                <button className="flex items-center font-medium" onClick={() => toggleSort("progress")}>
                  Avg Progress <SortIcon field="progress" />
                </button>
              </TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>
                <button className="flex items-center font-medium" onClick={() => toggleSort("joined")}>
                  Joined <SortIcon field="joined" />
                </button>
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {search ? "No members match your search." : "No members yet. Students who enroll will appear here."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.userId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {(m.name ?? m.email ?? "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{m.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.role === "org_admin" ? "default" : "secondary"} className="text-xs">
                      {m.role === "org_admin" ? "Admin" : "Student"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{m.totalEnrollments}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <Progress value={m.avgProgress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground w-8 text-right">{m.avgProgress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{m.completedCourses} / {m.totalEnrollments}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(m.joinedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEnrollEmail(m.email ?? ""); setEnrollDialogOpen(true); }}>
                          Enroll in Course
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {search ? "No members match your search." : "No members yet."}
            </CardContent>
          </Card>
        ) : (
          filtered.map((m) => (
            <Card key={m.userId}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="text-sm bg-primary/10 text-primary">
                        {(m.name ?? m.email ?? "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{m.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={m.role === "org_admin" ? "default" : "secondary"} className="text-xs">
                          {m.role === "org_admin" ? "Admin" : "Student"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(m.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEnrollEmail(m.email ?? ""); setEnrollDialogOpen(true); }}>
                        Enroll in Course
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-sm font-bold">{m.totalEnrollments}</p>
                    <p className="text-xs text-muted-foreground">Enrolled</p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-sm font-bold">{m.completedCourses}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-sm font-bold">{m.avgProgress}%</p>
                    <p className="text-xs text-muted-foreground">Progress</p>
                  </div>
                </div>
                {m.totalEnrollments > 0 && <Progress value={m.avgProgress} className="h-1.5 mt-2" />}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Manual Enroll Dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll Student in Course</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="enroll-email">Student Email</Label>
              <Input
                id="enroll-email"
                type="email"
                placeholder="student@example.com"
                value={enrollEmail}
                onChange={(e) => setEnrollEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The student must already have a Teachific account with this email.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Course</Label>
              <Select value={enrollCourseId} onValueChange={setEnrollCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course..." />
                </SelectTrigger>
                <SelectContent>
                  {(courses ?? []).map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!enrollEmail || !enrollCourseId || manualEnroll.isPending}
              onClick={() => {
                if (!orgId || !enrollCourseId) return;
                manualEnroll.mutate({ orgId, courseId: Number(enrollCourseId), email: enrollEmail });
              }}
            >
              {manualEnroll.isPending ? "Enrolling..." : "Enroll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

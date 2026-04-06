import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Users, Search, Edit, Trash2, Plus, X, BookOpen,
  User as UserIcon, Shield, Building2, Eye, EyeOff, Mail,
} from "lucide-react";
import { useState, useMemo } from "react";

type UserRow = {
  id: number;
  name: string | null;
  email: string | null;
  role: "site_owner" | "site_admin" | "org_super_admin" | "org_admin" | "member" | "user";
  loginMethod: string | null;
  createdAt: Date;
  lastSignedIn: Date;
  orgName?: string | null;
  orgId?: number | null;
};

const ROLE_LABELS: Record<string, string> = {
  site_owner: "Owner",
  site_admin: "Platform Admin",
  org_super_admin: "Org Super Admin",
  org_admin: "Org Admin",
  member: "Org Member",
  user: "Org Member",
};

const ROLE_COLORS: Record<string, string> = {
  site_owner: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  site_admin: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  org_super_admin: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  org_admin: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  member: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  user: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.role === "site_owner";
  const isPlatformAdmin = currentUser?.role === "site_owner" || currentUser?.role === "site_admin";

  const { data: users, refetch: refetchUsers } = trpc.users.listWithOrg.useQuery();
  const { data: orgs } = trpc.orgs.list.useQuery();

  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "member" as string });
  const [enrollOrgId, setEnrollOrgId] = useState<number | null>(null);
  const [enrollCourseId, setEnrollCourseId] = useState<number | null>(null);
  const [assignOrgId, setAssignOrgId] = useState<string>("");
  const [assignOrgRole, setAssignOrgRole] = useState<"org_super_admin" | "org_admin" | "member">("member");
  const [assignMemberSubRole, setAssignMemberSubRole] = useState<"basic_member" | "instructor" | "group_manager" | "group_member">("basic_member");

  // Add User dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", email: "", password: "",
    role: "member" as "site_admin" | "org_super_admin" | "org_admin" | "member",
    orgId: "" as string,
    memberSubRole: "basic_member" as "basic_member" | "instructor" | "group_manager" | "group_member",
  });
  const [showPassword, setShowPassword] = useState(false);

  const { data: enrollments, refetch: refetchEnrollments } = trpc.users.getEnrollments.useQuery(
    { userId: editUser?.id ?? 0 },
    { enabled: !!editUser }
  );
  const { data: courses } = trpc.lms.courses.list.useQuery(
    { orgId: enrollOrgId ?? 0 },
    { enabled: !!enrollOrgId }
  );

  const createUser = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("User created successfully");
      setAddOpen(false);
      setAddForm({ name: "", email: "", password: "", role: "member", orgId: "", memberSubRole: "basic_member" });
      refetchUsers();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateUser = trpc.users.update.useMutation({
    onSuccess: () => { toast.success("User updated"); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });

  const assignToOrg = trpc.users.assignToOrg.useMutation({
    onSuccess: () => { toast.success("Organization assigned"); setAssignOrgId(""); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteUserMutation = trpc.users.delete.useMutation({
    onSuccess: () => { toast.success("User deleted"); setDeleteTarget(null); setEditUser(null); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });

  const enrollMutation = trpc.users.enrollInCourse.useMutation({
    onSuccess: () => { toast.success("Enrolled successfully"); refetchEnrollments(); setEnrollCourseId(null); },
    onError: (e) => toast.error(e.message),
  });

  const revokeMutation = trpc.users.revokeEnrollment.useMutation({
    onSuccess: () => { toast.success("Enrollment revoked"); refetchEnrollments(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!users) return [];
    let list = users as UserRow[];
    if (orgFilter !== "all") {
      if (orgFilter === "none") {
        list = list.filter((u) => !u.orgId);
      } else {
        list = list.filter((u) => u.orgId?.toString() === orgFilter);
      }
    }
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((u) =>
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.orgName ?? "").toLowerCase().includes(q)
    );
  }, [users, search, orgFilter]);

  function openEdit(u: UserRow) {
    setEditUser(u);
    setEditForm({ name: u.name ?? "", email: u.email ?? "", role: u.role });
    setEnrollOrgId(null);
    setEnrollCourseId(null);
    setAssignOrgId(u.orgId?.toString() ?? "");
    setAssignOrgRole("member");
  }

  function handleSave() {
    if (!editUser) return;
    updateUser.mutate({
      userId: editUser.id,
      name: editForm.name || undefined,
      email: editForm.email || undefined,
      role: editForm.role as any,
    });
  }

  function handleAddUser() {
    if (!addForm.name || !addForm.email || !addForm.password) {
      toast.error("Name, email, and password are required");
      return;
    }
    createUser.mutate({
      name: addForm.name,
      email: addForm.email,
      password: addForm.password,
      role: addForm.role,
      orgId: addForm.orgId ? Number(addForm.orgId) : undefined,
    });
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Users
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{users?.length ?? 0} registered users</p>
        </div>
        <Button className="gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Search + Org Filter */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, role, or organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {isPlatformAdmin && (
          <Select value={orgFilter} onValueChange={setOrgFilter}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Filter by org..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              <SelectItem value="none">No Organization</SelectItem>
              {orgs?.map((o) => (
                <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border/60 overflow-hidden shadow-sm">
        <div className={`hidden sm:grid gap-4 px-5 py-2.5 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${isPlatformAdmin ? "grid-cols-[1fr_160px_auto_auto_auto_auto]" : "grid-cols-[1fr_auto_auto_auto_auto]"}`}>
          <span>User</span>
          {isPlatformAdmin && <span>Organization</span>}
          <span>Role</span>
          <span>Method</span>
          <span>Joined</span>
          <span></span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-muted-foreground text-sm">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No users found
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((u) => (
              <div key={u.id} className="hover:bg-muted/20 transition-colors">
                {/* Desktop row */}
                <div className={`hidden sm:grid gap-4 px-5 py-3 items-center ${isPlatformAdmin ? "grid-cols-[1fr_160px_auto_auto_auto_auto]" : "grid-cols-[1fr_auto_auto_auto_auto]"}`}>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{u.name ?? <span className="text-muted-foreground italic">No name</span>}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email ?? "—"}</p>
                  </div>
                  {isPlatformAdmin && (
                    <span className="text-xs text-muted-foreground truncate">
                      {u.orgName ?? <span className="italic opacity-50">—</span>}
                    </span>
                  )}
                  <Badge className={`text-xs border ${ROLE_COLORS[u.role] ?? ROLE_COLORS.user}`}>{ROLE_LABELS[u.role] ?? u.role}</Badge>
                  <span className="text-xs text-muted-foreground capitalize">{u.loginMethod ?? "—"}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(u as UserRow)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {/* Mobile card */}
                <div className="sm:hidden flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{u.name ?? <span className="text-muted-foreground italic">No name</span>}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email ?? "—"}</p>
                    {isPlatformAdmin && u.orgName && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />{u.orgName}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge className={`text-xs border ${ROLE_COLORS[u.role] ?? ROLE_COLORS.user}`}>{ROLE_LABELS[u.role] ?? u.role}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => openEdit(u as UserRow)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" /> Add New User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Jane Smith"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck={false}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                placeholder="jane@example.com"
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Temporary Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={addForm.password}
                  onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={addForm.role} onValueChange={(v) => setAddForm((f) => ({ ...f, role: v as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Org Member</SelectItem>
                    <SelectItem value="org_admin">Org Admin</SelectItem>
                    <SelectItem value="org_super_admin">Org Super Admin</SelectItem>
                    {isOwner && <SelectItem value="site_admin">Platform Admin</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              {isPlatformAdmin && (
                <div className="space-y-1.5">
                  <Label>Organization</Label>
                  <Select value={addForm.orgId} onValueChange={(v) => setAddForm((f) => ({ ...f, orgId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {orgs?.map((o) => (
                        <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={createUser.isPending} className="gap-2">
              <Plus className="h-4 w-4" />
              {createUser.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Sheet */}
      <Sheet open={!!editUser} onOpenChange={(o) => { if (!o) setEditUser(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              {editUser?.name ?? editUser?.email ?? "Edit User"}
            </SheetTitle>
          </SheetHeader>

          {editUser && (
            <div className="mt-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <UserIcon className="h-3.5 w-3.5" /> Basic Info
                </h3>
                <div className="space-y-1.5">
                  <Label>Display Name</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Full name"
                    autoCorrect="off"
                    autoCapitalize="words"
                    spellCheck={false}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email Address
                  </Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" /> Platform Role
                  </Label>
                  <Select
                    value={editForm.role}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, role: v }))}
                    disabled={!isOwner && editUser.role === "site_owner"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {isOwner && <SelectItem value="site_owner">Owner</SelectItem>}
                      <SelectItem value="site_admin">Platform Admin</SelectItem>
                      <SelectItem value="org_super_admin">Org Super Admin</SelectItem>
                      <SelectItem value="org_admin">Org Admin</SelectItem>
                      <SelectItem value="member">Org Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} disabled={updateUser.isPending} className="w-full">
                  {updateUser.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>

              {/* Organization Assignment (platform admin only) */}
              {isPlatformAdmin && (
                <div className="border-t border-border/40 pt-5 space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" /> Organization
                  </h3>
                  {editUser.orgName && (
                    <p className="text-sm text-muted-foreground">
                      Currently in: <span className="font-medium text-foreground">{editUser.orgName}</span>
                    </p>
                  )}
                  <div className="space-y-2">
                    <Select value={assignOrgId} onValueChange={setAssignOrgId}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select organization..." />
                      </SelectTrigger>
                      <SelectContent>
                        {orgs?.map((o) => (
                          <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={assignOrgRole} onValueChange={(v) => setAssignOrgRole(v as any)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Org Member</SelectItem>
                        <SelectItem value="org_admin">Org Admin</SelectItem>
                        <SelectItem value="org_super_admin">Org Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {assignOrgRole === "member" && (
                      <Select value={assignMemberSubRole} onValueChange={(v) => setAssignMemberSubRole(v as any)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic_member">Basic Member</SelectItem>
                          <SelectItem value="instructor">Instructor</SelectItem>
                          <SelectItem value="group_manager">Group Manager</SelectItem>
                          <SelectItem value="group_member">Group Member</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {assignOrgId && (
                      <Button
                        size="sm"
                        className="w-full h-8 gap-1.5"
                        onClick={() => assignToOrg.mutate({ userId: editUser.id, orgId: Number(assignOrgId), orgRole: assignOrgRole, memberSubRole: assignMemberSubRole })}
                        disabled={assignToOrg.isPending}
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        {assignToOrg.isPending ? "Assigning..." : "Assign to Organization"}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Course Enrollments */}
              <div className="border-t border-border/40 pt-5 space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5" /> Course Enrollments
                </h3>
                {enrollments && enrollments.length > 0 ? (
                  <div className="space-y-1.5">
                    {enrollments.map((e: any) => (
                      <div key={e.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium text-sm">Course #{e.courseId}</p>
                          <p className="text-xs text-muted-foreground">{e.progressPct?.toFixed(0) ?? 0}% complete · enrolled {new Date(e.enrolledAt).toLocaleDateString()}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => revokeMutation.mutate({ enrollmentId: e.id })}
                          disabled={revokeMutation.isPending}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active enrollments.</p>
                )}
                <div className="rounded-lg border border-dashed border-border/60 p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Enroll in a course</p>
                  <Select value={enrollOrgId?.toString() ?? ""} onValueChange={(v) => { setEnrollOrgId(Number(v)); setEnrollCourseId(null); }}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select organization..." />
                    </SelectTrigger>
                    <SelectContent>
                      {orgs?.map((o) => (
                        <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {enrollOrgId && (
                    <Select value={enrollCourseId?.toString() ?? ""} onValueChange={(v) => setEnrollCourseId(Number(v))}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select course..." />
                      </SelectTrigger>
                      <SelectContent>
                        {courses?.map((c: { id: number; title: string }) => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {enrollCourseId && enrollOrgId && (
                    <Button
                      size="sm"
                      className="w-full h-8 gap-1.5"
                      onClick={() => enrollMutation.mutate({ userId: editUser.id, courseId: enrollCourseId, orgId: enrollOrgId })}
                      disabled={enrollMutation.isPending}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {enrollMutation.isPending ? "Enrolling..." : "Enroll"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              {isOwner && editUser.role !== "site_owner" && (
                <div className="border-t border-destructive/20 pt-5 space-y-3">
                  <h3 className="text-xs font-semibold text-destructive uppercase tracking-wider flex items-center gap-2">
                    <Trash2 className="h-3.5 w-3.5" /> Danger Zone
                  </h3>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => setDeleteTarget(editUser)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Account Permanently
                  </Button>
                  <p className="text-xs text-muted-foreground">This will permanently delete the user and all their data. This action cannot be undone.</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{deleteTarget?.name ?? deleteTarget?.email ?? "this user"}</strong>?
              This will remove all their data, enrollments, and progress. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteUserMutation.mutate({ userId: deleteTarget.id })}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

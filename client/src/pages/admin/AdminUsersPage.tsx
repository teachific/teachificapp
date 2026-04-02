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
import { Users, Search, Edit, Trash2, Plus, X, BookOpen, Mail, User as UserIcon, Shield } from "lucide-react";
import { useState, useMemo } from "react";

type UserRow = {
  id: number;
  name: string | null;
  email: string | null;
  role: "site_owner" | "site_admin" | "org_admin" | "user";
  loginMethod: string | null;
  createdAt: Date;
  lastSignedIn: Date;
};

const ROLE_LABELS: Record<string, string> = {
  site_owner: "Site Owner",
  site_admin: "Site Admin",
  org_admin: "Org Admin",
  user: "User",
};

const ROLE_COLORS: Record<string, string> = {
  site_owner: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  site_admin: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  org_admin: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  user: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.role === "site_owner";

  const { data: users, refetch: refetchUsers } = trpc.users.list.useQuery();
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "user" as string });
  const [enrollOrgId, setEnrollOrgId] = useState<number | null>(null);
  const [enrollCourseId, setEnrollCourseId] = useState<number | null>(null);

  const { data: orgs } = trpc.orgs.list.useQuery();
  const { data: enrollments, refetch: refetchEnrollments } = trpc.users.getEnrollments.useQuery(
    { userId: editUser?.id ?? 0 },
    { enabled: !!editUser }
  );
  const { data: courses } = trpc.lms.courses.list.useQuery(
    { orgId: enrollOrgId ?? 0 },
    { enabled: !!enrollOrgId }
  );

  const updateUser = trpc.users.update.useMutation({
    onSuccess: () => { toast.success("User updated"); refetchUsers(); },
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
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) =>
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  function openEdit(u: UserRow) {
    setEditUser(u);
    setEditForm({ name: u.name ?? "", email: u.email ?? "", role: u.role });
    setEnrollOrgId(null);
    setEnrollCourseId(null);
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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Users
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{users?.length ?? 0} registered users</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden shadow-sm">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-2.5 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span>User</span>
          <span>Role</span>
          <span>Method</span>
          <span>Joined</span>
          <span></span>
        </div>
        <div className="divide-y divide-border/50">
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-muted-foreground text-sm">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No users found
            </div>
          )}
          {filtered.map((u) => (
            <div key={u.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 items-center hover:bg-muted/20 transition-colors">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{u.name ?? <span className="text-muted-foreground italic">No name</span>}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email ?? "—"}</p>
              </div>
              <Badge className={`text-xs border ${ROLE_COLORS[u.role] ?? ROLE_COLORS.user}`}>
                {ROLE_LABELS[u.role] ?? u.role}
              </Badge>
              <span className="text-xs text-muted-foreground capitalize">{u.loginMethod ?? "—"}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(u.createdAt).toLocaleDateString()}
              </span>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(u as UserRow)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Sheet */}
      <Sheet open={!!editUser} onOpenChange={(o) => { if (!o) setEditUser(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              Edit User Profile
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
                      {isOwner && <SelectItem value="site_owner">Site Owner</SelectItem>}
                      <SelectItem value="site_admin">Site Admin</SelectItem>
                      <SelectItem value="org_admin">Org Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={updateUser.isPending}
                  className="w-full"
                >
                  {updateUser.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>

              {/* Course Access */}
              <div className="space-y-3 border-t border-border/50 pt-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5" /> Course Enrollments
                </h3>

                {enrollments && enrollments.length > 0 ? (
                  <div className="space-y-1.5">
                    {enrollments.map((e) => (
                      <div key={e.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium text-sm">Course #{e.courseId}</p>
                          <p className="text-xs text-muted-foreground">{e.progressPct.toFixed(0)}% complete · enrolled {new Date(e.enrolledAt).toLocaleDateString()}</p>
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

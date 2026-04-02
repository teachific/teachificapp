import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Shield,
  Users,
  Building2,
  Settings,
  CreditCard,
  MoreHorizontal,
  UserPlus,
  Upload,
  Trash2,
  Edit,
  Crown,
  Lock,
  Globe,
  AlertTriangle,
  CheckCircle,
  Download,
} from "lucide-react";

// ─── Plan badge ──────────────────────────────────────────────────────────────
const PLAN_COLORS: Record<string, string> = {
  free: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  starter: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  builder: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  pro: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  enterprise: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};
function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${PLAN_COLORS[plan] ?? PLAN_COLORS.free}`}>
      {plan === "enterprise" && <Crown className="w-3 h-3 mr-1" />}
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </span>
  );
}

// ─── Platform Settings Tab ───────────────────────────────────────────────────
function SettingsTab() {
  const { data: settings, refetch } = trpc.platformAdmin.getSettings.useQuery();
  const update = trpc.platformAdmin.updateSettings.useMutation({
    onSuccess: () => { refetch(); toast.success("Settings saved"); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState<{
    allowPublicRegistration?: boolean;
    maintenanceMode?: boolean;
    platformName?: string;
    supportEmail?: string;
    maxUploadSizeMb?: number;
    enterpriseMaxUploadSizeMb?: number;
  }>({});

  const merged = { ...settings, ...form };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-400" />
            Registration & Access
          </CardTitle>
          <CardDescription className="text-slate-400">
            Control who can create new accounts on this platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700">
            <div>
              <p className="text-sm font-medium text-white">Public Registration</p>
              <p className="text-xs text-slate-400 mt-0.5">
                When off, only manually added users can log in. New OAuth logins are blocked.
              </p>
            </div>
            <Switch
              checked={merged.allowPublicRegistration ?? false}
              onCheckedChange={(v) => setForm((f) => ({ ...f, allowPublicRegistration: v }))}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700">
            <div>
              <p className="text-sm font-medium text-white">Maintenance Mode</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Shows a maintenance page to all non-admin users.
              </p>
            </div>
            <Switch
              checked={merged.maintenanceMode ?? false}
              onCheckedChange={(v) => setForm((f) => ({ ...f, maintenanceMode: v }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-teal-400" />
            Platform Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Platform Name</Label>
              <Input
                value={merged.platformName ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, platformName: e.target.value }))}
                placeholder="Teachific"
                className="bg-slate-900 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Support Email</Label>
              <Input
                value={merged.supportEmail ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, supportEmail: e.target.value }))}
                placeholder="support@example.com"
                className="bg-slate-900 border-slate-600 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Standard Max Upload Size (MB)</Label>
              <Input
                type="number"
                value={merged.maxUploadSizeMb ?? 100}
                onChange={(e) => setForm((f) => ({ ...f, maxUploadSizeMb: parseInt(e.target.value) || 100 }))}
                className="bg-slate-900 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Enterprise Max Upload Size (MB)</Label>
              <Input
                type="number"
                value={merged.enterpriseMaxUploadSizeMb ?? 2000}
                onChange={(e) => setForm((f) => ({ ...f, enterpriseMaxUploadSizeMb: parseInt(e.target.value) || 2000 }))}
                className="bg-slate-900 border-slate-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => update.mutate(form)}
          disabled={update.isPending || Object.keys(form).length === 0}
          className="bg-teal-600 hover:bg-teal-500 text-white"
        >
          {update.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

// ─── Organizations Tab ───────────────────────────────────────────────────────
function OrgsTab() {
  const { data: orgs = [], refetch } = trpc.platformAdmin.listOrgs.useQuery();
  const [editOrg, setEditOrg] = useState<typeof orgs[0] | null>(null);
  const [editForm, setEditForm] = useState<{ name?: string; slug?: string; description?: string; domain?: string }>({});
  const [planOrg, setPlanOrg] = useState<typeof orgs[0] | null>(null);
  const [planForm, setPlanForm] = useState<{
    plan: "free" | "starter" | "builder" | "pro" | "enterprise";
    customPriceUsd?: number;
    customPriceLabel?: string;
    adminNotes?: string;
    status?: "active" | "trialing" | "past_due" | "cancelled" | "unpaid";
  }>({ plan: "free", status: "active" });

  const { data: planOrgSub } = trpc.platformAdmin.getOrgSubscription.useQuery(
    { orgId: planOrg?.id ?? 0 },
    { enabled: !!planOrg }
  );

  const updateOrg = trpc.platformAdmin.updateOrg.useMutation({
    onSuccess: () => { refetch(); setEditOrg(null); toast.success("Organization updated"); },
    onError: (e) => toast.error(e.message),
  });
  const setOrgPlan = trpc.platformAdmin.setOrgPlan.useMutation({
    onSuccess: () => { refetch(); setPlanOrg(null); toast.success("Plan updated"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{orgs.length} organizations</p>
      </div>
      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-400">Organization</TableHead>
              <TableHead className="text-slate-400">Slug</TableHead>
              <TableHead className="text-slate-400">Domain</TableHead>
              <TableHead className="text-slate-400">Plan</TableHead>
              <TableHead className="text-slate-400 w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs.map((org) => (
              <TableRow key={org.id} className="border-slate-700 hover:bg-slate-800/50">
                <TableCell className="text-white font-medium">{org.name}</TableCell>
                <TableCell className="text-slate-400 font-mono text-xs">{org.slug}</TableCell>
                <TableCell className="text-slate-400 text-xs">—</TableCell>
                <TableCell>
                  <PlanBadge plan="free" />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem
                        className="text-slate-300 hover:text-white focus:text-white"
                        onClick={() => { setEditOrg(org); setEditForm({ name: org.name, slug: org.slug, description: org.description ?? "" }); }}
                      >
                        <Edit className="w-3.5 h-3.5 mr-2" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-slate-300 hover:text-white focus:text-white"
                        onClick={() => { setPlanOrg(org); setPlanForm({ plan: "free", status: "active" }); }}
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-2" /> Manage Plan
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Org Dialog */}
      <Dialog open={!!editOrg} onOpenChange={(o) => !o && setEditOrg(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription className="text-slate-400">Update organization details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Name</Label>
              <Input value={editForm.name ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Slug</Label>
              <Input value={editForm.slug ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))} className="bg-slate-800 border-slate-600 text-white font-mono" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300">Description</Label>
              <Textarea value={editForm.description ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOrg(null)} className="border-slate-600 text-slate-300">Cancel</Button>
            <Button
              onClick={() => editOrg && updateOrg.mutate({ orgId: editOrg.id, ...editForm })}
              disabled={updateOrg.isPending}
              className="bg-teal-600 hover:bg-teal-500 text-white"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Plan Dialog */}
      <Dialog open={!!planOrg} onOpenChange={(o) => !o && setPlanOrg(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              Manage Plan — {planOrg?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Manually assign a subscription tier. For Enterprise, you can set custom pricing.
            </DialogDescription>
          </DialogHeader>
          {planOrgSub && (
            <div className="rounded-lg bg-slate-800 border border-slate-700 p-3 text-sm">
              <p className="text-slate-400">Current plan: <PlanBadge plan={planOrgSub.plan} /></p>
              {planOrgSub.customPriceLabel && (
                <p className="text-slate-400 mt-1">Custom price: <span className="text-white">{planOrgSub.customPriceLabel}</span></p>
              )}
              {planOrgSub.adminNotes && (
                <p className="text-slate-400 mt-1">Notes: <span className="text-white">{planOrgSub.adminNotes}</span></p>
              )}
            </div>
          )}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Plan</Label>
              <Select value={planForm.plan} onValueChange={(v) => setPlanForm((f) => ({ ...f, plan: v as typeof planForm.plan }))}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {["free", "starter", "builder", "pro", "enterprise"].map((p) => (
                    <SelectItem key={p} value={p} className="text-white focus:bg-slate-700">
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Status</Label>
              <Select value={planForm.status ?? "active"} onValueChange={(v) => setPlanForm((f) => ({ ...f, status: v as typeof planForm.status }))}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {["active", "trialing", "past_due", "cancelled", "unpaid"].map((s) => (
                    <SelectItem key={s} value={s} className="text-white focus:bg-slate-700">
                      {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {planForm.plan === "enterprise" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Custom Price (USD cents)</Label>
                    <Input
                      type="number"
                      value={planForm.customPriceUsd ?? ""}
                      onChange={(e) => setPlanForm((f) => ({ ...f, customPriceUsd: parseInt(e.target.value) || undefined }))}
                      placeholder="e.g. 49900 = $499"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Price Label</Label>
                    <Input
                      value={planForm.customPriceLabel ?? ""}
                      onChange={(e) => setPlanForm((f) => ({ ...f, customPriceLabel: e.target.value }))}
                      placeholder="e.g. $499/mo"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label className="text-slate-300">Admin Notes (internal)</Label>
              <Textarea
                value={planForm.adminNotes ?? ""}
                onChange={(e) => setPlanForm((f) => ({ ...f, adminNotes: e.target.value }))}
                placeholder="Notes about this org's subscription..."
                className="bg-slate-800 border-slate-600 text-white"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanOrg(null)} className="border-slate-600 text-slate-300">Cancel</Button>
            <Button
              onClick={() => planOrg && setOrgPlan.mutate({ orgId: planOrg.id, ...planForm })}
              disabled={setOrgPlan.isPending}
              className="bg-teal-600 hover:bg-teal-500 text-white"
            >
              {setOrgPlan.isPending ? "Saving..." : "Apply Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Users Tab ───────────────────────────────────────────────────────────────
function UsersTab() {
  const { data: users = [], refetch } = trpc.platformAdmin.listUsers.useQuery();
  const { data: orgs = [] } = trpc.platformAdmin.listOrgs.useQuery();
  const [editUser, setEditUser] = useState<typeof users[0] | null>(null);
  const [editForm, setEditForm] = useState<{ name?: string; email?: string; role?: "site_owner" | "site_admin" | "org_admin" | "user" }>({});
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkOrgId, setBulkOrgId] = useState<number | null>(null);
  const [bulkText, setBulkText] = useState("");
  const [search, setSearch] = useState("");

  const updateUser = trpc.platformAdmin.updateUser.useMutation({
    onSuccess: () => { refetch(); setEditUser(null); toast.success("User updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteUser = trpc.platformAdmin.deleteUser.useMutation({
    onSuccess: () => { refetch(); toast.success("User deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const bulkAdd = trpc.platformAdmin.bulkAddUsers.useMutation({
    onSuccess: (results) => {
      refetch();
      setBulkOpen(false);
      setBulkText("");
      const created = results.filter((r) => r.status === "created").length;
      const added = results.filter((r) => r.status === "added_existing").length;
      const errors = results.filter((r) => r.status.startsWith("error")).length;
      toast.success(`Bulk import: ${created} created, ${added} added, ${errors} errors`);
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = users.filter((u) =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  function parseBulkUsers() {
    return bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        return { email: parts[0], name: parts[1] ?? undefined, role: (parts[2] as "org_admin" | "user") ?? "user" };
      })
      .filter((u) => u.email.includes("@"));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="bg-slate-800 border-slate-600 text-white max-w-xs"
        />
        <Button
          onClick={() => setBulkOpen(true)}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:text-white ml-auto"
        >
          <Upload className="w-3.5 h-3.5 mr-2" />
          Bulk Add Users
        </Button>
      </div>

      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-400">Name</TableHead>
              <TableHead className="text-slate-400">Email</TableHead>
              <TableHead className="text-slate-400">Role</TableHead>
              <TableHead className="text-slate-400">Joined</TableHead>
              <TableHead className="text-slate-400 w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id} className="border-slate-700 hover:bg-slate-800/50">
                <TableCell className="text-white font-medium">{u.name ?? "—"}</TableCell>
                <TableCell className="text-slate-400 text-sm">{u.email ?? "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      u.role === "site_owner" ? "border-amber-500/50 text-amber-300" :
                      u.role === "site_admin" ? "border-violet-500/50 text-violet-300" :
                      u.role === "org_admin" ? "border-teal-500/50 text-teal-300" :
                      "border-slate-600 text-slate-400"
                    }
                  >
                    {u.role === "site_owner" && <Crown className="w-3 h-3 mr-1" />}
                    {u.role?.replace("_", " ") ?? "user"}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-400 text-xs">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem
                        className="text-slate-300 hover:text-white focus:text-white"
                        onClick={() => { setEditUser(u); setEditForm({ name: u.name ?? "", email: u.email ?? "", role: (u.role as typeof editForm.role) ?? "user" }); }}
                      >
                        <Edit className="w-3.5 h-3.5 mr-2" /> Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuItem
                        className="text-red-400 hover:text-red-300 focus:text-red-300"
                        onClick={() => {
                          if (confirm(`Delete ${u.name ?? u.email}? This cannot be undone.`)) {
                            deleteUser.mutate({ userId: u.id });
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription className="text-slate-400">Update user profile and role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Name</Label>
              <Input value={editForm.name ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Email</Label>
              <Input value={editForm.email ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Platform Role</Label>
              <Select value={editForm.role ?? "user"} onValueChange={(v) => setEditForm((f) => ({ ...f, role: v as typeof editForm.role }))}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="user" className="text-white focus:bg-slate-700">User</SelectItem>
                  <SelectItem value="org_admin" className="text-white focus:bg-slate-700">Org Admin</SelectItem>
                  <SelectItem value="site_admin" className="text-white focus:bg-slate-700">Site Admin</SelectItem>
                  <SelectItem value="site_owner" className="text-white focus:bg-slate-700">Site Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)} className="border-slate-600 text-slate-300">Cancel</Button>
            <Button
              onClick={() => editUser && updateUser.mutate({ userId: editUser.id, ...editForm })}
              disabled={updateUser.isPending}
              className="bg-teal-600 hover:bg-teal-500 text-white"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Users Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-teal-400" />
              Bulk Add Users
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Paste one user per line: <code className="text-teal-400">email, name (optional), role (optional)</code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Target Organization</Label>
              <Select value={bulkOrgId?.toString() ?? ""} onValueChange={(v) => setBulkOrgId(parseInt(v))}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Select organization..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={o.id.toString()} className="text-white focus:bg-slate-700">
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">User List</Label>
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"alice@example.com, Alice Smith, user\nbob@example.com, Bob Jones, org_admin"}
                className="bg-slate-800 border-slate-600 text-white font-mono text-xs"
                rows={8}
              />
              <p className="text-xs text-slate-500">{parseBulkUsers().length} valid users detected</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)} className="border-slate-600 text-slate-300">Cancel</Button>
            <Button
              onClick={() => {
                if (!bulkOrgId) { toast.error("Select an organization first"); return; }
                bulkAdd.mutate({ orgId: bulkOrgId, users: parseBulkUsers() });
              }}
              disabled={bulkAdd.isPending || parseBulkUsers().length === 0 || !bulkOrgId}
              className="bg-teal-600 hover:bg-teal-500 text-white"
            >
              {bulkAdd.isPending ? "Importing..." : `Import ${parseBulkUsers().length} Users`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function PlatformAdminPage() {
  const { user } = useAuth();

  if (!user || (user.role !== "site_owner" && user.role !== "site_admin")) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Lock className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-400 font-medium">Platform Admin Access Required</p>
          <p className="text-sm text-slate-500">This area is restricted to site owners and site admins.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-600/20 border border-teal-500/30">
          <Shield className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Admin</h1>
          <p className="text-sm text-slate-400">
            Manage all organizations, users, subscriptions, and platform settings.
            {user.role === "site_owner" && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-400">
                <Crown className="w-3 h-3" /> Site Owner
              </span>
            )}
          </p>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="settings" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-slate-400">
            <Settings className="w-3.5 h-3.5 mr-1.5" /> Settings
          </TabsTrigger>
          <TabsTrigger value="orgs" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-slate-400">
            <Building2 className="w-3.5 h-3.5 mr-1.5" /> Organizations
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-slate-400">
            <Users className="w-3.5 h-3.5 mr-1.5" /> Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
        <TabsContent value="orgs">
          <OrgsTab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

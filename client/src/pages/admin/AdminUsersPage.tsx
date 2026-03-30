import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search } from "lucide-react";
import { useState, useMemo } from "react";

export default function AdminUsersPage() {
  const { data: users } = trpc.users.list.useQuery();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!users) return [];
    if (!search) return users;
    return users.filter((u) => (u.name ?? "").toLowerCase().includes(search.toLowerCase()) || (u.email ?? "").toLowerCase().includes(search.toLowerCase()));
  }, [users, search]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Users</h1><p className="text-muted-foreground text-sm mt-0.5">{users?.length ?? 0} users</p></div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <Card className="shadow-sm border-border/60 overflow-hidden">
        <div className="divide-y divide-border/50">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>User</span><span>Role</span><span>Method</span><span>Joined</span>
          </div>
          {filtered.map((u) => (
            <div key={u.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center hover:bg-accent/20">
              <div>
                <p className="text-sm font-medium">{u.name ?? "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{u.email ?? u.openId}</p>
              </div>
              <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs">{u.role}</Badge>
              <span className="text-xs text-muted-foreground">{u.loginMethod ?? "—"}</span>
              <span className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center"><Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground">No users found</p></div>
          )}
        </div>
      </Card>
    </div>
  );
}

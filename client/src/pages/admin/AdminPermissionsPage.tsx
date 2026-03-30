import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Globe, Users } from "lucide-react";

export default function AdminPermissionsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div><h1 className="text-2xl font-bold">Permissions</h1><p className="text-muted-foreground text-sm mt-0.5">Role-based access control overview</p></div>
      <div className="grid gap-4">
        {[
          { role: "Site Owner", icon: Shield, color: "text-red-600 bg-red-100", perms: ["Full system access", "Manage all organizations", "Promote/demote admins", "Delete any content", "View all analytics", "Manage billing"] },
          { role: "Admin", icon: Lock, color: "text-blue-600 bg-blue-100", perms: ["Manage organization content", "Upload and delete packages", "Manage organization users", "View organization analytics", "Configure permissions per file", "Create and manage quizzes"] },
          { role: "User", icon: Users, color: "text-green-600 bg-green-100", perms: ["View assigned content", "Play packages (within limits)", "Download if permitted", "Take quizzes", "View own progress", "No admin access"] },
        ].map((r) => (
          <Card key={r.role} className="shadow-sm border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${r.color}`}><r.icon className="h-4 w-4" /></div>
                {r.role}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {r.perms.map((p) => <li key={p} className="flex items-center gap-2 text-sm"><span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{p}</li>)}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

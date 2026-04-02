import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { User, Lock, Save } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><User className="h-6 w-6 text-primary" />My Profile</h1><p className="text-muted-foreground mt-0.5">Manage your account information and password</p></div>
      <Card>
        <CardHeader><CardTitle className="text-base">Account Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">{(user?.name || "U")[0].toUpperCase()}</div>
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">{user?.role?.replace("_", " ")}</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-2"><Label>Display Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Email Address</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <Button className="gap-2" onClick={() => toast.success("Profile updated")}><Save className="h-4 w-4" />Save Changes</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" />Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} /></div>
          <div className="space-y-2"><Label>New Password</Label><Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} /></div>
          <div className="space-y-2"><Label>Confirm New Password</Label><Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} /></div>
          <Button variant="outline" onClick={() => { if (newPw !== confirmPw) { toast.error("Passwords do not match"); return; } toast.success("Password updated"); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}>Update Password</Button>
        </CardContent>
      </Card>
    </div>
  );
}

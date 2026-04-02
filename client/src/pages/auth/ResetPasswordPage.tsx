import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
    else setError("Invalid or missing reset token. Please request a new password reset link.");
  }, []);

  const reset = trpc.customAuth.resetPassword.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError("");
    reset.mutate({ token, newPassword: password });
  };

  const Logo = () => (
    <div className="text-center mb-8">
      <div className="inline-flex items-baseline gap-0.5 mb-2">
        <span className="text-4xl font-bold text-white tracking-tight">teach</span>
        <span className="text-4xl font-bold text-[#4ad9e0] tracking-tight">ific</span>
        <span className="text-xl text-[#4ad9e0]/70 ml-0.5">™</span>
      </div>
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d1f2d] via-[#0f2a35] to-[#0a1a22] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <Logo />
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-10 shadow-2xl">
            <CheckCircle2 className="w-16 h-16 text-[#4ad9e0] mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-3">Password updated</h2>
            <p className="text-white/60 leading-relaxed mb-6">Your password has been successfully reset. You can now sign in with your new password.</p>
            <Link href="/login">
              <Button className="bg-[#189aa1] hover:bg-[#189aa1]/90 text-white font-semibold w-full">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1f2d] via-[#0f2a35] to-[#0a1a22] flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <Logo />
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-1">Set a new password</h2>
          <p className="text-white/50 text-sm mb-6">Choose a strong password for your account.</p>

          {error && (
            <Alert className="mb-4 border-red-500/30 bg-red-500/10">
              <AlertDescription className="text-red-300 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-white/70 text-sm">New password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required minLength={8}
                  className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-[#4ad9e0]/50 pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/70 text-sm">Confirm new password</Label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
                className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-[#4ad9e0]/50"
              />
              {confirm.length > 0 && password !== confirm && (
                <p className="text-red-400/80 text-xs">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={reset.isPending || !token}
              className="w-full bg-[#189aa1] hover:bg-[#189aa1]/90 text-white font-semibold py-2.5 rounded-lg"
            >
              {reset.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</> : "Update password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

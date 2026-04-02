import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const register = trpc.customAuth.register.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    register.mutate({ name, email, password });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d1f2d] via-[#0f2a35] to-[#0a1a22] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-baseline gap-0.5 mb-8">
            <span className="text-4xl font-bold text-white tracking-tight">teach</span>
            <span className="text-4xl font-bold text-[#4ad9e0] tracking-tight">ific</span>
            <span className="text-xl text-[#4ad9e0]/70 ml-0.5">™</span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-10 shadow-2xl">
            <CheckCircle2 className="w-16 h-16 text-[#4ad9e0] mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-3">Check your inbox</h2>
            <p className="text-white/60 leading-relaxed mb-6">
              We've sent a verification email to <span className="text-[#4ad9e0] font-medium">{email}</span>. Click the link in the email to activate your account.
            </p>
            <Link href="/login">
              <Button className="bg-[#189aa1] hover:bg-[#189aa1]/90 text-white font-semibold w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1f2d] via-[#0f2a35] to-[#0a1a22] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#189aa1]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-[#4ad9e0]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-baseline gap-0.5 mb-2">
            <span className="text-4xl font-bold text-white tracking-tight">teach</span>
            <span className="text-4xl font-bold text-[#4ad9e0] tracking-tight">ific</span>
            <span className="text-xl text-[#4ad9e0]/70 ml-0.5">™</span>
          </div>
          <p className="text-[#4ad9e0]/60 text-sm font-medium tracking-wide uppercase">Learning Management Platform</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-1">Create your account</h2>
          <p className="text-white/50 text-sm mb-6">Start building your learning experience today</p>

          {error && (
            <Alert className="mb-4 border-red-500/30 bg-red-500/10">
              <AlertDescription className="text-red-300 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-white/70 text-sm">Full name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                required
                autoComplete="name"
                className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-[#4ad9e0]/50 focus:ring-[#4ad9e0]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/70 text-sm">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-[#4ad9e0]/50 focus:ring-[#4ad9e0]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/70 text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-[#4ad9e0]/50 focus:ring-[#4ad9e0]/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && password.length < 8 && (
                <p className="text-amber-400/80 text-xs">Password must be at least 8 characters</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={register.isPending}
              className="w-full bg-[#189aa1] hover:bg-[#189aa1]/90 text-white font-semibold py-2.5 rounded-lg transition-all"
            >
              {register.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</>
              ) : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/40 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-[#4ad9e0] hover:text-[#4ad9e0]/80 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          © {new Date().getFullYear()} Teachific™. All rights reserved.
        </p>
      </div>
    </div>
  );
}

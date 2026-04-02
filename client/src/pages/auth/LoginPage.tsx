import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const login = trpc.customAuth.login.useMutation({
    onSuccess: () => {
      navigate("/dashboard");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    login.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1f2d] via-[#0f2a35] to-[#0a1a22] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#189aa1]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4ad9e0]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-baseline gap-0.5 mb-2">
            <span className="text-4xl font-bold text-white tracking-tight">teach</span>
            <span className="text-4xl font-bold text-[#4ad9e0] tracking-tight">ific</span>
            <span className="text-xl text-[#4ad9e0]/70 ml-0.5">™</span>
          </div>
          <p className="text-[#4ad9e0]/60 text-sm font-medium tracking-wide uppercase">Learning Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-white/50 text-sm mb-6">Sign in to your account to continue</p>

          {error && (
            <Alert className="mb-4 border-red-500/30 bg-red-500/10">
              <AlertDescription className="text-red-300 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white/70 text-sm">Password</Label>
                <Link href="/forgot-password" className="text-[#4ad9e0] text-xs hover:text-[#4ad9e0]/80 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
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
            </div>

            <Button
              type="submit"
              disabled={login.isPending}
              className="w-full bg-[#189aa1] hover:bg-[#189aa1]/90 text-white font-semibold py-2.5 rounded-lg transition-all"
            >
              {login.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>
              ) : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/40 text-sm">
              Don't have an account?{" "}
              <Link href="/register" className="text-[#4ad9e0] hover:text-[#4ad9e0]/80 font-medium transition-colors">
                Create one
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

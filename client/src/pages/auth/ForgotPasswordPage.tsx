import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MailCheck, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const forgot = trpc.customAuth.forgotPassword.useMutation({
    onSuccess: () => setSent(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgot.mutate({ email });
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d1f2d] via-[#0f2a35] to-[#0a1a22] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-baseline gap-0.5 mb-8">
            <span className="text-4xl font-bold text-white tracking-tight">teach</span>
            <span className="text-4xl font-bold text-[#4ad9e0] tracking-tight">ific</span>
            <span className="text-xl text-[#4ad9e0]/70 ml-0.5">™</span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-10 shadow-2xl">
            <MailCheck className="w-16 h-16 text-[#4ad9e0] mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-3">Check your inbox</h2>
            <p className="text-white/60 leading-relaxed mb-6">
              If an account exists for <span className="text-[#4ad9e0] font-medium">{email}</span>, we've sent a password reset link. Check your spam folder if you don't see it within a few minutes.
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
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-[#189aa1]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-baseline gap-0.5 mb-2">
            <span className="text-4xl font-bold text-white tracking-tight">teach</span>
            <span className="text-4xl font-bold text-[#4ad9e0] tracking-tight">ific</span>
            <span className="text-xl text-[#4ad9e0]/70 ml-0.5">™</span>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>

          <h2 className="text-xl font-semibold text-white mb-1">Forgot your password?</h2>
          <p className="text-white/50 text-sm mb-6">Enter your email and we'll send you a reset link.</p>

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
                className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-[#4ad9e0]/50"
              />
            </div>

            <Button
              type="submit"
              disabled={forgot.isPending}
              className="w-full bg-[#189aa1] hover:bg-[#189aa1]/90 text-white font-semibold py-2.5 rounded-lg"
            >
              {forgot.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
              ) : "Send reset link"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

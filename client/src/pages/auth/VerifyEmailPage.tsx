import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const verify = trpc.customAuth.verifyEmail.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage(data.message);
    },
    onError: (err) => {
      setStatus("error");
      setMessage(err.message);
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
      verify.mutate({ token: t });
    } else {
      setStatus("error");
      setMessage("Invalid or missing verification token.");
    }
  }, []);

  const Logo = () => (
    <div className="inline-flex items-baseline gap-0.5 mb-8">
      <span className="text-4xl font-bold text-white tracking-tight">teach</span>
      <span className="text-4xl font-bold text-[#4ad9e0] tracking-tight">ific</span>
      <span className="text-xl text-[#4ad9e0]/70 ml-0.5">™</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1f2d] via-[#0f2a35] to-[#0a1a22] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <Logo />
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-10 shadow-2xl">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 text-[#4ad9e0] mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-semibold text-white mb-3">Verifying your email...</h2>
              <p className="text-white/60">Please wait a moment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 text-[#4ad9e0] mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-3">Email verified!</h2>
              <p className="text-white/60 leading-relaxed mb-6">{message}</p>
              <Link href="/login">
                <Button className="bg-[#189aa1] hover:bg-[#189aa1]/90 text-white font-semibold w-full">
                  Sign In
                </Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-3">Verification failed</h2>
              <p className="text-white/60 leading-relaxed mb-6">{message}</p>
              <Link href="/login">
                <Button className="bg-[#189aa1] hover:bg-[#189aa1]/90 text-white font-semibold w-full">
                  Back to Sign In
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

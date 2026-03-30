/**
 * EmbedPage — a bare content player with no admin navigation.
 * Accessible at /embed/:id
 * Used for share links, external embeds, and learner-facing access.
 */
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, Clock, Download,
  Maximize2, Minimize2, Loader2, Lock,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { getLoginUrl } from "@/const";

// SCORM 1.2 + 2004 API Bridge
const SCORM_API_SCRIPT = `
(function() {
  var _data = {};
  var _initialized = false;
  function post(type, payload) {
    window.parent.postMessage({ source: 'scorm-api', type: type, payload: payload }, '*');
  }
  window.API = {
    LMSInitialize: function() { _initialized = true; post('initialize', {}); return 'true'; },
    LMSFinish: function() { post('finish', { data: _data }); return 'true'; },
    LMSGetValue: function(k) { return _data[k] || ''; },
    LMSSetValue: function(k, v) { _data[k] = v; post('setValue', { key: k, value: v }); return 'true'; },
    LMSCommit: function() { post('commit', { data: _data }); return 'true'; },
    LMSGetLastError: function() { return '0'; },
    LMSGetErrorString: function() { return ''; },
    LMSGetDiagnostic: function() { return ''; },
  };
  window.API_1484_11 = {
    Initialize: function() { _initialized = true; post('initialize', {}); return 'true'; },
    Terminate: function() { post('finish', { data: _data }); return 'true'; },
    GetValue: function(k) { return _data[k] || ''; },
    SetValue: function(k, v) { _data[k] = v; post('setValue', { key: k, value: v }); return 'true'; },
    Commit: function() { post('commit', { data: _data }); return 'true'; },
    GetLastError: function() { return '0'; },
    GetErrorString: function() { return ''; },
    GetDiagnostic: function() { return ''; },
  };
})();
`;

export default function EmbedPage() {
  const params = useParams<{ id: string }>();
  const packageId = Number(params.id);

  // Read dynamic learner identity + UTM params from the URL query string
  // Supported: ?learner_name=&learner_email=&learner_id=&learner_group=&custom_data=&utm_source=&utm_medium=&utm_campaign=
  const urlParams = new URLSearchParams(window.location.search);
  const learnerName   = urlParams.get("learner_name")   ?? undefined;
  const learnerEmail  = urlParams.get("learner_email")  ?? undefined;
  const learnerId     = urlParams.get("learner_id")     ?? undefined;
  const learnerGroup  = urlParams.get("learner_group")  ?? undefined;
  const customData    = urlParams.get("custom_data")    ?? undefined;
  const utmSource     = urlParams.get("utm_source")     ?? undefined;
  const utmMedium     = urlParams.get("utm_medium")     ?? undefined;
  const utmCampaign   = urlParams.get("utm_campaign")   ?? undefined;
  const referrer      = document.referrer || undefined;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [completionStatus, setCompletionStatus] = useState("not_started");
  const [scorePercent, setScorePercent] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const startedAt = useRef(Date.now());
  const sessionTokenRef = useRef<string | null>(null);
  const scormDataRef = useRef<Record<string, string>>({});

  const { data: pkg, isLoading, error: pkgError } = trpc.packages.get.useQuery(
    { id: packageId },
    { retry: false, staleTime: Infinity }
  );
  const { data: perms } = trpc.permissions.get.useQuery({ packageId }, { retry: false });
  const startSession = trpc.sessions.start.useMutation();
  const endSession = trpc.sessions.end.useMutation();
  const saveScorm = trpc.scorm.setData.useMutation();

  // Start session — forward all URL learner params so they are stored on the session record
  useEffect(() => {
    if (pkg?.status === "ready") {
      startSession.mutateAsync({
        packageId,
        learnerName,
        learnerEmail,
        learnerId,
        learnerGroup,
        customData,
        utmSource,
        utmMedium,
        utmCampaign,
        referrer,
      })
        .then((r) => {
          sessionTokenRef.current = r.sessionToken;
          setStarted(true);
          startedAt.current = Date.now();
        })
        .catch(() => {});
    }
    return () => {
      if (sessionTokenRef.current) {
        endSession.mutate({ sessionToken: sessionTokenRef.current, completionStatus: "incomplete" });
      }
    };
  }, [pkg?.status]);

  // Elapsed timer
  useEffect(() => {
    if (!started) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [started]);

  // SCORM message listener
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data || e.data.source !== "scorm-api") return;
      const { type, payload } = e.data;
      if (type === "setValue") {
        const { key, value } = payload;
        scormDataRef.current[key] = value;
        if (key === "cmi.core.lesson_status" || key === "cmi.completion_status") setCompletionStatus(value);
        if (key === "cmi.core.score.raw" || key === "cmi.score.raw") {
          const max = scormDataRef.current["cmi.core.score.max"] || scormDataRef.current["cmi.score.max"] || "100";
          setScorePercent(Math.round((parseFloat(value) / parseFloat(max)) * 100));
        }
        if (key === "cmi.core.score.scaled" || key === "cmi.score.scaled") {
          setScorePercent(Math.round(parseFloat(value) * 100));
        }
        if (sessionTokenRef.current) {
          const updates: Record<string, unknown> = { sessionToken: sessionTokenRef.current };
          if (key.includes("suspend_data")) updates.suspendData = value;
          else if (key.includes("lesson_status") || key.includes("completion_status")) updates.lessonStatus = value;
          else if (key.includes("lesson_location") || key.includes("location")) updates.lessonLocation = value;
          else if (key.includes("score.raw") || key.includes("score.scaled")) updates.score = parseFloat(value) || undefined;
          else if (key.includes("total_time") || key.includes("session_time")) updates.totalTime = value;
          if (Object.keys(updates).length > 1) saveScorm.mutate(updates as Parameters<typeof saveScorm.mutate>[0]);
        }
      }
      if (type === "finish") {
        const status = payload.data?.["cmi.core.lesson_status"] || payload.data?.["cmi.completion_status"] || "completed";
        setCompletionStatus(status);
        if (sessionTokenRef.current) {
          endSession.mutate({ sessionToken: sessionTokenRef.current, completionStatus: status });
          sessionTokenRef.current = null;
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Inject SCORM API after iframe loads
  const handleIframeLoad = useCallback(() => {
    try {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;
      const script = iframe.contentDocument?.createElement("script");
      if (script) {
        script.textContent = SCORM_API_SCRIPT;
        iframe.contentDocument?.head?.appendChild(script);
      }
    } catch {
      // Cross-origin: bridge via postMessage only
    }
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatElapsed = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const playerUrl = pkg?.status === "ready" ? `/api/content/${packageId}/entry` : null;
  const isLmsShell = pkg?.displayMode === "lms_shell";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pkg) {
    // Check if it's an UNAUTHORIZED error (private package, not logged in)
    const isPrivateBlock = (pkgError as any)?.data?.code === "UNAUTHORIZED";
    if (isPrivateBlock) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-950">
          <div className="flex flex-col items-center gap-6 p-8 max-w-sm w-full bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl text-center">
            <div className="h-14 w-14 rounded-full bg-gray-800 flex items-center justify-center">
              <Lock className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Private Content</h2>
              <p className="text-sm text-gray-400 mt-1">This content is restricted. Please sign in to access it.</p>
            </div>
            <Button
              onClick={() => {
                sessionStorage.setItem("returnTo", `/embed/${packageId}${window.location.search}`);
                window.location.href = getLoginUrl();
              }}
              className="w-full"
            >
              Sign in to continue
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-400">
        <p>Content not found</p>
      </div>
    );
  }

  if (pkg.status === "processing") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-gray-400 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Content is still being processed. Please check back shortly.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Minimal top bar */}
      <div className={`shrink-0 flex items-center px-4 gap-3 ${isLmsShell ? "h-14 bg-gray-900 border-b border-gray-800" : "h-11 bg-gray-900/80 border-b border-gray-800/60"}`}>
          {isLmsShell && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xl font-bold tracking-tight select-none hidden sm:inline" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>
              <span className="text-white">teach</span><span style={{ color: '#189aa1' }}>ific</span><span className="text-white" style={{ fontSize: '0.45em', verticalAlign: 'super', marginLeft: '1px' }}>&#8482;</span>
            </span>
            <div className="h-4 w-px bg-gray-700 hidden sm:block" />
          </div>
          )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{pkg.title}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {started && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />{formatElapsed(elapsed)}
            </span>
          )}
          {scorePercent !== null && (
            <Badge variant="secondary" className="text-xs bg-gray-800 text-gray-200">
              {scorePercent}%
            </Badge>
          )}
          {completionStatus !== "not_started" && (completionStatus === "completed" || completionStatus === "passed") && (
            <Badge className="text-xs bg-emerald-600 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />Complete
            </Badge>
          )}
          {perms?.allowDownload && pkg.originalZipUrl && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-white" asChild title="Download">
              <a href={pkg.originalZipUrl} download target="_blank" rel="noreferrer">
                <Download className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-white" onClick={toggleFullscreen} title="Fullscreen">
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* LMS progress bar */}
      {isLmsShell && (completionStatus === "incomplete" || completionStatus === "completed" || completionStatus === "passed") && (
        <div className="px-4 pb-1 bg-gray-900">
          <Progress
            value={completionStatus === "completed" || completionStatus === "passed" ? 100 : scorePercent ?? 30}
            className="h-1 bg-gray-800"
          />
        </div>
      )}

      {/* Content iframe */}
      <div className="flex-1 relative overflow-hidden">
        {playerUrl ? (
          <iframe
            ref={iframeRef}
            src={playerUrl}
            className="w-full h-full border-0"
            title={pkg.title}
            allow="fullscreen autoplay"
            onLoad={handleIframeLoad}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-sm">No content entry point found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft, Copy, Download, ExternalLink, FileArchive,
  GitBranch, Globe, Link2, Lock, Play, RefreshCw, Save, Settings, Shield, User,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

// ── Dynamic Embed Integration Builder ────────────────────────────────────────
const ALL_PARAMS = [
  { key: "learner_name",  label: "Learner Name",   token: "{{learner_name}}",  desc: "Full name of the learner",        example: "Jane Smith" },
  { key: "learner_email", label: "Learner Email",  token: "{{learner_email}}", desc: "Email address for session tracking", example: "jane@example.com" },
  { key: "learner_id",    label: "Learner ID",     token: "{{learner_id}}",    desc: "Employee, student, or user ID",   example: "EMP-12345" },
  { key: "learner_group", label: "Group / Cohort", token: "{{learner_group}}", desc: "Team, class, or cohort name",     example: "Cohort-2026-Q1" },
  { key: "custom_data",   label: "Custom Data",    token: "{{custom_data}}",   desc: "Any extra key=value metadata",    example: "dept=cardio" },
  { key: "utm_source",    label: "UTM Source",     token: "{{utm_source}}",    desc: "Traffic source (e.g. email)",     example: "lms" },
  { key: "utm_medium",    label: "UTM Medium",     token: "{{utm_medium}}",    desc: "Marketing medium",               example: "course" },
  { key: "utm_campaign",  label: "UTM Campaign",   token: "{{utm_campaign}}",  desc: "Campaign or course name",        example: "onboarding-2026" },
] as const;

type ParamKey = typeof ALL_PARAMS[number]["key"];

function EmbedIntegrationBuilder({ baseUrl }: { baseUrl: string }) {
  const [enabled, setEnabled] = useState<Set<ParamKey>>(() => new Set<ParamKey>(["learner_name", "learner_email", "learner_id"]));
  const [testValues, setTestValues] = useState<Record<ParamKey, string>>(
    Object.fromEntries(ALL_PARAMS.map((p) => [p.key, ""])) as Record<ParamKey, string>
  );
  const [activeTab, setActiveTab] = useState<"js" | "iframe" | "server">("js");
  const [showTest, setShowTest] = useState(false);

  const toggleParam = (key: ParamKey) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Template URL — uses {{token}} placeholders for enabled params
  const templateUrl = useMemo(() => {
    const url = new URL(baseUrl);
    for (const p of ALL_PARAMS) {
      if (enabled.has(p.key)) url.searchParams.set(p.key, p.token);
    }
    return url.toString();
  }, [baseUrl, enabled]);

  // Live preview URL — substitutes test values (or keeps placeholder if blank)
  const previewUrl = useMemo(() => {
    const url = new URL(baseUrl);
    for (const p of ALL_PARAMS) {
      if (!enabled.has(p.key)) continue;
      const val = testValues[p.key].trim();
      url.searchParams.set(p.key, val || p.token);
    }
    return url.toString();
  }, [baseUrl, enabled, testValues]);

  const enabledParams = ALL_PARAMS.filter((p) => enabled.has(p.key));

  // Code snippets
  const jsVarLines = enabledParams.map((p) => `  const ${p.key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())} = getCurrentUser().${p.key}; // replace with your variable`).join("\n");
  const jsReplaceLines = enabledParams.map((p) => `    .replace('${p.token}', encodeURIComponent(${p.key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())}))`).join("\n");

  const jsSnippet = enabledParams.length === 0 ? `// Enable at least one parameter above` : `// 1. Store the template URL (copy from above)
const TEMPLATE_URL = '${templateUrl}';

// 2. Replace placeholders with your app's dynamic variables
function buildLearnerUrl() {
${jsVarLines}

  return TEMPLATE_URL
${jsReplaceLines};
}

// 3. Set the iframe src
document.getElementById('teachific-frame').src = buildLearnerUrl();`;

  const jsUrl = templateUrl.replace(/{{/g, '${user.').replace(/}}/g, '}');
  const BT = String.fromCharCode(96); // backtick — avoids nested template literal parse errors
  const iframeSnippet = enabledParams.length === 0
    ? '<iframe src="' + baseUrl + '" width="100%" height="600" frameborder="0" allowfullscreen></iframe>'
    : [
        '<!-- Replace each {{token}} with your platform\'s variable syntax -->',
        '<!-- Example shown with generic JS template literals -->',
        '<script>',
        '  const url = ' + BT + jsUrl + BT + ';',
        '  document.write(' + BT + '<iframe src="${url}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>' + BT + ');',
        '</script>',
      ].join('\n');

  const serverSnippet = enabledParams.length === 0
    ? '# Enable at least one parameter above'
    : [
        '# Python / Django example',
        'from urllib.parse import urlencode, quote_plus',
        '',
        "base = '" + baseUrl + "'",
        'params = {',
        ...enabledParams.map((p) => "    '" + p.key + "': request.user." + p.key.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase()) + ",  # your user object field"),
        '}',
        "embed_url = base + '?' + urlencode(params, quote_via=quote_plus)",
        '',
        '# Pass embed_url to your template:',
        '# <iframe src="{{ embed_url }}" ...></iframe>',
        '',
        '# Node.js / Express example:',
        '# const params = new URLSearchParams({',
        ...enabledParams.map((p) => '#   ' + p.key + ': req.user.' + p.key + ','),
        '# });',
        '# const embedUrl = `' + baseUrl + '?${params}`;',
      ].join('\n');

  return (
    <div className="space-y-5 pt-1">
      {/* Step 1: Select params */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Step 1 — Choose which variables to pass</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ALL_PARAMS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => toggleParam(p.key)}
              className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-colors ${
                enabled.has(p.key)
                  ? "border-primary/60 bg-primary/5 text-foreground"
                  : "border-border/50 bg-muted/30 text-muted-foreground hover:border-border"
              }`}
            >
              <div className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                enabled.has(p.key) ? "bg-primary border-primary" : "border-muted-foreground/40"
              }`}>
                {enabled.has(p.key) && <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-primary-foreground"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium leading-tight">{p.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{p.desc}</p>
                <code className="text-[10px] text-primary/80 mt-0.5 block">{p.token}</code>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Template URL */}
      {enabledParams.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Step 2 — Template URL (copy this into your code)</p>
          <div className="flex gap-2">
            <Input readOnly value={templateUrl} className="font-mono text-[11px] h-8" />
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => { navigator.clipboard.writeText(templateUrl); toast.success("Template URL copied!"); }}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Your server or frontend replaces each <code className="text-primary/80">&#123;&#123;token&#125;&#125;</code> with the learner's actual value before setting the iframe <code className="text-primary/80">src</code>.
          </p>
        </div>
      )}

      {/* Step 3: Code snippets */}
      {enabledParams.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Step 3 — Integration code</p>
          <div className="flex gap-1 mb-2">
            {(["js", "iframe", "server"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setActiveTab(t)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  activeTab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}>
                {t === "js" ? "JavaScript" : t === "iframe" ? "iframe HTML" : "Server-side"}
              </button>
            ))}
          </div>
          <div className="relative">
            <pre className="bg-muted rounded-lg p-3 text-[11px] leading-relaxed overflow-x-auto whitespace-pre font-mono max-h-56">
              {activeTab === "js" ? jsSnippet : activeTab === "iframe" ? iframeSnippet : serverSnippet}
            </pre>
            <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 px-2 text-[10px]"
              onClick={() => {
                const txt = activeTab === "js" ? jsSnippet : activeTab === "iframe" ? iframeSnippet : serverSnippet;
                navigator.clipboard.writeText(txt);
                toast.success("Code copied!");
              }}>
              <Copy className="h-3 w-3 mr-1" />Copy
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Live test */}
      {enabledParams.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowTest((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors">
            <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 transition-transform ${showTest ? "rotate-90" : ""}`} fill="currentColor">
              <path d="M6 4l4 4-4 4"/>
            </svg>
            Step 4 — Test with sample values
          </button>
          {showTest && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {enabledParams.map((p) => (
                  <div key={p.key} className="space-y-0.5">
                    <Label className="text-[11px] font-medium">{p.label}</Label>
                    <Input
                      value={testValues[p.key]}
                      onChange={(e) => setTestValues((v) => ({ ...v, [p.key]: e.target.value }))}
                      placeholder={p.example}
                      className="h-7 text-xs"
                    />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Preview URL (unfilled tokens remain as placeholders):</p>
                <div className="flex gap-2">
                  <Input readOnly value={previewUrl} className="font-mono text-[11px] h-7" />
                  <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={() => { navigator.clipboard.writeText(previewUrl); toast.success("Copied!"); }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" asChild>
                    <a href={previewUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3" /></a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function FileDetailPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const packageId = Number(params.id);

  const { data: pkg, isLoading, refetch } = trpc.packages.get.useQuery({ id: packageId });
  const { data: versions } = trpc.versions.list.useQuery({ packageId });
  const { data: perms } = trpc.permissions.get.useQuery({ packageId });
  const { data: analytics } = trpc.analytics.byPackage.useQuery({ packageId });

  const updatePkg = trpc.packages.update.useMutation({ onSuccess: () => { toast.success("Saved"); refetch(); } });
  const updatePerms = trpc.permissions.update.useMutation({ onSuccess: () => toast.success("Permissions saved") });
  const generateToken = trpc.permissions.generateShareToken.useMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true);
  const [maxPlays, setMaxPlays] = useState("");
  const [shareToken, setShareToken] = useState("");

  useEffect(() => { if (pkg) { setTitle(pkg.title); setDescription(pkg.description ?? ""); setIsPublic(pkg.isPublic ?? false); } }, [pkg]);
  useEffect(() => {
    if (perms) {
      setAllowDownload(perms.allowDownload ?? true);
      setMaxPlays(perms.maxTotalPlays ? String(perms.maxTotalPlays) : "");
      setShareToken(perms.shareToken ?? "");
    }
  }, [perms]);

  const baseEmbedUrl = `${window.location.origin}/embed/${packageId}`;
  const shareUrl = shareToken ? `${baseEmbedUrl}?token=${shareToken}` : "";

  if (isLoading) return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" />
    </div>
  );

  if (!pkg) return (
    <div className="p-6 text-center">
      <p className="text-muted-foreground">Package not found</p>
      <Button variant="outline" className="mt-4" onClick={() => setLocation("/files")}>Back to Files</Button>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/files")}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{pkg.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${pkg.status === "ready" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{pkg.status}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${pkg.isPublic ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{pkg.isPublic ? <><Globe className="h-3 w-3" />Public</> : <><Lock className="h-3 w-3" />Private</>}</span>
            <span className="text-xs text-muted-foreground">{pkg.contentType}</span>
            {pkg.scormVersion !== "none" && <span className="text-xs text-muted-foreground">SCORM {pkg.scormVersion}</span>}
          </div>
        </div>
        <Button onClick={() => setLocation(`/play/${packageId}`)} className="gap-2"><Play className="h-4 w-4" />Preview</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Plays", value: pkg.totalPlayCount ?? 0, icon: Play },
          { label: "Downloads", value: pkg.totalDownloadCount ?? 0, icon: Download },
          { label: "Versions", value: versions?.length ?? 1, icon: GitBranch },
          { label: "Assets", value: (analytics as any)?.assetCount ?? "—", icon: FileArchive },
        ].map((s) => (
          <Card key={s.label} className="shadow-sm border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold mt-0.5">{s.value}</p></div>
                <s.icon className="h-5 w-5 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="details">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="details"><Settings className="h-3.5 w-3.5 mr-1.5" />Details</TabsTrigger>
          <TabsTrigger value="permissions"><Shield className="h-3.5 w-3.5 mr-1.5" />Permissions</TabsTrigger>
          <TabsTrigger value="sharing"><Globe className="h-3.5 w-3.5 mr-1.5" />Sharing</TabsTrigger>
          <TabsTrigger value="versions"><GitBranch className="h-3.5 w-3.5 mr-1.5" />Versions</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-sm">Package Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              {pkg.scormVersion !== "none" && (
                <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
                  <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">SCORM Metadata</p>
                  <p><span className="text-muted-foreground">Version:</span> {pkg.scormVersion}</p>
                  {pkg.scormEntryPoint && <p><span className="text-muted-foreground">Entry:</span> <code className="text-xs bg-muted px-1 rounded">{pkg.scormEntryPoint}</code></p>}
                </div>
              )}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/30">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    {isPublic ? <Globe className="h-4 w-4 text-blue-500" /> : <Lock className="h-4 w-4 text-slate-500" />}
                    {isPublic ? "Public Access" : "Private Access"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isPublic
                      ? "Anyone with the link can view this content — no login required."
                      : "Only signed-in users can view this content."}
                  </p>
                </div>
                <Switch
                  checked={isPublic}
                  onCheckedChange={(val) => {
                    setIsPublic(val);
                    updatePkg.mutate({ id: packageId, title, description, isPublic: val });
                  }}
                />
              </div>
              {pkg.originalZipUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={pkg.originalZipUrl} download target="_blank" rel="noreferrer"><Download className="h-3.5 w-3.5 mr-1.5" />Download Original ZIP</a>
                </Button>
              )}
              <Button onClick={() => updatePkg.mutate({ id: packageId, title, description, isPublic })} disabled={updatePkg.isPending} className="gap-2">
                <Save className="h-3.5 w-3.5" />{updatePkg.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-sm">Access Permissions</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Allow Download</p><p className="text-xs text-muted-foreground">Let users download the original ZIP file</p></div>
                <Switch checked={allowDownload} onCheckedChange={setAllowDownload} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Total Plays</Label>
                <Input type="number" placeholder="Unlimited" value={maxPlays} onChange={(e) => setMaxPlays(e.target.value)} className="max-w-xs" />
                <p className="text-xs text-muted-foreground">Leave blank for unlimited plays</p>
              </div>
              <Button onClick={() => updatePerms.mutate({ packageId, allowDownload, maxTotalPlays: maxPlays ? Number(maxPlays) : undefined })} disabled={updatePerms.isPending} className="gap-2">
                <Lock className="h-3.5 w-3.5" />{updatePerms.isPending ? "Saving..." : "Save Permissions"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sharing" className="mt-4 space-y-4">
          {/* Basic share links */}
          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-sm">Share & Embed</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm font-medium mb-2">Direct Play Link</p>
                <div className="flex gap-2">
                  <Input readOnly value={baseEmbedUrl} className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(baseEmbedUrl); toast.success("Copied!"); }}><Copy className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" asChild><a href={`/embed/${packageId}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Token-Protected Share Link</p>
                {shareToken ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input readOnly value={shareUrl} className="font-mono text-xs" />
                      <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Copied!"); }}><Copy className="h-4 w-4" /></Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => generateToken.mutateAsync({ packageId, expiresInDays: 30 }).then((r) => setShareToken(r.token))} className="gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5" />Regenerate
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => generateToken.mutateAsync({ packageId, expiresInDays: 30 }).then((r) => { setShareToken(r.token); toast.success("Share link generated"); })} className="gap-2">
                    <Link2 className="h-4 w-4" />Generate Share Link
                  </Button>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Embed Code</p>
                <div className="relative">
                  <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap">{`<iframe src="${baseEmbedUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`}</pre>
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => { navigator.clipboard.writeText(`<iframe src="${baseEmbedUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`); toast.success("Copied!"); }}><Copy className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* URL Parameter Builder */}
          <Card className="shadow-sm border-border/60">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Dynamic Embed Integration
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Choose which variables to pass from your platform. Copy the template URL or ready-made code snippet and substitute the placeholders with your site's dynamic values.
              </p>
            </CardHeader>
            <CardContent>
              <EmbedIntegrationBuilder baseUrl={baseEmbedUrl} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="mt-4">
          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-sm">Version History</CardTitle></CardHeader>
            <CardContent>
              {!versions || versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No version history available</p>
              ) : (
                <div className="space-y-2">
                  {versions.map((v: any, i: number) => (
                    <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{v.versionNumber}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{v.changeNotes ?? `Version ${v.versionNumber}`}</p>
                        <p className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</p>
                      </div>
                      {i === 0 && <Badge variant="secondary" className="text-xs">Current</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

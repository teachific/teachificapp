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
  GitBranch, Globe, Link2, Lock, Play, RefreshCw, Save, Settings, Shield,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

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
  const [allowDownload, setAllowDownload] = useState(true);
  const [maxPlays, setMaxPlays] = useState("");
  const [shareToken, setShareToken] = useState("");

  useEffect(() => { if (pkg) { setTitle(pkg.title); setDescription(pkg.description ?? ""); } }, [pkg]);
  useEffect(() => {
    if (perms) {
      setAllowDownload(perms.allowDownload ?? true);
      setMaxPlays(perms.maxTotalPlays ? String(perms.maxTotalPlays) : "");
      setShareToken(perms.shareToken ?? "");
    }
  }, [perms]);

  const shareUrl = shareToken ? `${window.location.origin}/play/${packageId}?token=${shareToken}` : "";

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
              {pkg.originalZipUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={pkg.originalZipUrl} download target="_blank" rel="noreferrer"><Download className="h-3.5 w-3.5 mr-1.5" />Download Original ZIP</a>
                </Button>
              )}
              <Button onClick={() => updatePkg.mutate({ id: packageId, title, description })} disabled={updatePkg.isPending} className="gap-2">
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

        <TabsContent value="sharing" className="mt-4">
          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-sm">Share & Embed</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm font-medium mb-2">Direct Play Link</p>
                <div className="flex gap-2">
                  <Input readOnly value={`${window.location.origin}/play/${packageId}`} className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/play/${packageId}`); toast.success("Copied!"); }}><Copy className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" asChild><a href={`/play/${packageId}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
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
                  <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap">{`<iframe src="${window.location.origin}/play/${packageId}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`}</pre>
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => { navigator.clipboard.writeText(`<iframe src="${window.location.origin}/play/${packageId}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`); toast.success("Copied!"); }}><Copy className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
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

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle, CheckCircle2, ChevronRight, FileArchive,
  Layers, Loader2, Monitor, Play, Upload, X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type DisplayMode = "native" | "lms_shell" | "quiz";
type Step = "select" | "configure" | "uploading" | "done";

const DISPLAY_MODES: Array<{ id: DisplayMode; label: string; desc: string; icon: React.ElementType }> = [
  {
    id: "native",
    label: "Native Format",
    desc: "Play exactly as created by the authoring tool (Articulate, iSpring, etc.). Preserves all original interactivity and styling.",
    icon: Monitor,
  },
  {
    id: "lms_shell",
    label: "LMS Presentation Shell",
    desc: "Wrap the content in the internal LMS player with navigation controls, progress tracking, and branded interface.",
    icon: Layers,
  },
  {
    id: "quiz",
    label: "Import as Quiz",
    desc: "Extract questions from the content and import them into the internal quiz engine for full control over scoring and attempts.",
    icon: Play,
  },
];

export default function UploadPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: myOrgs } = trpc.orgs.myOrgs.useQuery();

  const [step, setStep] = useState<Step>("select");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("native");
  const [selectedOrgId, setSelectedOrgId] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [packageId, setPackageId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const analyzePackage = trpc.packages.analyze.useMutation();

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".zip")) {
      toast.error("Only ZIP files are supported");
      return;
    }
    if (selectedFile.size > 500 * 1024 * 1024) {
      toast.error("File size must be under 500 MB");
      return;
    }
    setFile(selectedFile);
    setTitle(selectedFile.name.replace(/\.zip$/i, "").replace(/[-_]/g, " "));
    setStep("configure");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!file || !title.trim()) { toast.error("Please provide a title"); return; }
    const orgId = selectedOrgId || myOrgs?.[0]?.id;
    if (!orgId) { toast.error("Please select an organization"); return; }
    if (!user) { toast.error("You must be logged in"); return; }

    setStep("uploading");
    setUploadProgress(10);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orgId", String(orgId));
      formData.append("uploadedBy", String(user.id));
      formData.append("title", title);
      formData.append("displayMode", displayMode);
      if (description) formData.append("description", description);

      const result = await new Promise<{ packageId: number }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(10 + Math.round((e.loaded / e.total) * 50));
        };
        xhr.onload = () => {
          if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
          else reject(new Error(JSON.parse(xhr.responseText)?.error ?? "Upload failed"));
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("POST", "/api/upload/package");
        xhr.send(formData);
      });

      setPackageId(result.packageId);
      setUploadProgress(65);

      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/upload/status/${result.packageId}`);
          const status = await res.json();
          if (status.status === "ready") {
            setUploadProgress(100);
            clearInterval(pollRef.current!);
            setStep("done");
            analyzePackage.mutate({ packageId: result.packageId, fileList: [] });
          } else if (status.status === "error") {
            clearInterval(pollRef.current!);
            setError(status.processingError ?? "Processing failed");
            setStep("configure");
          } else {
            setUploadProgress((p) => Math.min(p + 5, 95));
          }
        } catch { /* ignore */ }
      }, 2000);
    } catch (err: unknown) {
      setError(String(err));
      setStep("configure");
      toast.error("Upload failed: " + String(err));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const resetForm = () => {
    setFile(null); setTitle(""); setDescription(""); setDisplayMode("native");
    setPackageId(null); setUploadProgress(0); setError(null); setStep("select");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => setLocation("/")} className="hover:text-foreground transition-colors">Dashboard</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Upload Content</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Content Package</h1>
        <p className="text-muted-foreground text-sm mt-1">Upload SCORM, Articulate, iSpring, or HTML ZIP packages</p>
      </div>

      {/* Step 1: Select File */}
      {step === "select" && (
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-8">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                isDragging ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/50 hover:bg-accent/30"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".zip" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-base font-semibold">Drop your ZIP file here</p>
                  <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["SCORM 1.2", "SCORM 2004", "Articulate", "iSpring", "HTML5"].map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Maximum file size: 500 MB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Configure */}
      {step === "configure" && file && (
        <div className="space-y-5">
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileArchive className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => { setFile(null); setStep("select"); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Package Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. OBGYN Registry Review" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this content..." rows={3} />
              </div>
              {myOrgs && myOrgs.length > 1 && (
                <div className="space-y-1.5">
                  <Label>Organization</Label>
                  <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={selectedOrgId || ""} onChange={(e) => setSelectedOrgId(Number(e.target.value))}>
                    <option value="">Select organization...</option>
                    {myOrgs.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Display Mode</CardTitle>
              <p className="text-xs text-muted-foreground">Choose how this content will be presented to learners</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {DISPLAY_MODES.map((mode) => (
                <button key={mode.id} onClick={() => setDisplayMode(mode.id)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    displayMode === mode.id ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/30 hover:bg-accent/30"
                  }`}>
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                    displayMode === mode.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    <mode.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{mode.label}</p>
                      {displayMode === mode.id && <Badge className="text-xs h-4 px-1.5">Selected</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{mode.desc}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setFile(null); setStep("select"); }}>Back</Button>
            <Button onClick={handleUpload} disabled={!title.trim()} className="flex-1 gap-2">
              <Upload className="h-4 w-4" />Upload Package
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Uploading */}
      {step === "uploading" && (
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-8 text-center space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-lg">{uploadProgress < 65 ? "Uploading..." : "Processing..."}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {uploadProgress < 65 ? "Transferring your file to storage" : "Extracting files and parsing SCORM manifest"}
              </p>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              {["Upload", "Extract", "Parse SCORM", "Ready"].map((s, i) => (
                <span key={s} className="flex items-center gap-2">
                  {i > 0 && <ChevronRight className="h-3 w-3" />}
                  <span className={uploadProgress >= [10, 65, 80, 100][i] ? "text-primary font-medium" : ""}>{s}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Done */}
      {step === "done" && packageId && (
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-8 text-center space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-xl">Upload Complete!</p>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium">{title}</span> has been uploaded and processed successfully.
              </p>
              {analyzePackage.isPending && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />AI analysis running in background...
                </p>
              )}
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button variant="outline" onClick={() => setLocation("/files")}>View All Files</Button>
              <Button onClick={() => setLocation(`/files/${packageId}`)}>Manage Package</Button>
              <Button variant="outline" onClick={() => setLocation(`/play/${packageId}`)}>
                <Play className="h-4 w-4 mr-1.5" />Preview
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={resetForm}>
              Upload Another
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

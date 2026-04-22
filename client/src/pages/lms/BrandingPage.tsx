import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check, Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

const PRESET_COLORS = [
  { name: "Teal", value: "#15a4b7" },
  { name: "Aqua", value: "#4ad9e0" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Green", value: "#22c55e" },
  { name: "Emerald", value: "#10b981" },
  { name: "Slate", value: "#64748b" },
];

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter (Default)" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans" },
  { value: "DM Sans", label: "DM Sans" },
  { value: "Nunito", label: "Nunito" },
  { value: "Poppins", label: "Poppins" },
  { value: "Lato", label: "Lato" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Roboto", label: "Roboto" },
  { value: "Source Sans 3", label: "Source Sans 3" },
];

function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: { name: string; value: string };
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={color.name}
      className="relative h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        backgroundColor: color.value,
        borderColor: selected ? color.value : "transparent",
        boxShadow: selected ? `0 0 0 2px white, 0 0 0 4px ${color.value}` : undefined,
      }}
    >
      {selected && (
        <Check className="h-3.5 w-3.5 text-white absolute inset-0 m-auto drop-shadow" />
      )}
    </button>
  );
}

function LogoUploader({
  value,
  onChange,
  orgId,
}: {
  value: string;
  onChange: (url: string) => void;
  orgId: number;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const getUploadUrl = trpc.lms.media.getUploadUrl.useMutation();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2 MB");
      return;
    }
    setUploading(true);
    try {
      const { fileUrl } = await getUploadUrl.mutateAsync({
        orgId,
        fileName: file.name,
        contentType: file.type || "image/png",
      });
      await fetch(fileUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "image/png" },
      });
      const cleanUrl = fileUrl.split("?")[0];
      onChange(cleanUrl);
      toast.success("Logo uploaded");
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message ?? "Unknown error"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-start gap-4">
      {/* Preview box */}
      <div className="relative h-20 w-44 rounded-lg border border-border bg-muted/40 overflow-hidden flex items-center justify-center shrink-0">
        {value ? (
          <>
            <img src={value} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
            <button
              onClick={() => onChange("")}
              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive/80 text-white flex items-center justify-center hover:bg-destructive transition-colors"
              title="Remove logo"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
            <ImageIcon className="h-6 w-6" />
            <span className="text-xs">No logo</span>
          </div>
        )}
      </div>
      {/* Upload controls */}
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Upload Logo"}
        </Button>
        <p className="text-xs text-muted-foreground">PNG, JPG, SVG — max 2 MB</p>
        <p className="text-xs text-muted-foreground">Recommended: transparent background, 200×60 px min</p>
        {value && (
          <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={value}>
            {value.split("/").pop()}
          </p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

export default function BrandingPage() {
  const { data: orgs } = trpc.orgs.myOrgs.useQuery();
  const orgId = orgs?.[0]?.id;

  const { data: theme, isLoading } = trpc.lms.themes.get.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const [form, setForm] = useState({
    primaryColor: "#15a4b7",
    accentColor: "#4ad9e0",
    fontFamily: "Inter",
    schoolName: "",
    adminLogoUrl: "",
    customCss: "",
    studentPrimaryColor: "#15a4b7",
    studentAccentColor: "#4ad9e0",
    studentTheme: "light" as "light" | "dark",
  });

  useEffect(() => {
    if (theme) {
      setForm({
        primaryColor: theme.primaryColor ?? "#189aa1",
        accentColor: theme.accentColor ?? "#4ad9e0",
        fontFamily: theme.fontFamily ?? "Inter",
        schoolName: theme.schoolName ?? "",
        adminLogoUrl: theme.adminLogoUrl ?? "",
        customCss: theme.customCss ?? "",
        studentPrimaryColor: theme.studentPrimaryColor ?? "#15a4b7",
        studentAccentColor: theme.studentAccentColor ?? "#4ad9e0",
        studentTheme: (theme.studentTheme ?? "light") as "light" | "dark",
      });
    }
  }, [theme]);

  const updateTheme = trpc.lms.themes.update.useMutation({
    onSuccess: () => toast.success("Branding saved"),
    onError: (e) => toast.error(e.message),
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!orgId) return;
    updateTheme.mutate({ orgId, ...form });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col gap-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Branding & Appearance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Customize the look and feel of your student school, course player, and emails
        </p>
      </div>

      <Tabs defaultValue="school">
        <div className="overflow-x-auto pb-1">
          <TabsList className="flex w-max min-w-full sm:grid sm:grid-cols-3 sm:w-full mb-4">
            <TabsTrigger value="school">School Identity</TabsTrigger>
            <TabsTrigger value="colors">Colors &amp; Fonts</TabsTrigger>
            <TabsTrigger value="advanced">Advanced CSS</TabsTrigger>
          </TabsList>
        </div>

        {/* ── School Identity ── */}
        <TabsContent value="school" className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">School Name</CardTitle>
              <CardDescription>Displayed in the student-facing header, emails, and course player</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={form.schoolName}
                onChange={(e) => set("schoolName", e.target.value)}
                placeholder="e.g. Acme Training Academy"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">School Logo</CardTitle>
              <CardDescription>Shown in the student school header, course player, and email footers. If no logo is set, the School Name text is used instead.</CardDescription>
            </CardHeader>
            <CardContent>
              {orgId ? (
                <LogoUploader
                  value={form.adminLogoUrl}
                  onChange={(url) => set("adminLogoUrl", url)}
                  orgId={orgId}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
            </CardContent>
          </Card>

          {/* Live preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">School Header Preview</CardTitle>
              <CardDescription>How your school header will appear to students</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-xl border border-border overflow-hidden"
                style={{ fontFamily: form.fontFamily }}
              >
                <div
                  className="flex items-center gap-3 px-4 h-14 border-b border-border/50"
                  style={{ backgroundColor: form.studentPrimaryColor + "18" }}
                >
                  {form.adminLogoUrl ? (
                    <img src={form.adminLogoUrl} alt="Logo" className="h-8 max-w-[130px] object-contain" />
                  ) : (
                    <span
                      className="text-base font-bold tracking-tight"
                      style={{ color: form.studentPrimaryColor }}
                    >
                      {form.schoolName || "Your School Name"}
                    </span>
                  )}
                  <div className="flex-1" />
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ backgroundColor: form.studentPrimaryColor }}
                  >
                    My Courses
                  </button>
                </div>
                <div className="p-4 bg-background flex gap-3">
                  <div
                    className="h-14 w-20 rounded-lg shrink-0"
                    style={{ backgroundColor: form.studentPrimaryColor + "28" }}
                  />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-3 w-32 rounded bg-foreground/20" />
                    <div className="h-2.5 w-full rounded bg-foreground/10" />
                    <div className="h-1.5 w-full rounded-full bg-muted mt-1">
                      <div
                        className="h-1.5 rounded-full w-2/3"
                        style={{ backgroundColor: form.studentPrimaryColor }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Colors & Fonts ── */}
        <TabsContent value="colors" className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Primary Color</CardTitle>
              <CardDescription>Used for buttons, active states, progress bars, and CTAs across the student school and course player</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <ColorSwatch
                    key={c.value}
                    color={c}
                    selected={form.studentPrimaryColor === c.value}
                    onClick={() => {
                      set("studentPrimaryColor", c.value);
                      set("primaryColor", c.value);
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-lg border border-border shrink-0"
                  style={{ backgroundColor: form.studentPrimaryColor }}
                />
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">Custom hex</Label>
                  <Input
                    value={form.studentPrimaryColor}
                    onChange={(e) => {
                      set("studentPrimaryColor", e.target.value);
                      set("primaryColor", e.target.value);
                    }}
                    placeholder="#15a4b7"
                    className="h-8 font-mono text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Accent Color</CardTitle>
              <CardDescription>Secondary highlight used in badges, tags, and decorative elements</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <ColorSwatch
                    key={c.value}
                    color={c}
                    selected={form.studentAccentColor === c.value}
                    onClick={() => {
                      set("studentAccentColor", c.value);
                      set("accentColor", c.value);
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-lg border border-border shrink-0"
                  style={{ backgroundColor: form.studentAccentColor }}
                />
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">Custom hex</Label>
                  <Input
                    value={form.studentAccentColor}
                    onChange={(e) => {
                      set("studentAccentColor", e.target.value);
                      set("accentColor", e.target.value);
                    }}
                    placeholder="#4ad9e0"
                    className="h-8 font-mono text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">School Theme</CardTitle>
              <CardDescription>Choose a light or dark background for your student school pages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => set("studentTheme", "light")}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    form.studentTheme === "light"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <div className="w-full h-16 rounded-lg bg-white border border-border flex flex-col gap-1 p-2 overflow-hidden">
                    <div className="h-2 w-3/4 rounded bg-gray-200" />
                    <div className="h-2 w-1/2 rounded bg-gray-100" />
                    <div className="mt-1 h-3 w-1/3 rounded" style={{ backgroundColor: form.studentPrimaryColor }} />
                  </div>
                  <span className="text-sm font-medium">Light</span>
                  {form.studentTheme === "light" && (
                    <span className="text-xs text-primary font-semibold">Active</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => set("studentTheme", "dark")}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    form.studentTheme === "dark"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <div className="w-full h-16 rounded-lg bg-gray-900 border border-gray-700 flex flex-col gap-1 p-2 overflow-hidden">
                    <div className="h-2 w-3/4 rounded bg-gray-700" />
                    <div className="h-2 w-1/2 rounded bg-gray-800" />
                    <div className="mt-1 h-3 w-1/3 rounded" style={{ backgroundColor: form.studentPrimaryColor }} />
                  </div>
                  <span className="text-sm font-medium">Dark</span>
                  {form.studentTheme === "dark" && (
                    <span className="text-xs text-primary font-semibold">Active</span>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Typography</CardTitle>
              <CardDescription>Font family used in the student school and course player</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={form.fontFamily} onValueChange={(v) => set("fontFamily", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <span style={{ fontFamily: f.value }}>{f.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p
                className="mt-3 text-sm text-muted-foreground"
                style={{ fontFamily: form.fontFamily }}
              >
                Preview: The quick brown fox jumps over the lazy dog.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Advanced CSS ── */}
        <TabsContent value="advanced" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custom CSS</CardTitle>
              <CardDescription>
                Inject custom CSS into the student school pages. Scoped to{" "}
                <code className="bg-muted px-1 rounded text-xs">.school-scope</code> — use with care.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={form.customCss}
                onChange={(e) => set("customCss", e.target.value)}
                placeholder={"/* Your custom CSS here */\n.school-scope .hero-title { font-size: 2.5rem; }"}
                className="w-full h-48 font-mono text-xs bg-muted/30 border border-border rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateTheme.isPending} className="gap-2 min-w-[120px]">
          {updateTheme.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Save Branding
        </Button>
      </div>
    </div>
  );
}

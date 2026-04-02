import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Palette, Type, Sun, Moon, Monitor, Upload, Check } from "lucide-react";

const PRESET_COLORS = [
  { name: "Teal", value: "#189aa1" },
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

export default function BrandingPage() {
  const { data: orgs } = trpc.orgs.myOrgs.useQuery();
  const orgId = orgs?.[0]?.id;

  const { data: theme, isLoading } = trpc.lms.themes.get.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const [form, setForm] = useState({
    bgMode: "light" as "light" | "dark",
    primaryColor: "#189aa1",
    accentColor: "#4ad9e0",
    fontFamily: "Inter",
    schoolName: "",
    customCss: "",
    studentPrimaryColor: "#189aa1",
    studentAccentColor: "#4ad9e0",
  });

  useEffect(() => {
    if (theme) {
      setForm({
        bgMode: (theme.bgMode as "light" | "dark") ?? "light",
        primaryColor: theme.primaryColor ?? "#189aa1",
        accentColor: theme.accentColor ?? "#4ad9e0",
        fontFamily: theme.fontFamily ?? "Inter",
        schoolName: theme.schoolName ?? "",
        customCss: theme.customCss ?? "",
        studentPrimaryColor: theme.studentPrimaryColor ?? "#189aa1",
        studentAccentColor: theme.studentAccentColor ?? "#4ad9e0",
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
          Customize the look and feel of your admin dashboard and student school
        </p>
      </div>

      <Tabs defaultValue="admin">
        <TabsList className="mb-4">
          <TabsTrigger value="admin">Admin Dashboard</TabsTrigger>
          <TabsTrigger value="student">Student School</TabsTrigger>
          <TabsTrigger value="advanced">Advanced CSS</TabsTrigger>
        </TabsList>

        {/* ── Admin Dashboard ── */}
        <TabsContent value="admin" className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Color Mode</CardTitle>
              <CardDescription>Choose light or dark mode for the admin interface</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {(["light", "dark"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => set("bgMode", mode)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all w-32 ${
                      form.bgMode === mode
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    {mode === "light" ? (
                      <Sun className="h-6 w-6 text-amber-500" />
                    ) : (
                      <Moon className="h-6 w-6 text-indigo-400" />
                    )}
                    <span className="text-sm font-medium capitalize">{mode}</span>
                    {form.bgMode === mode && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Primary Color</CardTitle>
              <CardDescription>Used for buttons, active states, and accents in the admin UI</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <ColorSwatch
                    key={c.value}
                    color={c}
                    selected={form.primaryColor === c.value}
                    onClick={() => set("primaryColor", c.value)}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-lg border border-border shrink-0"
                  style={{ backgroundColor: form.primaryColor }}
                />
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">Custom hex</Label>
                  <Input
                    value={form.primaryColor}
                    onChange={(e) => set("primaryColor", e.target.value)}
                    placeholder="#189aa1"
                    className="h-8 font-mono text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Accent Color</CardTitle>
              <CardDescription>Secondary highlight color used in badges and decorative elements</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <ColorSwatch
                    key={c.value}
                    color={c}
                    selected={form.accentColor === c.value}
                    onClick={() => set("accentColor", c.value)}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-lg border border-border shrink-0"
                  style={{ backgroundColor: form.accentColor }}
                />
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">Custom hex</Label>
                  <Input
                    value={form.accentColor}
                    onChange={(e) => set("accentColor", e.target.value)}
                    placeholder="#4ad9e0"
                    className="h-8 font-mono text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Typography</CardTitle>
              <CardDescription>Font family used throughout the admin interface</CardDescription>
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

          {/* Live preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
              <CardDescription>How your admin interface will look</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-xl p-5 border border-border flex flex-col gap-3"
                style={{
                  backgroundColor: form.bgMode === "dark" ? "#0f172a" : "#ffffff",
                  fontFamily: form.fontFamily,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: form.primaryColor }}
                  >
                    <span className="text-white text-xs font-bold">T</span>
                  </div>
                  <span
                    className="font-bold text-sm"
                    style={{ color: form.bgMode === "dark" ? "#f1f5f9" : "#0f172a" }}
                  >
                    teachific
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                    style={{ backgroundColor: form.primaryColor }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: form.accentColor + "20",
                      color: form.accentColor,
                      border: `1px solid ${form.accentColor}40`,
                    }}
                  >
                    Accent Badge
                  </button>
                </div>
                <div
                  className="h-1 rounded-full"
                  style={{ backgroundColor: form.bgMode === "dark" ? "#1e293b" : "#f1f5f9" }}
                >
                  <div
                    className="h-1 rounded-full w-2/3"
                    style={{ backgroundColor: form.primaryColor }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Student School ── */}
        <TabsContent value="student" className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">School Name</CardTitle>
              <CardDescription>Displayed in the student-facing header and emails</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={form.schoolName}
                onChange={(e) => set("schoolName", e.target.value)}
                placeholder="e.g. All About Ultrasound Academy"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Student Primary Color</CardTitle>
              <CardDescription>Used for buttons and CTAs on the student storefront and course player</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <ColorSwatch
                    key={c.value}
                    color={c}
                    selected={form.studentPrimaryColor === c.value}
                    onClick={() => set("studentPrimaryColor", c.value)}
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
                    onChange={(e) => set("studentPrimaryColor", e.target.value)}
                    placeholder="#189aa1"
                    className="h-8 font-mono text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Student Accent Color</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <ColorSwatch
                    key={c.value}
                    color={c}
                    selected={form.studentAccentColor === c.value}
                    onClick={() => set("studentAccentColor", c.value)}
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
                    onChange={(e) => set("studentAccentColor", e.target.value)}
                    placeholder="#4ad9e0"
                    className="h-8 font-mono text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Advanced CSS ── */}
        <TabsContent value="advanced" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custom CSS</CardTitle>
              <CardDescription>
                Advanced: inject custom CSS into the admin dashboard. Use with care.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={form.customCss}
                onChange={(e) => set("customCss", e.target.value)}
                placeholder="/* Your custom CSS here */&#10;.sidebar { border-right: 2px solid var(--primary); }"
                className="w-full h-48 font-mono text-xs bg-muted/30 border border-border rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateTheme.isPending} className="gap-2">
          {updateTheme.isPending ? "Saving..." : "Save Branding"}
        </Button>
      </div>
    </div>
  );
}

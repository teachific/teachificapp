import { useState, useEffect, useRef } from "react";
import { RichTextEditor } from "@/components/RichTextEditor";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Settings, Building2, Palette, Globe, CreditCard,
  Check, AlertCircle, Crown, Zap, Rocket, Bell, Upload, ImageIcon, X, FileText, Video,
  UserCircle, Plus, Trash2, Edit2, Link as LinkIcon, Link2,
  Wand2, Sparkles, Loader2, ExternalLink, Copy,
  AlertTriangle, RefreshCw, DollarSign, ArrowDownCircle, History, ShieldAlert, ReceiptText,
} from "lucide-react";
import { useLocation } from "wouter";
import { getSubdomain } from "@/hooks/useSubdomain";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function OrgSettingsPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  const currentSubdomain = getSubdomain() ?? undefined;
  const { data: orgCtx, isLoading: orgLoading } = trpc.orgs.myContext.useQuery(
    { subdomain: currentSubdomain },
    { enabled: !!user }
  );

  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [debouncedSlug, setDebouncedSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Branding / theme state
  const [primaryColor, setPrimaryColor] = useState("#189aa1");
  const [accentColor, setAccentColor] = useState("#4ad9e0");
  const [themeInitialized, setThemeInitialized] = useState(false);

  // Watermark state
  const [watermarkImageUrl, setWatermarkImageUrl] = useState<string | null>(null);
  const [watermarkOpacity, setWatermarkOpacity] = useState(30);
  const [watermarkPosition, setWatermarkPosition] = useState("bottom-left");
  const [watermarkSize, setWatermarkSize] = useState(120);
  const [watermarkUploading, setWatermarkUploading] = useState(false);

  const [notifEnrollment, setNotifEnrollment] = useState(true);
  const [notifCompletion, setNotifCompletion] = useState(true);
  const [notifQuizResult, setNotifQuizResult] = useState(true);
  const [notifReminder, setNotifReminder] = useState(false);
  const [notifAnnouncement, setNotifAnnouncement] = useState(true);
  const [notifWeeklyDigest, setNotifWeeklyDigest] = useState(false);

  const { data: notifSettings } = trpc.lms.notifications.getOrgSettings.useQuery(
    { orgId: orgCtx?.org?.id! },
    { enabled: !!orgCtx?.org?.id }
  );

  const { data: orgTheme } = trpc.lms.themes.get.useQuery(
    { orgId: orgCtx?.org?.id! },
    { enabled: !!orgCtx?.org?.id }
  );

  const updateNotifSettings = trpc.lms.notifications.updateOrgSettings.useMutation({
    onSuccess: () => toast.success("Notification settings saved"),
    onError: (e) => toast.error(e.message),
  });

  const updateTheme = trpc.lms.themes.update.useMutation({
    onSuccess: () => {
      toast.success("Branding settings saved");
      utils.lms.themes.get.invalidate({ orgId: orgCtx?.org?.id! });
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (orgCtx && !initialized) {
      setOrgName(orgCtx.org.name);
      setOrgSlug(orgCtx.org.slug);
      setDebouncedSlug(orgCtx.org.slug);
      setLogoUrl(orgCtx.org.logoUrl || "");
      setLogoPreview(orgCtx.org.logoUrl || null);
      setCustomDomain(orgCtx.org.customDomain || "");
      setInitialized(true);
    }
  }, [orgCtx, initialized]);

  // Debounce slug input for availability check
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSlug(orgSlug), 500);
    return () => clearTimeout(timer);
  }, [orgSlug]);

  useEffect(() => {
    if (orgTheme && !themeInitialized) {
      setPrimaryColor(orgTheme.primaryColor || "#189aa1");
      setAccentColor(orgTheme.accentColor || "#4ad9e0");
      setWatermarkImageUrl(orgTheme.watermarkImageUrl || null);
      setWatermarkOpacity(orgTheme.watermarkOpacity ?? 30);
      setWatermarkPosition(orgTheme.watermarkPosition || "bottom-left");
      setWatermarkSize(orgTheme.watermarkSize ?? 120);
      setThemeInitialized(true);
    }
  }, [orgTheme, themeInitialized]);

  useEffect(() => {
    if (notifSettings) {
      setNotifEnrollment(notifSettings.enrollment ?? true);
      setNotifCompletion(notifSettings.completion ?? true);
      setNotifQuizResult(notifSettings.quizResult ?? true);
      setNotifReminder(notifSettings.reminder ?? false);
      setNotifAnnouncement(notifSettings.announcement ?? true);
      setNotifWeeklyDigest(notifSettings.weeklyDigest ?? false);
    }
  }, [notifSettings]);

  const updateSettings = trpc.orgs.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
      utils.orgs.myContext.invalidate();
    },
    onError: (error) => toast.error(error.message || "Failed to save settings"),
  });

  // Real-time subdomain availability check
  const { data: subdomainCheck, isFetching: checkingSubdomain } = trpc.orgs.checkSubdomain.useQuery(
    { subdomain: debouncedSlug, currentOrgId: orgCtx?.org?.id },
    {
      enabled: !!debouncedSlug && debouncedSlug.length >= 2,
      staleTime: 10_000,
    }
  );
  const subdomainAvailable = subdomainCheck?.available;
  const subdomainChanged = debouncedSlug !== orgCtx?.org?.slug;

  const uploadLogo = trpc.orgs.uploadLogo.useMutation({
    onSuccess: (data) => {
      setLogoUrl(data.fileUrl);
      setLogoPreview(data.fileUrl);
      utils.orgs.myContext.invalidate();
      toast.success("Logo uploaded successfully");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be under 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setLogoUploading(true);
    try {
      const { uploadUrl, fileUrl } = await uploadLogo.mutateAsync({
        fileName: file.name,
        contentType: file.type || "image/png",
      });
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "image/png" },
      });
      setLogoUrl(fileUrl);
      setLogoPreview(fileUrl);
      utils.orgs.myContext.invalidate();
      toast.success("Logo uploaded successfully");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleWatermarkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Watermark image must be under 5 MB");
      return;
    }
    if (!orgCtx?.org?.id) return;
    setWatermarkUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orgId", String(orgCtx.org.id));
      formData.append("folder", "watermarks");
      const res = await fetch("/api/media-upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setWatermarkImageUrl(url);
      toast.success("Watermark image uploaded");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setWatermarkUploading(false);
      if (watermarkInputRef.current) watermarkInputRef.current.value = "";
    }
  };

  const handleSaveBranding = () => {
    if (!orgCtx?.org?.id) return;
    updateTheme.mutate({
      orgId: orgCtx.org.id,
      primaryColor,
      accentColor,
      watermarkImageUrl: watermarkImageUrl ?? null,
      watermarkOpacity,
      watermarkPosition,
      watermarkSize,
    });
  };

  if (orgLoading || !orgCtx) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const org = orgCtx.org;
  const plan = orgCtx.subscription?.plan ?? "free";
  const isProPlus = ["pro", "enterprise"].includes(plan);

  const tierConfig = {
    free: { name: "Free", icon: Settings, color: "text-gray-500", features: ["Basic features", "1 organization", "Community support"] },
    starter: { name: "Starter", icon: Zap, color: "text-blue-500", features: ["All Free features", "Custom branding", "Email support", "5 courses"] },
    builder: { name: "Builder+", icon: Rocket, color: "text-violet-500", features: ["All Starter features", "Custom email sender", "Unlimited courses", "Priority support"] },
    pro: { name: "Pro", icon: Crown, color: "text-amber-500", features: ["All Builder+ features", "Custom domain", "Advanced analytics", "API access"] },
    enterprise: { name: "Enterprise", icon: Crown, color: "text-emerald-500", features: ["All Pro features", "Dedicated support", "SLA guarantee", "Custom integrations"] },
  };

  const currentTier = tierConfig[plan as keyof typeof tierConfig] || tierConfig.free;
  const TierIcon = currentTier.icon;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Organization Settings
        </h1>
        <p className="text-muted-foreground mt-0.5">{org.name}</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="h-auto flex flex-wrap gap-1 p-1">
            <TabsTrigger value="general" className="gap-1.5 whitespace-nowrap">
              <Building2 className="h-4 w-4" /> General
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-1.5 whitespace-nowrap">
              <Palette className="h-4 w-4" /> Branding
            </TabsTrigger>
            <TabsTrigger value="domain" className="gap-1.5 whitespace-nowrap">
              <Globe className="h-4 w-4" /> Domain
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 whitespace-nowrap">
              <Bell className="h-4 w-4" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-1.5 whitespace-nowrap">
              <CreditCard className="h-4 w-4" /> Subscription
            </TabsTrigger>
            <TabsTrigger value="instructors" className="gap-1.5 whitespace-nowrap">
              <UserCircle className="h-4 w-4" /> Instructors
            </TabsTrigger>
            <TabsTrigger value="policies" className="gap-1.5 whitespace-nowrap">
              <FileText className="h-4 w-4" /> Site Policies
            </TabsTrigger>
            <TabsTrigger value="payment" className="gap-1.5 whitespace-nowrap">
              <CreditCard className="h-4 w-4" /> Payments
            </TabsTrigger>
            <TabsTrigger value="homepage" className="gap-1.5 whitespace-nowrap">
              <Globe className="h-4 w-4" /> Homepage
            </TabsTrigger>
            <TabsTrigger value="landing" className="gap-1.5 whitespace-nowrap">
              <Rocket className="h-4 w-4" /> Landing Page
            </TabsTrigger>
           </TabsList>
        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Update your organization name and subdomain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Learning"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-slug">Subdomain</Label>
                <div className="flex items-center">
                  <Input
                    id="org-slug"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="acme-learning"
                    className="rounded-r-none border-r-0 flex-1"
                  />
                  <span className="h-10 px-3 flex items-center bg-muted border border-input rounded-r-md text-sm text-muted-foreground whitespace-nowrap select-none">.teachific.app</span>
                </div>
                {/* Availability indicator */}
                {orgSlug.length >= 2 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    {checkingSubdomain || debouncedSlug !== orgSlug ? (
                      <><Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Checking availability…</span></>
                    ) : subdomainChanged ? (
                      subdomainAvailable ? (
                        <><Check className="h-3 w-3 text-emerald-600" /><span className="text-emerald-600 font-medium">{orgSlug}.teachific.app is available</span></>
                      ) : (
                        <><AlertCircle className="h-3 w-3 text-destructive" /><span className="text-destructive font-medium">{orgSlug}.teachific.app is already taken</span></>
                      )
                    ) : (
                      <><Check className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Current subdomain</span></>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Your school will be accessible at:{" "}
                  <a
                    href={`https://${orgSlug}.teachific.app`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-teal-600 hover:underline"
                  >
                    {orgSlug}.teachific.app
                  </a>
                </p>
              </div>
              <Button
                onClick={() => updateSettings.mutate({ name: orgName, slug: orgSlug })}
                disabled={updateSettings.isPending || (subdomainChanged && !subdomainAvailable)}
                className="gap-2"
              >
                {updateSettings.isPending ? "Saving..." : <><Check className="h-4 w-4" /> Save Changes</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Site Logo</CardTitle>
              <CardDescription>Upload your organization logo — displayed in the admin panel and learner portal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-40 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="max-h-16 max-w-36 object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                      <span className="text-xs">No logo</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={logoUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {logoUploading ? "Uploading..." : "Upload Logo"}
                  </Button>
                  {logoPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setLogoPreview(null);
                        setLogoUrl("");
                        updateSettings.mutate({ logoUrl: null });
                      }}
                    >
                      <X className="h-3.5 w-3.5" /> Remove logo
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Recommended: 200×50 px, transparent background, PNG or SVG.<br />
                    Max file size: 5 MB.
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoFileChange}
              />
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="logo-url">Or enter a Logo URL directly</Label>
                <div className="flex gap-2">
                  <Input
                    id="logo-url"
                    value={logoUrl}
                    onChange={(e) => { setLogoUrl(e.target.value); setLogoPreview(e.target.value || null); }}
                    placeholder="https://example.com/logo.png"
                  />
                  <Button
                    variant="outline"
                    onClick={() => updateSettings.mutate({ logoUrl: logoUrl || null })}
                    disabled={updateSettings.isPending}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-4 w-4" /> Theme Colors
              </CardTitle>
              <CardDescription>
                These colors are applied to the admin panel, learner portal, and video player controls.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg border border-border shadow-sm shrink-0 cursor-pointer overflow-hidden"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <Input
                      id="primary-color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#189aa1"
                      className="font-mono"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Used for buttons, progress bars, and active states</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg border border-border shadow-sm shrink-0 cursor-pointer overflow-hidden"
                      style={{ backgroundColor: accentColor }}
                    >
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <Input
                      id="accent-color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      placeholder="#4ad9e0"
                      className="font-mono"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Used for highlights, hover states, and secondary elements</p>
                </div>
              </div>
              {/* Color preview */}
              <div className="p-4 rounded-lg border bg-muted/20 space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <button
                    className="px-4 py-2 rounded-md text-white text-sm font-medium shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-4 py-2 rounded-md text-sm font-medium border-2"
                    style={{ borderColor: accentColor, color: accentColor }}
                  >
                    Accent Button
                  </button>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: primaryColor }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Player Watermark */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-4 w-4" /> Video Player Watermark
              </CardTitle>
              <CardDescription>
                Overlay a semi-transparent logo or watermark image on all video players across your school.
                This helps protect your content and reinforce your brand.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Watermark image upload */}
              <div className="space-y-3">
                <Label>Watermark Image</Label>
                <div className="flex items-start gap-4">
                  <div className="w-32 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden shrink-0">
                    {watermarkImageUrl ? (
                      <img
                        src={watermarkImageUrl}
                        alt="Watermark preview"
                        className="max-h-16 max-w-28 object-contain"
                        style={{ opacity: watermarkOpacity / 100 }}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-xs">No watermark</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={watermarkUploading}
                      onClick={() => watermarkInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      {watermarkUploading ? "Uploading..." : "Upload Watermark"}
                    </Button>
                    {watermarkImageUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground hover:text-destructive"
                        onClick={() => setWatermarkImageUrl(null)}
                      >
                        <X className="h-3.5 w-3.5" /> Remove watermark
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Recommended: PNG with transparent background.<br />
                      Max file size: 5 MB.
                    </p>
                  </div>
                </div>
                <input
                  ref={watermarkInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={handleWatermarkFileChange}
                />
              </div>

              {/* Watermark settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t">
                <div className="space-y-3">
                  <Label>Opacity: {watermarkOpacity}%</Label>
                  <Slider
                    min={5}
                    max={100}
                    step={5}
                    value={[watermarkOpacity]}
                    onValueChange={([v]) => setWatermarkOpacity(v)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Lower opacity = more subtle watermark</p>
                </div>
                <div className="space-y-3">
                  <Label>Size: {watermarkSize}px</Label>
                  <Slider
                    min={40}
                    max={300}
                    step={10}
                    value={[watermarkSize]}
                    onValueChange={([v]) => setWatermarkSize(v)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Width of the watermark image in pixels</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Position</Label>
                <Select value={watermarkPosition} onValueChange={setWatermarkPosition}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Live preview */}
              {watermarkImageUrl && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground">Player Preview</p>
                  <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-border">
                    <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
                      Video Content
                    </div>
                    {/* Simulated controls bar */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-10 flex items-center px-3 gap-2"
                      style={{ backgroundColor: primaryColor + "cc" }}
                    >
                      <div className="w-4 h-4 rounded bg-white/80" />
                      <div className="flex-1 h-1.5 rounded-full bg-white/30">
                        <div className="w-1/3 h-full rounded-full bg-white/80" />
                      </div>
                      <div className="w-4 h-4 rounded bg-white/80" />
                    </div>
                    {/* Watermark overlay */}
                    <img
                      src={watermarkImageUrl}
                      alt="Watermark"
                      className="absolute pointer-events-none"
                      style={{
                        width: `${Math.min(watermarkSize, 160)}px`,
                        opacity: watermarkOpacity / 100,
                        ...(watermarkPosition === "bottom-left" ? { bottom: "48px", left: "12px" } :
                          watermarkPosition === "bottom-right" ? { bottom: "48px", right: "12px" } :
                          watermarkPosition === "top-left" ? { top: "12px", left: "12px" } :
                          watermarkPosition === "top-right" ? { top: "12px", right: "12px" } :
                          { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }),
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveBranding}
              disabled={updateTheme.isPending}
              className="gap-2"
            >
              {updateTheme.isPending ? "Saving..." : <><Check className="h-4 w-4" /> Save Branding Settings</>}
            </Button>
          </div>
        </TabsContent>

        {/* Domain Tab */}
        <TabsContent value="domain" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Domain</CardTitle>
              <CardDescription>Connect your own domain to your organization (Pro+ required)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-domain">Custom Domain</Label>
                <Input
                  id="custom-domain"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="learn.acme.com"
                  disabled={!isProPlus}
                />
                <p className="text-xs text-muted-foreground">
                  Point your domain's CNAME record to:{" "}
                  <span className="font-mono">teachific.app</span>
                </p>
              </div>
              {!isProPlus && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-900 dark:text-amber-200">
                    Custom domains require a Pro plan or higher. Upgrade your subscription to enable this feature.
                  </p>
                </div>
              )}
              <Button
                onClick={() => updateSettings.mutate({ customDomain })}
                disabled={updateSettings.isPending || !isProPlus}
                className="gap-2"
              >
                {updateSettings.isPending ? "Saving..." : <><Check className="h-4 w-4" /> Save Domain</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Control which automated notifications are sent to your students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Enrollment Confirmation", desc: "Notify students when they enroll in a course", value: notifEnrollment, set: setNotifEnrollment },
                { label: "Course Completion", desc: "Celebrate when a student completes a course", value: notifCompletion, set: setNotifCompletion },
                { label: "Quiz Results", desc: "Send quiz score and feedback after submission", value: notifQuizResult, set: setNotifQuizResult },
                { label: "Learning Reminders", desc: "Nudge inactive students to continue their courses", value: notifReminder, set: setNotifReminder },
                { label: "Announcements", desc: "Allow sending broadcast announcements to members", value: notifAnnouncement, set: setNotifAnnouncement },
                { label: "Weekly Digest", desc: "Send a weekly summary of course activity to students", value: notifWeeklyDigest, set: setNotifWeeklyDigest },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={item.value} onCheckedChange={item.set} />
                </div>
              ))}
              <Button
                className="gap-2 mt-2"
                disabled={updateNotifSettings.isPending}
                onClick={() => {
                  if (!org?.id) return;
                  updateNotifSettings.mutate({
                    orgId: org.id,
                    enrollment: notifEnrollment,
                    completion: notifCompletion,
                    quizResult: notifQuizResult,
                    reminder: notifReminder,
                    announcement: notifAnnouncement,
                    weeklyDigest: notifWeeklyDigest,
                  });
                }}
              >
                {updateNotifSettings.isPending ? "Saving..." : <><Check className="h-4 w-4" /> Save Notification Settings</>}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course-Level Overrides</CardTitle>
              <CardDescription>Override notification settings for individual courses in the Course Settings panel</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Each course can inherit these org-wide defaults or override them individually. Go to a course's Settings tab to configure per-course notification behavior.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription & Billing</CardTitle>
              <CardDescription>Manage your Teachific plan and payment methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <TierIcon className={`h-6 w-6 ${currentTier.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{currentTier.name}</h3>
                    <Badge variant="secondary" className="capitalize">{plan}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Your current subscription tier</p>
                </div>
              </div>
              <div className="pt-2">
                <Button
                  className="gap-2"
                  onClick={() => window.location.href = "/billing"}
                >
                  <CreditCard className="h-4 w-4" /> Manage Billing & Upgrade
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  View all plans, upgrade, or manage your payment methods on the Billing page.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <OrgPaymentSettingsTab orgId={orgCtx?.org?.id} plan={plan} />
        {/* Instructors Tab */}
        <InstructorsTab orgId={orgCtx?.org?.id} />
        {/* Site Policies Tab */}
        <SitePoliciesTab orgId={orgCtx?.org?.id} />
        {/* Homepage Tab */}
        <OrgHomepageTab orgId={orgCtx?.org?.id} orgName={orgCtx?.org?.name ?? ""} orgSlug={orgCtx?.org?.slug ?? ""} primaryColor={primaryColor} description={orgCtx?.org?.description ?? ""} />
        {/* Landing Page Tab */}
        <OrgLandingPageTab orgId={orgCtx?.org?.id} orgSlug={orgCtx?.org?.slug ?? ""} orgName={orgCtx?.org?.name ?? ""} plan={plan} />
      </Tabs>
    </div>
  );
}

function InstructorsTab({ orgId }: { orgId?: number }) {
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: instructorList = [], isLoading } = trpc.lms.instructors.list.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const createInstructor = trpc.lms.instructors.create.useMutation({
    onSuccess: () => { utils.lms.instructors.list.invalidate({ orgId: orgId! }); toast.success("Instructor added"); closeDialog(); },
    onError: (e) => toast.error(e.message),
  });

  const updateInstructor = trpc.lms.instructors.update.useMutation({
    onSuccess: () => { utils.lms.instructors.list.invalidate({ orgId: orgId! }); toast.success("Instructor updated"); closeDialog(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteInstructor = trpc.lms.instructors.delete.useMutation({
    onSuccess: () => { utils.lms.instructors.list.invalidate({ orgId: orgId! }); toast.success("Instructor removed"); },
    onError: (e) => toast.error(e.message),
  });

  const getUploadUrl = trpc.lms.media.getUploadUrl.useMutation();

  const openNew = () => {
    setEditingId(null); setDisplayName(""); setTitle(""); setBio(""); setAvatarUrl(""); setSocialLinks("");
    setDialogOpen(true);
  };

  const openEdit = (inst: any) => {
    setEditingId(inst.id); setDisplayName(inst.displayName ?? ""); setTitle(inst.title ?? "");
    setBio(inst.bio ?? ""); setAvatarUrl(inst.avatarUrl ?? ""); setSocialLinks(inst.socialLinks ?? "");
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    try {
      const { uploadUrl, fileUrl } = await getUploadUrl.mutateAsync({ orgId: orgId!, fileName: file.name, contentType: file.type });
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setAvatarUrl(fileUrl);
    } catch { toast.error("Upload failed"); } finally { setUploading(false); }
  };

  const handleSave = () => {
    if (!displayName.trim()) return toast.error("Display name is required");
    if (editingId) {
      updateInstructor.mutate({ id: editingId, orgId: orgId!, displayName, title, bio, avatarUrl, socialLinks });
    } else {
      createInstructor.mutate({ orgId: orgId!, displayName, title, bio, avatarUrl, socialLinks });
    }
  };

  return (
    <TabsContent value="instructors" className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Instructors</CardTitle>
            <CardDescription>Manage the instructors who appear on your course pages and landing pages.</CardDescription>
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Add Instructor
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : instructorList.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No instructors yet</p>
              <p className="text-sm">Add instructors to feature them on your course landing pages.</p>
              <Button className="mt-4" onClick={openNew}>Add Your First Instructor</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {instructorList.map((inst) => (
                <div key={inst.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  {inst.avatarUrl ? (
                    <img src={inst.avatarUrl} alt={inst.displayName ?? ""} className="h-12 w-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg shrink-0">
                      {(inst.displayName ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{inst.displayName}</p>
                    {inst.title && <p className="text-sm text-muted-foreground">{inst.title}</p>}
                    {inst.bio && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{inst.bio}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(inst)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => { if (confirm(`Remove ${inst.displayName}?`)) deleteInstructor.mutate({ id: inst.id, orgId: orgId! }); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Instructor" : "Add Instructor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <UserCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />{uploading ? "Uploading…" : "Upload Photo"}
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />
                {avatarUrl && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setAvatarUrl("")}><X className="h-3.5 w-3.5 mr-1" />Remove</Button>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Display Name *</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Jane Smith" />
              </div>
              <div className="space-y-1.5">
                <Label>Title / Credentials</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="PhD, RN, RDMS" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Brief instructor biography..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><LinkIcon className="h-3.5 w-3.5" /> Social Links (JSON)</Label>
              <Input value={socialLinks} onChange={(e) => setSocialLinks(e.target.value)} placeholder='{"website":"https://...","linkedin":"https://..."}' />
              <p className="text-xs text-muted-foreground">Optional: JSON object with keys like website, linkedin, twitter, youtube</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={createInstructor.isPending || updateInstructor.isPending}>
              {editingId ? "Save Changes" : "Add Instructor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}

function SitePoliciesTab({ orgId }: { orgId?: number }) {
  const utils = trpc.useUtils();
  const [termsHtml, setTermsHtml] = useState("");
  const [privacyHtml, setPrivacyHtml] = useState("");
  const [requireAgreement, setRequireAgreement] = useState(false);
  const [footerLinks, setFooterLinks] = useState<Array<{label: string; url: string}>>([]);
  const [initialized, setInitialized] = useState(false);

  const { data: legalDocs, isLoading } = trpc.orgs.getLegalDocs.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  useEffect(() => {
    if (legalDocs && !initialized) {
      setTermsHtml(legalDocs.termsOfService ?? "");
      setPrivacyHtml(legalDocs.privacyPolicy ?? "");
      setRequireAgreement(legalDocs.requireTermsAgreement ?? false);
      try { setFooterLinks(JSON.parse(legalDocs.footerLinks || "[]")); } catch { setFooterLinks([]); }
      setInitialized(true);
    }
  }, [legalDocs, initialized]);

  const updateLegalDocs = trpc.orgs.updateLegalDocs.useMutation({
    onSuccess: () => {
      toast.success("Site policies saved");
      utils.orgs.getLegalDocs.invalidate({ orgId: orgId! });
      utils.orgs.publicLegalDocs.invalidate({ orgId: orgId! });
    },
    onError: (e) => toast.error(e.message),
  });

  if (!orgId || isLoading) return (
    <TabsContent value="policies" className="space-y-4">
      <Skeleton className="h-64 w-full" />
    </TabsContent>
  );

  return (
    <TabsContent value="policies" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Site Policies</CardTitle>
          <CardDescription>
            Set your Terms of Service and Privacy Policy. When enabled, learners must agree before completing a purchase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Require agreement at checkout</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Learners must check a box agreeing to your policies before purchasing a course or membership.
              </p>
            </div>
            <Switch checked={requireAgreement} onCheckedChange={setRequireAgreement} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Terms of Service
          </CardTitle>
          <CardDescription>Displayed to learners at checkout when agreement is required.</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={termsHtml}
            onChange={setTermsHtml}
            placeholder="Enter your Terms of Service here..."
            minHeight={300}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Privacy Policy
          </CardTitle>
          <CardDescription>Displayed alongside Terms of Service at checkout.</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={privacyHtml}
            onChange={setPrivacyHtml}
            placeholder="Enter your Privacy Policy here..."
            minHeight={300}
          />
        </CardContent>
      </Card>

      {/* Footer Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Footer Links
          </CardTitle>
          <CardDescription>
            Links shown in the site footer (e.g. Terms, Privacy, Contact). These appear on your school storefront.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {footerLinks.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder="Label (e.g. Terms of Service)"
                value={link.label}
                onChange={(e) => { const u = [...footerLinks]; u[i] = { ...u[i], label: e.target.value }; setFooterLinks(u); }}
                className="flex-1 text-sm"
              />
              <Input
                placeholder="URL (e.g. /terms or https://...)"
                value={link.url}
                onChange={(e) => { const u = [...footerLinks]; u[i] = { ...u[i], url: e.target.value }; setFooterLinks(u); }}
                className="flex-1 text-sm"
              />
              <Button variant="ghost" size="icon" onClick={() => setFooterLinks(footerLinks.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setFooterLinks([...footerLinks, { label: "", url: "" }])} className="gap-2">
            <Plus className="h-3.5 w-3.5" /> Add Link
          </Button>
          {footerLinks.length === 0 && <p className="text-xs text-muted-foreground italic">No footer links yet.</p>}
        </CardContent>
      </Card>
            <div className="flex justify-end">
        <Button
          onClick={() => updateLegalDocs.mutate({ orgId: orgId!, termsOfService: termsHtml, privacyPolicy: privacyHtml, requireTermsAgreement: requireAgreement, footerLinks: JSON.stringify(footerLinks) })}
          disabled={updateLegalDocs.isPending}
          className="gap-2"
        >
          {updateLegalDocs.isPending ? "Saving..." : <><Check className="h-4 w-4" /> Save Policies</>}
        </Button>
      </div>
    </TabsContent>
  );
}

// ─── TeachificPayConnectSection ──────────────────────────────────────────────
function TeachificPayConnectSection({ orgId }: { orgId?: number }) {
  const utils = trpc.useUtils();
  const [payTab, setPayTab] = useState<"overview" | "charges" | "disputes" | "payouts">("overview");
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundChargeId, setRefundChargeId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [evidenceDisputeId, setEvidenceDisputeId] = useState("");
  const [evidenceText, setEvidenceText] = useState("");

  const syncStatus = trpc.teachificPay.syncConnectStatus.useMutation({
    onSuccess: () => {
      utils.teachificPay.getStatus.invalidate({ orgId: orgId! });
      utils.teachificPay.getEarnings.invalidate({ orgId: orgId! });
      toast.success("Connect account status refreshed");
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectParam = params.get("connect");
    if (connectParam === "success" || connectParam === "refresh") {
      if (orgId !== undefined) syncStatus.mutate({ orgId });
      const url = new URL(window.location.href);
      url.searchParams.delete("connect");
      window.history.replaceState({}, "", url.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const connectMutation = trpc.teachificPay.startConnectOnboarding.useMutation({
    onSuccess: (data: { url: string; accountId: string }) => {
      if (data.url) window.open(data.url, "_blank");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const { data: status, isLoading: statusLoading } = trpc.teachificPay.getStatus.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );
  const { data: earnings, isLoading: earningsLoading } = trpc.teachificPay.getEarnings.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId && status?.stripeConnectStatus === "active" }
  );
  const { data: charges, isLoading: chargesLoading } = trpc.teachificPay.listCharges.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId && payTab === "charges" }
  );
  const { data: disputes, isLoading: disputesLoading } = trpc.teachificPay.listDisputes.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId && payTab === "disputes" }
  );

  const refundMutation = trpc.teachificPay.refundCharge.useMutation({
    onSuccess: () => {
      toast.success("Refund issued successfully");
      setRefundDialogOpen(false);
      utils.teachificPay.listCharges.invalidate({ orgId: orgId! });
    },
    onError: (e) => toast.error(e.message),
  });
  const evidenceMutation = trpc.teachificPay.submitDisputeEvidence.useMutation({
    onSuccess: () => {
      toast.success("Evidence submitted to Stripe");
      setEvidenceDialogOpen(false);
      utils.teachificPay.listDisputes.invalidate({ orgId: orgId! });
    },
    onError: (e) => toast.error(e.message),
  });

  if (statusLoading) return <Skeleton className="h-20 w-full" />;

  const isConnected = !!status?.stripeConnectAccountId;
  const isActive = status?.stripeConnectStatus === "active";

  const availableBalance = earnings?.connected && earnings.balance
    ? (earnings.balance as { available: { amount: number }[] }).available?.reduce((s, b) => s + b.amount, 0) ?? 0
    : 0;
  const pendingBalance = earnings?.connected && earnings.balance
    ? (earnings.balance as { pending: { amount: number }[] }).pending?.reduce((s, b) => s + b.amount, 0) ?? 0
    : 0;
  const totalPayouts = earnings?.connected
    ? (earnings.payouts as { amount: number }[]).reduce((s, p) => s + p.amount, 0)
    : 0;

  const disputeStatusColor = (s: string) => {
    if (s === "won") return "text-green-600 bg-green-50 border-green-200";
    if (s === "lost") return "text-red-600 bg-red-50 border-red-200";
    if (s === "needs_response") return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-muted-foreground bg-muted border-border";
  };

  const chargeStatusColor = (s: string) => {
    if (s === "succeeded") return "text-green-600 bg-green-50 border-green-200";
    if (s === "refunded" || s === "partially_refunded") return "text-amber-600 bg-amber-50 border-amber-200";
    if (s === "failed") return "text-red-600 bg-red-50 border-red-200";
    return "text-muted-foreground bg-muted border-border";
  };

  return (
    <div className="space-y-4">
      {/* Connect header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnected && isActive ? (
            <Badge className="gap-1" style={{ background: "#189aa120", color: "#189aa1" }}>
              <Check className="h-3 w-3" /> Connected
            </Badge>
          ) : isConnected ? (
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
              <AlertCircle className="h-3 w-3" /> Onboarding incomplete
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              Not connected
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {isConnected && (
            <Button size="sm" variant="ghost" className="gap-1.5 h-8" disabled={syncStatus.isPending} onClick={() => orgId && syncStatus.mutate({ orgId })}>
              <RefreshCw className={`h-3.5 w-3.5 ${syncStatus.isPending ? "animate-spin" : ""}`} /> Sync
            </Button>
          )}
          <Button
            size="sm"
            variant={isConnected ? "outline" : "default"}
            className="gap-2"
            style={!isConnected ? { background: "#189aa1", color: "white" } : {}}
            disabled={connectMutation.isPending}
            onClick={() =>
              orgId &&
              connectMutation.mutate({
                orgId,
                returnUrl: `${window.location.origin}/settings/payment?connect=success`,
                refreshUrl: `${window.location.origin}/settings/payment?connect=refresh`,
              })
            }
          >
            {connectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            {isConnected ? "Manage Account" : "Connect to TeachificPay"}
          </Button>
        </div>
      </div>

      {!isConnected && (
        <p className="text-xs text-muted-foreground">
          Connect your bank account to receive payouts from TeachificPay. Stripe handles identity verification securely.
        </p>
      )}

      {isConnected && (
        <Tabs value={payTab} onValueChange={(v) => setPayTab(v as typeof payTab)}>
          <TabsList className="h-8 gap-0.5">
            <TabsTrigger value="overview" className="h-7 text-xs gap-1"><DollarSign className="h-3 w-3" />Overview</TabsTrigger>
            <TabsTrigger value="charges" className="h-7 text-xs gap-1"><ReceiptText className="h-3 w-3" />Charges</TabsTrigger>
            <TabsTrigger value="disputes" className="h-7 text-xs gap-1"><ShieldAlert className="h-3 w-3" />Disputes</TabsTrigger>
            <TabsTrigger value="payouts" className="h-7 text-xs gap-1"><ArrowDownCircle className="h-3 w-3" />Payouts</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-3">
            {isActive && !earningsLoading && earnings?.connected ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Available Balance", value: `$${(availableBalance / 100).toFixed(2)}` },
                  { label: "Pending Balance", value: `$${(pendingBalance / 100).toFixed(2)}` },
                  { label: "Total Paid Out", value: `$${(totalPayouts / 100).toFixed(2)}` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg p-3 text-center" style={{ background: "#189aa108", border: "1px solid #189aa120" }}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold" style={{ color: "#189aa1" }}>{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Complete Stripe onboarding to view your earnings dashboard.</p>
            )}
          </TabsContent>

          {/* Charges */}
          <TabsContent value="charges" className="mt-3">
            {chargesLoading ? <Skeleton className="h-32 w-full" /> : !charges?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No charges recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {charges.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">${(c.amount / 100).toFixed(2)} {c.currency.toUpperCase()}</span>
                      <span className="text-xs text-muted-foreground">{c.learnerEmail ?? "—"} · {new Date(c.chargedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${chargeStatusColor(c.status)}`}>{c.status.replace("_", " ")}</Badge>
                      {(c.status === "succeeded" || c.status === "partially_refunded") && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => { setRefundChargeId(c.stripeChargeId); setRefundAmount(""); setRefundDialogOpen(true); }}>
                          <ReceiptText className="h-3 w-3" /> Refund
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Disputes */}
          <TabsContent value="disputes" className="mt-3">
            {disputesLoading ? <Skeleton className="h-32 w-full" /> : !disputes?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No disputes on record. Great!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {disputes.map((d) => (
                  <div key={d.id} className="rounded-lg border p-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">${(d.amount / 100).toFixed(2)} · {d.reason ?? "unknown reason"}</span>
                        <span className="text-xs text-muted-foreground">{d.learnerEmail ?? "—"} · {new Date(d.createdAt).toLocaleDateString()}</span>
                      </div>
                      <Badge variant="outline" className={`text-xs ${disputeStatusColor(d.status)}`}>{d.status.replace(/_/g, " ")}</Badge>
                    </div>
                    {d.evidenceDueBy && d.status === "needs_response" && (
                      <p className="text-xs text-orange-600">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        Evidence due by {new Date(d.evidenceDueBy).toLocaleDateString()}
                      </p>
                    )}
                    {!d.evidenceSubmitted && (d.status === "needs_response" || d.status === "under_review") && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setEvidenceDisputeId(d.stripeDisputeId); setEvidenceText(""); setEvidenceDialogOpen(true); }}>
                        <ShieldAlert className="h-3 w-3" /> Submit Evidence
                      </Button>
                    )}
                    {d.evidenceSubmitted && <span className="text-xs text-green-600"><Check className="h-3 w-3 inline mr-1" />Evidence submitted</span>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Payouts */}
          <TabsContent value="payouts" className="mt-3">
            {earningsLoading ? <Skeleton className="h-32 w-full" /> : !earnings?.connected ? (
              <p className="text-sm text-muted-foreground">Complete Stripe onboarding to view payout history.</p>
            ) : !(earnings.payouts as any[]).length ? (
              <div className="text-center py-8 text-muted-foreground">
                <ArrowDownCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No payouts yet. Payouts are sent automatically by Stripe on your configured schedule.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(earnings.payouts as { id: string; amount: number; currency: string; arrival_date: number; status: string }[]).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">${(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}</span>
                      <span className="text-xs text-muted-foreground">Arrival: {new Date(p.arrival_date * 1000).toLocaleDateString()}</span>
                    </div>
                    <Badge variant="outline" className={`text-xs ${p.status === "paid" ? "text-green-600 bg-green-50 border-green-200" : "text-muted-foreground"}`}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Issue Refund</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Leave amount blank for a full refund.</p>
            <div className="space-y-1">
              <Label className="text-xs">Amount (USD, optional)</Label>
              <Input placeholder="e.g. 29.99" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={refundMutation.isPending}
              onClick={() => orgId && refundMutation.mutate({
                orgId,
                chargeId: refundChargeId,
                amountCents: refundAmount ? Math.round(parseFloat(refundAmount) * 100) : undefined,
              })}
            >
              {refundMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Issue Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evidence Dialog */}
      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Submit Dispute Evidence</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Describe why this charge is legitimate. Include course access logs, completion records, or any other relevant information.</p>
            <Textarea
              placeholder="Describe the service provided, when access was granted, completion status, etc."
              value={evidenceText}
              onChange={(e) => setEvidenceText(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvidenceDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={evidenceMutation.isPending || !evidenceText.trim()}
              onClick={() => orgId && evidenceMutation.mutate({
                orgId,
                disputeId: evidenceDisputeId,
                uncategorizedText: evidenceText,
              })}
            >
              {evidenceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Evidence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrgPaymentSettingsTab({ orgId, plan = "free" }: { orgId?: number; plan?: string }) {
  const canUseCustomGateway = ["pro", "enterprise"].includes(plan);
  const teachificPayFee = plan === "free" ? "2%" : plan === "starter" ? "1%" : plan === "builder" ? "0.5%" : "0%";
  const utils = trpc.useUtils();
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalClientSecret, setPaypalClientSecret] = useState("");
  const [autoEnrollment, setAutoEnrollment] = useState(false);
  const [autoEnrollCourseIds, setAutoEnrollCourseIds] = useState<number[]>([]);
  const [initialized, setInitialized] = useState(false);

  const { data: paymentSettings, isLoading } = trpc.billing.getOrgPaymentSettings.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  // Fetch published courses for auto-enrollment selector
  const { data: coursesData } = trpc.lms.courses.list.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId && autoEnrollment }
  );

  useEffect(() => {
    if (paymentSettings && !initialized) {
      setStripePublishableKey(paymentSettings.stripePublishableKey || "");
      setStripeSecretKey(paymentSettings.stripeSecretKey ? "••••••••••••••••" : "");
      setPaypalClientId(paymentSettings.paypalClientId || "");
      setPaypalClientSecret(paymentSettings.paypalClientSecret ? "••••••••••••••••" : "");
      setAutoEnrollment(paymentSettings.autoEnrollment ?? false);
      try {
        const ids = paymentSettings.autoEnrollCourseIds
          ? JSON.parse(paymentSettings.autoEnrollCourseIds as string)
          : [];
        setAutoEnrollCourseIds(Array.isArray(ids) ? ids : []);
      } catch { setAutoEnrollCourseIds([]); }
      setInitialized(true);
    }
  }, [paymentSettings, initialized]);

  const saveSettings = trpc.billing.updateOrgPaymentSettings.useMutation({
    onSuccess: () => {
      toast.success("Payment settings saved");
      utils.billing.getOrgPaymentSettings.invalidate({ orgId: orgId! });
      setInitialized(false); // re-init on next load
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!orgId) return;
    saveSettings.mutate({
      orgId,
      stripePublishableKey: stripePublishableKey.startsWith("•") ? undefined : stripePublishableKey || null,
      stripeSecretKey: stripeSecretKey.startsWith("•") ? undefined : stripeSecretKey || null,
      paypalClientId: paypalClientId || null,
      paypalClientSecret: paypalClientSecret.startsWith("•") ? undefined : paypalClientSecret || null,
      autoEnrollment,
      autoEnrollCourseIds: JSON.stringify(autoEnrollCourseIds),
    });
  };

  const toggleCourse = (courseId: number) => {
    setAutoEnrollCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  return (
    <TabsContent value="payment" className="space-y-4">
      {/* TeachificPay Section */}
      <Card className="border-2" style={{ borderColor: "#189aa120" }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "#189aa115" }}>
                <CreditCard className="h-5 w-5" style={{ color: "#189aa1" }} />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  TeachificPay
                  <Badge className="text-xs" style={{ background: "#189aa120", color: "#189aa1" }}>Powered by Stripe</Badge>
                </CardTitle>
                <CardDescription>Teachific's built-in payment processor — no setup required</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">{teachificPayFee} platform fee</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg p-4 space-y-3" style={{ background: "#189aa108", border: "1px solid #189aa120" }}>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#189aa1" }} />
              <p className="text-sm">
                {canUseCustomGateway
                  ? `Your ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan supports TeachificPay or your own Stripe gateway with no platform fee.`
                  : teachificPayFee === "0%"
                  ? `Your ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan uses TeachificPay with no platform fee.`
                  : `Your ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan uses TeachificPay exclusively. A ${teachificPayFee} platform fee applies to each transaction. Upgrade to Pro or higher to use your own payment gateway.`
                }
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#189aa1" }} />
              <p className="text-sm">Group registrations follow your plan's payment gateway setting.</p>
            </div>
          </div>
          <TeachificPayConnectSection orgId={orgId} />
        </CardContent>
      </Card>

      {/* Custom Gateway Section — Builder+ only */}
      {canUseCustomGateway && (
      <Card>
        <CardHeader>
          <CardTitle>Custom Payment Gateway</CardTitle>
          <CardDescription>
            Configure your own Stripe or PayPal accounts to collect payments directly. Available on Pro plan and above.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <>
              {/* Stripe Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Stripe Integration</p>
                    <p className="text-xs text-muted-foreground">Accept credit/debit card payments via Stripe</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
                  <div className="space-y-1.5">
                    <Label htmlFor="stripe-pk">Publishable Key</Label>
                    <Input
                      id="stripe-pk"
                      value={stripePublishableKey}
                      onChange={(e) => setStripePublishableKey(e.target.value)}
                      placeholder="pk_live_..."
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="stripe-sk">Secret Key</Label>
                    <Input
                      id="stripe-sk"
                      type="password"
                      value={stripeSecretKey}
                      onChange={(e) => setStripeSecretKey(e.target.value)}
                      placeholder="sk_live_..."
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pl-10">
                  Get your keys from{" "}
                  <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Stripe Dashboard → Developers → API Keys
                  </a>
                </p>
              </div>

              <div className="border-t" />

              {/* PayPal Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Link2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">PayPal Integration</p>
                    <p className="text-xs text-muted-foreground">Accept PayPal payments and send affiliate payouts</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
                  <div className="space-y-1.5">
                    <Label htmlFor="paypal-id">Client ID</Label>
                    <Input
                      id="paypal-id"
                      value={paypalClientId}
                      onChange={(e) => setPaypalClientId(e.target.value)}
                      placeholder="AYour-PayPal-Client-ID"
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="paypal-secret">Client Secret</Label>
                    <Input
                      id="paypal-secret"
                      type="password"
                      value={paypalClientSecret}
                      onChange={(e) => setPaypalClientSecret(e.target.value)}
                      placeholder="Your-PayPal-Client-Secret"
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pl-10">
                  Get your credentials from{" "}
                  <a href="https://developer.paypal.com/dashboard/applications" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    PayPal Developer Dashboard
                  </a>
                </p>
              </div>

              <div className="border-t" />

              {/* Enrollment Settings */}
              <div className="space-y-3">
                <p className="font-medium text-sm">Member Enrollment</p>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm">Auto-enrollment</p>
                    <p className="text-xs text-muted-foreground">
                      Automatically enroll new members in all published courses when they join.
                    </p>
                  </div>
                  <Switch checked={autoEnrollment} onCheckedChange={setAutoEnrollment} />
                </div>
                {autoEnrollment && (
                  <div className="pl-2 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Select courses to auto-enroll into (leave all unchecked = enroll in all published courses):
                    </p>
                    {!coursesData ? (
                      <p className="text-xs text-muted-foreground">Loading courses...</p>
                    ) : (coursesData as any[]).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No published courses found.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
                        {(coursesData as any[]).map((course: any) => (
                          <label key={course.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/40 rounded px-2 py-1">
                            <input
                              type="checkbox"
                              checked={autoEnrollCourseIds.includes(course.id)}
                              onChange={() => toggleCourse(course.id)}
                              className="rounded"
                            />
                            <span className="text-xs truncate">{course.title}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {autoEnrollCourseIds.length > 0 && (
                      <p className="text-xs text-primary">
                        {autoEnrollCourseIds.length} course{autoEnrollCourseIds.length !== 1 ? "s" : ""} selected
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={saveSettings.isPending} className="gap-2">
                  {saveSettings.isPending ? "Saving..." : <><Check className="h-4 w-4" /> Save Payment Settings</>}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      )}
    </TabsContent>
  );
}

// ─── OrgLandingPageTab ───────────────────────────────────────────────────────
function OrgLandingPageTab({ orgId, orgSlug, orgName, plan }: {
  orgId?: number;
  orgSlug: string;
  orgName: string;
  plan: string;
}) {
  const utils = trpc.useUtils();
  const [initialized, setInitialized] = useState(false);

  // Form state
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSubheadline, setHeroSubheadline] = useState("");
  const [heroCtaText, setHeroCtaText] = useState("Browse Courses");
  const [heroBgColor, setHeroBgColor] = useState("#0f172a");
  const [heroTextColor, setHeroTextColor] = useState("#ffffff");
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutBody, setAboutBody] = useState("");
  const [accentColor, setAccentColor] = useState("#0ea5e9");
  const [showCourses, setShowCourses] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [footerText, setFooterText] = useState("");

  const { data: landingPage } = trpc.orgs.getLandingPage.useQuery(
    { slug: orgSlug },
    { enabled: !!orgSlug }
  );

  useEffect(() => {
    if (landingPage && !initialized) {
      setHeroHeadline(landingPage.heroHeadline ?? "");
      setHeroSubheadline(landingPage.heroSubheadline ?? "");
      setHeroCtaText(landingPage.heroCtaText ?? "Browse Courses");
      setHeroBgColor(landingPage.heroBgColor ?? "#0f172a");
      setHeroTextColor(landingPage.heroTextColor ?? "#ffffff");
      setAboutTitle(landingPage.aboutTitle ?? "");
      setAboutBody(landingPage.aboutBody ?? "");
      setAccentColor(landingPage.accentColor ?? "#0ea5e9");
      setShowCourses(landingPage.showCourses ?? true);
      setIsPublished(landingPage.isPublished ?? true);
      setFooterText(landingPage.footerText ?? "");
      setInitialized(true);
    }
  }, [landingPage, initialized]);

  const saveLandingPage = trpc.orgs.saveLandingPage.useMutation({
    onSuccess: () => {
      toast.success("Landing page saved");
      utils.orgs.getLandingPage.invalidate({ slug: orgSlug });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!orgId) return;
    saveLandingPage.mutate({
      orgId,
      heroHeadline,
      heroSubheadline,
      heroCtaText,
      heroBgColor,
      heroTextColor,
      aboutTitle,
      aboutBody,
      accentColor,
      showCourses,
      isPublished,
      footerText,
    });
  };

  const previewUrl = orgSlug ? `https://${orgSlug}.teachific.app` : null;

  return (
    <TabsContent value="landing" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Landing Page
          </CardTitle>
          <CardDescription>
            Customize the public landing page visitors see when they visit your subdomain.
            This page is auto-generated when your school is created and can be edited anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preview link */}
          {previewUrl && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
              <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground flex-1 truncate font-mono">{previewUrl}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(previewUrl); toast.success("URL copied!"); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(previewUrl, "_blank")}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Published toggle */}
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-sm">Published</p>
              <p className="text-xs text-muted-foreground">When off, visitors see the course catalog instead</p>
            </div>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          </div>

          {/* Hero Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Hero Section</h3>
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} placeholder={`Welcome to ${orgName}`} />
            </div>
            <div className="space-y-2">
              <Label>Subheadline</Label>
              <Textarea value={heroSubheadline} onChange={(e) => setHeroSubheadline(e.target.value)} placeholder="Explore our courses and start learning today." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>CTA Button Text</Label>
              <Input value={heroCtaText} onChange={(e) => setHeroCtaText(e.target.value)} placeholder="Browse Courses" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={heroBgColor} onChange={(e) => setHeroBgColor(e.target.value)} className="h-9 w-14 rounded border cursor-pointer" />
                  <Input value={heroBgColor} onChange={(e) => setHeroBgColor(e.target.value)} className="font-mono text-xs" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Text Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={heroTextColor} onChange={(e) => setHeroTextColor(e.target.value)} className="h-9 w-14 rounded border cursor-pointer" />
                  <Input value={heroTextColor} onChange={(e) => setHeroTextColor(e.target.value)} className="font-mono text-xs" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-9 w-14 rounded border cursor-pointer" />
                  <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="font-mono text-xs" />
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">About Section</h3>
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input value={aboutTitle} onChange={(e) => setAboutTitle(e.target.value)} placeholder={`About ${orgName}`} />
            </div>
            <div className="space-y-2">
              <Label>Body Text</Label>
              <Textarea value={aboutBody} onChange={(e) => setAboutBody(e.target.value)} placeholder="Describe your school and what students will learn..." rows={4} />
            </div>
          </div>

          {/* Courses & Footer */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Courses & Footer</h3>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-sm">Show Course Grid</p>
                <p className="text-xs text-muted-foreground">Display published courses on the landing page</p>
              </div>
              <Switch checked={showCourses} onCheckedChange={setShowCourses} />
            </div>
            <div className="space-y-2">
              <Label>Footer Text</Label>
              <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder={`© ${new Date().getFullYear()} ${orgName}. All rights reserved.`} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saveLandingPage.isPending} className="gap-2">
              {saveLandingPage.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Check className="h-4 w-4" /> Save Landing Page</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── OrgHomepageTab ───────────────────────────────────────────────────────────
function OrgHomepageTab({ orgId, orgName, orgSlug, primaryColor, description }: {
  orgId?: number;
  orgName: string;
  orgSlug: string;
  primaryColor: string;
  description: string;
}) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [tagline, setTagline] = useState("");
  const [desc, setDesc] = useState(description);
  const [generatedPageId, setGeneratedPageId] = useState<number | null>(null);

  // Check if a homepage already exists
  const { data: pages, isLoading: pagesLoading } = trpc.lms.pages.list.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );
  const existingHomepage = pages?.find((p: any) => p.pageType === "school_home");

  const aiGenerate = trpc.lms.pages.aiGenerate.useMutation({
    onSuccess: (result) => {
      setGeneratedPageId(result.pageId);
      utils.lms.pages.list.invalidate({ orgId: orgId! });
      toast.success("Homepage generated! Click 'Edit in Page Builder' to customize it.");
    },
    onError: (err) => toast.error(err.message),
  });

  const previewUrl = orgSlug
    ? `${window.location.origin}/school/${orgSlug}`
    : null;

  const pageBuilderUrl = generatedPageId
    ? `/lms/page-builder/${generatedPageId}`
    : existingHomepage
    ? `/lms/page-builder/${existingHomepage.id}`
    : null;

  return (
    <TabsContent value="homepage" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Generated Homepage
          </CardTitle>
          <CardDescription>
            Automatically generate a professional homepage for your school using AI, then customize it with the drag-and-drop editor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subdomain preview link */}
          {previewUrl && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Your school URL</p>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline truncate block"
                >
                  {previewUrl}
                </a>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => { navigator.clipboard.writeText(previewUrl); toast.success("URL copied!"); }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => window.open(previewUrl, "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Existing homepage status */}
          {existingHomepage && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Homepage exists</p>
                  <p className="text-xs text-green-600 dark:text-green-500">"{existingHomepage.title}" · {existingHomepage.isPublished ? "Published" : "Draft"}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setLocation(`/lms/page-builder/${existingHomepage.id}`)}
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </Button>
            </div>
          )}

          {/* AI Generation form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="hp-tagline">Tagline <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="hp-tagline"
                placeholder="e.g. Learn anything, anywhere"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="hp-desc">School Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="hp-desc"
                placeholder="Describe your school, its mission, and what students will learn..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
                className="mt-1.5"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="gap-2 flex-1 sm:flex-none"
                onClick={() => orgId && aiGenerate.mutate({
                  orgId,
                  orgName: orgName || "My School",
                  tagline: tagline || undefined,
                  description: desc || undefined,
                  primaryColor,
                })}
                disabled={aiGenerate.isPending || !orgId}
              >
                {aiGenerate.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Wand2 className="h-4 w-4" /> {existingHomepage ? "Regenerate Homepage" : "Generate Homepage with AI"}</>
                )}
              </Button>
              {pageBuilderUrl && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setLocation(pageBuilderUrl)}
                >
                  <Edit2 className="h-4 w-4" /> Edit in Page Builder
                </Button>
              )}
            </div>
            {aiGenerate.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                AI is designing your homepage... this may take 10–20 seconds.
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="rounded-lg bg-muted/30 border p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tips</p>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-1.5"><Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary" /> The AI uses your school name, tagline, and branding colors to generate a unique homepage.</li>
              <li className="flex items-start gap-1.5"><Edit2 className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary" /> After generation, use the Page Builder to drag, drop, and edit every section.</li>
              <li className="flex items-start gap-1.5"><Globe className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary" /> Your homepage is automatically published at your school URL above.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

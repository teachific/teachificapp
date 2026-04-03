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
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Settings, Building2, Palette, Globe, CreditCard,
  Check, AlertCircle, Crown, Zap, Rocket, Bell, Upload, ImageIcon, X, FileText,
} from "lucide-react";

export default function OrgSettingsPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: orgCtx, isLoading: orgLoading } = trpc.orgs.myContext.useQuery(undefined, {
    enabled: !!user,
  });

  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [initialized, setInitialized] = useState(false);

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

  const updateNotifSettings = trpc.lms.notifications.updateOrgSettings.useMutation({
    onSuccess: () => toast.success("Notification settings saved"),
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (orgCtx && !initialized) {
      setOrgName(orgCtx.org.name);
      setOrgSlug(orgCtx.org.slug);
      setLogoUrl(orgCtx.org.logoUrl || "");
      setLogoPreview(orgCtx.org.logoUrl || null);
      setCustomDomain(orgCtx.org.customDomain || "");
      setInitialized(true);
    }
  }, [orgCtx, initialized]);

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
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setLogoUploading(true);
    try {
      // Get presigned upload URL from backend
      const { uploadUrl, fileUrl } = await uploadLogo.mutateAsync({
        fileName: file.name,
        contentType: file.type || "image/png",
      });
      // PUT the file bytes directly to S3
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
        <div className="overflow-x-auto pb-1">
          <TabsList className="flex w-max min-w-full sm:grid sm:w-full sm:grid-cols-6 gap-0">
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
            <TabsTrigger value="policies" className="gap-1.5 whitespace-nowrap">
              <FileText className="h-4 w-4" /> Site Policies
            </TabsTrigger>
          </TabsList>
        </div>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Update your organization name and URL slug</CardDescription>
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
                <Label htmlFor="org-slug">URL Slug</Label>
                <Input
                  id="org-slug"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="acme-learning"
                />
                <p className="text-xs text-muted-foreground">
                  Your organization will be accessible at:{" "}
                  <span className="font-mono">teachific.app/{orgSlug}</span>
                </p>
              </div>
              <Button
                onClick={() => updateSettings.mutate({ name: orgName, slug: orgSlug })}
                disabled={updateSettings.isPending}
                className="gap-2"
              >
                {updateSettings.isPending ? "Saving..." : <><Check className="h-4 w-4" /> Save Changes</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Logo</CardTitle>
              <CardDescription>Upload your organization logo — displayed in the admin panel and learner portal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo preview */}
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
              {/* Also allow manual URL entry */}
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
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Manage your subscription tier and billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

              <div className="space-y-2">
                <p className="text-sm font-medium">Included features:</p>
                <ul className="space-y-1.5">
                  {currentTier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" className="gap-2">
                  <Crown className="h-4 w-4" /> Upgrade Plan
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Contact support to upgrade your subscription tier
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Site Policies Tab */}
        <SitePoliciesTab orgId={orgCtx?.org?.id} />

      </Tabs>
    </div>
  );
}

function SitePoliciesTab({ orgId }: { orgId?: number }) {
  const utils = trpc.useUtils();
  const [termsHtml, setTermsHtml] = useState("");
  const [privacyHtml, setPrivacyHtml] = useState("");
  const [requireAgreement, setRequireAgreement] = useState(false);
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

      <div className="flex justify-end">
        <Button
          onClick={() => updateLegalDocs.mutate({ orgId: orgId!, termsOfService: termsHtml, privacyPolicy: privacyHtml, requireTermsAgreement: requireAgreement })}
          disabled={updateLegalDocs.isPending}
          className="gap-2"
        >
          {updateLegalDocs.isPending ? "Saving..." : <><Check className="h-4 w-4" /> Save Policies</>}
        </Button>
      </div>
    </TabsContent>
  );
}

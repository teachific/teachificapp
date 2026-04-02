import { useState, useEffect } from "react";
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
import {
  Settings, Building2, Palette, Globe, Mail, CreditCard,
  Check, AlertCircle, Crown, Zap, Rocket,
} from "lucide-react";

export default function OrgSettingsPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Get org context (includes subscription now)
  const { data: orgCtx, isLoading: orgLoading } = trpc.orgs.myContext.useQuery(undefined, {
    enabled: !!user,
  });

  // Form states
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Initialize form when org loads
  useEffect(() => {
    if (orgCtx && !initialized) {
      setOrgName(orgCtx.org.name);
      setOrgSlug(orgCtx.org.slug);
      setLogoUrl(orgCtx.org.logoUrl || "");
      setCustomDomain(orgCtx.org.customDomain || "");
      setSenderName(orgCtx.org.customSenderName || "");
      setSenderEmail(orgCtx.org.customSenderEmail || "");
      setInitialized(true);
    }
  }, [orgCtx, initialized]);

  // Mutation
  const updateSettings = trpc.orgs.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
      utils.orgs.myContext.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save settings");
    },
  });

  if (orgLoading || !orgCtx) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const org = orgCtx.org;
  const plan = orgCtx.subscription?.plan ?? "free";
  const isBuilderPlus = ["builder", "pro", "enterprise"].includes(plan);
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Organization Settings
        </h1>
        <p className="text-muted-foreground mt-0.5">{org.name}</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="gap-1.5">
            <Building2 className="h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5">
            <Palette className="h-4 w-4" /> Branding
          </TabsTrigger>
          <TabsTrigger value="domain" className="gap-1.5">
            <Globe className="h-4 w-4" /> Domain
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5">
            <Mail className="h-4 w-4" /> Email Sender
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-1.5">
            <CreditCard className="h-4 w-4" /> Subscription
          </TabsTrigger>
        </TabsList>

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
              <CardTitle>Custom Branding</CardTitle>
              <CardDescription>Set your organization logo for a personalized learner experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo-url">Logo URL</Label>
                <Input
                  id="logo-url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 200×50px, transparent background, PNG format
                </p>
              </div>
              {logoUrl && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <img src={logoUrl} alt="Logo preview" className="h-12 object-contain" />
                </div>
              )}
              <Button
                onClick={() => updateSettings.mutate({ logoUrl })}
                disabled={updateSettings.isPending}
                className="gap-2"
              >
                {updateSettings.isPending ? "Saving..." : <><Check className="h-4 w-4" /> Save Logo</>}
              </Button>
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
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
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

        {/* Email Sender Tab */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Email Sender</CardTitle>
              <CardDescription>Send emails from your own domain (Builder+ required)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sender-name">Sender Name</Label>
                <Input
                  id="sender-name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Acme Learning Team"
                  disabled={!isBuilderPlus}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender-email">Sender Email</Label>
                <Input
                  id="sender-email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="hello@acme.com"
                  disabled={!isBuilderPlus}
                />
                <p className="text-xs text-muted-foreground">
                  You must verify this email address with SendGrid before sending campaigns.
                </p>
              </div>
              {!isBuilderPlus && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-900 dark:text-amber-200">
                    Custom email sender requires a Builder+ plan or higher. Upgrade to send emails from your own domain.
                  </p>
                </div>
              )}
              <Button
                onClick={() => updateSettings.mutate({ customSenderName: senderName, customSenderEmail: senderEmail })}
                disabled={updateSettings.isPending || !isBuilderPlus}
                className="gap-2"
              >
                {updateSettings.isPending ? "Saving..." : <><Check className="h-4 w-4" /> Save Sender</>}
              </Button>
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
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
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
      </Tabs>
    </div>
  );
}

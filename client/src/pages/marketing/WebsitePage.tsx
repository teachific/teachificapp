import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Globe, Save, ExternalLink, Code, Eye } from "lucide-react";

export default function WebsitePage() {
  const { data: orgs } = trpc.orgs.myOrgs.useQuery();
  const orgSlug = orgs?.[0]?.slug;
  // Build preview URL using the org slug — works even in draft/maintenance mode
  const previewUrl = orgSlug
    ? `${window.location.origin}/school/${orgSlug}?preview=1`
    : null;

  const [homeTitle, setHomeTitle] = useState("All About Ultrasound");
  const [homeSubtitle, setHomeSubtitle] = useState("Professional ultrasound education for healthcare providers");
  const [privacyPolicy, setPrivacyPolicy] = useState("Enter your privacy policy here...");
  const [termsOfService, setTermsOfService] = useState("Enter your terms of service here...");
  const [googleVerification, setGoogleVerification] = useState("");
  const [fbPixel, setFbPixel] = useState("");
  const [gaId, setGaId] = useState("");
  const [customHead, setCustomHead] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const openPreview = () => {
    if (previewUrl) {
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    } else {
      toast.info("Loading your site URL…");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />Website
          </h1>
          <p className="text-muted-foreground mt-0.5">Configure your public-facing website, pages, and tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={openPreview}>
            <Eye className="h-4 w-4" />Preview Site
          </Button>
          <Button variant="outline" className="gap-2" onClick={openPreview}>
            <ExternalLink className="h-4 w-4" />View Live Site
          </Button>
        </div>
      </div>

      {previewUrl && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm">
          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Your site URL:</span>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium truncate"
          >
            {previewUrl.replace("?preview=1", "")}
          </a>
        </div>
      )}

      <Tabs defaultValue="homepage">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="homepage">Home Page</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="tracking">Tracking &amp; SEO</TabsTrigger>
        </TabsList>
        <TabsContent value="homepage" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Homepage Settings</CardTitle>
              <CardDescription>Configure the look and feel of your school homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>School Name / Headline</Label>
                <Input value={homeTitle} onChange={e => setHomeTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Subtitle / Tagline</Label>
                <Input value={homeSubtitle} onChange={e => setHomeSubtitle(e.target.value)} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Maintenance Mode</p>
                  <p className="text-xs text-muted-foreground">Show a maintenance page to visitors while you make changes</p>
                </div>
                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
              </div>
              <Button className="gap-2" onClick={() => toast.success("Homepage settings saved")}>
                <Save className="h-4 w-4" />Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pages" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Privacy Policy</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={privacyPolicy} onChange={e => setPrivacyPolicy(e.target.value)} rows={6} />
              <Button size="sm" onClick={() => toast.success("Privacy policy saved")}>Save</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Terms of Service</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={termsOfService} onChange={e => setTermsOfService(e.target.value)} rows={6} />
              <Button size="sm" onClick={() => toast.success("Terms of service saved")}>Save</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custom Pages</CardTitle>
              <CardDescription>Create additional pages for your website</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="gap-2" onClick={() => toast.info("Custom page builder coming soon")}>
                <Globe className="h-4 w-4" />Add Custom Page
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tracking" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Search Engine Verification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Google Site Verification</Label>
                <Input value={googleVerification} onChange={e => setGoogleVerification(e.target.value)} placeholder="google-site-verification=..." />
              </div>
              <Button size="sm" onClick={() => toast.success("Saved")}>Save</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Analytics &amp; Pixels</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Facebook Pixel ID</Label>
                <Input value={fbPixel} onChange={e => setFbPixel(e.target.value)} placeholder="123456789012345" />
              </div>
              <div className="space-y-2">
                <Label>Google Analytics ID</Label>
                <Input value={gaId} onChange={e => setGaId(e.target.value)} placeholder="G-XXXXXXXXXX" />
              </div>
              <Button size="sm" onClick={() => toast.success("Saved")}>Save</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custom Head Code</CardTitle>
              <CardDescription>Add custom scripts or meta tags to the &lt;head&gt; of your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={customHead}
                onChange={e => setCustomHead(e.target.value)}
                rows={5}
                placeholder="<!-- Custom scripts, meta tags, etc. -->"
                className="font-mono text-xs"
              />
              <Button size="sm" className="gap-2" onClick={() => toast.success("Custom head code saved")}>
                <Code className="h-4 w-4" />Save Code
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Mail } from "lucide-react";

export default function InvoicesPage() {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Automate invoice generation and delivery for purchases and subscriptions.</p>
          </div>
        </div>
        <Button className="shrink-0">
          <Mail className="mr-2 h-4 w-4" />
          Create Invoice Template
        </Button>
      </div>

      {/* Feature Preview */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Coming Soon</CardTitle>
            <Badge variant="secondary" className="text-xs">In Development</Badge>
          </div>
          <CardDescription>
            This feature is currently being built. Here's what you'll be able to do:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li key={0} className="flex items-start gap-2.5 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-primary">1</span>
              </div>
              <span className="text-foreground/80">Create professional invoice templates with your branding</span>
            </li>
            <li key={1} className="flex items-start gap-2.5 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-primary">2</span>
              </div>
              <span className="text-foreground/80">Automatically send invoices on purchase or subscription renewal</span>
            </li>
            <li key={2} className="flex items-start gap-2.5 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-primary">3</span>
              </div>
              <span className="text-foreground/80">Enable or disable invoices per customer or site-wide</span>
            </li>
            <li key={3} className="flex items-start gap-2.5 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-primary">4</span>
              </div>
              <span className="text-foreground/80">Download and resend invoices from order history</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

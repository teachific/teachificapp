import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CreditCard, Download, CheckCircle } from "lucide-react";

const INVOICES = [
  { id: "INV-2026-04", date: "2026-04-01", amount: 79, status: "paid" },
  { id: "INV-2026-03", date: "2026-03-01", amount: 79, status: "paid" },
  { id: "INV-2026-02", date: "2026-02-01", amount: 79, status: "paid" },
];

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="h-6 w-6 text-primary" />Billing</h1><p className="text-muted-foreground mt-0.5">Manage your subscription and billing information</p></div>
      <Card>
        <CardHeader><CardTitle className="text-base">Current Plan</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
            <div>
              <div className="flex items-center gap-2"><p className="font-semibold">Pro Plan</p><Badge className="text-xs">Active</Badge></div>
              <p className="text-sm text-muted-foreground mt-0.5">$79/month · Renews May 1, 2026</p>
            </div>
            <Button variant="outline" onClick={() => toast.info("Plan management coming soon")}>Manage Plan</Button>
          </div>
          <div className="mt-4 space-y-2">
            {["Unlimited courses", "Up to 1,000 members", "Custom domain", "Email marketing", "Analytics & reports"].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-primary shrink-0" />{f}</div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Payment Method</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-8 w-12 bg-muted rounded flex items-center justify-center text-xs font-bold">VISA</div>
              <div><p className="text-sm font-medium">•••• •••• •••• 4242</p><p className="text-xs text-muted-foreground">Expires 12/28</p></div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => toast.info("Update payment method coming soon")}>Update</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Billing History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {INVOICES.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{inv.id}</p>
                  <p className="text-xs text-muted-foreground">{inv.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">${inv.amount}</span>
                  <Badge variant="default" className="text-xs">Paid</Badge>
                  <Button variant="ghost" size="sm" onClick={() => toast.info("Download coming soon")}><Download className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

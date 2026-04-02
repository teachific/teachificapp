import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, CreditCard } from "lucide-react";

export default function MembershipsPage() {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Star className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Memberships</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Create membership plans that give subscribers ongoing access to your content.</p>
          </div>
        </div>
        <Button className="shrink-0">
          <CreditCard className="mr-2 h-4 w-4" />
          Create Membership Plan
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
              <span className="text-foreground/80">Define membership tiers with different access levels</span>
            </li>
            <li key={1} className="flex items-start gap-2.5 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-primary">2</span>
              </div>
              <span className="text-foreground/80">Set monthly or annual pricing with optional trial periods</span>
            </li>
            <li key={2} className="flex items-start gap-2.5 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-primary">3</span>
              </div>
              <span className="text-foreground/80">Bundle courses and content into membership plans</span>
            </li>
            <li key={3} className="flex items-start gap-2.5 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-primary">4</span>
              </div>
              <span className="text-foreground/80">Manage active subscribers and billing cycles</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

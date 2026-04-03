import { useOrgScope } from "@/hooks/useOrgScope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileBarChart, Plus } from "lucide-react";

export default function CustomReportsPage() {
  const { orgId } = useOrgScope();
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileBarChart className="h-6 w-6 text-primary" />Custom Reports</h1>
          <p className="text-muted-foreground mt-0.5">Build custom reports from your LMS data</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info("Custom report builder coming soon")}><Plus className="h-4 w-4" />New Report</Button>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
          <FileBarChart className="h-16 w-16 text-muted-foreground/30" />
          <div className="text-center">
            <p className="font-medium">Custom Report Builder</p>
            <p className="text-sm text-muted-foreground mt-1">Create custom reports by selecting metrics, dimensions, and filters from your LMS data.</p>
          </div>
          <Button onClick={() => toast.info("Custom report builder coming soon")}>Get Started</Button>
        </CardContent>
      </Card>
    </div>
  );
}

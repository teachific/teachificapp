import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ChevronLeft, Trash2, Eye, Download, BarChart2 } from "lucide-react";

export default function FormResponsesPage() {
  const params = useParams<{ id: string }>();
  const formId = parseInt(params.id ?? "0");
  const [, setLocation] = useLocation();
  const [viewSubmission, setViewSubmission] = useState<any>(null);

  const { data: formData, isLoading: formLoading } = trpc.forms.get.useQuery(
    { id: formId },
    { enabled: !!formId }
  );

  const { data: submissions, isLoading: subsLoading, refetch } = trpc.forms.submissions.list.useQuery(
    { formId },
    { enabled: !!formId }
  );

  const deleteMutation = trpc.forms.submissions.delete.useMutation({
    onSuccess: () => { toast.success("Response deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const fields = formData?.fields ?? [];

  const getFieldLabel = (fieldId: string) => {
    return fields.find((f: any) => String(f.id) === fieldId)?.label ?? `Field #${fieldId}`;
  };

  const exportCsv = () => {
    if (!submissions || submissions.length === 0) return;
    const headers = ["Submitted At", "Respondent Email", ...fields.map((f: any) => f.label)];
    const rows = submissions.map((s: any) => {
      const answers = JSON.parse(s.answers ?? "{}");
      return [
        new Date(s.submittedAt).toLocaleString(),
        s.respondentEmail ?? "",
        ...fields.map((f: any) => {
          const val = answers[f.id];
          return Array.isArray(val) ? val.join("; ") : String(val ?? "");
        }),
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData?.title ?? "form"}-responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = formLoading || subsLoading;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/lms/forms/${formId}`)}
            className="gap-1.5 text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Builder
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Responses
            </h1>
            {formData && (
              <p className="text-sm text-muted-foreground">{formData.title}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {submissions?.length ?? 0} response{(submissions?.length ?? 0) !== 1 ? "s" : ""}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={!submissions || submissions.length === 0}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        </Card>
      ) : !submissions || submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <BarChart2 className="h-12 w-12 text-muted-foreground/40" />
          <p className="font-medium">No responses yet</p>
          <p className="text-sm text-muted-foreground">
            Responses will appear here once people submit the form.
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Submitted</TableHead>
                  <TableHead>Respondent</TableHead>
                  {fields.slice(0, 3).map((f: any) => (
                    <TableHead key={f.id} className="max-w-[180px]">
                      <span className="truncate block">{f.label}</span>
                    </TableHead>
                  ))}
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub: any) => {
                  const answers = JSON.parse(sub.answers ?? "{}");
                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(sub.submittedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {sub.respondentEmail ?? sub.respondentName ?? (
                          <span className="text-muted-foreground italic">Anonymous</span>
                        )}
                      </TableCell>
                      {fields.slice(0, 3).map((f: any) => {
                        const val = answers[f.id];
                        const display = Array.isArray(val) ? val.join(", ") : String(val ?? "");
                        return (
                          <TableCell key={f.id} className="text-xs max-w-[180px]">
                            <span className="truncate block">{display || <span className="text-muted-foreground">—</span>}</span>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setViewSubmission(sub)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              if (confirm("Delete this response?")) {
                                deleteMutation.mutate({ id: sub.id });
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* View submission dialog */}
      <Dialog open={!!viewSubmission} onOpenChange={() => setViewSubmission(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Response Details</DialogTitle>
          </DialogHeader>
          {viewSubmission && (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                Submitted {new Date(viewSubmission.submittedAt).toLocaleString()}
                {viewSubmission.respondentEmail && ` · ${viewSubmission.respondentEmail}`}
              </div>
              {fields.map((f: any) => {
                const answers = JSON.parse(viewSubmission.answers ?? "{}");
                const val = answers[f.id];
                const display = Array.isArray(val) ? val.join(", ") : String(val ?? "");
                return (
                  <div key={f.id} className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">{f.label}</p>
                    <p className="text-sm">{display || <span className="text-muted-foreground italic">No answer</span>}</p>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

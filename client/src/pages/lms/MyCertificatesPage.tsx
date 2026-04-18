import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Download, ExternalLink, BookOpen, Calendar } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function MyCertificatesPage() {
  const { user } = useAuth();
  const authLoading = false;
  const { data: certs, isLoading } = trpc.lms.certificates.mine.useQuery(undefined, {
    enabled: !!user,
  });
  const downloadMutation = trpc.lms.certificates.download.useMutation();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  async function handleDownload(enrollmentId: number, certId: number) {
    setDownloadingId(certId);
    try {
      const result = await downloadMutation.mutateAsync({ enrollmentId });
      // Open the PDF URL in a new tab — browser will prompt save
      const link = document.createElement("a");
      link.href = result.url;
      link.download = result.filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Certificate downloaded!");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to generate certificate. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container max-w-4xl py-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Award className="h-6 w-6 text-amber-500" />
              My Certificates
            </h1>
            <p className="text-muted-foreground mt-1">
              Download your certificates of completion for courses you've finished.
            </p>
          </div>
          {certs && certs.length > 0 && (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {certs.length} {certs.length === 1 ? "Certificate" : "Certificates"}
            </Badge>
          )}
        </div>

        {/* Empty state */}
        {(!certs || certs.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-4">
              <Award className="h-10 w-10 text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No certificates yet</h2>
            <p className="text-muted-foreground max-w-sm">
              Complete a course to earn your first certificate. Your achievements will appear here.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => window.history.back()}>
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Courses
            </Button>
          </div>
        )}

        {/* Certificate list */}
        {certs && certs.length > 0 && (
          <div className="grid gap-4">
            {certs.map((cert: any) => (
              <CertificateCard
                key={cert.id}
                cert={cert}
                isDownloading={downloadingId === cert.id}
                onDownload={() => handleDownload(cert.enrollmentId, cert.id)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

interface CertificateCardProps {
  cert: any;
  isDownloading: boolean;
  onDownload: () => void;
}

function CertificateCard({ cert, isDownloading, onDownload }: CertificateCardProps) {
  const issuedDate = cert.issuedAt
    ? new Date(cert.issuedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date unavailable";

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-l-4 border-l-amber-400">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: icon + info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
              <Award className="h-6 w-6 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base leading-tight truncate">
                {cert.courseName ?? cert.courseTitle ?? "Course Certificate"}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {cert.orgName ?? ""}
              </p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Issued {issuedDate}
                </span>
                {cert.verificationCode && (
                  <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                    ID: {cert.verificationCode}
                  </span>
                )}
                <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200">
                  Completed
                </Badge>
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={onDownload}
              disabled={isDownloading}
              className="gap-2"
            >
              {isDownloading ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

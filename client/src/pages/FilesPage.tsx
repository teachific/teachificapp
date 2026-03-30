import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Download, FileArchive, MoreVertical, Play,
  Plus, Search, Settings, Trash2, Upload,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type ContentType = "all" | "scorm" | "articulate" | "ispring" | "html" | "unknown";
type SortKey = "title" | "date" | "plays" | "size";

function ContentTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    scorm: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    articulate: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    ispring: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    html: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    unknown: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  const labels: Record<string, string> = { scorm: "SCORM", articulate: "Articulate", ispring: "iSpring", html: "HTML", unknown: "Unknown" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[type] ?? map.unknown}`}>{labels[type] ?? type}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    ready: { label: "Ready", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    processing: { label: "Processing", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    error: { label: "Error", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    uploading: { label: "Uploading", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  };
  const info = map[status] ?? { label: status, class: "bg-gray-100 text-gray-600" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${info.class}`}>{info.label}</span>;
}

function formatSize(bytes: number) {
  if (!bytes) return "\u2014";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<ContentType>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: packages, isLoading, refetch } = trpc.packages.list.useQuery(undefined);
  const deletePackage = trpc.packages.delete.useMutation({
    onSuccess: () => { toast.success("Package deleted"); refetch(); setDeleteId(null); },
    onError: (e) => toast.error("Delete failed: " + e.message),
  });

  const filtered = useMemo(() => {
    let list = packages ?? [];
    if (search) list = list.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
    if (filterType !== "all") list = list.filter((p) => p.contentType === filterType);
    return [...list].sort((a, b) => {
      if (sortKey === "title") return a.title.localeCompare(b.title);
      if (sortKey === "plays") return (b.totalPlayCount ?? 0) - (a.totalPlayCount ?? 0);
      if (sortKey === "size") return (b.originalZipSize ?? 0) - (a.originalZipSize ?? 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [packages, search, filterType, sortKey]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Files</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{packages?.length ?? 0} packages total</p>
        </div>
        <Button onClick={() => setLocation("/upload")} className="gap-2">
          <Plus className="h-4 w-4" />Upload Content
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search packages..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <select className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={filterType} onChange={(e) => setFilterType(e.target.value as ContentType)}>
            <option value="all">All Types</option>
            <option value="scorm">SCORM</option>
            <option value="articulate">Articulate</option>
            <option value="ispring">iSpring</option>
            <option value="html">HTML</option>
          </select>
          <select className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
            <option value="date">Newest First</option>
            <option value="title">Title A-Z</option>
            <option value="plays">Most Played</option>
            <option value="size">Largest</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Card key={i} className="shadow-sm"><CardContent className="p-4"><Skeleton className="h-14 w-full" /></CardContent></Card>)}</div>
      ) : filtered.length === 0 ? (
        <Card className="shadow-sm border-border/60">
          <CardContent className="py-16 text-center">
            <FileArchive className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-medium text-muted-foreground">{search || filterType !== "all" ? "No packages match your filters" : "No packages uploaded yet"}</p>
            {!search && filterType === "all" && <Button size="sm" className="mt-4 gap-2" onClick={() => setLocation("/upload")}><Upload className="h-3.5 w-3.5" />Upload your first package</Button>}
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-border/60 overflow-hidden">
          <div className="divide-y divide-border/50">
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-2.5 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Package</span><span className="text-center">Type</span><span className="text-center">Status</span><span className="text-center">Plays</span><span className="text-right">Actions</span>
            </div>
            {filtered.map((pkg) => (
              <div key={pkg.id} className="flex sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-4 hover:bg-accent/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => setLocation(`/files/${pkg.id}`)}>
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><FileArchive className="h-4 w-4 text-primary" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{pkg.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatSize(pkg.originalZipSize ?? 0)}</span>
                      {pkg.scormVersion !== "none" && <span className="text-xs text-muted-foreground">&bull; SCORM {pkg.scormVersion}</span>}
                      <span className="text-xs text-muted-foreground">&bull; {new Date(pkg.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex justify-center"><ContentTypeBadge type={pkg.contentType} /></div>
                <div className="hidden sm:flex justify-center"><StatusBadge status={pkg.status} /></div>
                <div className="hidden sm:flex items-center justify-center gap-1 text-sm text-muted-foreground"><Play className="h-3.5 w-3.5" />{pkg.totalPlayCount ?? 0}</div>
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => setLocation(`/play/${pkg.id}`)}><Play className="mr-2 h-4 w-4" />Preview</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation(`/files/${pkg.id}`)}><Settings className="mr-2 h-4 w-4" />Manage</DropdownMenuItem>
                      {pkg.originalZipUrl && <DropdownMenuItem asChild><a href={pkg.originalZipUrl} download target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" />Download ZIP</a></DropdownMenuItem>}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(pkg.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the package and all its versions. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteId && deletePackage.mutate({ id: deleteId })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

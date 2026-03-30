import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ChevronDown, ChevronRight, Download, FileArchive, Folder, FolderOpen,
  FolderPlus, MoreVertical, Pencil, Play, Plus, Search, Settings,
  Trash2, Upload, FolderInput,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────
type ContentType = "all" | "scorm" | "articulate" | "ispring" | "html" | "unknown";
type SortKey = "title" | "date" | "plays" | "size";

interface Folder {
  id: number;
  orgId: number;
  ownerId: number;
  parentId: number | null;
  name: string;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Folder Tree Node ─────────────────────────────────────────────────────────
function FolderNode({
  folder,
  allFolders,
  selectedFolderId,
  onSelect,
  onCreateChild,
  onRename,
  onDelete,
  depth = 0,
}: {
  folder: Folder;
  allFolders: Folder[];
  selectedFolderId: number | null | "root";
  onSelect: (id: number | null) => void;
  onCreateChild: (parentId: number) => void;
  onRename: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
  depth?: number;
}) {
  const children = allFolders.filter((f) => f.parentId === folder.id);
  const [open, setOpen] = useState(true);
  const isSelected = selectedFolderId === folder.id;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer transition-colors text-sm ${
          isSelected
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-accent/50 text-foreground"
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelect(folder.id)}
      >
        {children.length > 0 ? (
          <button
            type="button"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {open && children.length > 0
          ? <FolderOpen className="h-4 w-4 shrink-0 text-primary/70" />
          : <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
        }
        <span className="flex-1 truncate">{folder.name}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateChild(folder.id); }}>
              <FolderPlus className="mr-2 h-4 w-4" />New Subfolder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(folder); }}>
              <Pencil className="mr-2 h-4 w-4" />Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(folder); }}
            >
              <Trash2 className="mr-2 h-4 w-4" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {open && children.length > 0 && (
        <div>
          {children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              allFolders={allFolders}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onCreateChild={onCreateChild}
              onRename={onRename}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FilesPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<ContentType>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [deletePackageId, setDeletePackageId] = useState<number | null>(null);

  // Folder state
  const [selectedFolderId, setSelectedFolderId] = useState<number | null | "root">(null); // null = All Files, "root" = uncategorized
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderDialogMode, setFolderDialogMode] = useState<"create" | "rename">("create");
  const [folderDialogParentId, setFolderDialogParentId] = useState<number | null>(null);
  const [folderDialogTarget, setFolderDialogTarget] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState("");
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<Folder | null>(null);

  const utils = trpc.useUtils();

  // Queries
  const { data: packages, isLoading: pkgsLoading, refetch: refetchPkgs } = trpc.packages.list.useQuery(undefined);
  const { data: myOrgs } = trpc.orgs.myOrgs.useQuery();
  const orgId = myOrgs?.[0]?.id ?? 0;
  const { data: folders = [], refetch: refetchFolders } = trpc.folders.list.useQuery(
    { orgId },
    { enabled: orgId > 0 }
  );

  // Mutations
  const deletePackageMut = trpc.packages.delete.useMutation({
    onSuccess: () => { toast.success("Package deleted"); refetchPkgs(); setDeletePackageId(null); },
    onError: (e) => toast.error("Delete failed: " + e.message),
  });

  const createFolderMut = trpc.folders.create.useMutation({
    onSuccess: () => { toast.success("Folder created"); refetchFolders(); setFolderDialogOpen(false); },
    onError: (e) => toast.error("Failed to create folder: " + e.message),
  });

  const renameFolderMut = trpc.folders.rename.useMutation({
    onSuccess: () => { toast.success("Folder renamed"); refetchFolders(); setFolderDialogOpen(false); },
    onError: (e) => toast.error("Failed to rename folder: " + e.message),
  });

  const deleteFolderMut = trpc.folders.delete.useMutation({
    onSuccess: () => {
      toast.success("Folder deleted — contents moved to parent");
      refetchFolders();
      refetchPkgs();
      if (selectedFolderId === deleteFolderTarget?.id) setSelectedFolderId(null);
      setDeleteFolderTarget(null);
    },
    onError: (e) => toast.error("Failed to delete folder: " + e.message),
  });

  const movePackageMut = trpc.folders.movePackage.useMutation({
    onSuccess: () => { toast.success("Package moved"); refetchPkgs(); },
    onError: (e) => toast.error("Failed to move package: " + e.message),
  });

  // Folder dialog handlers
  const openCreateFolder = useCallback((parentId: number | null = null) => {
    setFolderDialogMode("create");
    setFolderDialogParentId(parentId);
    setFolderDialogTarget(null);
    setFolderName("");
    setFolderDialogOpen(true);
  }, []);

  const openRenameFolder = useCallback((folder: Folder) => {
    setFolderDialogMode("rename");
    setFolderDialogTarget(folder);
    setFolderName(folder.name);
    setFolderDialogOpen(true);
  }, []);

  const handleFolderDialogSubmit = () => {
    if (!folderName.trim()) return;
    if (folderDialogMode === "create") {
      createFolderMut.mutate({ orgId, name: folderName.trim(), parentId: folderDialogParentId });
    } else if (folderDialogTarget) {
      renameFolderMut.mutate({ id: folderDialogTarget.id, name: folderName.trim() });
    }
  };

  // Filtered packages
  const rootFolders = (folders as Folder[]).filter((f) => f.parentId === null);

  const filtered = useMemo(() => {
    let list = packages ?? [];

    // Folder filter
    if (selectedFolderId === "root") {
      list = list.filter((p) => (p as any).folderId == null);
    } else if (typeof selectedFolderId === "number") {
      list = list.filter((p) => (p as any).folderId === selectedFolderId);
    }

    if (search) list = list.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
    if (filterType !== "all") list = list.filter((p) => p.contentType === filterType);

    return [...list].sort((a, b) => {
      if (sortKey === "title") return a.title.localeCompare(b.title);
      if (sortKey === "plays") return (b.totalPlayCount ?? 0) - (a.totalPlayCount ?? 0);
      if (sortKey === "size") return (b.originalZipSize ?? 0) - (a.originalZipSize ?? 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [packages, search, filterType, sortKey, selectedFolderId]);

  const selectedFolderName = useMemo(() => {
    if (selectedFolderId === null) return "All Files";
    if (selectedFolderId === "root") return "Uncategorized";
    return (folders as Folder[]).find((f) => f.id === selectedFolderId)?.name ?? "Folder";
  }, [selectedFolderId, folders]);

  const uncategorizedCount = useMemo(() =>
    (packages ?? []).filter((p) => (p as any).folderId == null).length,
    [packages]
  );

  return (
    <div className="flex h-full min-h-0">
      {/* ── Folder Sidebar ── */}
      <aside className="w-56 shrink-0 border-r border-border/60 flex flex-col bg-muted/20 overflow-y-auto">
        <div className="flex items-center justify-between px-3 pt-4 pb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folders</span>
          <button
            type="button"
            title="New root folder"
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => openCreateFolder(null)}
          >
            <FolderPlus className="h-4 w-4" />
          </button>
        </div>

        {/* All Files */}
        <button
          type="button"
          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md mx-1 transition-colors ${
            selectedFolderId === null
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-accent/50 text-foreground"
          }`}
          onClick={() => setSelectedFolderId(null)}
        >
          <FileArchive className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">All Files</span>
          <span className="text-xs text-muted-foreground">{packages?.length ?? 0}</span>
        </button>

        {/* Uncategorized */}
        <button
          type="button"
          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md mx-1 transition-colors ${
            selectedFolderId === "root"
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-accent/50 text-muted-foreground"
          }`}
          onClick={() => setSelectedFolderId("root")}
        >
          <Folder className="h-4 w-4 shrink-0 opacity-50" />
          <span className="flex-1 text-left">Uncategorized</span>
          {uncategorizedCount > 0 && (
            <span className="text-xs text-muted-foreground">{uncategorizedCount}</span>
          )}
        </button>

        {/* Folder tree */}
        {rootFolders.length > 0 && (
          <div className="mt-1 px-1 pb-4">
            {rootFolders.map((folder) => (
              <FolderNode
                key={folder.id}
                folder={folder}
                allFolders={folders as Folder[]}
                selectedFolderId={selectedFolderId}
                onSelect={(id) => setSelectedFolderId(id)}
                onCreateChild={(parentId) => openCreateFolder(parentId)}
                onRename={openRenameFolder}
                onDelete={(f) => setDeleteFolderTarget(f)}
              />
            ))}
          </div>
        )}

        {rootFolders.length === 0 && orgId > 0 && (
          <p className="text-xs text-muted-foreground px-3 pt-2 pb-4 italic">
            No folders yet. Click + to create one.
          </p>
        )}
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{selectedFolderName}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{filtered.length} package{filtered.length !== 1 ? "s" : ""}</p>
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

        {pkgsLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="shadow-sm"><CardContent className="p-4"><Skeleton className="h-14 w-full" /></CardContent></Card>
          ))}</div>
        ) : filtered.length === 0 ? (
          <Card className="shadow-sm border-border/60">
            <CardContent className="py-16 text-center">
              <FileArchive className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="font-medium text-muted-foreground">
                {search || filterType !== "all"
                  ? "No packages match your filters"
                  : selectedFolderId !== null
                    ? "This folder is empty"
                    : "No packages uploaded yet"}
              </p>
              {!search && filterType === "all" && selectedFolderId === null && (
                <Button size="sm" className="mt-4 gap-2" onClick={() => setLocation("/upload")}>
                  <Upload className="h-3.5 w-3.5" />Upload your first package
                </Button>
              )}
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
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileArchive className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{pkg.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{formatSize(pkg.originalZipSize ?? 0)}</span>
                        {pkg.scormVersion !== "none" && <span className="text-xs text-muted-foreground">&bull; SCORM {pkg.scormVersion}</span>}
                        <span className="text-xs text-muted-foreground">&bull; {new Date(pkg.createdAt).toLocaleDateString()}</span>
                        {(pkg as any).folderId && (
                          <span className="text-xs text-primary/70 flex items-center gap-0.5">
                            <Folder className="h-3 w-3" />
                            {(folders as Folder[]).find((f) => f.id === (pkg as any).folderId)?.name ?? "Folder"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex justify-center"><ContentTypeBadge type={pkg.contentType} /></div>
                  <div className="hidden sm:flex justify-center"><StatusBadge status={pkg.status} /></div>
                  <div className="hidden sm:flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Play className="h-3.5 w-3.5" />{pkg.totalPlayCount ?? 0}
                  </div>
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setLocation(`/play/${pkg.id}`)}>
                          <Play className="mr-2 h-4 w-4" />Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLocation(`/files/${pkg.id}`)}>
                          <Settings className="mr-2 h-4 w-4" />Manage
                        </DropdownMenuItem>
                        {pkg.originalZipUrl && (
                          <DropdownMenuItem asChild>
                            <a href={pkg.originalZipUrl} download target="_blank" rel="noreferrer">
                              <Download className="mr-2 h-4 w-4" />Download ZIP
                            </a>
                          </DropdownMenuItem>
                        )}
                        {/* Move to folder submenu */}
                        {(folders as Folder[]).length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <FolderInput className="mr-2 h-4 w-4" />Move to Folder
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="w-44 max-h-64 overflow-y-auto">
                                <DropdownMenuItem
                                  onClick={() => movePackageMut.mutate({ packageId: pkg.id, folderId: null })}
                                >
                                  <Folder className="mr-2 h-4 w-4 opacity-50" />Uncategorized
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {(folders as Folder[]).map((f) => (
                                  <DropdownMenuItem
                                    key={f.id}
                                    onClick={() => movePackageMut.mutate({ packageId: pkg.id, folderId: f.id })}
                                  >
                                    <Folder className="mr-2 h-4 w-4 text-primary/70" />
                                    <span className="truncate">{f.name}</span>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeletePackageId(pkg.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* ── Folder Create/Rename Dialog ── */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {folderDialogMode === "create"
                ? folderDialogParentId ? "New Subfolder" : "New Folder"
                : "Rename Folder"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="folder-name">Folder name</Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g. Cardiology Courses"
                onKeyDown={(e) => { if (e.key === "Enter") handleFolderDialogSubmit(); }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleFolderDialogSubmit}
              disabled={!folderName.trim() || createFolderMut.isPending || renameFolderMut.isPending}
            >
              {folderDialogMode === "create" ? "Create" : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Package Dialog ── */}
      <AlertDialog open={deletePackageId !== null} onOpenChange={(o) => !o && setDeletePackageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the package and all its versions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deletePackageId && deletePackageMut.mutate({ id: deletePackageId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Folder Dialog ── */}
      <AlertDialog open={deleteFolderTarget !== null} onOpenChange={(o) => !o && setDeleteFolderTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              The folder <strong>"{deleteFolderTarget?.name}"</strong> will be deleted. Any subfolders will be promoted to its parent level, and all packages inside will be moved to Uncategorized. No content will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteFolderTarget && deleteFolderMut.mutate({ id: deleteFolderTarget.id })}
            >
              Delete Folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

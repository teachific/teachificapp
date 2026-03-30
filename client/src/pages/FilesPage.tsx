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
  FolderPlus, GripVertical, MoreVertical, Pencil, Play, Plus, Search,
  Settings, Trash2, Upload, FolderInput,
} from "lucide-react";
import { useState, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  sortOrder: number;
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

// ─── Sortable Folder Row ──────────────────────────────────────────────────────
function SortableFolderNode({
  folder,
  allFolders,
  selectedFolderId,
  dragOverFolderId,
  onSelect,
  onCreateChild,
  onRename,
  onDelete,
  depth = 0,
}: {
  folder: Folder;
  allFolders: Folder[];
  selectedFolderId: number | null | "root";
  dragOverFolderId: number | null;
  onSelect: (id: number | null) => void;
  onCreateChild: (parentId: number) => void;
  onRename: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
  depth?: number;
}) {
  const children = allFolders
    .filter((f) => f.parentId === folder.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const [open, setOpen] = useState(true);
  const isSelected = selectedFolderId === folder.id;
  const isDragTarget = dragOverFolderId === folder.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `folder-${folder.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`group flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer transition-colors text-sm ${
          isDragTarget
            ? "bg-primary/20 ring-1 ring-primary/40"
            : isSelected
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-accent/50 text-foreground"
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelect(folder.id)}
      >
        {/* Drag handle for reordering */}
        <button
          type="button"
          className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

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
          : <Folder className={`h-4 w-4 shrink-0 ${isDragTarget ? "text-primary" : "text-muted-foreground"}`} />
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
            <SortableFolderNode
              key={child.id}
              folder={child}
              allFolders={allFolders}
              selectedFolderId={selectedFolderId}
              dragOverFolderId={dragOverFolderId}
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

// ─── Draggable Package Row ────────────────────────────────────────────────────
function DraggablePackageRow({
  pkg,
  folders,
  onNavigate,
  onDelete,
  onMove,
  isDragging,
}: {
  pkg: any;
  folders: Folder[];
  onNavigate: (path: string) => void;
  onDelete: (id: number) => void;
  onMove: (packageId: number, folderId: number | null) => void;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSelfDragging } = useSortable({
    id: `pkg-${pkg.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSelfDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-4 hover:bg-accent/20 transition-colors ${isSelfDragging ? "bg-accent/30" : ""}`}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="hidden sm:flex cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors shrink-0"
        {...attributes}
        {...listeners}
        title="Drag to move to folder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Package info */}
      <div className="flex items-center gap-3 min-w-0 cursor-pointer flex-1" onClick={() => onNavigate(`/files/${pkg.id}`)}>
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileArchive className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{pkg.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-muted-foreground">{formatSize(pkg.originalZipSize ?? 0)}</span>
            {pkg.scormVersion !== "none" && <span className="text-xs text-muted-foreground">&bull; SCORM {pkg.scormVersion}</span>}
            <span className="text-xs text-muted-foreground">&bull; {new Date(pkg.createdAt).toLocaleDateString()}</span>
            {pkg.folderId && (
              <span className="text-xs text-primary/70 flex items-center gap-0.5">
                <Folder className="h-3 w-3" />
                {folders.find((f) => f.id === pkg.folderId)?.name ?? "Folder"}
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
            <DropdownMenuItem onClick={() => onNavigate(`/play/${pkg.id}`)}>
              <Play className="mr-2 h-4 w-4" />Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate(`/files/${pkg.id}`)}>
              <Settings className="mr-2 h-4 w-4" />Manage
            </DropdownMenuItem>
            {pkg.originalZipUrl && (
              <DropdownMenuItem asChild>
                <a href={pkg.originalZipUrl} download target="_blank" rel="noreferrer">
                  <Download className="mr-2 h-4 w-4" />Download ZIP
                </a>
              </DropdownMenuItem>
            )}
            {folders.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderInput className="mr-2 h-4 w-4" />Move to Folder
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-44 max-h-64 overflow-y-auto">
                    <DropdownMenuItem onClick={() => onMove(pkg.id, null)}>
                      <Folder className="mr-2 h-4 w-4 opacity-50" />Uncategorized
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {folders.map((f) => (
                      <DropdownMenuItem key={f.id} onClick={() => onMove(pkg.id, f.id)}>
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
              onClick={() => onDelete(pkg.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
  const [selectedFolderId, setSelectedFolderId] = useState<number | null | "root">(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderDialogMode, setFolderDialogMode] = useState<"create" | "rename">("create");
  const [folderDialogParentId, setFolderDialogParentId] = useState<number | null>(null);
  const [folderDialogTarget, setFolderDialogTarget] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState("");
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<Folder | null>(null);

  // DnD state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null);
  // Local folder order for optimistic reordering
  const [localFolderOrder, setLocalFolderOrder] = useState<number[] | null>(null);

  const utils = trpc.useUtils();

  // Queries
  const { data: packages, isLoading: pkgsLoading, refetch: refetchPkgs } = trpc.packages.list.useQuery(undefined);
  const { data: myOrgs } = trpc.orgs.myOrgs.useQuery();
  const orgId = myOrgs?.[0]?.id ?? 0;
  const { data: foldersRaw = [], refetch: refetchFolders } = trpc.folders.list.useQuery(
    { orgId },
    { enabled: orgId > 0 }
  );

  // Apply local order optimistically
  const folders: Folder[] = useMemo(() => {
    const raw = foldersRaw as Folder[];
    if (!localFolderOrder) return [...raw].sort((a, b) => a.sortOrder - b.sortOrder);
    return localFolderOrder
      .map((id) => raw.find((f) => f.id === id))
      .filter(Boolean) as Folder[];
  }, [foldersRaw, localFolderOrder]);

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

  const reorderFoldersMut = trpc.folders.reorder.useMutation({
    onError: (e) => { toast.error("Failed to save folder order: " + e.message); setLocalFolderOrder(null); refetchFolders(); },
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
      createFolderMut.mutate({ orgId, name: folderName.trim(), parentId: folderDialogParentId ?? undefined });
    } else if (folderDialogTarget) {
      renameFolderMut.mutate({ id: folderDialogTarget.id, name: folderName.trim() });
    }
  };

  // DnD sensors — require 8px movement before drag starts (prevents accidental drags)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = String(event.over?.id ?? "");
    if (overId.startsWith("folder-")) {
      setDragOverFolderId(Number(overId.replace("folder-", "")));
    } else {
      setDragOverFolderId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setDragOverFolderId(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Package dropped onto a folder node
    if (activeId.startsWith("pkg-") && overId.startsWith("folder-")) {
      const packageId = Number(activeId.replace("pkg-", ""));
      const folderId = Number(overId.replace("folder-", ""));
      movePackageMut.mutate({ packageId, folderId });
      return;
    }

    // Package dropped onto "uncategorized" or "all" zones
    if (activeId.startsWith("pkg-") && overId === "drop-uncategorized") {
      const packageId = Number(activeId.replace("pkg-", ""));
      movePackageMut.mutate({ packageId, folderId: null });
      return;
    }

    // Folder reordering within the sidebar
    if (activeId.startsWith("folder-") && overId.startsWith("folder-")) {
      const activeFolder = Number(activeId.replace("folder-", ""));
      const overFolder = Number(overId.replace("folder-", ""));
      if (activeFolder === overFolder) return;

      // Only reorder root-level folders (same parent)
      const activeFolderObj = folders.find((f) => f.id === activeFolder);
      const overFolderObj = folders.find((f) => f.id === overFolder);
      if (!activeFolderObj || !overFolderObj) return;
      if (activeFolderObj.parentId !== overFolderObj.parentId) return;

      const rootFolderIds = folders
        .filter((f) => f.parentId === activeFolderObj.parentId)
        .map((f) => f.id);
      const oldIndex = rootFolderIds.indexOf(activeFolder);
      const newIndex = rootFolderIds.indexOf(overFolder);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(rootFolderIds, oldIndex, newIndex);
      // Optimistic update
      const allFolderIds = folders.map((f) => f.id);
      const newFullOrder = allFolderIds.map((id) => {
        const pos = newOrder.indexOf(id);
        return pos !== -1 ? newOrder[pos] : id;
      });
      setLocalFolderOrder(newOrder.concat(folders.filter((f) => !newOrder.includes(f.id)).map((f) => f.id)));
      reorderFoldersMut.mutate({ orderedIds: newOrder });
    }
  };

  // Filtered packages
  const rootFolders = folders.filter((f) => f.parentId === null);

  const filtered = useMemo(() => {
    let list = packages ?? [];
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
    return folders.find((f) => f.id === selectedFolderId)?.name ?? "Folder";
  }, [selectedFolderId, folders]);

  const uncategorizedCount = useMemo(() =>
    (packages ?? []).filter((p) => (p as any).folderId == null).length,
    [packages]
  );

  // IDs for sortable contexts
  const folderSortableIds = rootFolders.map((f) => `folder-${f.id}`);
  const pkgSortableIds = filtered.map((p) => `pkg-${p.id}`);

  // Active drag item info for overlay
  const activePkg = activeDragId?.startsWith("pkg-")
    ? (packages ?? []).find((p) => p.id === Number(activeDragId.replace("pkg-", "")))
    : null;
  const activeFolder = activeDragId?.startsWith("folder-")
    ? folders.find((f) => f.id === Number(activeDragId.replace("folder-", "")))
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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

          {/* Uncategorized — also a drop target */}
          <div
            id="drop-uncategorized"
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md mx-1 transition-colors cursor-pointer ${
              activeDragId?.startsWith("pkg-") ? "ring-1 ring-dashed ring-muted-foreground/40" : ""
            } ${
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
          </div>

          {/* Sortable folder tree */}
          {rootFolders.length > 0 && (
            <div className="mt-1 px-1 pb-4">
              <SortableContext items={folderSortableIds} strategy={verticalListSortingStrategy}>
                {rootFolders.map((folder) => (
                  <SortableFolderNode
                    key={folder.id}
                    folder={folder}
                    allFolders={folders}
                    selectedFolderId={selectedFolderId}
                    dragOverFolderId={dragOverFolderId}
                    onSelect={(id) => setSelectedFolderId(id)}
                    onCreateChild={(parentId) => openCreateFolder(parentId)}
                    onRename={openRenameFolder}
                    onDelete={(f) => setDeleteFolderTarget(f)}
                  />
                ))}
              </SortableContext>
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

          {activeDragId?.startsWith("pkg-") && (
            <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary/70 text-center">
              Drag onto a folder in the sidebar to move this package
            </div>
          )}

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
                      ? "This folder is empty — drag packages here from All Files"
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
                <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-2.5 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span className="w-4" />
                  <span>Package</span>
                  <span className="text-center">Type</span>
                  <span className="text-center">Status</span>
                  <span className="text-center">Plays</span>
                  <span className="text-right">Actions</span>
                </div>
                <SortableContext items={pkgSortableIds} strategy={verticalListSortingStrategy}>
                  {filtered.map((pkg) => (
                    <DraggablePackageRow
                      key={pkg.id}
                      pkg={pkg}
                      folders={folders}
                      onNavigate={setLocation}
                      onDelete={(id) => setDeletePackageId(id)}
                      onMove={(packageId, folderId) => movePackageMut.mutate({ packageId, folderId })}
                    />
                  ))}
                </SortableContext>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* DragOverlay — ghost preview while dragging */}
      <DragOverlay>
        {activePkg && (
          <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-4 py-3 shadow-xl opacity-90 w-72">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileArchive className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-medium truncate">{activePkg.title}</p>
          </div>
        )}
        {activeFolder && (
          <div className="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-2 shadow-xl opacity-90 w-48">
            <Folder className="h-4 w-4 text-primary/70 shrink-0" />
            <span className="text-sm truncate">{activeFolder.name}</span>
          </div>
        )}
      </DragOverlay>

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
    </DndContext>
  );
}

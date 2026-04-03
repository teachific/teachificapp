import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useOrgScope } from "@/hooks/useOrgScope";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye, EyeOff, Package, BarChart2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useLocation } from "wouter";

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileTypeLabel(type?: string | null): string {
  if (!type) return "File";
  if (type.includes("pdf")) return "PDF";
  if (type.includes("word") || type.includes("docx")) return "Word";
  if (type.includes("excel") || type.includes("xlsx")) return "Excel";
  if (type.includes("powerpoint") || type.includes("pptx")) return "PowerPoint";
  if (type.includes("video")) return "Video";
  if (type.includes("image")) return "Image";
  if (type.includes("zip")) return "ZIP";
  return "File";
}

export default function DigitalProductsPage() {
  const { orgId, ready } = useOrgScope();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [, navigate] = useLocation();

  const { data: products, refetch } = trpc.lms.downloads.listProducts.useQuery(
    { orgId: orgId! },
    { enabled: ready }
  );

  const deleteProduct = trpc.lms.downloads.deleteProduct.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteId(null);
      toast.success("Product deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateProduct = trpc.lms.downloads.updateProduct.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Product updated");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Digital Downloads</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sell digital files with custom sales pages, payment options, and access controls.
          </p>
        </div>

      </div>

      {ready && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {products?.length ?? 0} product{products?.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`/admin/downloads/reports?orgId=${orgId}`)}>
                <BarChart2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Reports</span>
              </Button>
              <Button size="sm" onClick={() => navigate(`/admin/downloads/new?orgId=${orgId}`)}>
                <Plus className="w-4 h-4 mr-2" />
                New Product
              </Button>
            </div>
          </div>

          {!products || products.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                <h3 className="font-semibold text-lg mb-1">No digital products yet</h3>
                <p className="text-muted-foreground text-sm mb-4">Create your first digital product to start selling downloads.</p>
                <Button onClick={() => navigate(`/admin/downloads/new?orgId=${orgId}`)}>
                  <Plus className="w-4 h-4 mr-2" />Create Product
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {products.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {product.thumbnailUrl ? (
                            <img src={product.thumbnailUrl} alt={product.title} className="w-10 h-10 rounded object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate">{product.title}</p>
                            <p className="text-xs text-muted-foreground">/{product.slug}</p>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <Badge variant="outline" className="text-xs">{fileTypeLabel(product.fileType)}</Badge>
                              <Badge variant={product.isPublished ? "default" : "secondary"} className="text-xs">
                                {product.isPublished ? "Published" : "Draft"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{formatFileSize(product.fileSize)}</span>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/downloads/${product.id}`)}>
                              <Edit className="w-4 h-4 mr-2" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateProduct.mutate({ id: product.id, isPublished: !product.isPublished })}>
                              {product.isPublished ? <><EyeOff className="w-4 h-4 mr-2" />Unpublish</> : <><Eye className="w-4 h-4 mr-2" />Publish</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(product.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>File Type</TableHead>
                      <TableHead>File Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Access Limits</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.thumbnailUrl ? (
                              <img src={product.thumbnailUrl} alt={product.title} className="w-10 h-10 rounded object-cover shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                                <Package className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{product.title}</p>
                              <p className="text-xs text-muted-foreground">/{product.slug}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{fileTypeLabel(product.fileType)}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatFileSize(product.fileSize)}</TableCell>
                        <TableCell>
                          <Badge variant={product.isPublished ? "default" : "secondary"}>
                            {product.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="space-y-0.5">
                            <p>{product.defaultAccessDays ? `${product.defaultAccessDays}d access` : "Unlimited access"}</p>
                            <p>{product.defaultMaxDownloads ? `${product.defaultMaxDownloads} downloads max` : "Unlimited downloads"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" title={product.isPublished ? "Unpublish" : "Publish"}
                              onClick={() => updateProduct.mutate({ id: product.id, isPublished: !product.isPublished })}>
                              {product.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" title="Edit" onClick={() => navigate(`/admin/downloads/${product.id}`)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Delete"
                              className="text-destructive hover:text-destructive" onClick={() => setDeleteId(product.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              This will permanently delete the product and all associated orders and download logs. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteProduct.mutate({ id: deleteId })}
              disabled={deleteProduct.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Eye, EyeOff, Package, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

// Simple inline org selector using trpc
function OrgPicker({ value, onChange }: { value: number | null; onChange: (id: number | null) => void }) {
  const { data: orgs } = trpc.orgs.list.useQuery();
  return (
    <div className="space-y-1.5">
      <Label>Organization</Label>
      <select
        className="w-full max-w-sm border border-input rounded-md px-3 py-2 text-sm bg-background"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">Select an organization…</option>
        {orgs?.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </div>
  );
}

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
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [, navigate] = useLocation();

  const { data: products, refetch } = trpc.lms.downloads.listProducts.useQuery(
    { orgId: selectedOrgId! },
    { enabled: !!selectedOrgId }
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
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Digital Downloads</h1>
        <p className="text-muted-foreground">
          Sell digital files (PDFs, videos, documents) with custom sales pages, payment options, and access controls.
        </p>
      </div>

      <div className="mb-6">
        <OrgPicker value={selectedOrgId} onChange={setSelectedOrgId} />
      </div>

      {selectedOrgId && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {products?.length ?? 0} product{products?.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/admin/downloads/reports?orgId=${selectedOrgId}`)}>
                <BarChart2 className="w-4 h-4 mr-2" />
                Reports
              </Button>
              <Button onClick={() => navigate(`/admin/downloads/new?orgId=${selectedOrgId}`)}>
                <Plus className="w-4 h-4 mr-2" />
                New Product
              </Button>
            </div>
          </div>

          {!products || products.length === 0 ? (
            <div className="border border-dashed rounded-lg p-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
              <h3 className="font-semibold text-lg mb-1">No digital products yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Create your first digital product to start selling downloads.
              </p>
              <Button onClick={() => navigate(`/admin/downloads/new?orgId=${selectedOrgId}`)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Product
              </Button>
            </div>
          ) : (
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
                          <img
                            src={product.thumbnailUrl}
                            alt={product.title}
                            className="w-10 h-10 rounded object-cover shrink-0"
                          />
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
                    <TableCell>
                      <Badge variant="outline">{fileTypeLabel(product.fileType)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFileSize(product.fileSize)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.isPublished ? "default" : "secondary"}>
                        {product.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="space-y-0.5">
                        {product.defaultAccessDays ? (
                          <p>{product.defaultAccessDays}d access</p>
                        ) : (
                          <p>Unlimited access</p>
                        )}
                        {product.defaultMaxDownloads ? (
                          <p>{product.defaultMaxDownloads} downloads max</p>
                        ) : (
                          <p>Unlimited downloads</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={product.isPublished ? "Unpublish" : "Publish"}
                          onClick={() =>
                            updateProduct.mutate({ id: product.id, isPublished: !product.isPublished })
                          }
                        >
                          {product.isPublished ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit"
                          onClick={() => navigate(`/admin/downloads/${product.id}`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

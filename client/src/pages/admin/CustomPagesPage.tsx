import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function CustomPagesPage() {
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<number | null>(null);

  const { data: orgs } = trpc.orgs.list.useQuery();
  const { data: pages, refetch: refetchPages } = trpc.lms.pages.list.useQuery(
    { orgId: selectedOrgId! },
    { enabled: !!selectedOrgId }
  );

  const createPage = trpc.lms.pages.create.useMutation({
    onSuccess: () => {
      refetchPages();
      toast.success("Page created");
    },
  });

  const updatePage = trpc.lms.pages.update.useMutation({
    onSuccess: () => {
      refetchPages();
      setEditingPage(null);
      toast.success("Page updated");
    },
  });

  const deletePage = trpc.lms.pages.delete.useMutation({
    onSuccess: () => {
      refetchPages();
      setDeleteDialogOpen(false);
      setPageToDelete(null);
      toast.success("Page deleted");
    },
  });

  const handleCreatePage = () => {
    if (!selectedOrgId) {
      toast.error("Please select an organization first");
      return;
    }
    setEditingPage({
      id: null,
      orgId: selectedOrgId,
      title: "",
      slug: "",
      blocksJson: "[]",
      isPublished: false,
      showHeader: true,
      showFooter: true,
      metaTitle: "",
      metaDescription: "",
      customCss: "",
      pageType: "custom",
    });
  };

  const handleSavePage = async () => {
    if (!editingPage) return;

    if (editingPage.id) {
      await updatePage.mutateAsync({
        id: editingPage.id,
        title: editingPage.title,
        slug: editingPage.slug,
        blocksJson: editingPage.blocksJson,
        isPublished: editingPage.isPublished,
        showHeader: editingPage.showHeader,
        showFooter: editingPage.showFooter,
        metaTitle: editingPage.metaTitle,
        metaDescription: editingPage.metaDescription,
        customCss: editingPage.customCss,
      });
    } else {
      await createPage.mutateAsync({
        orgId: editingPage.orgId,
        pageType: "custom",
        title: editingPage.title,
        slug: editingPage.slug,
      });
    }
  };

  const handleDeletePage = async () => {
    if (!pageToDelete) return;
    await deletePage.mutateAsync({ id: pageToDelete });
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Custom Pages</h1>
        <p className="text-muted-foreground">
          Create custom web pages with rich content, control header/footer visibility, and manage SEO.
        </p>
      </div>

      <div className="mb-6">
        <Label htmlFor="org-select">Organization</Label>
        <select
          id="org-select"
          className="w-full max-w-md px-3 py-2 border rounded-md"
          value={selectedOrgId ?? ""}
          onChange={(e) => setSelectedOrgId(Number(e.target.value))}
        >
          <option value="">Select an organization</option>
          {orgs?.map((org: any) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      {selectedOrgId && (
        <>
          <div className="mb-4">
            <Button onClick={handleCreatePage}>
              <Plus className="w-4 h-4 mr-2" />
              Create Page
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Header/Footer</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages?.map((page: any) => (
                <TableRow key={page.id}>
                  <TableCell>{page.title || "(Untitled)"}</TableCell>
                  <TableCell className="font-mono text-sm">{page.slug || "—"}</TableCell>
                  <TableCell>
                    {page.isPublished ? (
                      <span className="text-green-600">Published</span>
                    ) : (
                      <span className="text-gray-500">Draft</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {page.showHeader ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      {page.showFooter ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPage(page)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPageToDelete(page.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {/* Edit Sheet */}
      <Sheet open={!!editingPage} onOpenChange={() => setEditingPage(null)}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingPage?.id ? "Edit Page" : "Create Page"}</SheetTitle>
            <SheetDescription>
              Build a custom page with rich content, control visibility, and manage SEO.
            </SheetDescription>
          </SheetHeader>

          {editingPage && (
            <div className="space-y-6 mt-6">
              <div>
                <Label htmlFor="page-title">Title</Label>
                <Input
                  id="page-title"
                  value={editingPage.title}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, title: e.target.value })
                  }
                  placeholder="About Us"
                />
              </div>

              <div>
                <Label htmlFor="page-slug">Slug (URL path)</Label>
                <Input
                  id="page-slug"
                  value={editingPage.slug}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, slug: e.target.value })
                  }
                  placeholder="about-us"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Example: /about-us
                </p>
              </div>

              <div>
                <Label htmlFor="page-content">Content</Label>
                <RichTextEditor
                  value={editingPage.blocksJson}
                  onChange={(html: string) =>
                    setEditingPage({ ...editingPage, blocksJson: html })
                  }
                  minHeight={300}
                  placeholder="Write your page content here..."
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-header"
                    checked={editingPage.showHeader}
                    onCheckedChange={(checked) =>
                      setEditingPage({ ...editingPage, showHeader: checked })
                    }
                  />
                  <Label htmlFor="show-header">Show Header</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="show-footer"
                    checked={editingPage.showFooter}
                    onCheckedChange={(checked) =>
                      setEditingPage({ ...editingPage, showFooter: checked })
                    }
                  />
                  <Label htmlFor="show-footer">Show Footer</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is-published"
                    checked={editingPage.isPublished}
                    onCheckedChange={(checked) =>
                      setEditingPage({ ...editingPage, isPublished: checked })
                    }
                  />
                  <Label htmlFor="is-published">Published</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="meta-title">SEO Title</Label>
                <Input
                  id="meta-title"
                  value={editingPage.metaTitle}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, metaTitle: e.target.value })
                  }
                  placeholder="About Us | Your Company"
                />
              </div>

              <div>
                <Label htmlFor="meta-description">SEO Description</Label>
                <Textarea
                  id="meta-description"
                  value={editingPage.metaDescription}
                  onChange={(e) =>
                    setEditingPage({
                      ...editingPage,
                      metaDescription: e.target.value,
                    })
                  }
                  placeholder="Learn more about our mission and values..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="custom-css">Custom CSS</Label>
                <Textarea
                  id="custom-css"
                  value={editingPage.customCss}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, customCss: e.target.value })
                  }
                  placeholder=".custom-class { color: blue; }"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSavePage} disabled={updatePage.isPending || createPage.isPending}>
                  {editingPage.id ? "Update Page" : "Create Page"}
                </Button>
                <Button variant="outline" onClick={() => setEditingPage(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this page? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePage} disabled={deletePage.isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

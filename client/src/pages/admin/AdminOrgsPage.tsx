import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminOrgsPage() {
  const { data: orgs, refetch } = trpc.orgs.list.useQuery();
  const createOrg = trpc.orgs.create.useMutation({ onSuccess: () => { toast.success("Organization created"); refetch(); setOpen(false); } });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Organizations</h1><p className="text-muted-foreground text-sm mt-0.5">{orgs?.length ?? 0} organizations</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />New Organization</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Organization</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")); }} placeholder="Acme Corp" /></div>
              <div className="space-y-1.5"><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme-corp" /></div>
              <Button onClick={() => createOrg.mutate({ name, slug })} disabled={!name || !slug || createOrg.isPending} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {(orgs ?? []).map((org) => (
          <Card key={org.id} className="shadow-sm border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{org.name}</p>
                  <p className="text-xs text-muted-foreground">/{org.slug}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />{(org as any).memberCount ?? 0} members
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!orgs || orgs.length === 0) && (
          <Card className="shadow-sm border-border/60"><CardContent className="py-12 text-center"><Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground">No organizations yet</p></CardContent></Card>
        )}
      </div>
    </div>
  );
}

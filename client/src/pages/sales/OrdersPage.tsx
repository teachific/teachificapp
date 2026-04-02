import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShoppingCart, Search, Download, Eye } from "lucide-react";

const ORDERS = [
  { id: "ORD-001", customer: "Alice Martin", email: "alice@example.com", product: "Echo Fundamentals", amount: 149, status: "completed", date: "2026-04-01" },
  { id: "ORD-002", customer: "Bob Kim", email: "bob@example.com", product: "POCUS Essentials", amount: 89, status: "completed", date: "2026-04-01" },
  { id: "ORD-003", customer: "Carol Torres", email: "carol@example.com", product: "Echo Mastery Bundle", amount: 149, status: "refunded", date: "2026-03-30" },
  { id: "ORD-004", customer: "David Lee", email: "david@example.com", product: "Advanced Echo", amount: 199, status: "pending", date: "2026-04-02" },
  { id: "ORD-005", customer: "Emma Wilson", email: "emma@example.com", product: "Pro Membership", amount: 79, status: "completed", date: "2026-04-02" },
];

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = ORDERS.filter((o) => {
    const ms = o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase()) || o.product.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === "all" || o.status === statusFilter;
    return ms && mf;
  });

  const statusBadge = (s: string) => {
    const m: Record<string, "default" | "destructive" | "secondary" | "outline"> = { completed: "default", refunded: "destructive", pending: "secondary" };
    return <Badge variant={m[s] || "outline"} className="text-xs capitalize">{s}</Badge>;
  };

  const revenue = ORDERS.filter((o) => o.status === "completed").reduce((s, o) => s + o.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Orders
          </h1>
          <p className="text-muted-foreground mt-0.5">View and manage all customer orders</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => toast.info("Export coming soon")}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: "Total Orders", v: ORDERS.length },
          { l: "Completed", v: ORDERS.filter((o) => o.status === "completed").length },
          { l: "Refunded", v: ORDERS.filter((o) => o.status === "refunded").length },
          { l: "Revenue", v: "$" + revenue.toLocaleString() },
        ].map((s) => (
          <Card key={s.l}><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{s.l}</p><p className="text-3xl font-bold">{s.v}</p></CardContent></Card>
        ))}
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by order ID, customer, or product..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead><TableHead>Customer</TableHead><TableHead>Product</TableHead>
              <TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No orders found</TableCell></TableRow>
            ) : filtered.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-xs">{o.id}</TableCell>
                <TableCell><div><p className="font-medium text-sm">{o.customer}</p><p className="text-xs text-muted-foreground">{o.email}</p></div></TableCell>
                <TableCell className="text-sm">{o.product}</TableCell>
                <TableCell className="font-medium">${o.amount}</TableCell>
                <TableCell>{statusBadge(o.status)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{o.date}</TableCell>
                <TableCell><Button variant="ghost" size="sm" onClick={() => toast.info("Order detail view coming soon")}><Eye className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

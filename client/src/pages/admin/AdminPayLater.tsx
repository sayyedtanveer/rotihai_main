import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import api from "@/lib/apiClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function AdminPayLater() {
  const { toast } = useToast();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/admin/pay-later"],
    queryFn: async () => {
      const res = await api.get("/api/admin/pay-later");
      return res.data;
    }
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/admin/pay-later/${id}/mark-paid`);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: "Transaction marked as paid" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pay-later"] });
    },
    onError: () => {
      toast({ title: "Failed to update transaction", variant: "destructive" });
    }
  });

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order Now, Pay Later tracking</CardTitle>
          <CardDescription>Manage pending user dues and mark them as paid.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>{format(new Date(t.createdAt), "dd MMM yyyy")}</TableCell>
                    <TableCell>{t.customerName || "N/A"}</TableCell>
                    <TableCell>{t.phone || "N/A"}</TableCell>
                    <TableCell className="font-mono text-xs">{t.orderId.substring(0, 8)}...</TableCell>
                    <TableCell className="font-bold">₹{t.amount}</TableCell>
                    <TableCell>{format(new Date(t.dueDate), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      {t.status === "PAID" ? (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">PAID</Badge>
                      ) : (
                        <Badge variant="destructive">{t.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {t.status !== "PAID" && (
                        <>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => {
                              const txt = `Hi ${t.customerName}, your ROTIHAI order payment of ₹${t.amount} is due on ${format(new Date(t.dueDate), "dd MMM yyyy")}. Please clear your dues.`;
                              window.open(`https://wa.me/91${t.phone}?text=${encodeURIComponent(txt)}`, '_blank');
                            }}
                          >
                            Send Reminder
                          </Button>
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => {
                              if(window.confirm("Are you sure you want to mark this as paid?")) {
                                markPaidMutation.mutate(t.id);
                              }
                            }}
                            disabled={markPaidMutation.isPending}
                          >
                            Mark Paid
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!transactions?.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

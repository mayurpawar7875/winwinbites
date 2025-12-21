import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface CustomerReceivable {
  customerId: string | null;
  customerName: string;
  totalInvoiced: number;
  totalReceived: number;
  outstanding: number;
  invoiceCount: number;
}

interface Invoice {
  id: string;
  invoice_no: string;
  invoice_date: string;
  grand_total: number;
  balance_due: number;
  payment_status: string;
}

export function ReceivablesTab() {
  const { user } = useAuth();
  const [receivables, setReceivables] = useState<CustomerReceivable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [onlyOutstanding, setOnlyOutstanding] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerReceivable | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  useEffect(() => {
    fetchReceivables();
  }, [user]);

  const fetchReceivables = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch all invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("customer_id, customer_name, grand_total");

      if (invoicesError) throw invoicesError;

      // Fetch all collections
      const { data: collections, error: collectionsError } = await supabase
        .from("collections")
        .select("customer_id, amount_received");

      if (collectionsError) throw collectionsError;

      // Aggregate by customer
      const customerMap = new Map<string, CustomerReceivable>();

      invoices?.forEach((inv) => {
        const key = inv.customer_id || inv.customer_name;
        const existing = customerMap.get(key) || {
          customerId: inv.customer_id,
          customerName: inv.customer_name,
          totalInvoiced: 0,
          totalReceived: 0,
          outstanding: 0,
          invoiceCount: 0,
        };
        existing.totalInvoiced += inv.grand_total;
        existing.invoiceCount += 1;
        customerMap.set(key, existing);
      });

      collections?.forEach((col) => {
        const key = col.customer_id || "";
        const existing = customerMap.get(key);
        if (existing) {
          existing.totalReceived += col.amount_received;
        }
      });

      // Calculate outstanding
      customerMap.forEach((cust) => {
        cust.outstanding = cust.totalInvoiced - cust.totalReceived;
      });

      const result = Array.from(customerMap.values()).sort((a, b) => b.outstanding - a.outstanding);
      setReceivables(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load receivables";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerInvoices = async (customer: CustomerReceivable) => {
    setSelectedCustomer(customer);
    setIsLoadingInvoices(true);

    try {
      let query = supabase
        .from("invoices")
        .select("id, invoice_no, invoice_date, grand_total, balance_due, payment_status")
        .order("invoice_date", { ascending: false });

      if (customer.customerId) {
        query = query.eq("customer_id", customer.customerId);
      } else {
        query = query.eq("customer_name", customer.customerName);
      }

      // Only show unpaid invoices
      query = query.neq("payment_status", "PAID");

      const { data, error } = await query;

      if (error) throw error;
      setCustomerInvoices(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load invoices";
      toast.error(message);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const filteredReceivables = onlyOutstanding
    ? receivables.filter((r) => r.outstanding > 0)
    : receivables;

  const totalOutstanding = filteredReceivables.reduce((sum, r) => sum + r.outstanding, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="p-4 bg-destructive/5 border-destructive/20">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Total Outstanding</p>
          <p className="text-3xl font-bold text-destructive">₹{totalOutstanding.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-1">
            From {filteredReceivables.length} customers
          </p>
        </div>
      </Card>

      {/* Filter */}
      <div className="flex items-center space-x-2">
        <Switch
          id="only-outstanding"
          checked={onlyOutstanding}
          onCheckedChange={setOnlyOutstanding}
        />
        <Label htmlFor="only-outstanding">Show only customers with outstanding</Label>
      </div>

      {/* Customer List */}
      {filteredReceivables.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {onlyOutstanding ? "No outstanding receivables!" : "No customers found"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReceivables.map((customer, idx) => (
            <Card
              key={customer.customerId || customer.customerName + idx}
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fetchCustomerInvoices(customer)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{customer.customerName}</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.invoiceCount} invoice{customer.invoiceCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className={`font-bold ${customer.outstanding > 0 ? "text-destructive" : "text-green-600"}`}>
                    ₹{customer.outstanding.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Invoiced</p>
                  <p className="font-medium">₹{customer.totalInvoiced.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Received</p>
                  <p className="font-medium text-green-600">₹{customer.totalReceived.toLocaleString()}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Customer Invoice Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedCustomer?.customerName} - Pending Invoices</DialogTitle>
          </DialogHeader>

          {isLoadingInvoices ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : customerInvoices.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No pending invoices</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <span className="font-mono text-sm">{inv.invoice_no}</span>
                      </TableCell>
                      <TableCell>{format(new Date(inv.invoice_date), "dd MMM yy")}</TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        ₹{inv.balance_due.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

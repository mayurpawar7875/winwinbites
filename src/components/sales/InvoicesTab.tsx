import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Eye, CreditCard, Printer } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { CreateInvoiceForm } from "./CreateInvoiceForm";
import { InvoiceDetail } from "./InvoiceDetail";
import { RecordPaymentForm } from "./RecordPaymentForm";

interface Invoice {
  id: string;
  invoice_no: string;
  invoice_date: string;
  customer_name: string;
  customer_phone: string | null;
  grand_total: number;
  amount_paid: number;
  balance_due: number;
  payment_status: "UNPAID" | "PARTIAL" | "PAID";
}

export function InvoicesTab() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const fetchInvoices = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("payment_status", statusFilter as "UNPAID" | "PARTIAL" | "PAID");
      }

      const { data, error } = await query;

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load invoices";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user, statusFilter]);

  const filteredInvoices = invoices.filter(inv =>
    inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoice_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Paid</Badge>;
      case "PARTIAL":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Partial</Badge>;
      default:
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Unpaid</Badge>;
    }
  };

  const handleInvoiceCreated = () => {
    setShowCreateDialog(false);
    fetchInvoices();
  };

  const handlePaymentRecorded = () => {
    setShowPaymentDialog(false);
    setSelectedInvoice(null);
    fetchInvoices();
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
        
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="UNPAID">Unpaid</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoice List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>
      ) : filteredInvoices.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No invoices found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Invoice
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-medium">{invoice.invoice_no}</span>
                    {getStatusBadge(invoice.payment_status)}
                  </div>
                  <p className="font-semibold text-foreground mt-1">{invoice.customer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(invoice.invoice_date), "dd MMM yyyy")}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-lg">₹{invoice.grand_total.toLocaleString()}</p>
                  {invoice.balance_due > 0 && (
                    <p className="text-sm text-destructive">
                      Due: ₹{invoice.balance_due.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setShowDetailDialog(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                {invoice.payment_status !== "PAID" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setShowPaymentDialog(true);
                    }}
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Record Payment
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <CreateInvoiceForm onSuccess={handleInvoiceCreated} onCancel={() => setShowCreateDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <InvoiceDetail
              invoiceId={selectedInvoice.id}
              onRecordPayment={() => {
                setShowDetailDialog(false);
                setShowPaymentDialog(true);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <RecordPaymentForm
              invoice={selectedInvoice}
              onSuccess={handlePaymentRecorded}
              onCancel={() => setShowPaymentDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

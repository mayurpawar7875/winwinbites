import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Collection {
  id: string;
  payment_date: string;
  invoice_id: string;
  customer_id: string | null;
  amount_received: number;
  mode_of_payment: string;
  reference_no: string | null;
  remarks: string | null;
  created_at: string;
  invoice?: {
    invoice_no: string;
    customer_name: string;
  };
}

interface UnpaidInvoice {
  id: string;
  invoice_no: string;
  customer_name: string;
  customer_id: string | null;
  grand_total: number;
  balance_due: number;
}

type PaymentMode = "CASH" | "UPI" | "ONLINE" | "BANK";

export function CollectionsTab() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Add payment form state
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [amountReceived, setAmountReceived] = useState(0);
  const [modeOfPayment, setModeOfPayment] = useState<PaymentMode>("CASH");
  const [referenceNo, setReferenceNo] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    fetchCollections();
  }, [user]);

  const fetchCollections = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("collections")
        .select(`
          *,
          invoice:invoices(invoice_no, customer_name)
        `)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load collections";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnpaidInvoices = async () => {
    setIsLoadingInvoices(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_no, customer_name, customer_id, grand_total, balance_due")
        .neq("payment_status", "PAID")
        .order("invoice_date", { ascending: false });

      if (error) throw error;
      setUnpaidInvoices(data || []);
    } catch (error: unknown) {
      console.error("Error fetching unpaid invoices:", error);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const openAddDialog = () => {
    setSelectedInvoiceId("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setAmountReceived(0);
    setModeOfPayment("CASH");
    setReferenceNo("");
    setRemarks("");
    setShowAddDialog(true);
    fetchUnpaidInvoices();
  };

  const handleInvoiceSelect = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    const invoice = unpaidInvoices.find((inv) => inv.id === invoiceId);
    if (invoice) {
      setAmountReceived(invoice.balance_due);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!selectedInvoiceId) {
      toast.error("Please select an invoice");
      return;
    }

    if (amountReceived <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    const selectedInvoice = unpaidInvoices.find((inv) => inv.id === selectedInvoiceId);
    if (selectedInvoice && amountReceived > selectedInvoice.balance_due) {
      toast.error(`Amount cannot exceed balance due (₹${selectedInvoice.balance_due.toLocaleString()})`);
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.from("collections").insert({
        payment_date: paymentDate,
        invoice_id: selectedInvoiceId,
        customer_id: selectedInvoice?.customer_id || null,
        amount_received: amountReceived,
        mode_of_payment: modeOfPayment,
        reference_no: referenceNo.trim() || null,
        remarks: remarks.trim() || null,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Payment recorded successfully");
      setShowAddDialog(false);
      fetchCollections();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to record payment";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const getPaymentModeBadge = (mode: string) => {
    const colors: Record<string, string> = {
      CASH: "bg-green-500/10 text-green-600 border-green-500/20",
      UPI: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      ONLINE: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      BANK: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    };
    return <Badge className={colors[mode] || ""}>{mode}</Badge>;
  };

  const filteredCollections = collections.filter((col) =>
    col.invoice?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    col.invoice?.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    col.reference_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCollected = filteredCollections.reduce((sum, col) => sum + col.amount_received, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={openAddDialog} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Payment
        </Button>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Summary */}
      <Card className="p-4 bg-green-500/5 border-green-500/20">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Total Collected</p>
          <p className="text-3xl font-bold text-green-600">₹{totalCollected.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredCollections.length} payment{filteredCollections.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Card>

      {/* Collections List */}
      {filteredCollections.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No collections found</p>
          <Button variant="outline" className="mt-4" onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Record Your First Payment
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCollections.map((collection) => (
            <Card key={collection.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm">{collection.invoice?.invoice_no}</span>
                    {getPaymentModeBadge(collection.mode_of_payment)}
                  </div>
                  <p className="font-semibold mt-1">{collection.invoice?.customer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(collection.payment_date), "dd MMM yyyy")}
                    {collection.reference_no && ` • Ref: ${collection.reference_no}`}
                  </p>
                  {collection.remarks && (
                    <p className="text-sm text-muted-foreground mt-1">{collection.remarks}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    +₹{collection.amount_received.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Payment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddPayment} className="space-y-4">
            <div>
              <Label>Select Invoice</Label>
              {isLoadingInvoices ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : unpaidInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No unpaid invoices found</p>
              ) : (
                <Select value={selectedInvoiceId} onValueChange={handleInvoiceSelect}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose an invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {unpaidInvoices.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.invoice_no} - {inv.customer_name} (Due: ₹{inv.balance_due.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedInvoiceId && (
              <>
                <div>
                  <Label>Payment Date</Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Amount Received (₹)</Label>
                  <Input
                    type="number"
                    value={amountReceived || ""}
                    onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                    min="0.01"
                    step="0.01"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Mode of Payment</Label>
                  <Select value={modeOfPayment} onValueChange={(v) => setModeOfPayment(v as PaymentMode)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="ONLINE">Online Transfer</SelectItem>
                      <SelectItem value="BANK">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Reference No. (optional)</Label>
                  <Input
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="Transaction ID, cheque no., etc."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Remarks (optional)</Label>
                  <Textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Any additional notes..."
                    className="mt-1"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || !selectedInvoiceId}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Record Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

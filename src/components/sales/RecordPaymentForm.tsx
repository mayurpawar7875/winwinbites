import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Invoice {
  id: string;
  invoice_no: string;
  customer_name: string;
  grand_total: number;
  balance_due: number;
}

interface Props {
  invoice: Invoice;
  onSuccess: () => void;
  onCancel: () => void;
}

type PaymentMode = "CASH" | "UPI" | "ONLINE" | "BANK";

export function RecordPaymentForm({ invoice, onSuccess, onCancel }: Props) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [amountReceived, setAmountReceived] = useState(invoice.balance_due);
  const [modeOfPayment, setModeOfPayment] = useState<PaymentMode>("CASH");
  const [referenceNo, setReferenceNo] = useState("");
  const [remarks, setRemarks] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (amountReceived <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    if (amountReceived > invoice.balance_due) {
      toast.error(`Amount cannot exceed balance due (₹${invoice.balance_due.toLocaleString()})`);
      return;
    }

    setIsSaving(true);

    try {
      // Get customer_id from the invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("customer_id")
        .eq("id", invoice.id)
        .single();

      if (invoiceError) throw invoiceError;

      const { error } = await supabase
        .from("collections")
        .insert({
          payment_date: paymentDate,
          invoice_id: invoice.id,
          customer_id: invoiceData.customer_id,
          amount_received: amountReceived,
          mode_of_payment: modeOfPayment,
          reference_no: referenceNo.trim() || null,
          remarks: remarks.trim() || null,
          created_by: user.id,
        });

      if (error) throw error;

      toast.success("Payment recorded successfully");
      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to record payment";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Invoice Info */}
      <Card className="p-4 bg-muted/50">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Invoice</p>
          <p className="font-mono font-medium">{invoice.invoice_no}</p>
          <p className="font-semibold">{invoice.customer_name}</p>
        </div>
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Amount</p>
            <p className="font-semibold">₹{invoice.grand_total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Balance Due</p>
            <p className="font-semibold text-destructive">₹{invoice.balance_due.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {/* Payment Details */}
      <div className="space-y-4">
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
            max={invoice.balance_due}
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
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Record Payment
        </Button>
      </div>
    </form>
  );
}

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, CreditCard, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import logo from "@/assets/win-win-bites-logo.jpg";

interface InvoiceItem {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  rate: number;
  line_total: number;
}

interface Collection {
  id: string;
  payment_date: string;
  amount_received: number;
  mode_of_payment: string;
  reference_no: string | null;
}

interface InvoiceData {
  id: string;
  invoice_no: string;
  invoice_date: string;
  customer_name: string;
  customer_phone: string | null;
  billing_address: string | null;
  ship_to_address: string | null;
  sub_total: number;
  discount: number;
  gst_percent: number;
  gst_amount: number;
  grand_total: number;
  amount_paid: number;
  balance_due: number;
  payment_status: string;
  notes: string | null;
}

// Company details for invoice
const COMPANY_INFO = {
  name: "Win Win Bites",
  address: "Your Company Address Here",
  phone: "+91 XXXXXXXXXX",
  email: "info@winwinbites.com",
  gstin: "XXXXXXXXXXXX",
  bankName: "Your Bank Name",
  accountNo: "XXXX XXXX XXXX XXXX",
  ifscCode: "XXXXXXXX",
  upiId: "winwinbites@upi"
};

interface Props {
  invoiceId: string;
  onRecordPayment: () => void;
}

export function InvoiceDetail({ invoiceId, onRecordPayment }: Props) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [invoiceId]);

  const fetchInvoiceDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (invoiceError) throw invoiceError;
      setInvoice(invoiceData);

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("created_at");

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Fetch collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from("collections")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("payment_date", { ascending: false });

      if (collectionsError) throw collectionsError;
      setCollections(collectionsData || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load invoice";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice?.invoice_no}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; font-size: 12px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .logo { max-width: 80px; height: auto; }
            .company-info { text-align: right; }
            .company-info h2 { margin: 0 0 5px 0; font-size: 18px; }
            .company-info p { margin: 2px 0; color: #666; }
            .invoice-title { text-align: center; font-size: 20px; font-weight: bold; margin: 15px 0; text-transform: uppercase; letter-spacing: 2px; }
            .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .invoice-meta div { font-size: 12px; }
            .address-section { display: flex; gap: 30px; margin-bottom: 20px; }
            .address-box { flex: 1; border: 1px solid #ddd; padding: 10px; border-radius: 4px; }
            .address-box h4 { margin: 0 0 8px 0; font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
            .address-box p { margin: 3px 0; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
            th { background: #f5f5f5; font-size: 11px; text-transform: uppercase; }
            .text-right { text-align: right; }
            .totals { margin-left: auto; width: 250px; margin-top: 15px; }
            .totals div { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
            .grand-total { font-size: 14px; font-weight: bold; background: #f5f5f5; padding: 8px !important; }
            .bank-details { margin-top: 25px; padding: 15px; background: #f9f9f9; border-radius: 4px; }
            .bank-details h4 { margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; }
            .bank-details p { margin: 3px 0; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
            .signature { text-align: center; }
            .signature-line { border-top: 1px solid #333; width: 150px; margin: 40px auto 5px; }
            .notes { margin-top: 15px; padding: 10px; background: #fffbe6; border-left: 3px solid #ffc107; }
            .thank-you { text-align: center; margin-top: 30px; color: #666; font-style: italic; }
            @media print { body { margin: 10px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <img src="${logo}" alt="Win Win Bites" class="logo" />
            </div>
            <div class="company-info">
              <h2>${COMPANY_INFO.name}</h2>
              <p>${COMPANY_INFO.address}</p>
              <p>Phone: ${COMPANY_INFO.phone}</p>
              <p>Email: ${COMPANY_INFO.email}</p>
              <p>GSTIN: ${COMPANY_INFO.gstin}</p>
            </div>
          </div>
          
          <div class="invoice-title">Tax Invoice</div>
          
          <div class="invoice-meta">
            <div>
              <p><strong>Invoice No:</strong> ${invoice?.invoice_no}</p>
              <p><strong>Date:</strong> ${invoice ? format(new Date(invoice.invoice_date), "dd MMM yyyy") : ""}</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Status:</strong> ${invoice?.payment_status}</p>
            </div>
          </div>
          
          <div class="address-section">
            <div class="address-box">
              <h4>Bill To</h4>
              <p><strong>${invoice?.customer_name}</strong></p>
              ${invoice?.customer_phone ? `<p>Phone: ${invoice.customer_phone}</p>` : ""}
              ${invoice?.billing_address ? `<p>${invoice.billing_address}</p>` : ""}
            </div>
            <div class="address-box">
              <h4>Ship To</h4>
              ${invoice?.ship_to_address ? `<p>${invoice.ship_to_address}</p>` : `<p><strong>${invoice?.customer_name}</strong></p>${invoice?.billing_address ? `<p>${invoice.billing_address}</p>` : ""}`}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Product / Service</th>
                <th class="text-right" style="width: 60px;">Qty</th>
                <th style="width: 50px;">Unit</th>
                <th class="text-right" style="width: 80px;">Rate (₹)</th>
                <th class="text-right" style="width: 90px;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${item.product_name}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td>${item.unit}</td>
                  <td class="text-right">${item.rate.toFixed(2)}</td>
                  <td class="text-right">${item.line_total.toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="totals">
            <div><span>Sub Total:</span><span>₹${invoice?.sub_total.toFixed(2)}</span></div>
            ${invoice?.discount ? `<div><span>Discount:</span><span>- ₹${invoice.discount.toFixed(2)}</span></div>` : ""}
            ${invoice?.gst_amount ? `<div><span>GST (${invoice.gst_percent}%):</span><span>+ ₹${invoice.gst_amount.toFixed(2)}</span></div>` : ""}
            <div class="grand-total"><span>Grand Total:</span><span>₹${invoice?.grand_total.toFixed(2)}</span></div>
            <div><span>Amount Paid:</span><span>₹${invoice?.amount_paid.toFixed(2)}</span></div>
            <div><span><strong>Balance Due:</strong></span><span><strong>₹${invoice?.balance_due.toFixed(2)}</strong></span></div>
          </div>

          ${invoice?.notes ? `<div class="notes"><strong>Notes:</strong> ${invoice.notes}</div>` : ""}

          <div class="bank-details">
            <h4>Bank Details for Payment</h4>
            <p><strong>Bank Name:</strong> ${COMPANY_INFO.bankName}</p>
            <p><strong>Account No:</strong> ${COMPANY_INFO.accountNo}</p>
            <p><strong>IFSC Code:</strong> ${COMPANY_INFO.ifscCode}</p>
            <p><strong>UPI ID:</strong> ${COMPANY_INFO.upiId}</p>
          </div>

          <div class="footer">
            <div>
              <p style="color: #666; font-size: 11px;">Terms & Conditions:</p>
              <p style="color: #888; font-size: 10px;">1. Payment due within 15 days of invoice date.</p>
              <p style="color: #888; font-size: 10px;">2. Goods once sold will not be taken back.</p>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <p><strong>Authorised Signatory</strong></p>
              <p style="color: #666; font-size: 10px;">For ${COMPANY_INFO.name}</p>
            </div>
          </div>

          <p class="thank-you">Thank you for your business!</p>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoice) {
    return <div className="text-center py-8 text-muted-foreground">Invoice not found</div>;
  }

  return (
    <div className="space-y-6" ref={printRef}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{invoice.invoice_no}</h2>
            {getStatusBadge(invoice.payment_status)}
          </div>
          <p className="text-muted-foreground">
            {format(new Date(invoice.invoice_date), "dd MMMM yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {invoice.payment_status !== "PAID" && (
            <Button size="sm" onClick={onRecordPayment}>
              <CreditCard className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          )}
        </div>
      </div>

      {/* Bill To & Ship To */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">BILL TO</h3>
          <p className="font-semibold text-lg">{invoice.customer_name}</p>
          {invoice.customer_phone && <p className="text-muted-foreground">{invoice.customer_phone}</p>}
          {invoice.billing_address && <p className="text-muted-foreground">{invoice.billing_address}</p>}
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">SHIP TO</h3>
          {invoice.ship_to_address ? (
            <p className="text-muted-foreground">{invoice.ship_to_address}</p>
          ) : (
            <>
              <p className="font-semibold text-lg">{invoice.customer_name}</p>
              {invoice.billing_address && <p className="text-muted-foreground">{invoice.billing_address}</p>}
            </>
          )}
        </Card>
      </div>

      {/* Items */}
      <div>
        <h3 className="font-semibold mb-3">Items</h3>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                  <TableCell className="text-right">₹{item.rate.toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{item.line_total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Totals */}
      <Card className="p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Sub Total:</span>
            <span>₹{invoice.sub_total.toFixed(2)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Discount:</span>
              <span>- ₹{invoice.discount.toFixed(2)}</span>
            </div>
          )}
          {invoice.gst_amount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>GST ({invoice.gst_percent}%):</span>
              <span>+ ₹{invoice.gst_amount.toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Grand Total:</span>
            <span>₹{invoice.grand_total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Amount Paid:</span>
            <span>₹{invoice.amount_paid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-destructive">
            <span>Balance Due:</span>
            <span>₹{invoice.balance_due.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Bank Details */}
      <Card className="p-4 bg-muted/30">
        <h3 className="font-semibold text-sm text-muted-foreground mb-3">BANK DETAILS FOR PAYMENT</h3>
        <div className="grid gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bank Name:</span>
            <span className="font-medium">{COMPANY_INFO.bankName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account No:</span>
            <span className="font-medium">{COMPANY_INFO.accountNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">IFSC Code:</span>
            <span className="font-medium">{COMPANY_INFO.ifscCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">UPI ID:</span>
            <span className="font-medium">{COMPANY_INFO.upiId}</span>
          </div>
        </div>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <div>
          <h3 className="font-semibold mb-2">Notes</h3>
          <p className="text-muted-foreground">{invoice.notes}</p>
        </div>
      )}

      {/* Payments */}
      {collections.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Payment History</h3>
          <div className="space-y-2">
            {collections.map((collection) => (
              <Card key={collection.id} className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">₹{collection.amount_received.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(collection.payment_date), "dd MMM yyyy")} • {collection.mode_of_payment}
                    {collection.reference_no && ` • Ref: ${collection.reference_no}`}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

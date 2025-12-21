import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
}

interface InvoiceItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  rate: number;
  lineTotal: number;
}

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateInvoiceForm({ onSuccess, onCancel }: Props) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [billToAddress, setBillToAddress] = useState("");
  const [shipToAddress, setShipToAddress] = useState("");
  const [discount, setDiscount] = useState(0);
  const [gstPercent, setGstPercent] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), productName: "", quantity: 1, unit: "pcs", rate: 0, lineTotal: 0 }
  ]);

  // Calculations
  const subTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const gstAmount = ((subTotal - discount) * gstPercent) / 100;
  const grandTotal = subTotal - discount + gstAmount;

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const fetchCustomers = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };
      if (field === "quantity" || field === "rate") {
        updated.lineTotal = updated.quantity * updated.rate;
      }
      return updated;
    }));
  };

  const addItem = () => {
    setItems(prev => [
      ...prev,
      { id: crypto.randomUUID(), productName: "", quantity: 1, unit: "pcs", rate: 0, lineTotal: 0 }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    const validItems = items.filter(item => item.productName.trim() && item.quantity > 0 && item.rate > 0);
    if (validItems.length === 0) {
      toast.error("Add at least one valid item");
      return;
    }

    if (!isNewCustomer && !selectedCustomerId) {
      toast.error("Select or create a customer");
      return;
    }

    if (isNewCustomer && !newCustomerName.trim()) {
      toast.error("Enter customer name");
      return;
    }

    setIsSaving(true);

    try {
      let customerId = selectedCustomerId;
      let customerName = "";
      let customerPhone = "";
      let customerAddress = "";

      // Create new customer if needed
      if (isNewCustomer) {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            name: newCustomerName.trim(),
            phone: newCustomerPhone.trim() || null,
            address: newCustomerAddress.trim() || null,
            created_by: user.id,
          })
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
        customerName = newCustomer.name;
        customerPhone = newCustomer.phone || "";
        customerAddress = newCustomer.address || "";
      } else {
        const customer = customers.find(c => c.id === selectedCustomerId);
        if (customer) {
          customerName = customer.name;
          customerPhone = customer.phone || "";
          customerAddress = billToAddress || customer.address || "";
        }
      }

      // Generate invoice number
      const { data: invoiceNoData, error: invoiceNoError } = await supabase
        .rpc("generate_invoice_number", { user_id: user.id });

      if (invoiceNoError) throw invoiceNoError;
      const invoiceNo = invoiceNoData;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          invoice_no: invoiceNo,
          invoice_date: invoiceDate,
          customer_id: customerId,
          customer_name: customerName,
          customer_phone: customerPhone || null,
          billing_address: billToAddress.trim() || customerAddress || null,
          ship_to_address: shipToAddress.trim() || null,
          sub_total: subTotal,
          discount,
          gst_percent: gstPercent,
          gst_amount: gstAmount,
          grand_total: grandTotal,
          balance_due: grandTotal,
          notes: notes.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const invoiceItems = validItems.map(item => ({
        invoice_id: invoice.id,
        product_name: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        line_total: item.lineTotal,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      toast.success(`Invoice ${invoiceNo} created successfully`);
      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create invoice";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Label className="text-base font-semibold">Customer</Label>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setIsNewCustomer(!isNewCustomer)}
          >
            {isNewCustomer ? "Select Existing" : "Create New"}
          </Button>
        </div>

        {isNewCustomer ? (
          <div className="grid gap-3">
            <Input
              placeholder="Customer Name *"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Phone (optional)"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
              />
              <Input
                placeholder="Address (optional)"
                value={newCustomerAddress}
                onChange={(e) => setNewCustomerAddress(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} {customer.phone && `(${customer.phone})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Invoice Date */}
      <div>
        <Label>Invoice Date</Label>
        <Input
          type="date"
          value={invoiceDate}
          onChange={(e) => setInvoiceDate(e.target.value)}
          className="mt-1"
        />
      </div>

      {/* Bill To & Ship To Addresses */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Bill To Address</Label>
          <Textarea
            placeholder="Billing address..."
            value={billToAddress}
            onChange={(e) => setBillToAddress(e.target.value)}
            className="mt-1"
            rows={3}
          />
        </div>
        <div>
          <Label>Ship To Address</Label>
          <Textarea
            placeholder="Shipping address (if different)..."
            value={shipToAddress}
            onChange={(e) => setShipToAddress(e.target.value)}
            className="mt-1"
            rows={3}
          />
        </div>
      </div>

      <Separator />

      {/* Invoice Items */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Items</Label>
        
        {items.map((item, index) => (
          <Card key={item.id} className="p-3">
            <div className="grid gap-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Product Name"
                  value={item.productName}
                  onChange={(e) => updateItem(item.id, "productName", e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity || ""}
                  onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
                <Select value={item.unit} onValueChange={(v) => updateItem(item.id, "unit", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">pcs</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="l">l</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="box">box</SelectItem>
                    <SelectItem value="pack">pack</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Rate"
                  value={item.rate || ""}
                  onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
                <div className="flex items-center justify-end font-medium">
                  ₹{item.lineTotal.toFixed(2)}
                </div>
              </div>
            </div>
          </Card>
        ))}

        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <Separator />

      {/* Discount & GST */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Discount (₹)</Label>
          <Input
            type="number"
            value={discount || ""}
            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            className="mt-1"
          />
        </div>
        <div>
          <Label>GST (%)</Label>
          <Input
            type="number"
            value={gstPercent || ""}
            onChange={(e) => setGstPercent(parseFloat(e.target.value) || 0)}
            min="0"
            max="100"
            step="0.01"
            className="mt-1"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label>Notes (optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes..."
          className="mt-1"
        />
      </div>

      {/* Summary */}
      <Card className="p-4 bg-muted/50">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Sub Total:</span>
            <span>₹{subTotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Discount:</span>
              <span>- ₹{discount.toFixed(2)}</span>
            </div>
          )}
          {gstPercent > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>GST ({gstPercent}%):</span>
              <span>+ ₹{gstAmount.toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Grand Total:</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create Invoice
        </Button>
      </div>
    </form>
  );
}

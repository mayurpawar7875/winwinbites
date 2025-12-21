import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, ShoppingCart, X } from "lucide-react";
import logo from "@/assets/win-win-bites-logo.jpg";

type PaymentStatus = "PAID" | "CREDIT";

export default function Purchases() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    vendor_name: "",
    item_name: "",
    quantity: "",
    unit: "kg",
    rate: "",
    payment_status: "PAID" as PaymentStatus,
  });

  const today = new Date().toISOString().split("T")[0];

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["purchases", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .eq("date", today)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const addPurchaseMutation = useMutation({
    mutationFn: async (purchase: {
      vendor_name: string;
      item_name: string;
      quantity: number;
      unit: string;
      rate: number;
      payment_status: PaymentStatus;
    }) => {
      const totalAmount = purchase.quantity * purchase.rate;
      const { error } = await supabase.from("purchases").insert({
        user_id: user!.id,
        date: today,
        vendor_name: purchase.vendor_name,
        item_name: purchase.item_name,
        quantity: purchase.quantity,
        unit: purchase.unit,
        rate: purchase.rate,
        total_amount: totalAmount,
        payment_status: purchase.payment_status,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast.success("Purchase added successfully");
      setShowForm(false);
      setFormData({
        vendor_name: "",
        item_name: "",
        quantity: "",
        unit: "kg",
        rate: "",
        payment_status: "PAID",
      });
    },
    onError: (error) => {
      toast.error("Failed to add purchase: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor_name || !formData.item_name || !formData.quantity || !formData.rate) {
      toast.error("Please fill all required fields");
      return;
    }
    addPurchaseMutation.mutate({
      vendor_name: formData.vendor_name,
      item_name: formData.item_name,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      rate: parseFloat(formData.rate),
      payment_status: formData.payment_status,
    });
  };

  const totalAmount = purchases.reduce((sum, p) => sum + p.total_amount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container flex items-center h-12 sm:h-16 px-3 sm:px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/plant-manager/dashboard")}
            className="mr-2 h-8 w-8 sm:h-10 sm:w-10"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <img src={logo} alt="Win Win Bites" className="h-7 sm:h-9 w-auto mr-2 sm:mr-3" />
          <div>
            <h1 className="font-bold text-sm sm:text-lg text-foreground">Purchases</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Vendor Orders</p>
          </div>
        </div>
      </header>

      <main className="container px-3 sm:px-4 py-4 sm:py-6">
        {/* Summary */}
        <Card className="p-3 sm:p-4 mb-4 bg-primary/5">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-muted-foreground">Today's Purchases</span>
            <span className="font-bold text-base sm:text-lg text-foreground">
              ₹{totalAmount.toLocaleString()}
            </span>
          </div>
        </Card>

        {/* Add Button */}
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="w-full mb-4 h-10 sm:h-12 text-sm sm:text-base"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Add Purchase
          </Button>
        )}

        {/* Add Form */}
        {showForm && (
          <Card className="p-3 sm:p-4 mb-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="font-semibold text-sm sm:text-base">New Purchase</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowForm(false)}
                className="h-7 w-7 sm:h-8 sm:w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Vendor Name *</Label>
                <Input
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                  placeholder="Enter vendor name"
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Item Name *</Label>
                <Input
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  placeholder="Enter item name"
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Quantity *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="0"
                    className="h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="pcs">pcs</SelectItem>
                      <SelectItem value="ltr">ltr</SelectItem>
                      <SelectItem value="box">box</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Rate (₹) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    placeholder="0"
                    className="h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Payment</Label>
                  <Select
                    value={formData.payment_status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, payment_status: value as PaymentStatus })
                    }
                  >
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="CREDIT">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.quantity && formData.rate && (
                <div className="p-2 bg-muted rounded text-xs sm:text-sm">
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-semibold">
                    ₹{(parseFloat(formData.quantity) * parseFloat(formData.rate)).toLocaleString()}
                  </span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-9 sm:h-10 text-xs sm:text-sm"
                disabled={addPurchaseMutation.isPending}
              >
                {addPurchaseMutation.isPending ? "Adding..." : "Add Purchase"}
              </Button>
            </form>
          </Card>
        )}

        {/* Purchases List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm sm:text-base text-foreground">
            Today's Entries ({purchases.length})
          </h3>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
          ) : purchases.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center">
              <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm sm:text-base text-muted-foreground">No purchases recorded today</p>
            </Card>
          ) : (
            purchases.map((purchase) => (
              <Card key={purchase.id} className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-xs sm:text-sm text-foreground">
                      {purchase.item_name}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      from {purchase.vendor_name}
                    </p>
                  </div>
                  <Badge
                    variant={purchase.payment_status === "PAID" ? "secondary" : "destructive"}
                    className="text-[10px] sm:text-xs"
                  >
                    {purchase.payment_status}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">
                    {purchase.quantity} {purchase.unit} × ₹{purchase.rate}
                  </span>
                  <span className="font-semibold text-foreground">
                    ₹{purchase.total_amount.toLocaleString()}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

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
import { ArrowLeft, Plus, CreditCard, X } from "lucide-react";
import logo from "@/assets/win-win-bites-logo.jpg";

type PartyType = "VENDOR" | "CUSTOMER";

export default function Outstanding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    party_name: "",
    party_type: "CUSTOMER" as PartyType,
    opening_outstanding: "",
    new_credit_amount: "",
    amount_settled: "",
  });

  const today = new Date().toISOString().split("T")[0];

  const { data: outstandings = [], isLoading } = useQuery({
    queryKey: ["outstanding", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outstanding")
        .select("*")
        .eq("date", today)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const addOutstandingMutation = useMutation({
    mutationFn: async (outstanding: {
      party_name: string;
      party_type: PartyType;
      opening_outstanding: number;
      new_credit_amount: number;
      amount_settled: number;
    }) => {
      const closing = outstanding.opening_outstanding + outstanding.new_credit_amount - outstanding.amount_settled;
      const { error } = await supabase.from("outstanding").insert({
        user_id: user!.id,
        date: today,
        party_name: outstanding.party_name,
        party_type: outstanding.party_type,
        opening_outstanding: outstanding.opening_outstanding,
        new_credit_amount: outstanding.new_credit_amount,
        amount_settled: outstanding.amount_settled,
        closing_outstanding: closing,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outstanding"] });
      toast.success("Outstanding entry added successfully");
      setShowForm(false);
      setFormData({
        party_name: "",
        party_type: "CUSTOMER",
        opening_outstanding: "",
        new_credit_amount: "",
        amount_settled: "",
      });
    },
    onError: (error) => {
      toast.error("Failed to add entry: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.party_name) {
      toast.error("Please enter party name");
      return;
    }
    addOutstandingMutation.mutate({
      party_name: formData.party_name,
      party_type: formData.party_type,
      opening_outstanding: parseFloat(formData.opening_outstanding) || 0,
      new_credit_amount: parseFloat(formData.new_credit_amount) || 0,
      amount_settled: parseFloat(formData.amount_settled) || 0,
    });
  };

  const totalClosing = outstandings.reduce((sum, o) => sum + o.closing_outstanding, 0);

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
            <h1 className="font-bold text-sm sm:text-lg text-foreground">Outstanding</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Pending Payments</p>
          </div>
        </div>
      </header>

      <main className="container px-3 sm:px-4 py-4 sm:py-6">
        {/* Summary */}
        <Card className="p-3 sm:p-4 mb-4 bg-amber-500/5">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-muted-foreground">Total Outstanding</span>
            <span className="font-bold text-base sm:text-lg text-amber-600">
              ₹{totalClosing.toLocaleString()}
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
            Add Outstanding Entry
          </Button>
        )}

        {/* Add Form */}
        {showForm && (
          <Card className="p-3 sm:p-4 mb-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="font-semibold text-sm sm:text-base">New Entry</h2>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Party Name *</Label>
                  <Input
                    value={formData.party_name}
                    onChange={(e) => setFormData({ ...formData, party_name: e.target.value })}
                    placeholder="Enter name"
                    className="h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Party Type</Label>
                  <Select
                    value={formData.party_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, party_type: value as PartyType })
                    }
                  >
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">Customer</SelectItem>
                      <SelectItem value="VENDOR">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Opening Outstanding (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.opening_outstanding}
                  onChange={(e) => setFormData({ ...formData, opening_outstanding: e.target.value })}
                  placeholder="0"
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">New Credit (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.new_credit_amount}
                    onChange={(e) => setFormData({ ...formData, new_credit_amount: e.target.value })}
                    placeholder="0"
                    className="h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Amount Settled (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount_settled}
                    onChange={(e) => setFormData({ ...formData, amount_settled: e.target.value })}
                    placeholder="0"
                    className="h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {(formData.opening_outstanding || formData.new_credit_amount || formData.amount_settled) && (
                <div className="p-2 bg-muted rounded text-xs sm:text-sm">
                  <span className="text-muted-foreground">Closing: </span>
                  <span className="font-semibold">
                    ₹{(
                      (parseFloat(formData.opening_outstanding) || 0) +
                      (parseFloat(formData.new_credit_amount) || 0) -
                      (parseFloat(formData.amount_settled) || 0)
                    ).toLocaleString()}
                  </span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-9 sm:h-10 text-xs sm:text-sm"
                disabled={addOutstandingMutation.isPending}
              >
                {addOutstandingMutation.isPending ? "Adding..." : "Add Entry"}
              </Button>
            </form>
          </Card>
        )}

        {/* Outstanding List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm sm:text-base text-foreground">
            Today's Entries ({outstandings.length})
          </h3>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
          ) : outstandings.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center">
              <CreditCard className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm sm:text-base text-muted-foreground">No outstanding entries today</p>
            </Card>
          ) : (
            outstandings.map((outstanding) => (
              <Card key={outstanding.id} className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-xs sm:text-sm text-foreground">
                      {outstanding.party_name}
                    </p>
                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                      {outstanding.party_type}
                    </Badge>
                  </div>
                  <span className="font-bold text-sm sm:text-base text-amber-600">
                    ₹{outstanding.closing_outstanding.toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] sm:text-xs text-muted-foreground">
                  <div>
                    <span className="block">Opening</span>
                    <span className="font-medium text-foreground">
                      ₹{outstanding.opening_outstanding.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="block">+ Credit</span>
                    <span className="font-medium text-foreground">
                      ₹{outstanding.new_credit_amount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="block">- Settled</span>
                    <span className="font-medium text-foreground">
                      ₹{outstanding.amount_settled.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

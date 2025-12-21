import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Wallet, X } from "lucide-react";
import logo from "@/assets/win-win-bites-logo.jpg";

type PaymentMode = "CASH" | "ONLINE";

const expenseHeads = [
  "Raw Materials",
  "Labour Wages",
  "Transport",
  "Utilities",
  "Repairs & Maintenance",
  "Office Supplies",
  "Miscellaneous",
];

export default function Expenses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    expense_head: "",
    description: "",
    amount: "",
    paid_to: "",
    mode_of_payment: "CASH" as PaymentMode,
  });

  const today = new Date().toISOString().split("T")[0];

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("date", today)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (expense: {
      expense_head: string;
      description: string;
      amount: number;
      paid_to: string;
      mode_of_payment: PaymentMode;
    }) => {
      const { error } = await supabase.from("expenses").insert({
        user_id: user!.id,
        date: today,
        expense_head: expense.expense_head,
        description: expense.description,
        amount: expense.amount,
        paid_to: expense.paid_to || null,
        mode_of_payment: expense.mode_of_payment,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense added successfully");
      setShowForm(false);
      setFormData({
        expense_head: "",
        description: "",
        amount: "",
        paid_to: "",
        mode_of_payment: "CASH",
      });
    },
    onError: (error) => {
      toast.error("Failed to add expense: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expense_head || !formData.description || !formData.amount) {
      toast.error("Please fill all required fields");
      return;
    }
    addExpenseMutation.mutate({
      expense_head: formData.expense_head,
      description: formData.description,
      amount: parseFloat(formData.amount),
      paid_to: formData.paid_to,
      mode_of_payment: formData.mode_of_payment,
    });
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

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
            <h1 className="font-bold text-sm sm:text-lg text-foreground">Expenses</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Daily Expenses</p>
          </div>
        </div>
      </header>

      <main className="container px-3 sm:px-4 py-4 sm:py-6">
        {/* Summary */}
        <Card className="p-3 sm:p-4 mb-4 bg-destructive/5">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-muted-foreground">Today's Expenses</span>
            <span className="font-bold text-base sm:text-lg text-destructive">
              ₹{totalExpenses.toLocaleString()}
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
            Add Expense
          </Button>
        )}

        {/* Add Form */}
        {showForm && (
          <Card className="p-3 sm:p-4 mb-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="font-semibold text-sm sm:text-base">New Expense</h2>
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
                <Label className="text-xs sm:text-sm">Expense Head *</Label>
                <Select
                  value={formData.expense_head}
                  onValueChange={(value) => setFormData({ ...formData, expense_head: value })}
                >
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseHeads.map((head) => (
                      <SelectItem key={head} value={head} className="text-xs sm:text-sm">
                        {head}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the expense..."
                  rows={2}
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Amount (₹) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0"
                    className="h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Payment Mode</Label>
                  <Select
                    value={formData.mode_of_payment}
                    onValueChange={(value) =>
                      setFormData({ ...formData, mode_of_payment: value as PaymentMode })
                    }
                  >
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="ONLINE">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Paid To (Optional)</Label>
                <Input
                  value={formData.paid_to}
                  onChange={(e) => setFormData({ ...formData, paid_to: e.target.value })}
                  placeholder="Recipient name"
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-9 sm:h-10 text-xs sm:text-sm"
                disabled={addExpenseMutation.isPending}
              >
                {addExpenseMutation.isPending ? "Adding..." : "Add Expense"}
              </Button>
            </form>
          </Card>
        )}

        {/* Expenses List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm sm:text-base text-foreground">
            Today's Entries ({expenses.length})
          </h3>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
          ) : expenses.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center">
              <Wallet className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm sm:text-base text-muted-foreground">No expenses recorded today</p>
            </Card>
          ) : (
            expenses.map((expense) => (
              <Card key={expense.id} className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <Badge variant="outline" className="text-[10px] sm:text-xs mb-1">
                      {expense.expense_head}
                    </Badge>
                    <p className="text-xs sm:text-sm text-foreground">{expense.description}</p>
                  </div>
                  <span className="font-bold text-sm sm:text-base text-destructive">
                    ₹{expense.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                  <span>{expense.paid_to ? `Paid to: ${expense.paid_to}` : ""}</span>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    {expense.mode_of_payment}
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

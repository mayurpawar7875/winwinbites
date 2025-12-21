import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft,
  Factory,
  Plus,
  Loader2,
  Trash2,
  Calendar,
} from "lucide-react";

interface ProductionEntry {
  id: string;
  date: string;
  product_name: string;
  labour_name: string;
  quantity: number;
  unit: string;
  shift: string | null;
  remarks: string | null;
  created_at: string;
}

export default function Production() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [productName, setProductName] = useState("");
  const [labourName, setLabourName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [shift, setShift] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    fetchEntries();
  }, [selectedDate]);

  const fetchEntries = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("production")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", selectedDate)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching production:", error);
      toast.error("Failed to load entries");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName || !labourName || !quantity) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("production").insert({
        user_id: user!.id,
        date: selectedDate,
        product_name: productName,
        labour_name: labourName,
        quantity: parseFloat(quantity),
        unit,
        shift: shift || null,
        remarks: remarks || null,
      });

      if (error) throw error;

      toast.success("Production entry added");
      resetForm();
      fetchEntries();
    } catch (error: any) {
      console.error("Error adding production:", error);
      toast.error(error.message || "Failed to add entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("production")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Entry deleted");
      fetchEntries();
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast.error(error.message || "Failed to delete");
    }
  };

  const resetForm = () => {
    setProductName("");
    setLabourName("");
    setQuantity("");
    setUnit("kg");
    setShift("");
    setRemarks("");
  };

  // Calculate totals by product
  const totalsByProduct = entries.reduce((acc, entry) => {
    const key = `${entry.product_name} (${entry.unit})`;
    acc[key] = (acc[key] || 0) + entry.quantity;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container flex items-center h-12 sm:h-14 px-3 sm:px-4 gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => navigate("/plant-manager/dashboard")}>
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-sm sm:text-base text-foreground">Production</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Daily output logs</p>
          </div>
        </div>
      </header>

      <main className="container px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Date Picker */}
        <Card className="border-0 shadow-md">
          <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 h-8 sm:h-10 text-xs sm:text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Entry Form */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Add Production Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="productName" className="text-xs sm:text-sm">Product Name *</Label>
                  <Input
                    id="productName"
                    placeholder="e.g. Cement"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                    className="h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="labourName" className="text-xs sm:text-sm">Labour Name *</Label>
                  <Input
                    id="labourName"
                    placeholder="e.g. John Doe"
                    value={labourName}
                    onChange={(e) => setLabourName(e.target.value)}
                    required
                    className="h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="quantity" className="text-xs sm:text-sm">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="any"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    className="h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="unit" className="text-xs sm:text-sm">Unit</Label>
                  <Input
                    id="unit"
                    placeholder="kg"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="shift" className="text-xs sm:text-sm">Shift</Label>
                  <Input
                    id="shift"
                    placeholder="Morning"
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="remarks" className="text-xs sm:text-sm">Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Any notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  className="text-xs sm:text-sm min-h-[60px] sm:min-h-[80px]"
                />
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary border-0 h-8 sm:h-10 text-xs sm:text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Entry"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Totals */}
        {Object.keys(totalsByProduct).length > 0 && (
          <Card className="border-0 shadow-md bg-primary/5">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm text-primary">Today's Totals</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {Object.entries(totalsByProduct).map(([product, total]) => (
                  <div
                    key={product}
                    className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-card shadow-sm"
                  >
                    <span className="font-semibold text-xs sm:text-sm">{total.toFixed(2)}</span>
                    <span className="text-muted-foreground ml-1 text-xs sm:text-sm">{product}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entries List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
              <Factory className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              Entries for {format(new Date(selectedDate), "MMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {isLoading ? (
              <div className="flex justify-center py-6 sm:py-8">
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
              </div>
            ) : entries.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 sm:py-8 text-xs sm:text-sm">
                No entries for this date
              </p>
            ) : (
              <div className="overflow-x-auto -mx-3 sm:-mx-4 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] sm:text-xs px-2 sm:px-4">Product</TableHead>
                      <TableHead className="text-[10px] sm:text-xs px-1 sm:px-4">Labour</TableHead>
                      <TableHead className="text-right text-[10px] sm:text-xs px-1 sm:px-4">Qty</TableHead>
                      <TableHead className="text-[10px] sm:text-xs px-1 sm:px-4">Shift</TableHead>
                      <TableHead className="w-8 sm:w-10 px-1"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-4">
                          {entry.product_name}
                        </TableCell>
                        <TableCell className="text-[11px] sm:text-sm px-1 sm:px-4 py-2 sm:py-4">{entry.labour_name}</TableCell>
                        <TableCell className="text-right text-[11px] sm:text-sm px-1 sm:px-4 py-2 sm:py-4">
                          {entry.quantity} {entry.unit}
                        </TableCell>
                        <TableCell className="text-[11px] sm:text-sm px-1 sm:px-4 py-2 sm:py-4">{entry.shift || "-"}</TableCell>
                        <TableCell className="px-1 py-2 sm:py-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

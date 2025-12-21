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
  Package,
  Plus,
  Loader2,
  Trash2,
  Calendar,
} from "lucide-react";

interface InventoryEntry {
  id: string;
  date: string;
  product_name: string;
  opening_stock: number;
  production_added: number;
  sales_dispatched: number;
  closing_stock: number;
  remarks: string | null;
  created_at: string;
}

export default function Inventory() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [productName, setProductName] = useState("");
  const [openingStock, setOpeningStock] = useState("");
  const [productionAdded, setProductionAdded] = useState("");
  const [salesDispatched, setSalesDispatched] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    fetchEntries();
  }, [selectedDate]);

  const fetchEntries = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", selectedDate)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to load entries");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateClosingStock = () => {
    const opening = parseFloat(openingStock) || 0;
    const added = parseFloat(productionAdded) || 0;
    const dispatched = parseFloat(salesDispatched) || 0;
    return opening + added - dispatched;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName || !openingStock) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const closingStock = calculateClosingStock();

      const { error } = await supabase.from("inventory").insert({
        user_id: user!.id,
        date: selectedDate,
        product_name: productName,
        opening_stock: parseFloat(openingStock) || 0,
        production_added: parseFloat(productionAdded) || 0,
        sales_dispatched: parseFloat(salesDispatched) || 0,
        closing_stock: closingStock,
        remarks: remarks || null,
      });

      if (error) throw error;

      toast.success("Inventory entry added");
      resetForm();
      fetchEntries();
    } catch (error: any) {
      console.error("Error adding inventory:", error);
      toast.error(error.message || "Failed to add entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("inventory")
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
    setOpeningStock("");
    setProductionAdded("");
    setSalesDispatched("");
    setRemarks("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container flex items-center h-12 sm:h-14 px-3 sm:px-4 gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => navigate("/plant-manager/dashboard")}>
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-sm sm:text-base text-foreground">Inventory</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Stock management</p>
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
              Add Inventory Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="productName" className="text-xs sm:text-sm">Product Name *</Label>
                <Input
                  id="productName"
                  placeholder="e.g. Cement Bags"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                  className="h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="openingStock" className="text-xs sm:text-sm">Opening Stock *</Label>
                  <Input
                    id="openingStock"
                    type="number"
                    step="any"
                    placeholder="0"
                    value={openingStock}
                    onChange={(e) => setOpeningStock(e.target.value)}
                    required
                    className="h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="productionAdded" className="text-xs sm:text-sm">Production Added</Label>
                  <Input
                    id="productionAdded"
                    type="number"
                    step="any"
                    placeholder="0"
                    value={productionAdded}
                    onChange={(e) => setProductionAdded(e.target.value)}
                    className="h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="salesDispatched" className="text-xs sm:text-sm">Sales Dispatched</Label>
                  <Input
                    id="salesDispatched"
                    type="number"
                    step="any"
                    placeholder="0"
                    value={salesDispatched}
                    onChange={(e) => setSalesDispatched(e.target.value)}
                    className="h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Closing Stock</Label>
                  <div className="h-8 sm:h-10 px-2 sm:px-3 py-1 sm:py-2 rounded-md border bg-muted flex items-center font-semibold text-primary text-xs sm:text-sm">
                    {calculateClosingStock().toFixed(2)}
                  </div>
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

        {/* Entries List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
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
                      <TableHead className="text-right text-[10px] sm:text-xs px-1 sm:px-4">Open</TableHead>
                      <TableHead className="text-right text-[10px] sm:text-xs px-1 sm:px-4">+Add</TableHead>
                      <TableHead className="text-right text-[10px] sm:text-xs px-1 sm:px-4">-Sold</TableHead>
                      <TableHead className="text-right text-[10px] sm:text-xs px-1 sm:px-4">Close</TableHead>
                      <TableHead className="w-8 sm:w-10 px-1"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-4">
                          {entry.product_name}
                        </TableCell>
                        <TableCell className="text-right text-[11px] sm:text-sm px-1 sm:px-4 py-2 sm:py-4">
                          {entry.opening_stock}
                        </TableCell>
                        <TableCell className="text-right text-success text-[11px] sm:text-sm px-1 sm:px-4 py-2 sm:py-4">
                          +{entry.production_added}
                        </TableCell>
                        <TableCell className="text-right text-destructive text-[11px] sm:text-sm px-1 sm:px-4 py-2 sm:py-4">
                          -{entry.sales_dispatched}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-[11px] sm:text-sm px-1 sm:px-4 py-2 sm:py-4">
                          {entry.closing_stock}
                        </TableCell>
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

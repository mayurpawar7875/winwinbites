import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, Plus, Wallet, Loader2, IndianRupee } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
}

interface Advance {
  id: string;
  user_id: string;
  advance_date: string;
  amount: number;
  remaining_amount: number;
  reason: string | null;
  created_at: string;
  user_name?: string;
}

export default function AdvancesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAdvance, setNewAdvance] = useState({
    user_id: "",
    amount: 0,
    reason: "",
    advance_date: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch non-admin users
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, user_id, name, email")
      .eq("is_active", true);

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const adminUserIds = (rolesData || []).filter(r => r.role === "admin").map(r => r.user_id);
    const nonAdminProfiles = (profilesData || []).filter(p => !adminUserIds.includes(p.user_id));
    setUsers(nonAdminProfiles);

    // Fetch all advances
    const { data: advancesData, error } = await supabase
      .from("advances")
      .select("*")
      .order("advance_date", { ascending: false });

    if (error) {
      console.error("Error fetching advances:", error);
    } else {
      // Map user names to advances
      const advancesWithNames = (advancesData || []).map(adv => ({
        ...adv,
        user_name: nonAdminProfiles.find(u => u.user_id === adv.user_id)?.name || "Unknown",
      }));
      setAdvances(advancesWithNames);
    }
    
    setIsLoading(false);
  };

  const addAdvance = async () => {
    if (!newAdvance.user_id || newAdvance.amount <= 0) {
      toast.error("Please select an employee and enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from("advances")
      .insert({
        user_id: newAdvance.user_id,
        advance_date: newAdvance.advance_date,
        amount: newAdvance.amount,
        remaining_amount: newAdvance.amount,
        reason: newAdvance.reason || null,
        created_by: user?.id,
      });

    if (error) {
      console.error("Error adding advance:", error);
      toast.error("Failed to add advance");
    } else {
      toast.success("Advance added successfully");
      setShowAddDialog(false);
      setNewAdvance({ user_id: "", amount: 0, reason: "", advance_date: format(new Date(), "yyyy-MM-dd") });
      fetchData();
    }
    setIsSubmitting(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate total remaining advance per user
  const getUserAdvanceBalance = (userId: string) => {
    return advances
      .filter(a => a.user_id === userId)
      .reduce((sum, a) => sum + a.remaining_amount, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="container flex items-center justify-between h-12 sm:h-16 px-3 sm:px-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 mr-2" onClick={() => navigate("/admin/salary")}>
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-foreground">Salary Advances</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Manage employee advances</p>
            </div>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs h-8">
                <Plus className="h-3 w-3 mr-1" />
                Add Advance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Advance</DialogTitle>
                <DialogDescription>Record a salary advance for an employee</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Employee</Label>
                  <Select value={newAdvance.user_id} onValueChange={(v) => setNewAdvance(prev => ({ ...prev, user_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.user_id} value={u.user_id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newAdvance.advance_date}
                    onChange={(e) => setNewAdvance(prev => ({ ...prev, advance_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    value={newAdvance.amount || ""}
                    onChange={(e) => setNewAdvance(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <Label>Reason (Optional)</Label>
                  <Textarea
                    value={newAdvance.reason}
                    onChange={(e) => setNewAdvance(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Reason for advance"
                  />
                </div>
                <Button onClick={addAdvance} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Add Advance
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {/* Employee Balance Summary */}
        <Card className="border-0 shadow-md">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Advance Balances
            </CardTitle>
            <CardDescription className="text-xs">Outstanding advance amounts per employee</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {users.map((u) => {
                const balance = getUserAdvanceBalance(u.user_id);
                if (balance === 0) return null;
                return (
                  <div key={u.user_id} className="p-3 rounded-lg bg-muted">
                    <p className="text-xs font-medium truncate">{u.name}</p>
                    <p className="text-sm font-bold text-destructive">{formatCurrency(balance)}</p>
                  </div>
                );
              })}
              {users.every(u => getUserAdvanceBalance(u.user_id) === 0) && (
                <p className="text-xs text-muted-foreground col-span-full">No outstanding advances</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Advances History */}
        <Card className="border-0 shadow-md">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Advance History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-4 pt-0">
            {advances.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No advances recorded yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Employee</TableHead>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs">Remaining</TableHead>
                      <TableHead className="text-xs">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {advances.map((adv) => (
                      <TableRow key={adv.id}>
                        <TableCell className="text-xs">{format(new Date(adv.advance_date), "dd MMM yyyy")}</TableCell>
                        <TableCell className="text-xs font-medium">{adv.user_name}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(adv.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={adv.remaining_amount > 0 ? "destructive" : "secondary"} className="text-[10px]">
                            {formatCurrency(adv.remaining_amount)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                          {adv.reason || "-"}
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

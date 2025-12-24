import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, Wallet, Loader2, IndianRupee, Calendar } from "lucide-react";

interface Advance {
  id: string;
  advance_date: string;
  amount: number;
  remaining_amount: number;
  reason: string | null;
  created_at: string;
}

export default function MyAdvances() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAdvances();
    }
  }, [user]);

  const fetchAdvances = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("advances")
      .select("*")
      .eq("user_id", user?.id)
      .order("advance_date", { ascending: false });

    if (error) {
      console.error("Error fetching advances:", error);
      toast.error("Failed to load advances");
    } else {
      setAdvances(data || []);
    }
    setIsLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalAdvance = advances.reduce((sum, a) => sum + a.amount, 0);
  const totalRemaining = advances.reduce((sum, a) => sum + a.remaining_amount, 0);
  const totalRepaid = totalAdvance - totalRemaining;

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
        <div className="container flex items-center h-12 sm:h-16 px-3 sm:px-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 mr-2" onClick={() => navigate("/plant-manager/dashboard")}>
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-foreground">My Advances</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">View your advance history</p>
          </div>
        </div>
      </header>

      <main className="container px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {/* Summary Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">Total Taken</p>
                <p className="text-lg font-bold">{formatCurrency(totalAdvance)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Repaid</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totalRepaid)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Balance</p>
                <p className="text-lg font-bold text-destructive">{formatCurrency(totalRemaining)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advances List */}
        <Card className="border-0 shadow-md">
          <CardHeader className="p-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Advance History
            </CardTitle>
            <CardDescription className="text-xs">Your salary advance records</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {advances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No advances taken</p>
              </div>
            ) : (
              <div className="space-y-3">
                {advances.map((advance) => (
                  <div key={advance.id} className="p-3 rounded-lg bg-muted">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">
                            {format(new Date(advance.advance_date), "dd MMM yyyy")}
                          </span>
                        </div>
                        {advance.reason && (
                          <p className="text-[10px] text-muted-foreground mt-1">{advance.reason}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {formatCurrency(advance.amount).replace("₹", "")}
                        </p>
                        <Badge 
                          variant={advance.remaining_amount > 0 ? "destructive" : "secondary"} 
                          className="text-[10px] mt-1"
                        >
                          {advance.remaining_amount > 0 
                            ? `${formatCurrency(advance.remaining_amount)} pending`
                            : "Fully repaid"
                          }
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

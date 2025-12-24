import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, FileText, Loader2, Calendar, IndianRupee, Printer } from "lucide-react";

interface SalarySlip {
  id: string;
  month: number;
  year: number;
  total_days_in_month: number;
  days_present: number;
  weekly_off_days: number;
  paid_days: number;
  monthly_salary: number;
  per_day_salary: number;
  gross_salary: number;
  advance_deduction: number;
  other_deductions: number;
  net_salary: number;
  advance_balance_after: number;
  generated_at: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function MySalarySlips() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSalarySlips();
    }
  }, [user]);

  const fetchSalarySlips = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("salary_slips")
      .select("*")
      .eq("user_id", user?.id)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (error) {
      console.error("Error fetching salary slips:", error);
      toast.error("Failed to load salary slips");
    } else {
      setSalarySlips(data || []);
    }
    setIsLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
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
        <div className="container flex items-center h-12 sm:h-16 px-3 sm:px-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 mr-2" onClick={() => navigate("/plant-manager/dashboard")}>
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-foreground">My Salary Slips</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">View your salary history</p>
          </div>
        </div>
      </header>

      <main className="container px-3 sm:px-4 py-4 sm:py-6">
        {salarySlips.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No salary slips available yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {salarySlips.map((slip) => (
              <Dialog key={slip.id}>
                <DialogTrigger asChild>
                  <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            {MONTHS[slip.month - 1]} {slip.year}
                          </h3>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Generated: {format(new Date(slip.generated_at), "PP")}
                          </p>
                          <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                            <span>Days Present: <strong className="text-foreground">{slip.days_present}</strong></span>
                            <span>Paid Days: <strong className="text-foreground">{slip.paid_days}</strong></span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(slip.net_salary)}
                          </span>
                          {(slip.advance_deduction || 0) > 0 && (
                            <p className="text-[10px] text-destructive">
                              -{formatCurrency(slip.advance_deduction)} advance
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Salary Slip
                    </DialogTitle>
                    <DialogDescription>
                      {MONTHS[slip.month - 1]} {slip.year}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    {/* Attendance */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">ATTENDANCE</h4>
                      <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
                        <div>
                          <p className="text-muted-foreground text-[10px]">Total Days</p>
                          <p className="font-semibold">{slip.total_days_in_month || '-'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px]">Days Present</p>
                          <p className="font-semibold text-green-600">{slip.days_present}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px]">Weekly Offs (Paid)</p>
                          <p className="font-semibold">{slip.weekly_off_days || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px]">Total Paid Days</p>
                          <p className="font-semibold text-primary">{slip.paid_days || slip.days_present}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Earnings */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">EARNINGS</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Monthly Salary</span>
                          <span>{formatCurrency(slip.monthly_salary)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Per Day Rate</span>
                          <span>{formatCurrency(slip.per_day_salary)}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Gross Salary</span>
                          <span className="text-green-600">{formatCurrency(slip.gross_salary)}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Deductions */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">DEDUCTIONS</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Advance Deduction</span>
                          <span className="text-destructive">-{formatCurrency(slip.advance_deduction)}</span>
                        </div>
                        {(slip.other_deductions || 0) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Other Deductions</span>
                            <span className="text-destructive">-{formatCurrency(slip.other_deductions)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Net Salary */}
                    <div className="p-3 rounded-lg bg-primary/10">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold flex items-center gap-1">
                          <IndianRupee className="h-4 w-4" />
                          Net Salary
                        </span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(slip.net_salary)}</span>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full" onClick={() => window.print()}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Salary Slip
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

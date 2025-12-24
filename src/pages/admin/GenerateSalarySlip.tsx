import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format, getDaysInMonth, getDay, startOfMonth, endOfMonth } from "date-fns";
import {
  ArrowLeft,
  Calculator,
  FileText,
  Loader2,
  IndianRupee,
  Calendar,
  User,
  Save,
  Printer,
} from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
}

interface SalarySettings {
  default_monthly_salary: number;
  weekly_off_day: string;
  min_days_for_weekly_off_paid: number;
  cap_at_monthly_salary: boolean;
}

interface EmployeeSalary {
  user_id: string;
  monthly_salary: number;
}

interface SalaryCalculation {
  totalDaysInMonth: number;
  daysPresent: number;
  weeklyOffDays: number;
  paidDays: number;
  monthlySalary: number;
  perDaySalary: number;
  grossSalary: number;
  advanceBalance: number;
  advanceDeduction: number;
  otherDeductions: number;
  netSalary: number;
  advanceBalanceAfter: number;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3,
  "Thursday": 4, "Friday": 5, "Saturday": 6
};

export default function GenerateSalarySlipPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [settings, setSettings] = useState<SalarySettings | null>(null);
  const [employeeSalaries, setEmployeeSalaries] = useState<EmployeeSalary[]>([]);
  
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [otherDeductions, setOtherDeductions] = useState(0);
  
  const [calculation, setCalculation] = useState<SalaryCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [existingSlip, setExistingSlip] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
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

    // Fetch settings
    const { data: settingsData } = await supabase
      .from("salary_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    
    if (settingsData) {
      setSettings(settingsData);
    }

    // Fetch employee salaries
    const { data: salariesData } = await supabase
      .from("employee_salaries")
      .select("user_id, monthly_salary");
    
    setEmployeeSalaries(salariesData || []);
    
    setIsLoading(false);
  };

  const countWeeklyOffDays = (month: number, year: number, dayName: string): number => {
    const dayNumber = DAY_NAME_TO_NUMBER[dayName] ?? 4; // Default Thursday
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    let count = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      if (getDay(new Date(year, month - 1, day)) === dayNumber) {
        count++;
      }
    }
    return count;
  };

  const calculateSalary = useCallback(async () => {
    if (!selectedUserId || !settings) return;
    
    setIsCalculating(true);
    
    try {
      const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), "yyyy-MM-dd");
      const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth - 1)), "yyyy-MM-dd");
      
      // Fetch attendance
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", selectedUserId)
        .gte("date", startDate)
        .lte("date", endDate);
      
      // Fetch advances
      const { data: advancesData } = await supabase
        .from("advances")
        .select("*")
        .eq("user_id", selectedUserId);
      
      // Check existing slip
      const { data: existingData } = await supabase
        .from("salary_slips")
        .select("*")
        .eq("user_id", selectedUserId)
        .eq("month", selectedMonth)
        .eq("year", selectedYear)
        .maybeSingle();
      
      setExistingSlip(existingData);
      
      // Calculate values
      const totalDaysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1));
      
      // Days present = days with punch_in_time
      const daysPresent = (attendanceData || []).filter(a => a.punch_in_time !== null).length;
      
      const weeklyOffDays = countWeeklyOffDays(selectedMonth, selectedYear, settings.weekly_off_day);
      
      // Get employee salary (or use default)
      const empSalary = employeeSalaries.find(s => s.user_id === selectedUserId);
      const monthlySalary = empSalary?.monthly_salary || settings.default_monthly_salary;
      
      // Apply weekly off rule
      let paidDays = daysPresent;
      if (daysPresent >= settings.min_days_for_weekly_off_paid) {
        paidDays = daysPresent + weeklyOffDays;
      }
      
      const perDaySalary = monthlySalary / totalDaysInMonth;
      let grossSalary = perDaySalary * paidDays;
      
      // Cap at monthly salary
      if (settings.cap_at_monthly_salary && grossSalary > monthlySalary) {
        grossSalary = monthlySalary;
      }
      
      // Calculate advance balance
      const advanceBalance = (advancesData || []).reduce((sum, a) => sum + a.remaining_amount, 0);
      
      // Calculate advance deduction
      const advanceDeduction = Math.min(grossSalary, advanceBalance);
      
      // Calculate net salary
      let netSalary = grossSalary - advanceDeduction - otherDeductions;
      if (netSalary < 0) netSalary = 0;
      
      const advanceBalanceAfter = advanceBalance - advanceDeduction;
      
      setCalculation({
        totalDaysInMonth,
        daysPresent,
        weeklyOffDays,
        paidDays,
        monthlySalary,
        perDaySalary,
        grossSalary,
        advanceBalance,
        advanceDeduction,
        otherDeductions,
        netSalary,
        advanceBalanceAfter,
      });
      
    } catch (error) {
      console.error("Error calculating salary:", error);
      toast.error("Failed to calculate salary");
    }
    
    setIsCalculating(false);
  }, [selectedUserId, selectedMonth, selectedYear, settings, employeeSalaries, otherDeductions]);

  useEffect(() => {
    if (selectedUserId && settings) {
      calculateSalary();
    }
  }, [selectedUserId, selectedMonth, selectedYear, settings, calculateSalary]);

  const saveSalarySlip = async () => {
    if (!calculation || !user) return;
    
    setIsSaving(true);
    
    try {
      // Upsert salary slip
      const { error: slipError } = await supabase
        .from("salary_slips")
        .upsert({
          user_id: selectedUserId,
          month: selectedMonth,
          year: selectedYear,
          total_days_in_month: calculation.totalDaysInMonth,
          days_present: calculation.daysPresent,
          weekly_off_days: calculation.weeklyOffDays,
          paid_days: calculation.paidDays,
          monthly_salary: calculation.monthlySalary,
          per_day_salary: calculation.perDaySalary,
          gross_salary: calculation.grossSalary,
          advance_deduction: calculation.advanceDeduction,
          other_deductions: calculation.otherDeductions,
          net_salary: calculation.netSalary,
          advance_balance_after: calculation.advanceBalanceAfter,
          generated_by: user.id,
          // Keep old fields for compatibility
          total_working_days: calculation.totalDaysInMonth - calculation.weeklyOffDays,
          basic_salary: calculation.grossSalary,
          deductions: calculation.advanceDeduction + calculation.otherDeductions,
        }, {
          onConflict: "user_id,month,year"
        });
      
      if (slipError) throw slipError;
      
      // Update advance remaining amounts (proportionally reduce each advance)
      if (calculation.advanceDeduction > 0) {
        const { data: advancesData } = await supabase
          .from("advances")
          .select("*")
          .eq("user_id", selectedUserId)
          .gt("remaining_amount", 0)
          .order("advance_date", { ascending: true });
        
        let remainingDeduction = calculation.advanceDeduction;
        
        for (const advance of advancesData || []) {
          if (remainingDeduction <= 0) break;
          
          const deductFromThis = Math.min(advance.remaining_amount, remainingDeduction);
          const newRemaining = advance.remaining_amount - deductFromThis;
          
          await supabase
            .from("advances")
            .update({ remaining_amount: newRemaining })
            .eq("id", advance.id);
          
          remainingDeduction -= deductFromThis;
        }
      }
      
      toast.success("Salary slip saved successfully");
      setExistingSlip({ id: "saved" });
      
    } catch (error) {
      console.error("Error saving salary slip:", error);
      toast.error("Failed to save salary slip");
    }
    
    setIsSaving(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const selectedUser = users.find(u => u.user_id === selectedUserId);

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
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 mr-2" onClick={() => navigate("/admin/salary")}>
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-foreground">Generate Salary Slip</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Calculate and save salary slip</p>
          </div>
        </div>
      </header>

      <main className="container px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {/* Selection Card */}
        <Card className="border-0 shadow-md">
          <CardHeader className="p-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Select Employee & Month
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Employee</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
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
                <Label className="text-xs">Month</Label>
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, idx) => (
                      <SelectItem key={idx} value={(idx + 1).toString()}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Year</Label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Preview */}
        {calculation && selectedUser && (
          <Card className="border-0 shadow-md">
            <CardHeader className="p-4 bg-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Salary Slip Preview
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedUser.name} - {MONTHS[selectedMonth - 1]} {selectedYear}
                  </CardDescription>
                </div>
                {existingSlip && (
                  <span className="text-xs text-orange-600 font-medium">Existing slip will be updated</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {isCalculating ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Attendance Summary */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> ATTENDANCE
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2 rounded bg-muted text-center">
                        <p className="text-[10px] text-muted-foreground">Total Days</p>
                        <p className="text-sm font-bold">{calculation.totalDaysInMonth}</p>
                      </div>
                      <div className="p-2 rounded bg-muted text-center">
                        <p className="text-[10px] text-muted-foreground">Days Present</p>
                        <p className="text-sm font-bold text-green-600">{calculation.daysPresent}</p>
                      </div>
                      <div className="p-2 rounded bg-muted text-center">
                        <p className="text-[10px] text-muted-foreground">Weekly Offs ({settings?.weekly_off_day}s)</p>
                        <p className="text-sm font-bold">{calculation.weeklyOffDays}</p>
                      </div>
                      <div className="p-2 rounded bg-primary/10 text-center">
                        <p className="text-[10px] text-muted-foreground">Paid Days</p>
                        <p className="text-sm font-bold text-primary">{calculation.paidDays}</p>
                      </div>
                    </div>
                    {calculation.daysPresent < (settings?.min_days_for_weekly_off_paid || 20) && (
                      <p className="text-[10px] text-orange-600 mt-1">
                        * Weekly offs not paid (less than {settings?.min_days_for_weekly_off_paid} days present)
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Salary Breakdown */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" /> EARNINGS
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Salary</span>
                        <span>{formatCurrency(calculation.monthlySalary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per Day Rate</span>
                        <span>{formatCurrency(calculation.perDaySalary)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Gross Salary ({calculation.paidDays} days × {formatCurrency(calculation.perDaySalary)})</span>
                        <span className="text-green-600">{formatCurrency(calculation.grossSalary)}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Deductions */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">DEDUCTIONS</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Advance Balance</span>
                        <span className="text-orange-600">{formatCurrency(calculation.advanceBalance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Advance Deduction</span>
                        <span className="text-destructive">-{formatCurrency(calculation.advanceDeduction)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Other Deductions</span>
                        <Input
                          type="number"
                          value={otherDeductions}
                          onChange={(e) => setOtherDeductions(parseFloat(e.target.value) || 0)}
                          className="w-24 h-7 text-xs text-right"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Net Salary */}
                  <div className="p-3 rounded-lg bg-primary/10">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Net Salary</span>
                      <span className="text-xl font-bold text-primary">{formatCurrency(calculation.netSalary)}</span>
                    </div>
                    {calculation.advanceDeduction > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Advance balance after: {formatCurrency(calculation.advanceBalanceAfter)}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button onClick={saveSalarySlip} disabled={isSaving} className="flex-1">
                      {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      {existingSlip ? "Update Salary Slip" : "Save Salary Slip"}
                    </Button>
                    <Button variant="outline" onClick={() => window.print()}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedUserId && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Select an employee to calculate salary slip</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

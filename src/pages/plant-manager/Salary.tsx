import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, getDaysInMonth, getDay, startOfMonth, endOfMonth } from "date-fns";
import {
  ArrowLeft,
  Calculator,
  Download,
  FileText,
  IndianRupee,
  Users,
  Clock,
  Calendar,
} from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
}

interface UserWithSalary extends UserProfile {
  monthly_salary: number;
  overtime_rate: number;
}

interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  punch_in_time: string | null;
  punch_out_time: string | null;
  status: string | null;
  working_hours: number | null;
}

interface SalarySlip {
  id: string;
  user_id: string;
  month: number;
  year: number;
  total_working_days: number;
  days_present: number;
  days_absent: number;
  days_half: number;
  total_hours_worked: number;
  regular_hours: number;
  overtime_hours: number;
  basic_salary: number;
  overtime_pay: number;
  deductions: number;
  net_salary: number;
  generated_at: string;
  notes: string | null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const REGULAR_HOURS_PER_DAY = 8;

export default function Salary() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<UserWithSalary[]>([]);
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUser, setSelectedUser] = useState<UserWithSalary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSalaryDialog, setShowSalaryDialog] = useState(false);
  const [editingSalary, setEditingSalary] = useState({ monthly: 0, overtime: 0 });

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchSalarySlips();
    } else if (user) {
      fetchMySalarySlips();
    }
  }, [isAdmin, user, selectedMonth, selectedYear]);

  const fetchUsers = async () => {
    // Fetch profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, user_id, name, email")
      .eq("is_active", true);
    
    if (profilesError) {
      console.error("Error fetching users:", profilesError);
      return;
    }

    // Fetch salary data from employee_salaries table (admin-only)
    const { data: salaryData, error: salaryError } = await supabase
      .from("employee_salaries")
      .select("user_id, monthly_salary, overtime_rate");
    
    if (salaryError) {
      console.error("Error fetching salaries:", salaryError);
    }

    // Merge profile and salary data
    const usersWithSalary: UserWithSalary[] = (profilesData || []).map(profile => {
      const salary = salaryData?.find(s => s.user_id === profile.user_id);
      return {
        ...profile,
        monthly_salary: salary?.monthly_salary || 0,
        overtime_rate: salary?.overtime_rate || 0,
      };
    });

    setUsers(usersWithSalary);
  };

  const fetchSalarySlips = async () => {
    const { data, error } = await supabase
      .from("salary_slips")
      .select("*")
      .eq("month", selectedMonth)
      .eq("year", selectedYear);
    
    if (data) setSalarySlips(data);
    if (error) console.error("Error fetching salary slips:", error);
  };

  const fetchMySalarySlips = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("salary_slips")
      .select("*")
      .eq("user_id", user.id)
      .order("year", { ascending: false })
      .order("month", { ascending: false });
    
    if (data) setSalarySlips(data);
    if (error) console.error("Error fetching salary slips:", error);
  };

  // Calculate working days excluding Thursdays
  const calculateWorkingDays = (month: number, year: number): number => {
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    let workingDays = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = getDay(date);
      // Thursday is 4 in getDay() (0 = Sunday)
      if (dayOfWeek !== 4) {
        workingDays++;
      }
    }
    
    return workingDays;
  };

  const generateSalarySlip = async (userProfile: UserWithSalary) => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), "yyyy-MM-dd");
      const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth - 1)), "yyyy-MM-dd");

      // Fetch attendance for the month
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", userProfile.user_id)
        .gte("date", startDate)
        .lte("date", endDate);

      if (attendanceError) throw attendanceError;

      const attendance = attendanceData || [];
      const totalWorkingDays = calculateWorkingDays(selectedMonth, selectedYear);
      
      let daysPresent = 0;
      let daysHalf = 0;
      let totalHoursWorked = 0;

      attendance.forEach((record) => {
        if (record.status === "PRESENT") {
          daysPresent++;
        } else if (record.status === "HALF_DAY") {
          daysHalf++;
        }
        totalHoursWorked += record.working_hours || 0;
      });

      const daysAbsent = totalWorkingDays - daysPresent - daysHalf;
      const effectiveDaysWorked = daysPresent + (daysHalf * 0.5);
      
      // Calculate regular and overtime hours
      const regularHours = Math.min(totalHoursWorked, effectiveDaysWorked * REGULAR_HOURS_PER_DAY);
      const overtimeHours = Math.max(0, totalHoursWorked - regularHours);

      // Calculate salary
      const perDaySalary = userProfile.monthly_salary / totalWorkingDays;
      const basicSalary = effectiveDaysWorked * perDaySalary;
      const overtimePay = overtimeHours * userProfile.overtime_rate;
      const deductions = daysAbsent * perDaySalary;
      const netSalary = basicSalary + overtimePay;

      // Upsert salary slip
      const { error: upsertError } = await supabase
        .from("salary_slips")
        .upsert({
          user_id: userProfile.user_id,
          month: selectedMonth,
          year: selectedYear,
          total_working_days: totalWorkingDays,
          days_present: daysPresent,
          days_absent: daysAbsent,
          days_half: daysHalf,
          total_hours_worked: totalHoursWorked,
          regular_hours: regularHours,
          overtime_hours: overtimeHours,
          basic_salary: basicSalary,
          overtime_pay: overtimePay,
          deductions: deductions,
          net_salary: netSalary,
          generated_by: user.id,
        }, {
          onConflict: "user_id,month,year"
        });

      if (upsertError) throw upsertError;

      toast.success(`Salary slip generated for ${userProfile.name}`);
      fetchSalarySlips();
    } catch (error) {
      console.error("Error generating salary slip:", error);
      toast.error("Failed to generate salary slip");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAllSalarySlips = async () => {
    for (const userProfile of users) {
      await generateSalarySlip(userProfile);
    }
  };

  const updateUserSalary = async () => {
    if (!selectedUser) return;
    
    // Upsert to employee_salaries table (admin-only)
    const { error } = await supabase
      .from("employee_salaries")
      .upsert({
        user_id: selectedUser.user_id,
        monthly_salary: editingSalary.monthly,
        overtime_rate: editingSalary.overtime,
      }, {
        onConflict: "user_id"
      });

    if (error) {
      toast.error("Failed to update salary settings");
      console.error("Salary update error:", error);
      return;
    }

    toast.success("Salary settings updated");
    setShowSalaryDialog(false);
    fetchUsers();
  };

  const getSlipForUser = (userId: string) => {
    return salarySlips.find(s => s.user_id === userId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Employee view
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
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
              <CardContent className="p-6 text-center text-muted-foreground">
                No salary slips available yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {salarySlips.map((slip) => (
                <Card key={slip.id} className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {MONTHS[slip.month - 1]} {slip.year}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Generated: {format(new Date(slip.generated_at), "PP")}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(slip.net_salary)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Days Present:</span>
                        <span className="ml-1 font-medium">{slip.days_present}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Half Days:</span>
                        <span className="ml-1 font-medium">{slip.days_half}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Hours Worked:</span>
                        <span className="ml-1 font-medium">{slip.total_hours_worked.toFixed(1)}h</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Overtime:</span>
                        <span className="ml-1 font-medium">{slip.overtime_hours.toFixed(1)}h</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Admin view
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container flex items-center justify-between h-12 sm:h-16 px-3 sm:px-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 mr-2" onClick={() => navigate("/plant-manager/dashboard")}>
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-foreground">Salary Management</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Calculate & generate salary slips</p>
            </div>
          </div>
          <Button 
            onClick={generateAllSalarySlips} 
            disabled={isGenerating}
            size="sm"
            className="text-xs h-8"
          >
            <Calculator className="h-3 w-3 mr-1" />
            Generate All
          </Button>
        </div>
      </header>

      <main className="container px-3 sm:px-4 py-4 sm:py-6">
        {/* Month/Year Selector */}
        <Card className="border-0 shadow-md mb-4">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Month:</Label>
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, idx) => (
                      <SelectItem key={idx} value={(idx + 1).toString()}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Year:</Label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="w-20 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {calculateWorkingDays(selectedMonth, selectedYear)} working days
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Employees Table */}
        <Card className="border-0 shadow-md">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employees
            </CardTitle>
            <CardDescription className="text-xs">Set salary and generate slips for each employee</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-4 pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Employee</TableHead>
                    <TableHead className="text-xs">Monthly Salary</TableHead>
                    <TableHead className="text-xs">OT Rate/hr</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userProfile) => {
                    const slip = getSlipForUser(userProfile.user_id);
                    return (
                      <TableRow key={userProfile.id}>
                        <TableCell className="text-xs font-medium">{userProfile.name}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(userProfile.monthly_salary || 0)}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(userProfile.overtime_rate || 0)}</TableCell>
                        <TableCell>
                          {slip ? (
                            <Badge variant="default" className="text-[10px]">
                              {formatCurrency(slip.net_salary)}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Not Generated</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setSelectedUser(userProfile);
                                setEditingSalary({
                                  monthly: userProfile.monthly_salary || 0,
                                  overtime: userProfile.overtime_rate || 0,
                                });
                                setShowSalaryDialog(true);
                              }}
                            >
                              <IndianRupee className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => generateSalarySlip(userProfile)}
                              disabled={isGenerating}
                            >
                              <Calculator className="h-3 w-3" />
                            </Button>
                            {slip && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <FileText className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Salary Slip</DialogTitle>
                                    <DialogDescription>
                                      {userProfile.name} - {MONTHS[slip.month - 1]} {slip.year}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 text-sm">
                                    <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
                                      <div>
                                        <p className="text-muted-foreground text-xs">Working Days</p>
                                        <p className="font-semibold">{slip.total_working_days}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground text-xs">Days Present</p>
                                        <p className="font-semibold">{slip.days_present}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground text-xs">Half Days</p>
                                        <p className="font-semibold">{slip.days_half}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground text-xs">Days Absent</p>
                                        <p className="font-semibold">{slip.days_absent}</p>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
                                      <div>
                                        <p className="text-muted-foreground text-xs">Total Hours</p>
                                        <p className="font-semibold">{slip.total_hours_worked.toFixed(1)}h</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground text-xs">Overtime Hours</p>
                                        <p className="font-semibold">{slip.overtime_hours.toFixed(1)}h</p>
                                      </div>
                                    </div>
                                    <div className="border-t pt-3 space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Basic Salary</span>
                                        <span>{formatCurrency(slip.basic_salary)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Overtime Pay</span>
                                        <span className="text-green-600">+{formatCurrency(slip.overtime_pay)}</span>
                                      </div>
                                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                                        <span>Net Salary</span>
                                        <span className="text-primary">{formatCurrency(slip.net_salary)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Edit Salary Dialog */}
      <Dialog open={showSalaryDialog} onOpenChange={setShowSalaryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Salary for {selectedUser?.name}</DialogTitle>
            <DialogDescription>Configure monthly salary and overtime rate</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="monthly">Monthly Salary (₹)</Label>
              <Input
                id="monthly"
                type="number"
                value={editingSalary.monthly}
                onChange={(e) => setEditingSalary(prev => ({ ...prev, monthly: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="overtime">Overtime Rate per Hour (₹)</Label>
              <Input
                id="overtime"
                type="number"
                value={editingSalary.overtime}
                onChange={(e) => setEditingSalary(prev => ({ ...prev, overtime: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <Button onClick={updateUserSalary} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
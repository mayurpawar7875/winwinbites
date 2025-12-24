import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Settings,
  Wallet,
  Calculator,
  Users,
  IndianRupee,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
} from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
}

interface UserWithSalary extends UserProfile {
  monthly_salary: number;
}

interface SalarySettings {
  default_monthly_salary: number;
  weekly_off_day: string;
  min_days_for_weekly_off_paid: number;
}

export default function SalaryManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithSalary[]>([]);
  const [settings, setSettings] = useState<SalarySettings | null>(null);
  const [pendingAdvances, setPendingAdvances] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithSalary | null>(null);
  const [showSalaryDialog, setShowSalaryDialog] = useState(false);
  const [editingSalary, setEditingSalary] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

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

    // Fetch employee salaries
    const { data: salariesData } = await supabase
      .from("employee_salaries")
      .select("user_id, monthly_salary");

    // Fetch settings for default salary
    const { data: settingsData } = await supabase
      .from("salary_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    
    if (settingsData) {
      setSettings(settingsData);
    }

    // Merge data
    const usersWithSalary: UserWithSalary[] = nonAdminProfiles.map(profile => {
      const salary = salariesData?.find(s => s.user_id === profile.user_id);
      return {
        ...profile,
        monthly_salary: salary?.monthly_salary || settingsData?.default_monthly_salary || 20000,
      };
    });
    setUsers(usersWithSalary);

    // Fetch pending advances
    const { data: advancesData } = await supabase
      .from("advances")
      .select("user_id, remaining_amount");
    
    const advancesByUser: Record<string, number> = {};
    (advancesData || []).forEach(adv => {
      advancesByUser[adv.user_id] = (advancesByUser[adv.user_id] || 0) + adv.remaining_amount;
    });
    setPendingAdvances(advancesByUser);

    setIsLoading(false);
  };

  const updateUserSalary = async () => {
    if (!selectedUser) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from("employee_salaries")
      .upsert({
        user_id: selectedUser.user_id,
        monthly_salary: editingSalary,
      }, {
        onConflict: "user_id"
      });

    if (error) {
      toast.error("Failed to update salary");
      console.error("Salary update error:", error);
    } else {
      toast.success("Salary updated successfully");
      setShowSalaryDialog(false);
      fetchData();
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card 
          className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/admin/salary/settings")}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Settings</p>
              <p className="text-[10px] text-muted-foreground truncate">Global salary rules</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/admin/salary/advances")}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Advances</p>
              <p className="text-[10px] text-muted-foreground truncate">Manage advances</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow col-span-2"
          onClick={() => navigate("/admin/salary/generate")}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Calculator className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Generate Salary Slip</p>
              <p className="text-[10px] text-muted-foreground truncate">Calculate & save salary for employees</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Settings Summary */}
      {settings && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Default Salary: </span>
                <span className="font-medium">{formatCurrency(settings.default_monthly_salary)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Weekly Off: </span>
                <span className="font-medium">{settings.weekly_off_day}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Min Days for Weekly Off Paid: </span>
                <span className="font-medium">{settings.min_days_for_weekly_off_paid}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employees Table */}
      <Card className="border-0 shadow-md">
        <CardHeader className="p-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Employee Salaries
          </CardTitle>
          <CardDescription className="text-xs">Set monthly salary for each employee</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-4 pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Employee</TableHead>
                  <TableHead className="text-xs">Monthly Salary</TableHead>
                  <TableHead className="text-xs">Pending Advance</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userProfile) => (
                  <TableRow key={userProfile.id}>
                    <TableCell>
                      <div>
                        <p className="text-xs font-medium">{userProfile.name}</p>
                        <p className="text-[10px] text-muted-foreground">{userProfile.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {formatCurrency(userProfile.monthly_salary)}
                    </TableCell>
                    <TableCell>
                      {(pendingAdvances[userProfile.user_id] || 0) > 0 ? (
                        <Badge variant="destructive" className="text-[10px]">
                          {formatCurrency(pendingAdvances[userProfile.user_id])}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">None</Badge>
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
                            setEditingSalary(userProfile.monthly_salary);
                            setShowSalaryDialog(true);
                          }}
                        >
                          <IndianRupee className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => navigate(`/admin/salary/generate?user=${userProfile.user_id}`)}
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Salary Dialog */}
      <Dialog open={showSalaryDialog} onOpenChange={setShowSalaryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Salary for {selectedUser?.name}</DialogTitle>
            <DialogDescription>Configure monthly salary for this employee</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="monthly">Monthly Salary (₹)</Label>
              <Input
                id="monthly"
                type="number"
                value={editingSalary}
                onChange={(e) => setEditingSalary(parseFloat(e.target.value) || 0)}
              />
            </div>
            <Button onClick={updateUserSalary} disabled={isSaving} className="w-full">
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

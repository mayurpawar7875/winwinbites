import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Settings, Save, Loader2 } from "lucide-react";

interface SalarySettings {
  id: string;
  default_monthly_salary: number;
  weekly_off_day: string;
  min_days_for_weekly_off_paid: number;
  cap_at_monthly_salary: boolean;
}

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

export default function SalarySettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SalarySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("salary_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load salary settings");
    } else if (data) {
      setSettings(data);
    }
    setIsLoading(false);
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from("salary_settings")
      .update({
        default_monthly_salary: settings.default_monthly_salary,
        weekly_off_day: settings.weekly_off_day,
        min_days_for_weekly_off_paid: settings.min_days_for_weekly_off_paid,
        cap_at_monthly_salary: settings.cap_at_monthly_salary,
      })
      .eq("id", settings.id);

    if (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved successfully");
    }
    setIsSaving(false);
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
              <h1 className="font-bold text-sm sm:text-base text-foreground">Salary Settings</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Configure global salary rules</p>
            </div>
          </div>
          <Button onClick={saveSettings} disabled={isSaving} size="sm" className="text-xs h-8">
            {isSaving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
            Save
          </Button>
        </div>
      </header>

      <main className="container px-3 sm:px-4 py-4 sm:py-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="p-4">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Global Salary Settings
            </CardTitle>
            <CardDescription className="text-xs">
              These settings apply to all employees unless overridden
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="defaultSalary" className="text-sm">Default Monthly Salary (₹)</Label>
              <Input
                id="defaultSalary"
                type="number"
                value={settings?.default_monthly_salary || 0}
                onChange={(e) => setSettings(prev => prev ? { ...prev, default_monthly_salary: parseFloat(e.target.value) || 0 } : null)}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">Default salary for new employees</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weeklyOff" className="text-sm">Weekly Off Day</Label>
              <Select 
                value={settings?.weekly_off_day || "Thursday"} 
                onValueChange={(v) => setSettings(prev => prev ? { ...prev, weekly_off_day: v } : null)}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Day considered as weekly off for salary calculation</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minDays" className="text-sm">Minimum Days for Weekly Off Paid</Label>
              <Input
                id="minDays"
                type="number"
                value={settings?.min_days_for_weekly_off_paid || 0}
                onChange={(e) => setSettings(prev => prev ? { ...prev, min_days_for_weekly_off_paid: parseInt(e.target.value) || 0 } : null)}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                If employee is present for at least this many days, weekly offs are paid
              </p>
            </div>

            <div className="flex items-center justify-between max-w-xs p-3 rounded-lg bg-muted">
              <div>
                <Label htmlFor="capSalary" className="text-sm">Cap at Monthly Salary</Label>
                <p className="text-xs text-muted-foreground">Gross salary won't exceed monthly salary</p>
              </div>
              <Switch
                id="capSalary"
                checked={settings?.cap_at_monthly_salary || false}
                onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, cap_at_monthly_salary: checked } : null)}
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

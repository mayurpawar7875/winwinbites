import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, History as HistoryIcon, Calendar } from "lucide-react";
import logo from "@/assets/win-win-bites-logo.jpg";
import { format } from "date-fns";

type ModuleType = "production" | "purchases" | "expenses" | "problems" | "attendance";

const moduleLabels: Record<ModuleType, string> = {
  production: "Production",
  purchases: "Purchases",
  expenses: "Expenses",
  problems: "Problems",
  attendance: "Attendance",
};

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedModule, setSelectedModule] = useState<ModuleType>("production");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["history", selectedModule, selectedDate],
    queryFn: async () => {
      let query;

      switch (selectedModule) {
        case "production":
          query = supabase
            .from("production")
            .select("*")
            .eq("date", selectedDate)
            .order("created_at", { ascending: false });
          break;
        case "purchases":
          query = supabase
            .from("purchases")
            .select("*")
            .eq("date", selectedDate)
            .order("created_at", { ascending: false });
          break;
        case "expenses":
          query = supabase
            .from("expenses")
            .select("*")
            .eq("date", selectedDate)
            .order("created_at", { ascending: false });
          break;
        case "problems":
          query = supabase
            .from("problems")
            .select("*")
            .eq("date", selectedDate)
            .order("created_at", { ascending: false });
          break;
        case "attendance":
          query = supabase
            .from("attendance")
            .select("*")
            .eq("date", selectedDate)
            .order("created_at", { ascending: false });
          break;
        default:
          return [];
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const renderRecord = (record: any) => {
    switch (selectedModule) {
      case "production":
        return (
          <Card key={record.id} className="p-3 sm:p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium text-xs sm:text-sm text-foreground">
                  {record.product_name}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  by {record.labour_name}
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                {record.shift || "Day"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm">
              <span className="font-semibold">{record.quantity}</span> {record.unit}
            </p>
          </Card>
        );

      case "purchases":
        return (
          <Card key={record.id} className="p-3 sm:p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium text-xs sm:text-sm text-foreground">
                  {record.item_name}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  from {record.vendor_name}
                </p>
              </div>
              <Badge
                variant={record.payment_status === "PAID" ? "secondary" : "destructive"}
                className="text-[10px] sm:text-xs"
              >
                {record.payment_status}
              </Badge>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">
                {record.quantity} {record.unit} × ₹{record.rate}
              </span>
              <span className="font-semibold">₹{record.total_amount.toLocaleString()}</span>
            </div>
          </Card>
        );

      case "expenses":
        return (
          <Card key={record.id} className="p-3 sm:p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <Badge variant="outline" className="text-[10px] sm:text-xs mb-1">
                  {record.expense_head}
                </Badge>
                <p className="text-xs sm:text-sm text-foreground">{record.description}</p>
              </div>
              <span className="font-bold text-sm sm:text-base text-destructive">
                ₹{record.amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
              <span>{record.paid_to ? `Paid to: ${record.paid_to}` : ""}</span>
              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                {record.mode_of_payment}
              </Badge>
            </div>
          </Card>
        );

      case "problems":
        return (
          <Card key={record.id} className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant={record.status === "OPEN" ? "destructive" : "secondary"}
                  className="text-[10px] sm:text-xs"
                >
                  {record.status}
                </Badge>
                <Badge variant="outline" className="text-[10px] sm:text-xs">
                  {record.problem_type}
                </Badge>
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {record.time?.slice(0, 5)}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-foreground mb-1">
              {record.location_text}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">{record.description}</p>
          </Card>
        );

      case "attendance":
        return (
          <Card key={record.id} className="p-3 sm:p-4">
            <div className="flex justify-between items-center mb-2">
              <Badge
                variant={record.status === "present" ? "secondary" : "destructive"}
                className="text-[10px] sm:text-xs"
              >
                {record.status?.toUpperCase() || "PENDING"}
              </Badge>
              {record.working_hours && (
                <span className="text-xs sm:text-sm font-medium">
                  {record.working_hours.toFixed(1)} hrs
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
              <div>
                <span className="text-muted-foreground">Punch In: </span>
                <span className="font-medium">
                  {record.punch_in_time?.slice(0, 5) || "-"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Punch Out: </span>
                <span className="font-medium">
                  {record.punch_out_time?.slice(0, 5) || "-"}
                </span>
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

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
            <h1 className="font-bold text-sm sm:text-lg text-foreground">History</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Browse Past Entries</p>
          </div>
        </div>
      </header>

      <main className="container px-3 sm:px-4 py-4 sm:py-6">
        {/* Filters */}
        <Card className="p-3 sm:p-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Module</Label>
              <Select
                value={selectedModule}
                onValueChange={(value) => setSelectedModule(value as ModuleType)}
              >
                <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(moduleLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="text-xs sm:text-sm">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 sm:h-10 text-xs sm:text-sm"
              />
            </div>
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm sm:text-base text-foreground">
              {moduleLabels[selectedModule]}
            </h3>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              {format(new Date(selectedDate), "dd MMM yyyy")}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
          ) : records.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center">
              <HistoryIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm sm:text-base text-muted-foreground">
                No {moduleLabels[selectedModule].toLowerCase()} records for this date
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {records.length} record{records.length !== 1 ? "s" : ""} found
              </p>
              {records.map(renderRecord)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

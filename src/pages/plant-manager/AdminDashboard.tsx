import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Shield,
  Clock,
  Factory,
  Package,
  ShoppingCart,
  DollarSign,
  Wallet,
  AlertTriangle,
  Users,
  RefreshCw,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  punch_in_time: string | null;
  punch_out_time: string | null;
  status: string | null;
  working_hours: number | null;
  created_at: string | null;
}

interface ProductionRecord {
  id: string;
  user_id: string;
  date: string;
  product_name: string;
  quantity: number;
  unit: string;
  labour_name: string;
  created_at: string | null;
}

interface SalesRecord {
  id: string;
  user_id: string;
  date: string;
  customer_name: string;
  product_name: string;
  quantity: number;
  total_amount: number;
  payment_status: string;
  created_at: string | null;
}

interface PurchaseRecord {
  id: string;
  user_id: string;
  date: string;
  vendor_name: string;
  item_name: string;
  quantity: number;
  total_amount: number;
  payment_status: string;
  created_at: string | null;
}

interface ExpenseRecord {
  id: string;
  user_id: string;
  date: string;
  expense_head: string;
  description: string;
  amount: number;
  created_at: string | null;
}

interface ProblemRecord {
  id: string;
  user_id: string;
  date: string;
  problem_type: string;
  description: string;
  status: string | null;
  created_at: string | null;
}

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
}

export default function AdminDashboard() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [production, setProduction] = useState<ProductionRecord[]>([]);
  const [sales, setSales] = useState<SalesRecord[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [problems, setProblems] = useState<ProblemRecord[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const initialTab = tabFromUrl || "attendance";
  const showAllTabs = !tabFromUrl; // Show all tabs only when no specific tab is selected

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Access denied. Admin only.");
      navigate("/plant-manager/dashboard", { replace: true });
      return;
    }

    fetchAllData();
    setupRealtimeSubscriptions();
  }, [isAdmin, navigate]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [
        attendanceRes,
        productionRes,
        salesRes,
        purchasesRes,
        expensesRes,
        problemsRes,
        usersRes,
      ] = await Promise.all([
        supabase.from("attendance").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("production").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("sales").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("purchases").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("expenses").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("problems").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("profiles").select("*"),
      ]);

      if (attendanceRes.data) setAttendance(attendanceRes.data);
      if (productionRes.data) setProduction(productionRes.data);
      if (salesRes.data) setSales(salesRes.data);
      if (purchasesRes.data) setPurchases(purchasesRes.data);
      if (expensesRes.data) setExpenses(expensesRes.data);
      if (problemsRes.data) setProblems(problemsRes.data);
      if (usersRes.data) setUsers(usersRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel("admin-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance" },
        (payload: RealtimePostgresChangesPayload<AttendanceRecord>) => {
          handleRealtimeUpdate("Attendance", payload);
          if (payload.eventType === "INSERT") {
            setAttendance((prev) => [payload.new as AttendanceRecord, ...prev].slice(0, 50));
          } else if (payload.eventType === "UPDATE") {
            setAttendance((prev) =>
              prev.map((item) => (item.id === (payload.new as AttendanceRecord).id ? (payload.new as AttendanceRecord) : item))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "production" },
        (payload: RealtimePostgresChangesPayload<ProductionRecord>) => {
          handleRealtimeUpdate("Production", payload);
          if (payload.eventType === "INSERT") {
            setProduction((prev) => [payload.new as ProductionRecord, ...prev].slice(0, 50));
          } else if (payload.eventType === "UPDATE") {
            setProduction((prev) =>
              prev.map((item) => (item.id === (payload.new as ProductionRecord).id ? (payload.new as ProductionRecord) : item))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        (payload: RealtimePostgresChangesPayload<SalesRecord>) => {
          handleRealtimeUpdate("Sales", payload);
          if (payload.eventType === "INSERT") {
            setSales((prev) => [payload.new as SalesRecord, ...prev].slice(0, 50));
          } else if (payload.eventType === "UPDATE") {
            setSales((prev) =>
              prev.map((item) => (item.id === (payload.new as SalesRecord).id ? (payload.new as SalesRecord) : item))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "purchases" },
        (payload: RealtimePostgresChangesPayload<PurchaseRecord>) => {
          handleRealtimeUpdate("Purchases", payload);
          if (payload.eventType === "INSERT") {
            setPurchases((prev) => [payload.new as PurchaseRecord, ...prev].slice(0, 50));
          } else if (payload.eventType === "UPDATE") {
            setPurchases((prev) =>
              prev.map((item) => (item.id === (payload.new as PurchaseRecord).id ? (payload.new as PurchaseRecord) : item))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        (payload: RealtimePostgresChangesPayload<ExpenseRecord>) => {
          handleRealtimeUpdate("Expenses", payload);
          if (payload.eventType === "INSERT") {
            setExpenses((prev) => [payload.new as ExpenseRecord, ...prev].slice(0, 50));
          } else if (payload.eventType === "UPDATE") {
            setExpenses((prev) =>
              prev.map((item) => (item.id === (payload.new as ExpenseRecord).id ? (payload.new as ExpenseRecord) : item))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "problems" },
        (payload: RealtimePostgresChangesPayload<ProblemRecord>) => {
          handleRealtimeUpdate("Problems", payload);
          if (payload.eventType === "INSERT") {
            setProblems((prev) => [payload.new as ProblemRecord, ...prev].slice(0, 50));
          } else if (payload.eventType === "UPDATE") {
            setProblems((prev) =>
              prev.map((item) => (item.id === (payload.new as ProblemRecord).id ? (payload.new as ProblemRecord) : item))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleRealtimeUpdate = (table: string, payload: any) => {
    setLastUpdate(new Date());
    toast.info(`${table} updated: ${payload.eventType}`, {
      duration: 2000,
    });
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.user_id === userId);
    return user?.name || "Unknown";
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "-";
    return format(new Date(timestamp), "hh:mm a");
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container flex items-center justify-between h-12 sm:h-16 px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => navigate("/plant-manager/dashboard")}>
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-sm sm:text-base text-foreground">Admin Dashboard</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Real-time Monitor</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 animate-pulse" />
              <span className="hidden sm:inline">Live</span>
            </div>
            <Button variant="outline" size="sm" className="h-7 sm:h-9 text-xs sm:text-sm px-2 sm:px-3" onClick={fetchAllData}>
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-3 sm:px-4 py-4 sm:py-6">
        {/* Tabs with Data */}
        <Tabs defaultValue={initialTab} className="space-y-3 sm:space-y-4">
          {showAllTabs && (
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2 h-auto p-1">
              <TabsTrigger value="attendance" className="text-[10px] sm:text-sm px-1 sm:px-3 py-1.5">Attendance</TabsTrigger>
              <TabsTrigger value="production" className="text-[10px] sm:text-sm px-1 sm:px-3 py-1.5">Production</TabsTrigger>
              <TabsTrigger value="sales" className="text-[10px] sm:text-sm px-1 sm:px-3 py-1.5">Sales</TabsTrigger>
              <TabsTrigger value="purchases" className="text-[10px] sm:text-sm px-1 sm:px-3 py-1.5">Purchases</TabsTrigger>
              <TabsTrigger value="expenses" className="text-[10px] sm:text-sm px-1 sm:px-3 py-1.5">Expenses</TabsTrigger>
              <TabsTrigger value="problems" className="text-[10px] sm:text-sm px-1 sm:px-3 py-1.5">Problems</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="attendance">
            <Card className="border-0 shadow-lg">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  Attendance Records
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Real-time attendance from all plant managers</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                  {attendance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{getUserName(record.user_id)}</p>
                        <p className="text-[10px] sm:text-sm text-muted-foreground">{format(new Date(record.date), "PP")}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] sm:text-sm">
                          {formatTime(record.punch_in_time)} - {formatTime(record.punch_out_time)}
                        </p>
                        <Badge variant={record.status === "PRESENT" ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                          {record.status || "PENDING"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {attendance.length === 0 && (
                    <p className="text-center text-muted-foreground py-6 sm:py-8 text-xs sm:text-sm">No attendance records</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="production">
            <Card className="border-0 shadow-lg">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                  <Factory className="h-4 w-4 sm:h-5 sm:w-5" />
                  Production Records
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Real-time production logs from all plants</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                  {production.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{record.product_name}</p>
                        <p className="text-[10px] sm:text-sm text-muted-foreground truncate">
                          {getUserName(record.user_id)} • {record.labour_name}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-xs sm:text-sm">
                          {record.quantity} {record.unit}
                        </p>
                        <p className="text-[10px] sm:text-sm text-muted-foreground">{format(new Date(record.date), "PP")}</p>
                      </div>
                    </div>
                  ))}
                  {production.length === 0 && (
                    <p className="text-center text-muted-foreground py-6 sm:py-8 text-xs sm:text-sm">No production records</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card className="border-0 shadow-lg">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                  Sales Records
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Real-time sales from all plant managers</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                  {sales.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{record.customer_name}</p>
                        <p className="text-[10px] sm:text-sm text-muted-foreground truncate">
                          {record.product_name} • {getUserName(record.user_id)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-xs sm:text-sm">₹{record.total_amount.toLocaleString()}</p>
                        <Badge variant={record.payment_status === "PAID" ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                          {record.payment_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {sales.length === 0 && (
                    <p className="text-center text-muted-foreground py-6 sm:py-8 text-xs sm:text-sm">No sales records</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases">
            <Card className="border-0 shadow-lg">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  Purchase Records
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Real-time purchases from all plant managers</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                  {purchases.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{record.vendor_name}</p>
                        <p className="text-[10px] sm:text-sm text-muted-foreground truncate">
                          {record.item_name} • {getUserName(record.user_id)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-xs sm:text-sm">₹{record.total_amount.toLocaleString()}</p>
                        <Badge variant={record.payment_status === "PAID" ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                          {record.payment_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {purchases.length === 0 && (
                    <p className="text-center text-muted-foreground py-6 sm:py-8 text-xs sm:text-sm">No purchase records</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card className="border-0 shadow-lg">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                  Expense Records
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Real-time expenses from all plant managers</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                  {expenses.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{record.expense_head}</p>
                        <p className="text-[10px] sm:text-sm text-muted-foreground truncate">
                          {record.description} • {getUserName(record.user_id)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-xs sm:text-sm">₹{record.amount.toLocaleString()}</p>
                        <p className="text-[10px] sm:text-sm text-muted-foreground">{format(new Date(record.date), "PP")}</p>
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <p className="text-center text-muted-foreground py-6 sm:py-8 text-xs sm:text-sm">No expense records</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="problems">
            <Card className="border-0 shadow-lg">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                  Problem Reports
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Real-time issues from all plant managers</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                  {problems.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{record.problem_type}</p>
                        <p className="text-[10px] sm:text-sm text-muted-foreground truncate">
                          {record.description} • {getUserName(record.user_id)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge variant={record.status === "OPEN" ? "destructive" : "default"} className="text-[10px] sm:text-xs">
                          {record.status}
                        </Badge>
                        <p className="text-[10px] sm:text-sm text-muted-foreground">{format(new Date(record.date), "PP")}</p>
                      </div>
                    </div>
                  ))}
                  {problems.length === 0 && (
                    <p className="text-center text-muted-foreground py-6 sm:py-8 text-xs sm:text-sm">No problem reports</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

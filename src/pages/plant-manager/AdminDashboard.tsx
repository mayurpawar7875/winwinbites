import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/plant-manager/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">Real-time Activity Monitor</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4 text-green-500 animate-pulse" />
              <span className="hidden sm:inline">Live</span>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAllData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attendance.length}</p>
                <p className="text-xs text-muted-foreground">Attendance</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Factory className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{production.length}</p>
                <p className="text-xs text-muted-foreground">Production</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sales.length}</p>
                <p className="text-xs text-muted-foreground">Sales</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{purchases.length}</p>
                <p className="text-xs text-muted-foreground">Purchases</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expenses.length}</p>
                <p className="text-xs text-muted-foreground">Expenses</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{problems.filter((p) => p.status === "OPEN").length}</p>
                <p className="text-xs text-muted-foreground">Open Issues</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs with Data */}
        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 gap-2 h-auto p-1">
            <TabsTrigger value="attendance" className="text-xs sm:text-sm">Attendance</TabsTrigger>
            <TabsTrigger value="production" className="text-xs sm:text-sm">Production</TabsTrigger>
            <TabsTrigger value="sales" className="text-xs sm:text-sm">Sales</TabsTrigger>
            <TabsTrigger value="purchases" className="text-xs sm:text-sm">Purchases</TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs sm:text-sm">Expenses</TabsTrigger>
            <TabsTrigger value="problems" className="text-xs sm:text-sm">Problems</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Attendance Records
                </CardTitle>
                <CardDescription>Real-time attendance from all plant managers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {attendance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{getUserName(record.user_id)}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(record.date), "PPP")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          In: {formatTime(record.punch_in_time)} | Out: {formatTime(record.punch_out_time)}
                        </p>
                        <Badge variant={record.status === "PRESENT" ? "default" : "secondary"}>
                          {record.status || "PENDING"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {attendance.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No attendance records</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="production">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-5 w-5" />
                  Production Records
                </CardTitle>
                <CardDescription>Real-time production logs from all plants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {production.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{record.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {getUserName(record.user_id)} • {record.labour_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {record.quantity} {record.unit}
                        </p>
                        <p className="text-sm text-muted-foreground">{format(new Date(record.date), "PPP")}</p>
                      </div>
                    </div>
                  ))}
                  {production.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No production records</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Sales Records
                </CardTitle>
                <CardDescription>Real-time sales from all plant managers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {sales.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{record.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.product_name} • {getUserName(record.user_id)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{record.total_amount.toLocaleString()}</p>
                        <Badge variant={record.payment_status === "PAID" ? "default" : "secondary"}>
                          {record.payment_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {sales.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No sales records</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Purchase Records
                </CardTitle>
                <CardDescription>Real-time purchases from all plant managers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {purchases.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{record.vendor_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.item_name} • {getUserName(record.user_id)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{record.total_amount.toLocaleString()}</p>
                        <Badge variant={record.payment_status === "PAID" ? "default" : "secondary"}>
                          {record.payment_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {purchases.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No purchase records</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Expense Records
                </CardTitle>
                <CardDescription>Real-time expenses from all plant managers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {expenses.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{record.expense_head}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.description} • {getUserName(record.user_id)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{record.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(record.date), "PPP")}</p>
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No expense records</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="problems">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Problem Reports
                </CardTitle>
                <CardDescription>Real-time issues from all plant managers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {problems.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{record.problem_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.description} • {getUserName(record.user_id)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={record.status === "OPEN" ? "destructive" : "default"}>
                          {record.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground">{format(new Date(record.date), "PPP")}</p>
                      </div>
                    </div>
                  ))}
                  {problems.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No problem reports</p>
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

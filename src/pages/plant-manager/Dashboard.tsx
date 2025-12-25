import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Clock,
  Factory,
  Package,
  ShoppingCart,
  DollarSign,
  Wallet,
  CreditCard,
  AlertTriangle,
  History,
  LogOut,
  User,
  Shield,
  RefreshCw,
  CalendarIcon,
  IndianRupee,
} from "lucide-react";
import logo from "@/assets/win-win-bites-logo.jpg";

const modules = [
  {
    id: "attendance",
    title: "Attendance",
    description: "Punch In / Out",
    icon: Clock,
    path: "/plant-manager/attendance",
    color: "hsl(var(--primary))",
  },
  {
    id: "attendance-calendar",
    title: "Attendance Calendar",
    description: "Monthly view",
    icon: CalendarIcon,
    path: "/plant-manager/attendance-calendar",
    color: "hsl(199 89% 48%)",
  },
  {
    id: "production",
    title: "Production",
    description: "Daily output logs",
    icon: Factory,
    path: "/plant-manager/production",
    color: "hsl(var(--accent))",
  },
  {
    id: "inventory",
    title: "Inventory",
    description: "Stock management",
    icon: Package,
    path: "/plant-manager/inventory",
    color: "hsl(142 70% 45%)",
  },
  {
    id: "purchases",
    title: "Purchases",
    description: "Vendor orders",
    icon: ShoppingCart,
    path: "/plant-manager/purchases",
    color: "hsl(262 83% 58%)",
  },
  {
    id: "sales",
    title: "Sales & Invoicing",
    description: "Invoices & Collections",
    icon: DollarSign,
    path: "/plant-manager/sales",
    color: "hsl(199 89% 48%)",
  },
  {
    id: "expenses",
    title: "Expenses",
    description: "Daily expenses",
    icon: Wallet,
    path: "/plant-manager/expenses",
    color: "hsl(0 72% 51%)",
  },
  {
    id: "outstanding",
    title: "Outstanding",
    description: "Pending payments",
    icon: CreditCard,
    path: "/plant-manager/outstanding",
    color: "hsl(38 92% 50%)",
  },
  {
    id: "problems",
    title: "Problems",
    description: "Issues & Reports",
    icon: AlertTriangle,
    path: "/plant-manager/problems",
    color: "hsl(0 84% 60%)",
  },
];

const adminStats = [
  { id: "attendance", title: "Attendance", icon: Clock, color: "hsl(var(--primary))" },
  { id: "production", title: "Production", icon: Factory, color: "hsl(var(--accent))" },
  { id: "sales", title: "Sales", icon: DollarSign, color: "hsl(142 70% 45%)" },
  { id: "purchases", title: "Purchases", icon: ShoppingCart, color: "hsl(262 83% 58%)" },
  { id: "expenses", title: "Expenses", icon: Wallet, color: "hsl(0 72% 51%)" },
  { id: "problems", title: "Open Issues", icon: AlertTriangle, color: "hsl(38 92% 50%)" },
];

export default function Dashboard() {
  const { profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Admin stats state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [stats, setStats] = useState({
    attendance: 0,
    production: 0,
    sales: 0,
    purchases: 0,
    expenses: 0,
    problems: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminStats(selectedDate);
      setupRealtimeSubscriptions();
    }
  }, [isAdmin, selectedDate]);

  const fetchAdminStats = async (date: Date) => {
    setIsRefreshing(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      
      const [attendanceRes, productionRes, salesRes, purchasesRes, expensesRes, problemsRes] = await Promise.all([
        supabase.from("attendance").select("id", { count: "exact" }).eq("date", dateStr),
        supabase.from("production").select("id", { count: "exact" }).eq("date", dateStr),
        supabase.from("sales").select("id", { count: "exact" }).eq("date", dateStr),
        supabase.from("purchases").select("id", { count: "exact" }).eq("date", dateStr),
        supabase.from("expenses").select("id", { count: "exact" }).eq("date", dateStr),
        supabase.from("problems").select("id", { count: "exact" }).eq("status", "OPEN"),
      ]);

      setStats({
        attendance: attendanceRes.count || 0,
        production: productionRes.count || 0,
        sales: salesRes.count || 0,
        purchases: purchasesRes.count || 0,
        expenses: expensesRes.count || 0,
        problems: problemsRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel("admin-dashboard-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => fetchAdminStats(selectedDate))
      .on("postgres_changes", { event: "*", schema: "public", table: "production" }, () => fetchAdminStats(selectedDate))
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => fetchAdminStats(selectedDate))
      .on("postgres_changes", { event: "*", schema: "public", table: "purchases" }, () => fetchAdminStats(selectedDate))
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => fetchAdminStats(selectedDate))
      .on("postgres_changes", { event: "*", schema: "public", table: "problems" }, () => fetchAdminStats(selectedDate))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background ios-scroll">
      {/* Header with iOS safe area */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm safe-top">
        <div className="container flex items-center justify-between h-12 sm:h-16 px-3 sm:px-4 safe-x">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={logo} alt="Win Win Bites" className="h-8 sm:h-10 w-auto" />
            <div>
              <h1 className="font-bold text-sm sm:text-base text-foreground">
                {isAdmin ? "Admin Panel" : "Plant Manager"}
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {isAdmin ? "Real-time Monitor" : "Daily Reporting"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fetchAdminStats(selectedDate)}
                disabled={isRefreshing}
                className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground touch-target"
              >
                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            )}
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                <User className="h-4 w-4 text-secondary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">{profile?.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground hover:text-destructive touch-target"
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with iOS safe areas and better mobile spacing */}
      <main className="container px-3 sm:px-4 py-4 sm:py-6 pb-safe safe-x ios-scroll">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-base sm:text-xl font-bold text-foreground">Welcome, {profile?.name}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Admin Stats Grid */}
        {isAdmin && (
          <>
            {/* Date Picker */}
            <div className="flex items-center justify-between mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal text-xs sm:text-sm h-8 sm:h-10",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
                className="text-xs text-primary h-8"
              >
                Today
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
              {adminStats.map((stat) => {
                const Icon = stat.icon;
                const count = stats[stat.id as keyof typeof stats];
                return (
                  <Card
                    key={stat.id}
                    className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => navigate(`/plant-manager/admin?tab=${stat.id}&date=${format(selectedDate, "yyyy-MM-dd")}`)}
                  >
                    <div className="p-2 sm:p-4 flex flex-col items-center text-center gap-1 sm:gap-2">
                      <div
                        className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${stat.color}15` }}
                      >
                        <Icon className="h-4 w-4 sm:h-6 sm:w-6" style={{ color: stat.color }} />
                      </div>
                      <span className="text-lg sm:text-2xl font-bold text-foreground">{count}</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">{stat.title}</span>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Admin Navigation Cards */}
            <Card
              className="cursor-pointer border-0 shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] bg-primary/5"
              onClick={() => navigate(`/plant-manager/admin?date=${format(selectedDate, "yyyy-MM-dd")}`)}
            >
              <div className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl gradient-primary flex items-center justify-center">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">View All Activity</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Detailed real-time records</p>
                </div>
              </div>
            </Card>
            <Card
              className="mt-3 cursor-pointer border-0 shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99]"
              onClick={() => navigate("/plant-manager/users")}
            >
              <div className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-secondary flex items-center justify-center">
                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">User Management</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Create & manage users</p>
                </div>
              </div>
            </Card>
            <Card
              className="mt-3 cursor-pointer border-0 shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99]"
              onClick={() => navigate("/plant-manager/salary")}
            >
              <div className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">Salary Management</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Generate salary slips</p>
                </div>
              </div>
            </Card>
            <Card
              className="mt-3 cursor-pointer border-0 shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99]"
              onClick={() => navigate("/admin/attendance")}
            >
              <div className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">Attendance Management</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">View all employee attendance</p>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Module Grid - Only show for non-admin users */}
        {!isAdmin && (
          <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Card
                  key={module.id}
                  className="group cursor-pointer border-0 shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
                  onClick={() => navigate(module.path)}
                >
                  <div className="p-3 sm:p-6 flex flex-col items-center text-center gap-2 sm:gap-3">
                    <div
                      className="h-10 w-10 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${module.color}15` }}
                    >
                      <Icon
                        className="h-5 w-5 sm:h-8 sm:w-8"
                        style={{ color: module.color }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-xs sm:text-base">
                        {module.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                        {module.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* History and Salary Links - Only show for non-admin users */}
        {!isAdmin && (
          <>
            <Card
              className="mt-4 sm:mt-6 cursor-pointer border-0 shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99]"
              onClick={() => navigate("/plant-manager/history")}
            >
              <div className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-secondary flex items-center justify-center">
                  <History className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">View History</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Browse past entries</p>
                </div>
              </div>
            </Card>
            <Card
              className="mt-3 cursor-pointer border-0 shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99]"
              onClick={() => navigate("/plant-manager/my-salary-slips")}
            >
              <div className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">My Salary Slips</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">View your salary history</p>
                </div>
              </div>
            </Card>
            <Card
              className="mt-3 cursor-pointer border-0 shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99]"
              onClick={() => navigate("/plant-manager/my-advances")}
            >
              <div className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">My Advances</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">View advance balance</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
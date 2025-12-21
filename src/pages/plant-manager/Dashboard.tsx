import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
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

export default function Dashboard() {
  const { profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container flex items-center justify-between h-12 sm:h-16 px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={logo} alt="Win Win Bites" className="h-8 sm:h-10 w-auto" />
            <div>
              <h1 className="font-bold text-sm sm:text-base text-foreground">Plant Manager</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Daily Reporting</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
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
              className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-3 sm:px-4 py-4 sm:py-6">
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

        {/* Module Grid */}
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

        {/* History Link */}
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

        {/* Admin: User Management */}
        {isAdmin && (
          <>
            <Card
              className="mt-3 sm:mt-4 cursor-pointer border-0 shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] bg-primary/5"
              onClick={() => navigate("/plant-manager/admin")}
            >
              <div className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl gradient-primary flex items-center justify-center">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">Admin Dashboard</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Real-time activity monitor</p>
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
          </>
        )}
      </main>
    </div>
  );
}

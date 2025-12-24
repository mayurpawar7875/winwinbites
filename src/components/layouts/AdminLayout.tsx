import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Shield,
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Wallet,
  Settings,
  Receipt,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/win-win-bites-logo.jpg";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const navItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/admin/dashboard",
  },
  {
    title: "Attendance",
    icon: Calendar,
    path: "/admin/attendance",
  },
  {
    title: "Leave Requests",
    icon: FileText,
    path: "/admin/leave-requests",
  },
  {
    title: "User Management",
    icon: Users,
    path: "/admin/users",
  },
];

const salarySubItems = [
  {
    title: "Generate Slip",
    path: "/admin/salary",
  },
  {
    title: "Settings",
    path: "/admin/salary/settings",
  },
  {
    title: "Advances",
    path: "/admin/salary/advances",
  },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile, isAdmin } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };
  const [salaryMenuOpen, setSalaryMenuOpen] = useState(
    location.pathname.startsWith("/admin/salary")
  );

  const isActive = (path: string) => location.pathname === path;
  const isSalaryActive = location.pathname.startsWith("/admin/salary");

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={logo}
                  alt="Logo"
                  className="h-10 w-10 rounded-lg object-cover"
                />
                <div>
                  <h1 className="font-bold text-sm text-foreground">Admin Panel</h1>
                  <p className="text-[10px] text-muted-foreground">Win Win Bites</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile?.name || "Admin"}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-3">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10",
                    isActive(item.path) && "bg-primary/10 text-primary font-medium"
                  )}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.title}</span>
                  {isActive(item.path) && <ChevronRight className="h-4 w-4" />}
                </Button>
              ))}

              {/* Salary Management with submenu */}
              <Collapsible open={salaryMenuOpen} onOpenChange={setSalaryMenuOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant={isSalaryActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-10",
                      isSalaryActive && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <Wallet className="h-4 w-4" />
                    <span className="flex-1 text-left">Salary</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        salaryMenuOpen && "rotate-180"
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 mt-1 space-y-1">
                  {salarySubItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={isActive(item.path) ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "w-full justify-start gap-3 h-9",
                        isActive(item.path) && "bg-primary/10 text-primary font-medium"
                      )}
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                    >
                      {item.title === "Generate Slip" && <Receipt className="h-3.5 w-3.5" />}
                      {item.title === "Settings" && <Settings className="h-3.5 w-3.5" />}
                      {item.title === "Advances" && <CreditCard className="h-3.5 w-3.5" />}
                      <span>{item.title}</span>
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-3 border-t border-border space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-10 text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/plant-manager/dashboard")}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Switch to User View</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 bg-card border-b border-border lg:hidden">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">Admin Panel</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Page Content - Add bottom padding for mobile nav */}
        <main className="flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border lg:hidden">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full px-2 rounded-lg transition-colors",
                  isActive(item.path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform",
                  isActive(item.path) && "scale-110"
                )} />
                <span className={cn(
                  "text-[10px] font-medium truncate max-w-full",
                  isActive(item.path) && "font-semibold"
                )}>
                  {item.title.split(" ")[0]}
                </span>
                {isActive(item.path) && (
                  <div className="absolute bottom-1 h-1 w-6 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

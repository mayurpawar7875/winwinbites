import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Users,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Activity,
  ArrowRight,
  Loader2,
  UserCheck,
  Timer,
} from "lucide-react";
import { format, differenceInMinutes } from "date-fns";

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  pendingRequests: number;
  incompleteAttendance: number;
}

interface ActiveEmployee {
  id: string;
  user_id: string;
  user_name: string | null;
  punch_in_time: string | null;
  status: string | null;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    presentToday: 0,
    pendingRequests: 0,
    incompleteAttendance: 0,
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<ActiveEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Access denied. Admin only.");
      navigate("/plant-manager/dashboard", { replace: true });
      return;
    }
    fetchDashboardData();

    // Set up real-time subscription for attendance changes
    const channel = supabase
      .channel('admin-dashboard-attendance')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `date=eq.${today}`
        },
        (payload) => {
          console.log('Attendance change:', payload);
          fetchDashboardData(); // Refetch on any attendance change
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leave_requests'
        },
        (payload) => {
          console.log('Leave request change:', payload);
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, navigate, today]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [employeesRes, attendanceRes, requestsRes] = await Promise.all([
        supabase.from("profiles").select("id").eq("is_active", true),
        supabase.from("attendance").select("*").eq("date", today),
        supabase.from("leave_requests").select("*").eq("status", "PENDING").order("created_at", { ascending: false }).limit(5),
      ]);

      const totalEmployees = employeesRes.data?.length || 0;
      const attendance = attendanceRes.data || [];
      const presentToday = attendance.filter((a) => a.punch_in_time && a.punch_out_time).length;
      const incompleteAttendance = attendance.filter((a) => a.punch_in_time && !a.punch_out_time).length;
      const pendingRequests = requestsRes.data?.length || 0;

      // Get active employees (punched in but not punched out)
      const active = attendance
        .filter((a) => a.punch_in_time && !a.punch_out_time)
        .map((a) => ({
          id: a.id,
          user_id: a.user_id,
          user_name: a.user_name,
          punch_in_time: a.punch_in_time,
          status: a.status,
        }));

      setActiveEmployees(active);
      setStats({
        totalEmployees,
        presentToday,
        pendingRequests,
        incompleteAttendance,
      });
      setRecentRequests(requestsRes.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const getWorkingDuration = (punchInTime: string) => {
    const punchIn = new Date(punchInTime);
    const now = new Date();
    const mins = differenceInMinutes(now, punchIn);
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (!isAdmin) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4 text-green-500 animate-pulse" />
          <span className="hidden sm:inline">Live</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/users")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                <p className="text-xs text-muted-foreground">Total Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/attendance")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.presentToday}</p>
                <p className="text-xs text-muted-foreground">Present Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/attendance")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.incompleteAttendance}</p>
                <p className="text-xs text-muted-foreground">Incomplete</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/leave-requests")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                <p className="text-xs text-muted-foreground">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Employees - Real-time Section */}
      <Card className="border-0 shadow-lg border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-500" />
                Active Employees
                <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-600 border-green-500/30">
                  {activeEmployees.length} Working
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Employees currently on duty (real-time)</CardDescription>
            </div>
            <Activity className="h-4 w-4 text-green-500 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          {activeEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-40" />
              No employees currently working
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-500/5 to-transparent border border-green-500/20 hover:border-green-500/40 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-green-600">
                      {employee.user_name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{employee.user_name || "Unknown"}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      <span>In: {employee.punch_in_time ? format(new Date(employee.punch_in_time), "hh:mm a") : "-"}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-xs shrink-0">
                    {employee.punch_in_time ? getWorkingDuration(employee.punch_in_time) : "-"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions & Recent Requests */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-between h-11"
              onClick={() => navigate("/admin/attendance")}
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                View All Attendance
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between h-11"
              onClick={() => navigate("/admin/leave-requests")}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Manage Leave Requests
                {stats.pendingRequests > 0 && (
                  <Badge variant="destructive" className="ml-2">{stats.pendingRequests}</Badge>
                )}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between h-11"
              onClick={() => navigate("/admin/users")}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Manage Users
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Pending Requests
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Recent leave & overtime requests</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No pending requests
              </div>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate("/admin/leave-requests")}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{request.user_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {request.request_type === "LEAVE" ? "Leave" : "Overtime"} • {format(new Date(request.request_date), "PP")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {request.request_type === "LEAVE"
                        ? request.leave_type === "FULL_DAY"
                          ? "Full Day"
                          : "Half Day"
                        : `${request.overtime_hours}h OT`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

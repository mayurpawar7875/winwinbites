import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import AdminLayout from "@/components/layouts/AdminLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/plant-manager/Dashboard";
import Attendance from "./pages/plant-manager/Attendance";
import AttendanceCalendar from "./pages/plant-manager/AttendanceCalendar";
import Production from "./pages/plant-manager/Production";
import Inventory from "./pages/plant-manager/Inventory";
import Sales from "./pages/plant-manager/Sales";
import Purchases from "./pages/plant-manager/Purchases";
import Expenses from "./pages/plant-manager/Expenses";
import Outstanding from "./pages/plant-manager/Outstanding";
import Problems from "./pages/plant-manager/Problems";
import History from "./pages/plant-manager/History";
import UserManagement from "./pages/plant-manager/UserManagement";
import Salary from "./pages/plant-manager/Salary";
import MySalarySlips from "./pages/plant-manager/MySalarySlips";
import MyAdvances from "./pages/plant-manager/MyAdvances";

import AdminDashboardPage from "./pages/admin/Dashboard";
import AdminAttendance from "./pages/admin/AdminAttendance";
import LeaveRequests from "./pages/admin/LeaveRequests";
import AdminUsers from "./pages/admin/Users";
import SalaryManagement from "./pages/admin/SalaryManagement";
import SalarySettings from "./pages/admin/SalarySettings";
import Advances from "./pages/admin/Advances";
import GenerateSalarySlip from "./pages/admin/GenerateSalarySlip";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/install" element={<Install />} />
            
            {/* Plant Manager Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/plant-manager/dashboard" element={<Dashboard />} />
              <Route path="/plant-manager/attendance" element={<Attendance />} />
              <Route path="/plant-manager/attendance-calendar" element={<AttendanceCalendar />} />
              <Route path="/plant-manager/production" element={<Production />} />
              <Route path="/plant-manager/inventory" element={<Inventory />} />
              <Route path="/plant-manager/sales" element={<Sales />} />
              <Route path="/plant-manager/purchases" element={<Purchases />} />
              <Route path="/plant-manager/expenses" element={<Expenses />} />
              <Route path="/plant-manager/outstanding" element={<Outstanding />} />
              <Route path="/plant-manager/problems" element={<Problems />} />
              <Route path="/plant-manager/history" element={<History />} />
              <Route path="/plant-manager/users" element={<UserManagement />} />
              <Route path="/plant-manager/salary" element={<Salary />} />
              <Route path="/plant-manager/my-salary-slips" element={<MySalarySlips />} />
              <Route path="/plant-manager/my-advances" element={<MyAdvances />} />
            </Route>
            
            {/* Admin Routes with Admin Layout - Server-side role enforcement */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/attendance" element={<AdminAttendance />} />
                <Route path="/admin/leave-requests" element={<LeaveRequests />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/salary" element={<SalaryManagement />} />
                <Route path="/admin/salary/generate" element={<GenerateSalarySlip />} />
                <Route path="/admin/salary/settings" element={<SalarySettings />} />
                <Route path="/admin/salary/advances" element={<Advances />} />
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

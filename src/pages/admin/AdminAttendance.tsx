import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  subDays,
} from "date-fns";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  Users,
  List,
  Eye,
  Image,
  FileText,
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string;
  user_id: string;
  punch_in_time: string | null;
  punch_in_photo_url: string | null;
  punch_in_lat: number | null;
  punch_in_lng: number | null;
  punch_out_time: string | null;
  punch_out_photo_url: string | null;
  punch_out_lat: number | null;
  punch_out_lng: number | null;
  status: string | null;
  working_hours: number | null;
  user_name: string | null;
}

interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  is_active: boolean;
}

type AttendanceStatus = "PRESENT" | "INCOMPLETE" | "ABSENT";
type StatusFilter = "ALL" | "PRESENT" | "INCOMPLETE";

const getAttendanceStatus = (
  record: AttendanceRecord | undefined
): AttendanceStatus => {
  if (!record || !record.punch_in_time) return "ABSENT";
  if (record.punch_in_time && record.punch_out_time) return "PRESENT";
  return "INCOMPLETE";
};

const getStatusColor = (status: AttendanceStatus) => {
  switch (status) {
    case "PRESENT":
      return "bg-success";
    case "INCOMPLETE":
      return "bg-warning";
    default:
      return "";
  }
};

const getStatusBadge = (status: AttendanceStatus) => {
  switch (status) {
    case "PRESENT":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
          <CheckCircle2 className="h-3 w-3" />
          Present
        </span>
      );
    case "INCOMPLETE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
          <AlertCircle className="h-3 w-3" />
          Incomplete
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
          Absent
        </span>
      );
  }
};

export default function AdminAttendance() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Filters
  const [dateFrom, setDateFrom] = useState(
    format(subDays(new Date(), 7), "yyyy-MM-dd")
  );
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedEmployee, setSelectedEmployee] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  // Data
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarEmployee, setCalendarEmployee] = useState<string>("");

  // Modal state
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selfieModalOpen, setSelfieModalOpen] = useState(false);
  const [selfieUrls, setSelfieUrls] = useState<{
    punchIn: string | null;
    punchOut: string | null;
  }>({ punchIn: null, punchOut: null });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Access denied. Admin only.");
      navigate("/plant-manager/dashboard", { replace: true });
      return;
    }
    fetchEmployees();
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (employees.length > 0) {
      fetchAttendanceRecords();
    }
  }, [dateFrom, dateTo, selectedEmployee, statusFilter, employees]);

  useEffect(() => {
    if (calendarEmployee) {
      fetchCalendarRecords();
    }
  }, [calendarEmployee, currentMonth]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, email, is_active")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setEmployees(data || []);
      if (data && data.length > 0) {
        setCalendarEmployee(data[0].user_id);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
    }
  };

  const fetchAttendanceRecords = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("attendance")
        .select("*")
        .gte("date", dateFrom)
        .lte("date", dateTo)
        .order("date", { ascending: false });

      if (selectedEmployee !== "ALL") {
        query = query.eq("user_id", selectedEmployee);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Add user names from profiles
      const recordsWithNames = (data || []).map((record) => {
        const employee = employees.find((e) => e.user_id === record.user_id);
        return {
          ...record,
          user_name: record.user_name || employee?.name || "Unknown",
        };
      });

      // Filter by status
      let filtered = recordsWithNames;
      if (statusFilter === "PRESENT") {
        filtered = recordsWithNames.filter(
          (r) => r.punch_in_time && r.punch_out_time
        );
      } else if (statusFilter === "INCOMPLETE") {
        filtered = recordsWithNames.filter(
          (r) => r.punch_in_time && !r.punch_out_time
        );
      }

      setRecords(filtered);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance records");
    } finally {
      setIsLoading(false);
    }
  };

  // Calendar records for selected employee
  const [calendarRecords, setCalendarRecords] = useState<AttendanceRecord[]>(
    []
  );

  const fetchCalendarRecords = async () => {
    if (!calendarEmployee) return;

    try {
      const startDate = format(monthStart, "yyyy-MM-dd");
      const endDate = format(monthEnd, "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", calendarEmployee)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      if (error) throw error;
      setCalendarRecords(data || []);
    } catch (error) {
      console.error("Error fetching calendar records:", error);
    }
  };

  const calendarRecordsByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    calendarRecords.forEach((record) => {
      map.set(record.date, record);
    });
    return map;
  }, [calendarRecords]);

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const record = calendarRecordsByDate.get(dateStr);
    setSelectedDate(date);
    setSelectedRecord(record || null);
    setIsModalOpen(true);
  };

  const openGoogleMaps = (lat: number | null, lng: number | null) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
    }
  };

  const openSelfieModal = (record: AttendanceRecord) => {
    setSelfieUrls({
      punchIn: record.punch_in_photo_url,
      punchOut: record.punch_out_photo_url,
    });
    setSelfieModalOpen(true);
  };

  const startDay = getDay(monthStart);
  const paddingDays = Array(startDay).fill(null);

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container flex items-center h-12 sm:h-14 px-3 sm:px-4 gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={() => navigate("/plant-manager/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <div>
              <h1 className="font-bold text-sm sm:text-base text-foreground">
                Attendance Management
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                View all employee attendance
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex items-center gap-2"
            onClick={() => navigate("/admin/leave-requests")}
          >
            <FileText className="h-4 w-4" />
            Leave Requests
          </Button>
        </div>
      </header>

      <main className="container px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {/* Mobile Leave Requests Button */}
        <Button
          variant="outline"
          className="w-full sm:hidden flex items-center justify-center gap-2"
          onClick={() => navigate("/admin/leave-requests")}
        >
          <FileText className="h-4 w-4" />
          Manage Leave & Overtime Requests
        </Button>
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List View</span>
              <span className="sm:hidden">List</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar View</span>
              <span className="sm:hidden">Calendar</span>
            </TabsTrigger>
          </TabsList>

          {/* List View */}
          <TabsContent value="list" className="space-y-4">
            {/* Filters */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-sm sm:text-base">Filters</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">From Date</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">To Date</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Employee</Label>
                    <Select
                      value={selectedEmployee}
                      onValueChange={setSelectedEmployee}
                    >
                      <SelectTrigger className="h-9 text-xs sm:text-sm">
                        <SelectValue placeholder="All Employees" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Employees</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.user_id} value={emp.user_id}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={statusFilter}
                      onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                    >
                      <SelectTrigger className="h-9 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All</SelectItem>
                        <SelectItem value="PRESENT">Present</SelectItem>
                        <SelectItem value="INCOMPLETE">Incomplete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Records Table */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : records.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No attendance records found
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="block sm:hidden divide-y">
                      {records.map((record) => (
                        <div key={record.id} className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">
                                {record.user_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(record.date), "PP")}
                              </p>
                            </div>
                            {getStatusBadge(getAttendanceStatus(record))}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">Punch In</p>
                              <p className="font-medium">
                                {record.punch_in_time
                                  ? format(
                                      new Date(record.punch_in_time),
                                      "h:mm a"
                                    )
                                  : "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Punch Out</p>
                              <p className="font-medium">
                                {record.punch_out_time
                                  ? format(
                                      new Date(record.punch_out_time),
                                      "h:mm a"
                                    )
                                  : "-"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {(record.punch_in_photo_url ||
                              record.punch_out_photo_url) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs h-7"
                                onClick={() => openSelfieModal(record)}
                              >
                                <Image className="h-3 w-3 mr-1" />
                                Selfies
                              </Button>
                            )}
                            {(record.punch_in_lat || record.punch_out_lat) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs h-7"
                                onClick={() =>
                                  openGoogleMaps(
                                    record.punch_in_lat,
                                    record.punch_in_lng
                                  )
                                }
                              >
                                <MapPin className="h-3 w-3 mr-1" />
                                Map
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Employee</TableHead>
                            <TableHead>Punch In</TableHead>
                            <TableHead>Punch Out</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {records.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell className="text-sm">
                                {format(new Date(record.date), "PP")}
                              </TableCell>
                              <TableCell className="font-medium">
                                {record.user_name}
                              </TableCell>
                              <TableCell>
                                {record.punch_in_time
                                  ? format(
                                      new Date(record.punch_in_time),
                                      "h:mm a"
                                    )
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                {record.punch_out_time
                                  ? format(
                                      new Date(record.punch_out_time),
                                      "h:mm a"
                                    )
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(getAttendanceStatus(record))}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {(record.punch_in_photo_url ||
                                    record.punch_out_photo_url) && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => openSelfieModal(record)}
                                    >
                                      <Image className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {record.punch_in_lat && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() =>
                                        openGoogleMaps(
                                          record.punch_in_lat,
                                          record.punch_in_lng
                                        )
                                      }
                                    >
                                      <MapPin className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar" className="space-y-4">
            {/* Employee Selector */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-1">
                  <Label className="text-xs">Select Employee</Label>
                  <Select
                    value={calendarEmployee}
                    onValueChange={setCalendarEmployee}
                  >
                    <SelectTrigger className="h-9 text-xs sm:text-sm max-w-xs">
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.user_id} value={emp.user_id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-sm sm:text-lg">
                    {format(currentMonth, "MMMM yyyy")}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    disabled={isSameMonth(currentMonth, new Date())}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-2 sm:px-4 pb-3 sm:pb-4">
                {/* Legend */}
                <div className="flex items-center justify-center gap-4 sm:gap-6 mb-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-success" />
                    <span className="text-muted-foreground">Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-warning" />
                    <span className="text-muted-foreground">Incomplete</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                    <span className="text-muted-foreground">Absent</span>
                  </div>
                </div>

                {/* Calendar Container - constrained width on desktop */}
                <div className="max-w-md mx-auto">
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 mb-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                      <div
                        key={`${day}-${idx}`}
                        className="text-center text-[10px] sm:text-xs font-semibold text-muted-foreground py-1.5"
                      >
                        <span className="hidden sm:inline">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][idx]}
                        </span>
                        <span className="sm:hidden">{day}</span>
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid - tighter spacing */}
                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                    {paddingDays.map((_, index) => (
                      <div key={`pad-${index}`} className="aspect-square" />
                    ))}

                    {daysInMonth.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const record = calendarRecordsByDate.get(dateStr);
                      const status = getAttendanceStatus(record);
                      const isToday = isSameDay(day, new Date());
                      const isFuture = day > new Date();

                      return (
                        <button
                          key={dateStr}
                          onClick={() => !isFuture && handleDayClick(day)}
                          disabled={isFuture}
                          className={`
                            aspect-square rounded-md sm:rounded-lg flex flex-col items-center justify-center 
                            text-xs sm:text-sm font-medium transition-all
                            ${isFuture ? "opacity-30 cursor-not-allowed" : "hover:bg-muted/80 cursor-pointer active:scale-95"}
                            ${isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}
                            ${status === "PRESENT" && !isFuture ? "bg-success/10" : ""}
                            ${status === "INCOMPLETE" && !isFuture ? "bg-warning/10" : ""}
                          `}
                        >
                          <span className={`${isToday ? "text-primary font-bold" : ""}`}>
                            {format(day, "d")}
                          </span>
                          {!isFuture && (
                            <div
                              className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full mt-0.5 ${getStatusColor(status)}`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-success">
                    {calendarRecords.filter((r) => r.punch_in_time && r.punch_out_time).length}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    Present
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-warning">
                    {calendarRecords.filter((r) => r.punch_in_time && !r.punch_out_time).length}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    Incomplete
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-muted-foreground">
                    {daysInMonth.filter((d) => d <= new Date()).length - calendarRecords.length}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    Absent
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              {getStatusBadge(getAttendanceStatus(selectedRecord || undefined))}
            </div>

            {selectedRecord ? (
              <>
                {/* Punch In */}
                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4 text-primary" />
                    Punch In
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Time</p>
                      <p className="text-sm font-medium">
                        {selectedRecord.punch_in_time
                          ? format(
                              new Date(selectedRecord.punch_in_time),
                              "h:mm a"
                            )
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Selfie</p>
                      {selectedRecord.punch_in_photo_url ? (
                        <img
                          src={selectedRecord.punch_in_photo_url}
                          alt="Punch In"
                          className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:opacity-80"
                          onClick={() =>
                            setPhotoPreview(selectedRecord.punch_in_photo_url!)
                          }
                        />
                      ) : (
                        <p className="text-sm">-</p>
                      )}
                    </div>
                  </div>
                  {selectedRecord.punch_in_lat &&
                    selectedRecord.punch_in_lng && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 text-xs"
                        onClick={() =>
                          openGoogleMaps(
                            selectedRecord.punch_in_lat,
                            selectedRecord.punch_in_lng
                          )
                        }
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        Open in Google Maps
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                </div>

                {/* Punch Out */}
                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4 text-primary" />
                    Punch Out
                  </div>
                  {selectedRecord.punch_out_time ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            Time
                          </p>
                          <p className="text-sm font-medium">
                            {format(
                              new Date(selectedRecord.punch_out_time),
                              "h:mm a"
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            Selfie
                          </p>
                          {selectedRecord.punch_out_photo_url ? (
                            <img
                              src={selectedRecord.punch_out_photo_url}
                              alt="Punch Out"
                              className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:opacity-80"
                              onClick={() =>
                                setPhotoPreview(
                                  selectedRecord.punch_out_photo_url!
                                )
                              }
                            />
                          ) : (
                            <p className="text-sm">-</p>
                          )}
                        </div>
                      </div>
                      {selectedRecord.punch_out_lat &&
                        selectedRecord.punch_out_lng && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2 text-xs"
                            onClick={() =>
                              openGoogleMaps(
                                selectedRecord.punch_out_lat,
                                selectedRecord.punch_out_lng
                              )
                            }
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            Open in Google Maps
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Not punched out
                    </p>
                  )}
                </div>

                {selectedRecord.working_hours && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                    <span className="text-sm">Total Working Hours</span>
                    <span className="font-bold">
                      {selectedRecord.working_hours.toFixed(1)} hours
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No attendance record for this date</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Selfie Modal */}
      <Dialog open={selfieModalOpen} onOpenChange={setSelfieModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Attendance Selfies</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-center">Punch In</p>
              {selfieUrls.punchIn ? (
                <img
                  src={selfieUrls.punchIn}
                  alt="Punch In"
                  className="w-full h-auto rounded-lg cursor-pointer"
                  onClick={() => setPhotoPreview(selfieUrls.punchIn)}
                />
              ) : (
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                  No photo
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-center">Punch Out</p>
              {selfieUrls.punchOut ? (
                <img
                  src={selfieUrls.punchOut}
                  alt="Punch Out"
                  className="w-full h-auto rounded-lg cursor-pointer"
                  onClick={() => setPhotoPreview(selfieUrls.punchOut)}
                />
              ) : (
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                  No photo
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Preview Modal */}
      <Dialog open={!!photoPreview} onOpenChange={() => setPhotoPreview(null)}>
        <DialogContent className="max-w-lg p-0">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-background/80"
            onClick={() => setPhotoPreview(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Full size"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

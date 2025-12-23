import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type AttendanceStatus = "PRESENT" | "INCOMPLETE" | "ABSENT";

const getAttendanceStatus = (record: AttendanceRecord | undefined): AttendanceStatus => {
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

export default function AttendanceCalendar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create a map for quick lookup
  const recordsByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    records.forEach((record) => {
      map.set(record.date, record);
    });
    return map;
  }, [records]);

  useEffect(() => {
    fetchMonthAttendance();
  }, [currentMonth, user]);

  const fetchMonthAttendance = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const startDate = format(monthStart, "yyyy-MM-dd");
      const endDate = format(monthEnd, "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const record = recordsByDate.get(dateStr);
    setSelectedDate(date);
    setSelectedRecord(record || null);
    setIsModalOpen(true);
  };

  const openGoogleMaps = (lat: number | null, lng: number | null) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
    }
  };

  const openPhotoPreview = (url: string) => {
    setPhotoPreview(url);
  };

  // Get the day of week the month starts on (0 = Sunday)
  const startDay = getDay(monthStart);
  const paddingDays = Array(startDay).fill(null);

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
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <div>
              <h1 className="font-bold text-sm sm:text-base text-foreground">
                Attendance Calendar
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Your monthly attendance
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {/* Month Navigation */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
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
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mb-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-warning" />
                    <span>Incomplete</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted" />
                    <span>Absent</span>
                  </div>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-1"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Padding for start of month */}
                  {paddingDays.map((_, index) => (
                    <div key={`pad-${index}`} className="aspect-square" />
                  ))}

                  {/* Days */}
                  {daysInMonth.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const record = recordsByDate.get(dateStr);
                    const status = getAttendanceStatus(record);
                    const isToday = isSameDay(day, new Date());
                    const isFuture = day > new Date();

                    return (
                      <button
                        key={dateStr}
                        onClick={() => !isFuture && handleDayClick(day)}
                        disabled={isFuture}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs sm:text-sm transition-all ${
                          isFuture
                            ? "opacity-30 cursor-not-allowed"
                            : "hover:bg-muted cursor-pointer"
                        } ${isToday ? "ring-2 ring-primary" : ""}`}
                      >
                        <span
                          className={`${isToday ? "font-bold text-primary" : ""}`}
                        >
                          {format(day, "d")}
                        </span>
                        {!isFuture && (
                          <div
                            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-0.5 ${getStatusColor(
                              status
                            )}`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-success">
                {records.filter((r) => r.punch_in_time && r.punch_out_time).length}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">
                Present
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-warning">
                {records.filter((r) => r.punch_in_time && !r.punch_out_time).length}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">
                Incomplete
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-muted-foreground">
                {daysInMonth.filter((d) => d <= new Date()).length - records.length}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">
                Absent
              </div>
            </CardContent>
          </Card>
        </div>
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
            {/* Status */}
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
                          ? format(new Date(selectedRecord.punch_in_time), "h:mm a")
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
                            openPhotoPreview(selectedRecord.punch_in_photo_url!)
                          }
                        />
                      ) : (
                        <p className="text-sm">-</p>
                      )}
                    </div>
                  </div>
                  {selectedRecord.punch_in_lat && selectedRecord.punch_in_lng && (
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
                          <p className="text-[10px] text-muted-foreground">Time</p>
                          <p className="text-sm font-medium">
                            {format(new Date(selectedRecord.punch_out_time), "h:mm a")}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Selfie</p>
                          {selectedRecord.punch_out_photo_url ? (
                            <img
                              src={selectedRecord.punch_out_photo_url}
                              alt="Punch Out"
                              className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:opacity-80"
                              onClick={() =>
                                openPhotoPreview(selectedRecord.punch_out_photo_url!)
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
                    <p className="text-sm text-muted-foreground">Not punched out</p>
                  )}
                </div>

                {/* Working Hours */}
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

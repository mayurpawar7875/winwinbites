import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useCamera } from "@/hooks/useCamera";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Camera,
  MapPin,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Users,
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
  user_name?: string;
}

const getStatusBadge = (record: AttendanceRecord) => {
  // If punch out is complete, show status based on working hours
  if (record.punch_out_time && record.status) {
    if (record.status === 'PRESENT') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
          <CheckCircle2 className="h-3 w-3" />
          Present ({record.working_hours?.toFixed(1)}h)
        </span>
      );
    } else if (record.status === 'HALF_DAY') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
          <Clock className="h-3 w-3" />
          Half Day ({record.working_hours?.toFixed(1)}h)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
          <XCircle className="h-3 w-3" />
          Absent ({record.working_hours?.toFixed(1)}h)
        </span>
      );
    }
  }
  
  // Still working (punched in but not out)
  if (record.punch_in_time && !record.punch_out_time) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
        <Clock className="h-3 w-3" />
        Working
      </span>
    );
  }
  
  // No punch in
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
      <XCircle className="h-3 w-3" />
      Absent
    </span>
  );
};

export default function Attendance() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { latitude, longitude, error: geoError, isLoading: geoLoading, getLocation } = useGeolocation();
  const { photoDataUrl, photoFile, inputRef, capturePhoto, handleFileChange, clearPhoto } = useCamera();

  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (isAdmin) {
      fetchAllTodayAttendance();
    } else {
      fetchTodayAttendance();
      getLocation().catch(() => {});
    }
  }, [isAdmin]);

  const fetchTodayAttendance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (error) throw error;
      setTodayRecord(data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllTodayAttendance = async () => {
    try {
      // Fetch all attendance records for today
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", today)
        .order("punch_in_time", { ascending: true });

      if (attendanceError) throw attendanceError;

      // Fetch profiles to get user names
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name");

      if (profilesError) throw profilesError;

      // Map user names to attendance records
      const recordsWithNames = (attendanceData || []).map((record) => {
        const profile = profilesData?.find((p) => p.user_id === record.user_id);
        return {
          ...record,
          user_name: profile?.name || "Unknown User",
        };
      });

      setAllRecords(recordsWithNames);
    } catch (error) {
      console.error("Error fetching all attendance:", error);
      toast.error("Failed to load attendance records");
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPhoto = async (file: File, type: "punch-in" | "punch-out"): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user!.id}/${today}-${type}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("attendance-photos")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("attendance-photos")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handlePunchIn = async () => {
    if (!photoFile) {
      toast.error("Please take a selfie first");
      return;
    }

    const lat = latitude ?? (manualLat ? parseFloat(manualLat) : null);
    const lng = longitude ?? (manualLng ? parseFloat(manualLng) : null);

    if (!lat || !lng) {
      toast.error("Please enable location or enter coordinates manually");
      return;
    }

    setIsSubmitting(true);

    try {
      const photoUrl = await uploadPhoto(photoFile, "punch-in");

      const { error } = await supabase.from("attendance").insert({
        user_id: user!.id,
        date: today,
        punch_in_time: new Date().toISOString(),
        punch_in_photo_url: photoUrl,
        punch_in_lat: lat,
        punch_in_lng: lng,
      });

      if (error) throw error;

      toast.success("Punched in successfully!");
      clearPhoto();
      fetchTodayAttendance();
    } catch (error: any) {
      console.error("Punch in error:", error);
      toast.error(error.message || "Failed to punch in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePunchOut = async () => {
    if (!photoFile) {
      toast.error("Please take a selfie first");
      return;
    }

    if (!todayRecord) {
      toast.error("No punch-in record found");
      return;
    }

    const lat = latitude ?? (manualLat ? parseFloat(manualLat) : null);
    const lng = longitude ?? (manualLng ? parseFloat(manualLng) : null);

    if (!lat || !lng) {
      toast.error("Please enable location or enter coordinates manually");
      return;
    }

    setIsSubmitting(true);

    try {
      const photoUrl = await uploadPhoto(photoFile, "punch-out");

      const { error } = await supabase
        .from("attendance")
        .update({
          punch_out_time: new Date().toISOString(),
          punch_out_photo_url: photoUrl,
          punch_out_lat: lat,
          punch_out_lng: lng,
        })
        .eq("id", todayRecord.id);

      if (error) throw error;

      toast.success("Punched out successfully!");
      clearPhoto();
      fetchTodayAttendance();
    } catch (error: any) {
      console.error("Punch out error:", error);
      toast.error(error.message || "Failed to punch out");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPunchedIn = todayRecord?.punch_in_time && !todayRecord?.punch_out_time;
  const isFullyPunched = todayRecord?.punch_in_time && todayRecord?.punch_out_time;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container flex items-center h-12 sm:h-14 px-3 sm:px-4 gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => navigate("/plant-manager/dashboard")}>
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-foreground">Attendance</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
          </div>
        </div>
      </header>

      <main className="container px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Admin View - All Attendance Records */}
        {isAdmin ? (
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Today's Attendance ({allRecords.length} records)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              {allRecords.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground text-xs sm:text-sm">
                  No attendance records for today
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Mobile Card View */}
                  <div className="block sm:hidden space-y-2">
                    {allRecords.map((record) => (
                      <div key={record.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex items-center gap-2">
                          {record.punch_in_photo_url && (
                            <img
                              src={record.punch_in_photo_url}
                              alt="Employee"
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs truncate">{record.user_name}</p>
                            {getStatusBadge(record)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Punch In</p>
                            {record.punch_in_time ? (
                              <p className="font-medium">{format(new Date(record.punch_in_time), "h:mm a")}</p>
                            ) : (
                              <p className="text-muted-foreground">-</p>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Punch Out</p>
                            {record.punch_out_time ? (
                              <p className="font-medium">{format(new Date(record.punch_out_time), "h:mm a")}</p>
                            ) : (
                              <p className="text-muted-foreground">-</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Employee</TableHead>
                          <TableHead className="text-xs">Punch In</TableHead>
                          <TableHead className="text-xs">Punch Out</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {record.punch_in_photo_url && (
                                  <img
                                    src={record.punch_in_photo_url}
                                    alt="Employee"
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                )}
                                <span className="font-medium text-sm">{record.user_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {record.punch_in_time ? (
                                <div>
                                  <p className="font-medium text-sm">{format(new Date(record.punch_in_time), "h:mm a")}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {record.punch_in_lat?.toFixed(4)}, {record.punch_in_lng?.toFixed(4)}
                                  </p>
                                </div>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {record.punch_out_time ? (
                                <div>
                                  <p className="font-medium text-sm">{format(new Date(record.punch_out_time), "h:mm a")}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {record.punch_out_lat?.toFixed(4)}, {record.punch_out_lng?.toFixed(4)}
                                  </p>
                                </div>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(record)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Status Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Today's Status
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                {isFullyPunched ? (
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-success/10">
                    <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-success flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-success text-xs sm:text-base">Attendance Complete</p>
                      <p className="text-[10px] sm:text-sm text-muted-foreground">
                        In: {format(new Date(todayRecord!.punch_in_time!), "h:mm a")} • 
                        Out: {format(new Date(todayRecord!.punch_out_time!), "h:mm a")}
                      </p>
                    </div>
                  </div>
                ) : isPunchedIn ? (
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-warning/10">
                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-warning animate-pulse-gentle flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-warning text-xs sm:text-base">Currently Working</p>
                      <p className="text-[10px] sm:text-sm text-muted-foreground">
                        Punched in at {format(new Date(todayRecord!.punch_in_time!), "h:mm a")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-destructive/10">
                    <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-destructive text-xs sm:text-base">Not Punched In</p>
                      <p className="text-[10px] sm:text-sm text-muted-foreground">Capture your selfie to punch in</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {!isFullyPunched && (
              <>
                {/* Camera Section */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                      <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Selfie Capture
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {photoDataUrl ? (
                      <div className="relative">
                        <img
                          src={photoDataUrl}
                          alt="Selfie preview"
                          className="w-full h-48 sm:h-64 object-cover rounded-xl"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-7 sm:h-8 text-xs sm:text-sm"
                          onClick={clearPhoto}
                        >
                          Retake
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={capturePhoto}
                        className="w-full h-24 sm:h-32 flex flex-col gap-1 sm:gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                      >
                        <Camera className="h-6 w-6 sm:h-8 sm:w-8" />
                        <span className="text-xs sm:text-sm">Tap to take selfie</span>
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Location Section */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
                    {geoLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        Getting location...
                      </div>
                    ) : latitude && longitude ? (
                      <div className="p-2 sm:p-3 rounded-xl bg-success/10 flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-success">Location captured</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {latitude.toFixed(6)}, {longitude.toFixed(6)}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => getLocation()}>
                          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {geoError && (
                          <p className="text-xs sm:text-sm text-destructive">{geoError}</p>
                        )}
                        <Button
                          variant="outline"
                          className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                          onClick={() => getLocation()}
                        >
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          Enable Location
                        </Button>
                        <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                          Or enter manually:
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <div>
                            <Label htmlFor="lat" className="text-[10px] sm:text-xs">Latitude</Label>
                            <Input
                              id="lat"
                              type="number"
                              step="any"
                              placeholder="e.g. 28.6139"
                              value={manualLat}
                              onChange={(e) => setManualLat(e.target.value)}
                              className="h-8 sm:h-10 text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lng" className="text-[10px] sm:text-xs">Longitude</Label>
                            <Input
                              id="lng"
                              type="number"
                              step="any"
                              placeholder="e.g. 77.2090"
                              value={manualLng}
                              onChange={(e) => setManualLng(e.target.value)}
                              className="h-8 sm:h-10 text-xs sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Button */}
                <Button
                  onClick={isPunchedIn ? handlePunchOut : handlePunchIn}
                  disabled={isSubmitting || !photoFile}
                  className="w-full h-10 sm:h-14 text-sm sm:text-lg font-bold gradient-primary border-0 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      Processing...
                    </>
                  ) : isPunchedIn ? (
                    "Punch Out"
                  ) : (
                    "Punch In"
                  )}
                </Button>
              </>
            )}

            {/* History */}
            {todayRecord && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-sm sm:text-lg">Today's Record</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
                  {todayRecord.punch_in_time && (
                    <div className="flex gap-3 sm:gap-4">
                      {todayRecord.punch_in_photo_url && (
                        <img
                          src={todayRecord.punch_in_photo_url}
                          alt="Punch in"
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-success text-xs sm:text-base">Punch In</p>
                        <p className="text-[10px] sm:text-sm text-muted-foreground">
                          {format(new Date(todayRecord.punch_in_time), "h:mm:ss a")}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {todayRecord.punch_in_lat?.toFixed(4)}, {todayRecord.punch_in_lng?.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  )}
                  {todayRecord.punch_out_time && (
                    <div className="flex gap-3 sm:gap-4">
                      {todayRecord.punch_out_photo_url && (
                        <img
                          src={todayRecord.punch_out_photo_url}
                          alt="Punch out"
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-destructive text-xs sm:text-base">Punch Out</p>
                        <p className="text-[10px] sm:text-sm text-muted-foreground">
                          {format(new Date(todayRecord.punch_out_time), "h:mm:ss a")}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {todayRecord.punch_out_lat?.toFixed(4)}, {todayRecord.punch_out_lng?.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}

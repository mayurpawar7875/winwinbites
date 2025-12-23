import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, Clock, Loader2 } from "lucide-react";

type RequestType = "LEAVE" | "OVERTIME";
type LeaveType = "FULL_DAY" | "HALF_DAY";

interface LeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onSuccess: () => void;
}

export default function LeaveRequestDialog({
  open,
  onOpenChange,
  selectedDate,
  onSuccess,
}: LeaveRequestDialogProps) {
  const { user, profile } = useAuth();
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [leaveType, setLeaveType] = useState<LeaveType>("FULL_DAY");
  const [overtimeHours, setOvertimeHours] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !requestType) return;

    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    if (requestType === "OVERTIME" && (!overtimeHours || parseFloat(overtimeHours) <= 0)) {
      toast.error("Please enter valid overtime hours");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("leave_requests").insert({
        user_id: user.id,
        user_name: profile?.name || user.email,
        request_type: requestType,
        request_date: format(selectedDate, "yyyy-MM-dd"),
        leave_type: requestType === "LEAVE" ? leaveType : null,
        overtime_hours: requestType === "OVERTIME" ? parseFloat(overtimeHours) : null,
        reason: reason.trim(),
      });

      if (error) throw error;

      toast.success("Request submitted successfully!");
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error(error.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRequestType(null);
    setLeaveType("FULL_DAY");
    setOvertimeHours("");
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(selectedDate, "MMMM d, yyyy")}
          </DialogTitle>
          <DialogDescription>
            Submit a leave or overtime request for this date
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Request Type Selection */}
          {!requestType ? (
            <div className="space-y-3">
              <Label className="text-sm font-medium">What would you like to apply for?</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5"
                  onClick={() => setRequestType("LEAVE")}
                >
                  <Calendar className="h-5 w-5 text-destructive" />
                  <span className="text-sm font-medium">Apply Leave</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5"
                  onClick={() => setRequestType("OVERTIME")}
                >
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Apply Overtime</span>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Back button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRequestType(null)}
                className="text-xs text-muted-foreground"
              >
                ← Back to options
              </Button>

              {requestType === "LEAVE" ? (
                /* Leave Form */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Leave Type</Label>
                    <RadioGroup
                      value={leaveType}
                      onValueChange={(v) => setLeaveType(v as LeaveType)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="FULL_DAY" id="full" />
                        <Label htmlFor="full" className="text-sm cursor-pointer">
                          Full Day
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="HALF_DAY" id="half" />
                        <Label htmlFor="half" className="text-sm cursor-pointer">
                          Half Day
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-sm font-medium">
                      Reason <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="reason"
                      placeholder="Enter reason for leave..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              ) : (
                /* Overtime Form */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="hours" className="text-sm font-medium">
                      Expected Overtime Hours <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="hours"
                      type="number"
                      min="0.5"
                      max="12"
                      step="0.5"
                      placeholder="e.g., 2"
                      value={overtimeHours}
                      onChange={(e) => setOvertimeHours(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ot-reason" className="text-sm font-medium">
                      Reason <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="ot-reason"
                      placeholder="Enter reason for overtime..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Request
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

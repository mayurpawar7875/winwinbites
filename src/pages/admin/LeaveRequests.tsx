import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  FileText,
  Filter,
} from "lucide-react";

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";
type RequestType = "LEAVE" | "OVERTIME";

interface LeaveRequest {
  id: string;
  user_id: string;
  user_name: string | null;
  request_type: RequestType;
  request_date: string;
  leave_type: "FULL_DAY" | "HALF_DAY" | null;
  overtime_hours: number | null;
  reason: string;
  status: RequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

export default function LeaveRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">("PENDING");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("leave_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "ALL") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests((data as LeaveRequest[]) || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedRequest || !user) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("leave_requests")
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes.trim() || null,
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast.success(`Request ${status.toLowerCase()} successfully`);
      setSelectedRequest(null);
      setActionType(null);
      setReviewNotes("");
      fetchRequests();
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Failed to update request");
    } finally {
      setIsProcessing(false);
    }
  };

  const openReviewDialog = (request: LeaveRequest, action: "APPROVE" | "REJECT") => {
    setSelectedRequest(request);
    setActionType(action);
    setReviewNotes("");
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Pending</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Rejected</Badge>;
    }
  };

  const getRequestTypeBadge = (type: RequestType) => {
    return type === "LEAVE" ? (
      <Badge variant="secondary" className="bg-destructive/10 text-destructive">
        <Calendar className="h-3 w-3 mr-1" />
        Leave
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-primary/10 text-primary">
        <Clock className="h-3 w-3 mr-1" />
        Overtime
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container flex items-center h-12 sm:h-14 px-3 sm:px-4 gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={() => navigate("/admin/attendance")}
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <div>
              <h1 className="font-bold text-sm sm:text-base text-foreground">
                Leave & Overtime Requests
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Manage employee requests
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-3 sm:px-4 py-4 sm:py-6 space-y-4 max-w-4xl mx-auto">
        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No {statusFilter !== "ALL" ? statusFilter.toLowerCase() : ""} requests found
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <Card key={request.id} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{request.user_name || "Unknown"}</span>
                        {getRequestTypeBadge(request.request_type)}
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Date:</span>{" "}
                        {format(new Date(request.request_date), "MMMM d, yyyy")}
                        {request.leave_type && (
                          <span className="ml-2">
                            ({request.leave_type === "FULL_DAY" ? "Full Day" : "Half Day"})
                          </span>
                        )}
                        {request.overtime_hours && (
                          <span className="ml-2">({request.overtime_hours} hours)</span>
                        )}
                      </div>

                      <div className="text-sm">
                        <span className="text-muted-foreground font-medium">Reason:</span>{" "}
                        {request.reason}
                      </div>

                      {request.review_notes && (
                        <div className="text-sm">
                          <span className="text-muted-foreground font-medium">Admin Notes:</span>{" "}
                          {request.review_notes}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Submitted: {format(new Date(request.created_at), "MMM d, yyyy h:mm a")}
                      </div>
                    </div>

                    {request.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-success border-success/30 hover:bg-success/10"
                          onClick={() => openReviewDialog(request, "APPROVE")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => openReviewDialog(request, "REJECT")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest && !!actionType} onOpenChange={() => {
        setSelectedRequest(null);
        setActionType(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "APPROVE" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "APPROVE"
                ? "Are you sure you want to approve this request?"
                : "Are you sure you want to reject this request?"}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-3 py-2">
              <div className="text-sm">
                <span className="font-medium">Employee:</span> {selectedRequest.user_name}
              </div>
              <div className="text-sm">
                <span className="font-medium">Type:</span>{" "}
                {selectedRequest.request_type === "LEAVE" ? "Leave" : "Overtime"}
                {selectedRequest.leave_type && ` (${selectedRequest.leave_type === "FULL_DAY" ? "Full Day" : "Half Day"})`}
                {selectedRequest.overtime_hours && ` (${selectedRequest.overtime_hours} hours)`}
              </div>
              <div className="text-sm">
                <span className="font-medium">Date:</span>{" "}
                {format(new Date(selectedRequest.request_date), "MMMM d, yyyy")}
              </div>
              <div className="text-sm">
                <span className="font-medium">Reason:</span> {selectedRequest.reason}
              </div>

              <div className="pt-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  placeholder="Add any notes..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "APPROVE" ? "default" : "destructive"}
              onClick={() => handleAction(actionType === "APPROVE" ? "APPROVED" : "REJECTED")}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === "APPROVE" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

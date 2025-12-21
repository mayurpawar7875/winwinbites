import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, AlertTriangle, CheckCircle, X } from "lucide-react";
import logo from "@/assets/win-win-bites-logo.jpg";

type ProblemType = "MACHINE" | "RAW_MATERIAL" | "LABOUR" | "POWER" | "QUALITY" | "OTHER";
type ProblemStatus = "OPEN" | "RESOLVED";

const problemTypeLabels: Record<ProblemType, string> = {
  MACHINE: "Machine",
  RAW_MATERIAL: "Raw Material",
  LABOUR: "Labour",
  POWER: "Power",
  QUALITY: "Quality",
  OTHER: "Other",
};

export default function Problems() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    problem_type: "" as ProblemType | "",
    description: "",
    location_text: "",
  });

  const today = new Date().toISOString().split("T")[0];

  const { data: problems = [], isLoading } = useQuery({
    queryKey: ["problems", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .eq("date", today)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const addProblemMutation = useMutation({
    mutationFn: async (problem: {
      problem_type: ProblemType;
      description: string;
      location_text: string;
    }) => {
      const now = new Date();
      const { error } = await supabase.from("problems").insert({
        user_id: user!.id,
        date: today,
        time: now.toTimeString().split(" ")[0],
        problem_type: problem.problem_type,
        description: problem.description,
        location_text: problem.location_text,
        status: "OPEN" as ProblemStatus,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["problems"] });
      toast.success("Problem reported successfully");
      setShowForm(false);
      setFormData({ problem_type: "", description: "", location_text: "" });
    },
    onError: (error) => {
      toast.error("Failed to report problem: " + error.message);
    },
  });

  const resolveProblemMutation = useMutation({
    mutationFn: async (problemId: string) => {
      const { error } = await supabase
        .from("problems")
        .update({
          status: "RESOLVED" as ProblemStatus,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", problemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["problems"] });
      toast.success("Problem marked as resolved");
    },
    onError: (error) => {
      toast.error("Failed to resolve problem: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.problem_type || !formData.description || !formData.location_text) {
      toast.error("Please fill all required fields");
      return;
    }
    addProblemMutation.mutate({
      problem_type: formData.problem_type as ProblemType,
      description: formData.description,
      location_text: formData.location_text,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container flex items-center h-12 sm:h-16 px-3 sm:px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/plant-manager/dashboard")}
            className="mr-2 h-8 w-8 sm:h-10 sm:w-10"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <img src={logo} alt="Win Win Bites" className="h-7 sm:h-9 w-auto mr-2 sm:mr-3" />
          <div>
            <h1 className="font-bold text-sm sm:text-lg text-foreground">Problems</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Report & Track Issues</p>
          </div>
        </div>
      </header>

      <main className="container px-3 sm:px-4 py-4 sm:py-6">
        {/* Add Problem Button */}
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="w-full mb-4 h-10 sm:h-12 text-sm sm:text-base"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Report New Problem
          </Button>
        )}

        {/* Add Problem Form */}
        {showForm && (
          <Card className="p-3 sm:p-4 mb-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="font-semibold text-sm sm:text-base">Report Problem</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowForm(false)}
                className="h-7 w-7 sm:h-8 sm:w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Problem Type *</Label>
                <Select
                  value={formData.problem_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, problem_type: value as ProblemType })
                  }
                >
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(problemTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="text-xs sm:text-sm">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Location *</Label>
                <Input
                  value={formData.location_text}
                  onChange={(e) =>
                    setFormData({ ...formData, location_text: e.target.value })
                  }
                  placeholder="e.g., Machine #3, Warehouse B"
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the problem in detail..."
                  rows={3}
                  className="text-xs sm:text-sm"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-9 sm:h-10 text-xs sm:text-sm"
                disabled={addProblemMutation.isPending}
              >
                {addProblemMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </form>
          </Card>
        )}

        {/* Problems List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm sm:text-base text-foreground">
            Today's Reports ({problems.length})
          </h3>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
          ) : problems.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center">
              <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm sm:text-base text-muted-foreground">No problems reported today</p>
            </Card>
          ) : (
            problems.map((problem) => (
              <Card key={problem.id} className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={problem.status === "OPEN" ? "destructive" : "secondary"}
                      className="text-[10px] sm:text-xs"
                    >
                      {problem.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                      {problemTypeLabels[problem.problem_type as ProblemType]}
                    </Badge>
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {problem.time?.slice(0, 5)}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-medium text-foreground mb-1">
                  {problem.location_text}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  {problem.description}
                </p>

                {problem.status === "OPEN" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resolveProblemMutation.mutate(problem.id)}
                    disabled={resolveProblemMutation.isPending}
                    className="h-7 sm:h-8 text-[10px] sm:text-xs"
                  >
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Mark Resolved
                  </Button>
                )}
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

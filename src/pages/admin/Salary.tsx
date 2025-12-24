import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// This is a wrapper that renders the existing Salary page within admin layout
import SalaryPage from "@/pages/plant-manager/Salary";

export default function AdminSalary() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Access denied. Admin only.");
      navigate("/plant-manager/dashboard", { replace: true });
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  // Render the existing salary page content
  return <SalaryPage />;
}

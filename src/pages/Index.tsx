import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/win-win-bites-logo.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <img 
        src={logo} 
        alt="Win Win Bites Logo" 
        className="h-28 w-auto mb-6 drop-shadow-lg"
      />
      <h1 className="text-3xl font-bold text-foreground mb-2">Plant Manager</h1>
      <p className="text-muted-foreground mb-8 text-center">Daily Reporting System</p>
      <Button
        size="lg"
        className="gradient-primary border-0 text-lg px-8 h-14"
        onClick={() => navigate("/auth")}
      >
        Sign In to Continue
      </Button>
    </div>
  );
};

export default Index;

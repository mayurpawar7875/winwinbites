import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Mail, Lock, User, Briefcase, Sparkles } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/win-win-bites-logo.jpg";

const ROLES = [
  { value: "plantManager", label: "Plant Manager", icon: "🏭" },
  { value: "productionManager", label: "Production Manager", icon: "⚙️" },
  { value: "accountant", label: "Accountant", icon: "📊" },
] as const;

const authSchema = z.object({
  email: z.string().trim().email("Please enter a valid email").max(255, "Email too long"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password too long"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long").optional(),
  role: z.enum(["plantManager", "productionManager", "accountant"]).optional(),
});

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("plantManager");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Clear stale auth tokens on mount to prevent refresh token errors
  useEffect(() => {
    const clearStaleTokens = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error?.message?.includes("Refresh Token")) {
          await supabase.auth.signOut();
        }
      } catch {
        // Ignore errors during cleanup
      }
    };
    clearStaleTokens();
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/plant-manager/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationData = isSignUp 
      ? { email, password, name, role } 
      : { email, password };
    
    const validation = authSchema.safeParse(validationData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    if (isSignUp && (!name || name.trim().length < 2)) {
      toast.error("Please enter your name");
      return;
    }

    if (isSignUp && !role) {
      toast.error("Please select a role");
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, name, role);
        
        if (error) {
          if (error.message.includes("User already registered")) {
            toast.error("An account with this email already exists. Please sign in.");
          } else {
            toast.error(error.message);
          }
          setIsLoading(false);
          return;
        }

        toast.success("Account created successfully! Welcome aboard!");
      } else {
        const { error } = await signIn(email, password);
        
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else if (error.message.includes("Email not confirmed")) {
            toast.error("Please verify your email address");
          } else {
            toast.error(error.message);
          }
          setIsLoading(false);
          return;
        }

        toast.success("Welcome back!");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail("");
    setPassword("");
    setName("");
    setRole("plantManager");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-3 sm:p-4 py-4 sm:py-6">
      {/* Background decorative elements - hidden on mobile for performance */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and branding - more compact on mobile */}
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <div className="relative mb-2 sm:mb-4">
            <div className="hidden sm:block absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150" />
            <div className="relative bg-card p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-border/50">
              <img 
                src={logo} 
                alt="Win Win Bites Logo" 
                className="h-12 sm:h-16 w-auto rounded-lg sm:rounded-xl"
              />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Plant Manager
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3" />
              Daily Reporting System
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="border border-border/50 shadow-xl sm:shadow-2xl backdrop-blur-sm bg-card/95 overflow-hidden">
          {/* Card header with gradient accent */}
          <div className="h-1 sm:h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
          
          <CardContent className="p-4 sm:p-6">
            {/* Title section - more compact on mobile */}
            <div className="text-center mb-4 sm:mb-5">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                {isSignUp 
                  ? "Join us to manage your plant operations" 
                  : "Sign in to access your dashboard"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {isSignUp && (
                <>
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                      <User className="h-3 w-3 text-muted-foreground" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isSignUp}
                      autoComplete="name"
                      className="h-10 sm:h-11 text-sm bg-muted/30 border-border/50 focus:bg-background transition-colors"
                      maxLength={100}
                    />
                  </div>

                  {/* Role field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="role" className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3 text-muted-foreground" />
                      Role
                    </Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="h-10 sm:h-11 text-sm bg-muted/30 border-border/50 focus:bg-background transition-colors">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value} className="py-2.5">
                            <span className="flex items-center gap-2">
                              <span>{r.icon}</span>
                              <span>{r.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              {/* Email field */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-10 sm:h-11 text-sm bg-muted/30 border-border/50 focus:bg-background transition-colors"
                  maxLength={255}
                />
              </div>
              
              {/* Password field */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    className="h-10 sm:h-11 text-sm pr-10 bg-muted/30 border-border/50 focus:bg-background transition-colors"
                    maxLength={72}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-muted"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full h-10 sm:h-11 text-sm font-semibold mt-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md shadow-primary/20 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSignUp ? "Creating..." : "Signing in..."}
                  </>
                ) : (
                  <span className="flex items-center gap-2">
                    {isSignUp ? "Create Account" : "Sign In"}
                    <span>{isSignUp ? "🚀" : "→"}</span>
                  </span>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-4 sm:my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
                  {isSignUp ? "Already a member?" : "New here?"}
                </span>
              </div>
            </div>

            {/* Toggle mode button */}
            <Button
              type="button"
              variant="outline"
              onClick={toggleMode}
              className="w-full h-9 sm:h-10 text-xs sm:text-sm font-medium border-border/50 hover:bg-muted/50 transition-colors"
            >
              {isSignUp ? "Sign in to your account" : "Create a new account"}
            </Button>
          </CardContent>
        </Card>

        {/* Footer text - hidden on very small screens for sign in */}
        <p className="text-center text-[10px] sm:text-xs text-muted-foreground mt-3 sm:mt-4 px-4">
          {isSignUp 
            ? "By creating an account, you agree to our terms" 
            : "Need help? Contact your administrator"}
        </p>
      </div>
    </div>
  );
}

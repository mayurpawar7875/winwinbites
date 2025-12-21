import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/win-win-bites-logo.jpg";

const authSchema = z.object({
  email: z.string().trim().email("Please enter a valid email").max(255, "Email too long"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password too long"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long").optional(),
});

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
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
      ? { email, password, name } 
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

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, name);
        
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
        // Navigation will be handled by useEffect watching user state
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
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail("");
    setPassword("");
    setName("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-6 sm:py-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-4 sm:mb-8">
          <img 
            src={logo} 
            alt="Win Win Bites Logo" 
            className="h-14 sm:h-20 w-auto mb-2 sm:mb-4"
          />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Plant Manager</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Daily Reporting System</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-2 sm:pb-4 pt-4 sm:pt-6">
            <CardTitle className="text-lg sm:text-xl text-center">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-center text-xs sm:text-sm">
              {isSignUp 
                ? "Enter your details to create your account" 
                : "Enter your credentials to access your dashboard"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {isSignUp && (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="name" className="text-sm">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isSignUp}
                    autoComplete="name"
                    className="h-10 sm:h-12 text-sm sm:text-base"
                    maxLength={100}
                  />
                </div>
              )}
              
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="manager@plant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-10 sm:h-12 text-sm sm:text-base"
                  maxLength={255}
                />
              </div>
              
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    className="h-10 sm:h-12 text-sm sm:text-base pr-12"
                    maxLength={72}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold gradient-primary border-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 sm:h-5 w-4 sm:w-5 animate-spin" />
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </>
                ) : (
                  isSignUp ? "Create Account" : "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-primary hover:underline"
              >
                {isSignUp 
                  ? "Already have an account? Sign in" 
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4 sm:mt-6">
          {isSignUp 
            ? "By signing up, you agree to our terms of service" 
            : "Contact your administrator if you need access"}
        </p>
      </div>
    </div>
  );
}

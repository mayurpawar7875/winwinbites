import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, UserPlus, ArrowLeft, Users, Trash2, Shield, User } from "lucide-react";
import { z } from "zod";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: AppRole;
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  plantManager: "Plant Manager",
  productionManager: "Production Manager",
  accountant: "Accountant",
};

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function UserManagement() {
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("plantManager");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);
  
  const { isAdmin, user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Access denied. Admin only.");
      navigate("/plant-manager/dashboard", { replace: true });
      return;
    }
    fetchUsers();
    fetchUserRoles();
  }, [isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (error) throw error;
      setUserRoles(data || []);
    } catch (error) {
      console.error("Error fetching user roles:", error);
    }
  };

  const getUserRole = (userId: string): AppRole => {
    const role = userRoles.find((r) => r.user_id === userId);
    return role?.role || "plantManager";
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signupSchema.safeParse({ 
      name: newName, 
      email: newEmail, 
      password: newPassword 
    });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsCreating(true);

    try {
      const response = await supabase.functions.invoke("create-user", {
        body: {
          email: newEmail,
          password: newPassword,
          name: newName,
        },
      });

      if (response.error) {
        toast.error(response.error.message || "Failed to create user");
        return;
      }

      if (response.data?.error) {
        if (response.data.error.includes("already")) {
          toast.error("This email is already registered");
        } else {
          toast.error(response.data.error);
        }
        return;
      }

      // If a non-default role was selected, update the role
      if (newRole !== "plantManager" && response.data?.user?.id) {
        await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", response.data.user.id);
      }

      toast.success(`User ${newName} created successfully!`);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("plantManager");
      
      // Refresh user list after a short delay
      setTimeout(() => {
        fetchUsers();
        fetchUserRoles();
      }, 1000);
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !currentStatus })
        .eq("user_id", userId);

      if (error) throw error;
      
      toast.success(`User ${currentStatus ? "deactivated" : "activated"} successfully`);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user status");
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setUpdatingRoleUserId(userId);
    try {
      const { data, error } = await supabase.functions.invoke("update-user-role", {
        body: {
          targetUserId: userId,
          newRole: newRole,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast.success("Role updated successfully");
      fetchUserRoles();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error(error.message || "Failed to update role");
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    setDeletingUserId(userId);
    try {
      const response = await supabase.functions.invoke("delete-user", {
        body: { userId },
      });

      if (response.error) {
        toast.error(response.error.message || "Failed to delete user");
        return;
      }

      if (response.data?.error) {
        toast.error(response.data.error);
        return;
      }

      toast.success(`User ${userName} deleted successfully`);
      fetchUsers();
      fetchUserRoles();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setDeletingUserId(null);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container flex items-center h-12 sm:h-16 px-3 sm:px-4 gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={() => navigate("/plant-manager/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-foreground">User Management</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
        {/* Create User Form */}
        <Card className="border-0 shadow-lg mb-4 sm:mb-6">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Create New User
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Add a new user account to the system
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <form onSubmit={handleCreateUser} className="space-y-3 sm:space-y-4">
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="newName" className="text-xs sm:text-sm">Full Name</Label>
                  <Input
                    id="newName"
                    type="text"
                    placeholder="Enter name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    className="h-9 sm:h-11 text-sm"
                  />
                </div>
                
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="newEmail" className="text-xs sm:text-sm">Email</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    autoComplete="off"
                    className="h-9 sm:h-11 text-sm"
                  />
                </div>
                
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="newPassword" className="text-xs sm:text-sm">Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="h-9 sm:h-11 text-sm pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="newRole" className="text-xs sm:text-sm">Role</Label>
                  <Select value={newRole} onValueChange={(value) => setNewRole(value as AppRole)}>
                    <SelectTrigger className="h-9 sm:h-11 text-sm">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plantManager">Plant Manager</SelectItem>
                      <SelectItem value="productionManager">Production Manager</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                className="gradient-primary border-0 text-xs sm:text-sm h-9 sm:h-11"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Create User
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              All Users
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Manage existing user accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No users found
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {users.map((user) => {
                  const isCurrentUser = currentUser?.id === user.user_id;
                  const userRole = getUserRole(user.user_id);
                  
                  return (
                    <div
                      key={user.id}
                      className="p-3 sm:p-4 rounded-lg bg-muted/50 space-y-2 sm:space-y-3"
                    >
                      {/* User Info Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-xs sm:text-sm truncate">
                              {user.name}
                              {isCurrentUser && <span className="text-muted-foreground ml-1">(You)</span>}
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                        <span
                          className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 ${
                            user.is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {/* Actions Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Role Selector */}
                        <Select 
                          value={userRole} 
                          onValueChange={(value) => handleRoleChange(user.user_id, value as AppRole)}
                          disabled={isCurrentUser || updatingRoleUserId === user.user_id}
                        >
                          <SelectTrigger className="h-7 sm:h-8 text-[10px] sm:text-xs w-auto min-w-[100px] sm:min-w-[140px]">
                            {updatingRoleUserId === user.user_id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="plantManager" className="text-xs sm:text-sm">Plant Manager</SelectItem>
                            <SelectItem value="productionManager" className="text-xs sm:text-sm">Production Manager</SelectItem>
                            <SelectItem value="accountant" className="text-xs sm:text-sm">Accountant</SelectItem>
                            <SelectItem value="admin" className="text-xs sm:text-sm">Admin</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Status Toggle */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                          onClick={() => toggleUserStatus(user.user_id, user.is_active ?? true)}
                          disabled={isCurrentUser}
                        >
                          {user.is_active ? "Deactivate" : "Activate"}
                        </Button>

                        {/* Delete Button */}
                        {!isCurrentUser && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                                disabled={deletingUserId === user.user_id}
                              >
                                {deletingUserId === user.user_id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                                    Delete
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-sm sm:text-base">Delete User</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs sm:text-sm">
                                  Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be undone. All their data will be permanently removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="text-xs sm:text-sm h-8 sm:h-10">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="text-xs sm:text-sm h-8 sm:h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDeleteUser(user.user_id, user.name)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

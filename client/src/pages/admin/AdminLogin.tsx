import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminLoginSchema, type AdminLogin } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const form = useForm<AdminLogin>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: AdminLogin) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const result = await response.json();
      // Ensure token is trimmed of any whitespace
      const cleanToken = (result.accessToken || "").trim();
      if (!cleanToken) {
        throw new Error("No authentication token received from server");
      }
      localStorage.setItem("adminToken", cleanToken);
      localStorage.setItem("adminUser", JSON.stringify(result.admin));

      toast({
        title: "Login successful",
        description: `Welcome back, ${result.admin.username}!`,
      });

      setLocation("/admin/dashboard");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleForgotPassword = async () => {
    if (!forgotUsername.trim()) {
      toast({
        title: "Error",
        description: "Please enter your username",
        variant: "destructive",
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      const tempPassword = generateRandomPassword();
      const response = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: forgotUsername,
          newPassword: tempPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Password reset failed");
      }

      const result = await response.json();
      setNewPassword(tempPassword);
      toast({
        title: "Password reset successful",
        description: result.emailSent 
          ? "📧 A temporary password has been sent to the admin's email"
          : "Your temporary password has been generated",
      });
    } catch (error) {
      toast({
        title: "Reset failed",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newPassword);
    toast({
      title: "Copied",
      description: "Password copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
          <CardDescription>Sign in to access the admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Enter your username"
                        disabled={isLoading}
                        data-testid="input-username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter your password"
                        disabled={isLoading}
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-4 pt-4 border-t space-y-3">
            <Button
              onClick={async () => {
                setIsLoading(true);
                try {
                  const response = await fetch("/api/admin/auth/test-login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  });

                  if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || "Test login failed");
                  }

                  const result = await response.json();
                  // Ensure token is trimmed of any whitespace
                  const cleanToken = (result.accessToken || "").trim();
                  if (!cleanToken) {
                    throw new Error("No authentication token received from server");
                  }
                  localStorage.setItem("adminToken", cleanToken);
                  localStorage.setItem("adminUser", JSON.stringify(result.admin));

                  toast({
                    title: "Test login successful",
                    description: `Logged in as ${result.admin.username}`,
                  });

                  setLocation("/admin/dashboard");
                } catch (error) {
                  toast({
                    title: "Test login failed",
                    description: error instanceof Error ? error.message : "Failed to login",
                    variant: "destructive",
                  });
                } finally {
                  setIsLoading(false);
                }
              }}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              Test Login (Bypass Auth)
            </Button>
            <p className="text-xs text-center text-slate-500">
              For testing only - uses default admin account
            </p>

            <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  type="button"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Forgot Password?
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Reset Admin Password</DialogTitle>
                  <DialogDescription>
                    Enter your username to generate a temporary password
                  </DialogDescription>
                </DialogHeader>

                {newPassword ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                        ✓ Password reset successful!
                      </p>
                      <div className="space-y-2">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Your temporary password:
                        </p>
                        <div className="flex items-center gap-2">
                          {showNewPassword ? (
                            <code className="flex-1 p-2 bg-white dark:bg-slate-900 rounded border font-mono text-sm break-all">
                              {newPassword}
                            </code>
                          ) : (
                            <code className="flex-1 p-2 bg-white dark:bg-slate-900 rounded border font-mono text-sm">
                              {"•".repeat(newPassword.length)}
                            </code>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            type="button"
                          >
                            {showNewPassword ? "Hide" : "Show"}
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          onClick={copyToClipboard}
                          className="w-full"
                          type="button"
                        >
                          Copy to Clipboard
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Next steps:</p>
                      <ol className="text-sm space-y-1 text-slate-600 dark:text-slate-400 list-decimal list-inside">
                        <li>Close this dialog</li>
                        <li>Enter your username and the temporary password</li>
                        <li>Click Sign In</li>
                      </ol>
                    </div>
                    <Button
                      onClick={() => {
                        setShowForgotPassword(false);
                        setNewPassword("");
                        setForgotUsername("");
                      }}
                      className="w-full"
                      type="button"
                    >
                      Close
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Username</label>
                      <Input
                        placeholder="Enter your username"
                        value={forgotUsername}
                        onChange={(e) => setForgotUsername(e.target.value)}
                        disabled={isResettingPassword}
                      />
                    </div>
                    <Button
                      onClick={handleForgotPassword}
                      disabled={isResettingPassword || !forgotUsername.trim()}
                      className="w-full"
                      type="button"
                    >
                      {isResettingPassword ? "Resetting..." : "Generate Temporary Password"}
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

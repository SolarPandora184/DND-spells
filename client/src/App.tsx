import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { AuthLogin } from "@/components/auth-login";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
}

function useAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    const storedUser = localStorage.getItem("dnd-user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return {
    user,
    isAuthenticated: !!user
  };
}

function Router() {
  const { isAuthenticated, user } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLoginSuccess = (user: User) => {
    localStorage.setItem("dnd-user", JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    if (currentUser) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    }
    localStorage.removeItem("dnd-user");
    setCurrentUser(null);
  };

  if (!isAuthenticated && !currentUser) {
    return <AuthLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      <Header user={currentUser || JSON.parse(localStorage.getItem("dnd-user") || "null")} onLogout={handleLogout} />
      <Switch>
        <Route path="/">
          {() => <Dashboard user={currentUser || JSON.parse(localStorage.getItem("dnd-user") || "null")} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
      <MobileNavigation />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="dnd-companion-theme">
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

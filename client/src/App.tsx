import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ProtectedRoute } from "@/components/protected-route";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import SosPage from "@/pages/dashboard/sos";
import ContactsPage from "@/pages/dashboard/contacts";
import SafePlacesPage from "@/pages/dashboard/safe-places";
import CrimeMapPage from "@/pages/dashboard/crime-map";
import { isAuthenticated } from "@/lib/auth";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b border-border bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => {
          if (isAuthenticated()) {
            return <Redirect to="/dashboard" />;
          }
          return <Redirect to="/login" />;
        }}
      </Route>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/sos">
        <ProtectedRoute>
          <DashboardLayout>
            <SosPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/contacts">
        <ProtectedRoute>
          <DashboardLayout>
            <ContactsPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/safe-places">
        <ProtectedRoute>
          <DashboardLayout>
            <SafePlacesPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/crime-map">
        <ProtectedRoute>
          <DashboardLayout>
            <CrimeMapPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

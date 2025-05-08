import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Register from "@/pages/auth/register";
import Login from "@/pages/auth/login";
import EmailVerification from "@/pages/auth/email-verification";
import ParentDashboard from "@/pages/dashboard/parent-dashboard";
import SchoolRegistration from "@/pages/admin/school-registration";

function Router() {
  return (
    <Switch>
      <Route path="/admin/school-registration" component={SchoolRegistration} />
      <Route path="/auth/register" component={Register} />
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/verify-email" component={EmailVerification} />
      <Route path="/dashboard" component={ParentDashboard} />
      <Route path="/" component={Register} />
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

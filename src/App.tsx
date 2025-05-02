
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

import MainLayout from "@/components/layout/MainLayout";
import AuthLayout from "@/components/layout/AuthLayout";

import LoginPage from "@/pages/Auth/LoginPage";
import DashboardPage from "@/pages/Dashboard/DashboardPage";
import NewRequestPage from "@/pages/Requests/NewRequestPage";
import MyRequestsPage from "@/pages/Requests/MyRequestsPage";
import AllRequestsPage from "@/pages/Requests/AllRequestsPage";
import RequestDetailPage from "@/pages/Requests/RequestDetailPage";
import ReportsPage from "@/pages/Reports/ReportsPage";
import UsersPage from "@/pages/Users/UsersPage";
import SettingsPage from "@/pages/Settings/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Auth Routes */}
                <Route path="/auth" element={<AuthLayout />}>
                  <Route path="login" element={<LoginPage />} />
                </Route>
                
                {/* App Routes */}
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="request/new" element={<NewRequestPage />} />
                  <Route path="request/:id" element={<RequestDetailPage />} />
                  <Route path="requests/my" element={<MyRequestsPage />} />
                  <Route path="requests" element={<AllRequestsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

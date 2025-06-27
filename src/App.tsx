import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import StockAdjustmentPage from "@/pages/StockAdjustment/StockAdjustmentPage";
import NotFound from "@/pages/NotFound";
import ResetPasswordPage from '@/pages/Auth/ResetPasswordPage';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ThemeProvider>
            <NotificationProvider>
              <BrowserRouter>
                <Routes>
                  {/* Força o reset de senha a ser exibido isoladamente */}
                  <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
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
                    <Route path="stock-adjustment" element={<StockAdjustmentPage />} />
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
};

export default App;

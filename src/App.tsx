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
import CicloVidaPage from "@/pages/Requests/CicloVidaPage";
import AcceptancePage from "@/pages/Requests/AcceptancePage";
import NotFound from "@/pages/NotFound";
import ResetPasswordPage from '@/pages/Auth/ResetPasswordPage';

// Configuração robusta do QueryClient para evitar conflitos de cache
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tempo de vida do cache zerado (dados em tempo real para baixo tráfego)
      staleTime: 0,
      gcTime: 1000 * 60 * 5, // 5 minutos (anteriormente cacheTime)
      // Retry mais agressivo para problemas de rede
      retry: (failureCount, error) => {
        // Não retry para erros 4xx (exceto 408, 429)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
            return false;
          }
        }
        return failureCount < 3;
      },
      // Refetch em foco para garantir dados atualizados
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      // Refetch em intervalos foi desativado (usando refetchOnWindowFocus)
      refetchInterval: false,
      refetchIntervalInBackground: false,
    },
    mutations: {
      // Retry para mutações também
      retry: 1,
    },
  },
});

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
                  {/* Public Acceptance Route */}
                  <Route path="/aceite/:id" element={<AcceptancePage />} />
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
                    <Route path="ciclo-vida" element={<CicloVidaPage />} />
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

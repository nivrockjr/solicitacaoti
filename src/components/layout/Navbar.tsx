import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import NotificationsList from '../notifications/NotificationsList';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from './Sidebar';
import { translate, getSemanticIcon } from '@/lib/utils';
import { getGuidePdfUrl } from '@/services/storageService';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };
  
  // Função para abrir o manual do usuário
  const handleOpenGuide = () => {
    window.open(getGuidePdfUrl(), '_blank');
  };
  
  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center px-4 md:px-6">
        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden mr-2" title="Menu">
                {getSemanticIcon('menu', { className: 'h-5 w-5' })}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
        )}

        <div className="ml-auto flex items-center space-x-2">
          {/* Botão de ajuda */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenGuide}
            aria-label="Ajuda"
            title="Manual do Usuário"
          >
            {getSemanticIcon('help', { className: 'h-5 w-5' })}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          >
            {theme === 'dark'
              ? getSemanticIcon('theme-light', { className: 'h-5 w-5' })
              : getSemanticIcon('theme-dark', { className: 'h-5 w-5' })}
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" title="Notificações">
                {getSemanticIcon('notification', { className: 'h-5 w-5' })}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <NotificationsList />
            </PopoverContent>
          </Popover>
          
          <div className="flex items-center gap-2">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{translate('role', user?.role)}</p>
            </div>
            
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
              {getSemanticIcon('logout', { className: 'h-5 w-5' })}
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

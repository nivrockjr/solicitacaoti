
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn, getSemanticIcon } from '@/lib/utils';

interface SidebarProps {
  /** Callback opcional disparado ao clicar em qualquer item de navegação.
   *  Usado pelo Navbar mobile para fechar o Sheet automaticamente apos navegar. */
  onNavigate?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const navIconClass = 'h-5 w-5';
  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: getSemanticIcon('dashboard', { className: navIconClass }),
      showFor: 'both',
    },
    {
      title: 'Nova Solicitação',
      href: '/request/new',
      icon: getSemanticIcon('file-add', { className: navIconClass }),
      showFor: 'both',
    },
    {
      title: 'Ajuste de Estoque',
      href: '/stock-adjustment',
      icon: getSemanticIcon('package', { className: navIconClass }),
      showFor: 'both',
    },
    {
      title: 'Minhas Solicitações',
      href: '/requests/my',
      icon: getSemanticIcon('file', { className: navIconClass }),
      showFor: 'requester',
    },
    {
      title: 'Todas Solicitações',
      href: '/requests',
      icon: getSemanticIcon('file', { className: navIconClass }),
      showFor: 'admin',
    },
    {
      title: 'Relatórios',
      href: '/reports',
      icon: getSemanticIcon('file-spreadsheet', { className: navIconClass }),
      showFor: 'admin',
    },
    {
      title: 'Usuários',
      href: '/users',
      icon: getSemanticIcon('users', { className: navIconClass }),
      showFor: 'admin',
    },
    {
      title: 'Configurações',
      href: '/settings',
      icon: getSemanticIcon('settings', { className: navIconClass }),
      showFor: 'both',
    },
  ];
  
  const filteredNavItems = navItems.filter(item => 
    item.showFor === 'both' || 
    (isAdmin && item.showFor === 'admin') || 
    (!isAdmin && item.showFor === 'requester')
  );
  
  return (
    <aside className="w-64 border-r bg-card h-screen flex flex-col">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Suporte TI</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isAdmin ? 'Portal do Administrador' : 'Portal do Solicitante'}
        </p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredNavItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-2 py-2 rounded-full text-sm transition-colors dark-hover-gradient",
                    isActive
                      ? "font-semibold shadow-sm text-foreground bg-muted/60 dark:dark-active-tone"
                      : ""
                  )
                }
              >
                {item.icon}
                {item.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="truncate">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

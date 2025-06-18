
import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, FilePlus, FileText, Settings, Users, FileSpreadsheet, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <BarChart3 className="h-5 w-5" />,
      showFor: 'both',
    },
    {
      title: 'Nova Solicitação',
      href: '/request/new',
      icon: <FilePlus className="h-5 w-5" />,
      showFor: 'both',
    },
    {
      title: 'Ajuste de Estoque',
      href: '/stock-adjustment',
      icon: <Package className="h-5 w-5" />,
      showFor: 'both',
    },
    {
      title: 'Minhas Solicitações',
      href: '/requests/my',
      icon: <FileText className="h-5 w-5" />,
      showFor: 'requester',
    },
    {
      title: 'Todas Solicitações',
      href: '/requests',
      icon: <FileText className="h-5 w-5" />,
      showFor: 'admin',
    },
    {
      title: 'Relatórios',
      href: '/reports',
      icon: <FileSpreadsheet className="h-5 w-5" />,
      showFor: 'admin',
    },
    {
      title: 'Usuários',
      href: '/users',
      icon: <Users className="h-5 w-5" />,
      showFor: 'admin',
    },
    {
      title: 'Configurações',
      href: '/settings',
      icon: <Settings className="h-5 w-5" />,
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
              <NavLink to={item.href} className={({ isActive }) => 
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )
              }>
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
            {profile?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="truncate">
            <p className="text-sm font-medium truncate">{profile?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

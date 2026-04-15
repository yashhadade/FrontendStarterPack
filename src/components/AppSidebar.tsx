import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, LayoutDashboard, LogOut, Package, Users } from 'lucide-react';
import { logout } from '@/utils/logout';
import { getStorageItem } from '@/utils/storageUtils';

const navItems = [
  // { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { title: 'Products', path: '/products', icon: Package },
  { title: 'Clients', path: '/clients', icon: Users },
  { title: 'Invoices', path: '/invoices', icon: FileText },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      
    >
      {/* Logo */}
      <div
        className={`border-b border-sidebar-border flex items-center ${
          isCollapsed ? 'p-3 justify-between' : 'p-6 justify-between'
        }`}
      >
        {!isCollapsed ? (
          <div>
            <h2 className="text-sm font-bold text-foreground tracking-tight">Mahalaxmi</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Enterprise Panel
            </p>
          </div>
        ) : (
          <div
            className="w-8 h-8 rounded-md bg-primary/15 text-primary flex items-center justify-center text-xs font-bold tracking-wide"
            aria-label="Mahalaxmi Enterprise"
            title="Mahalaxmi Enterprise"
          >
            ME
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground hover:text-foreground transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.title : undefined}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isCollapsed ? 'justify-center' : 'gap-3'
              } ${
                isActive
                  ? 'sidebar-active text-primary font-medium'
                  : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {!isCollapsed ? item.title : null}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t border-sidebar-border ${isCollapsed ? '' : 'space-y-3'}`}>
        {!isCollapsed ? (
          <div className="glass-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Admin</span>
              <span className="text-xs font-medium text-foreground">
                {JSON.parse(getStorageItem('user'))?.name}
              </span>
            </div>
          </div>
        ) : null}
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : undefined}
          className={`flex items-center px-3 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors w-full ${
            isCollapsed ? 'justify-center' : 'gap-2'
          }`}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed ? 'Logout' : null}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;

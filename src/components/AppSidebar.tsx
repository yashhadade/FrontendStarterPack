import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Link2, ArrowLeftRight, LogOut, Shield } from 'lucide-react';
import { logout } from '@/utils/logout';
import { getStorageItem } from '@/utils/storageUtils';

const navItems = [
  // { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Assets Requests", path: "/assets-requests", icon: ArrowLeftRight },
  { title: "Blockchain Transactions", path: "/blockchain", icon: Link2 },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center neon-border">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground tracking-tight">WhiteBox</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Custodian Panel
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'sidebar-active text-primary font-medium'
                  : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.title}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="glass-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Custodian</span>
            <span className="text-xs font-medium text-foreground">
              {JSON.parse(getStorageItem('user'))?.username}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;

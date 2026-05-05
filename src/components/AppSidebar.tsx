import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { logout } from '@/utils/logout';
import { getStorageItem } from '@/utils/storageUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type NavItem = { title: string; path: string; icon: LucideIcon };

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const user = JSON.parse(getStorageItem('user') || '{}');
  const userRole = user?.role;

  const navItems: NavItem[] = [
    userRole === 'ADMIN' && { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    userRole === 'ADMIN' && { title: 'Products', path: '/products', icon: Package },
    userRole === 'ADMIN' && { title: 'Clients', path: '/clients', icon: Users },
    userRole === 'ADMIN' && { title: 'Invoices', path: '/invoices', icon: FileText },
    (userRole === 'SUB_ADMIN' || userRole === 'ADMIN') && {
      title: 'Buyer',
      path: '/buyer',
      icon: Users,
    },
  ].filter(Boolean) as NavItem[];
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
              {!isCollapsed ? item?.title : null}
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
              <span className="text-xs font-medium text-foreground">{user?.name}</span>
            </div>
          </div>
        ) : null}
        <button
          onClick={() => setIsLogoutDialogOpen(true)}
          title={isCollapsed ? 'Logout' : undefined}
          className={`flex items-center px-3 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors w-full ${
            isCollapsed ? 'justify-center' : 'gap-2'
          }`}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed ? 'Logout' : null}
        </button>
      </div>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be signed out of your account and redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
};

export default AppSidebar;

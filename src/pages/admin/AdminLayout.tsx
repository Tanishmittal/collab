import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  ShieldCheck, 
  FileText, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/admin' },
  { id: 'users', label: 'User Moderation', icon: Users, path: '/admin/users' },
  { id: 'campaigns', label: 'Campaigns', icon: FileText, path: '/admin/campaigns' },
  { id: 'broadcast', label: 'Global Broadcast', icon: Megaphone, path: '/admin/broadcast' },
];

export const AdminLayout = () => {
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-white h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">Influgal <span className="text-blue-600">Admin</span></span>
        </div>

        <nav className="flex-grow p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-blue-50 text-blue-700 shadow-sm" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              {location.pathname === item.path && <ChevronRight className="h-4 w-4" />}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span className="font-medium text-sm">Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-slate-800">
            {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2">
              <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Super Admin</span>
              <span className="text-[10px] text-slate-400">Manage mode active</span>
            </div>
            <div className="h-8 w-8 bg-slate-100 rounded-full border border-slate-200" />
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiHome,
  FiLayers,
  FiBox,
  FiTruck,
  FiUsers,
  FiShoppingCart,
  FiSearch,
  FiSettings,
  FiTool,
  FiChevronsLeft,
  FiChevronsRight,
} from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { useLogoutMutation } from '@/store/api/apiSlice';
import { logoutUser } from '@/store/slices/authSlice';
import ThemeToggle from '../ui/ThemeToggle';
import toast from 'react-hot-toast';

const NAV_GROUPS = [
  {
    label: 'Operate',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: FiHome },
      { label: 'Fabric Inventory', href: '/inventory', icon: FiLayers },
      { label: 'Products & SKUs', href: '/products', icon: FiBox },
      { label: 'Warehouse Stock', href: '/warehouse', icon: FiTruck },
    ],
  },
  {
    label: 'Sell',
    items: [
      { label: 'Orders & Payments', href: '/orders', icon: FiShoppingCart },
      { label: 'Customers', href: '/customers', icon: FiUsers },
    ],
  },
  {
    label: 'Track',
    items: [
      { label: 'SKU Traceability', href: '/trace', icon: FiSearch, highlight: true },
      {
        label: 'Production Stages',
        href: '#',
        icon: FiTool,
        badge: 'Phase 2',
        disabled: true,
      },
    ],
  },
];

const ADMIN_ITEM = { label: 'Staff & Roles', href: '/settings/users', icon: FiSettings };

interface NavItemProps {
  label: string;
  href: string;
  icon: React.ElementType;
  highlight?: boolean;
  badge?: string;
  disabled?: boolean;
  collapsed: boolean;
}

function NavItem({ label, href, icon: Icon, highlight, badge, disabled, collapsed }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && href !== '#' && pathname.startsWith(href));

  if (disabled) {
    return (
      <div
        title={collapsed ? `${label} (${badge})` : undefined}
        className={`flex items-center rounded-xl text-slate-400 dark:text-slate-600 cursor-not-allowed select-none text-sm transition-all ${
          collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5 justify-between'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4.5 h-4.5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">{label}</span>}
        </div>
        {!collapsed && badge && (
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800/80 text-slate-500 font-medium px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/40">
            {badge}
          </span>
        )}
      </div>
    );
  }

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`relative flex items-center rounded-xl text-sm font-medium transition-all duration-200 group ${
        collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5 gap-3'
      } ${
        isActive
          ? 'bg-brand-50 dark:bg-brand-600/15 text-brand-700 dark:text-brand-300 font-semibold'
          : highlight
          ? 'text-brand-600 dark:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800/70'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
      }`}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-600 dark:bg-brand-400 rounded-r-full" />
      )}

      <Icon
        className={`w-4.5 h-4.5 flex-shrink-0 transition-colors ${
          isActive ? 'text-brand-600 dark:text-brand-400' : highlight ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
        }`}
      />
      {!collapsed && (
        <>
          <span className="truncate flex-1">{label}</span>
          {highlight && !isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          )}
        </>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { sidebarCollapsed } = useAppSelector((state) => state.ui);
  const { user } = useAppSelector((state) => state.auth);
  const [logoutApi] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutApi(undefined).unwrap();
    } catch {}
    dispatch(logoutUser());
    toast.success('Signed out');
    router.push('/login');
  };

  const collapsed = sidebarCollapsed;

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen flex flex-col transition-all duration-300 ease-in-out
        bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/70 shadow-sm
        ${collapsed ? 'w-[68px]' : 'w-64'}`}
    >
      {/* ─── Brand Header ─── */}
      <div className={`h-16 flex items-center border-b border-slate-200 dark:border-slate-800/70 flex-shrink-0 ${collapsed ? 'justify-center px-3' : 'justify-between px-4'}`}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-display font-bold text-base text-white shadow-brand-glow group-hover:shadow-brand-glow-lg transition-shadow">
              G
            </div>
            <div className="leading-tight">
              <span className="font-display font-bold text-base text-slate-900 dark:text-white block">
                Garment<span className="text-brand-600 dark:text-brand-400">Flow</span>
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono tracking-widest uppercase block">
                Factory OS
              </span>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-display font-bold text-base text-white shadow-brand-glow">
            G
          </Link>
        )}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className={`text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all ${collapsed ? 'absolute bottom-20 left-1/2 -translate-x-1/2' : ''}`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <FiChevronsRight className="w-4 h-4" /> : <FiChevronsLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* ─── Nav Groups ─── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-3 mb-1.5 mt-3 first:mt-0">
                {group.label}
              </p>
            )}
            {collapsed && <div className="h-px bg-slate-200 dark:bg-slate-800/60 mx-2 my-2" />}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  {...item}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Admin group */}
        {user?.role === 'OWNER' && (
          <div>
            {!collapsed && (
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-3 mb-1.5 mt-3">
                Admin
              </p>
            )}
            {collapsed && <div className="h-px bg-slate-200 dark:bg-slate-800/60 mx-2 my-2" />}
            <NavItem {...ADMIN_ITEM} collapsed={collapsed} />
          </div>
        )}
      </nav>

      {/* ─── User Footer ─── */}
      {!collapsed ? (
        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800/70 p-3">
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.organizationName || 'Organization'}</p>
            </div>
            <div className="flex-shrink-0">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                user?.role === 'OWNER' ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-transparent' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
              }`}>
                {user?.role || 'STAFF'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/50">
            <ThemeToggle variant="segmented" />
            <button
              onClick={handleLogout}
              className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800/70 p-2 flex flex-col items-center gap-2">
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-xs font-bold text-white cursor-pointer shadow-sm"
            title={user?.name || 'User'}
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <ThemeToggle variant="icon" />
        </div>
      )}
    </aside>
  );
}

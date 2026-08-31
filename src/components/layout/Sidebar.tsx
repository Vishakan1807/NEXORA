'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebarStore, useAuthStore, toast } from '@/lib/stores';
import type { NavItem, UserRole } from '@/types';

// Define which roles can access which sections
const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin'];

const hasAccess = (itemCategory: string, userRole: UserRole) => {
  const isAdmin = ADMIN_ROLES.includes(userRole);
  
  if (isAdmin) {
    // Admins ONLY see Platform (Dashboard), System (Admin tools), and Observability
    return ['Platform', 'System', 'Observability'].includes(itemCategory);
  } else {
    // Non-admins see everything EXCEPT System (Admin tools)
    return itemCategory !== 'System';
  }
};

const NAV_SECTIONS: { label: string; category: string; items: NavItem[] }[] = [
  {
    label: 'Platform',
    category: 'Platform',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/dashboard' },
      { id: 'chat', label: 'Code Assistant', icon: '💻', href: '/dashboard/chat' },
      { id: 'workspace', label: 'Workspace', icon: '📂', href: '/dashboard/workspace' },
    ],
  },
  {
    label: 'Engineering',
    category: 'Engineering',
    items: [
      { id: 'code', label: 'Code Studio', icon: '🔧', href: '/dashboard/code' },
      { id: 'qa', label: 'Q & A', icon: '❓', href: '/dashboard/qa' },
      { id: 'security', label: 'Security (Soon)', icon: '🔒', href: '/dashboard/security' },
      { id: 'performance', label: 'Performance (Soon)', icon: '⚡', href: '/dashboard/performance' },
    ],
  },
  {
    label: 'Operations',
    category: 'Operations',
    items: [
      { id: 'runtime', label: 'Runtime (Soon)', icon: '🚀', href: '/dashboard/runtime' },
      { id: 'certification', label: 'Certification (Soon)', icon: '✅', href: '/dashboard/certification' },
      { id: 'providers', label: 'AI Providers', icon: '🤖', href: '/dashboard/providers' },
    ],
  },
  {
    label: 'Observability',
    category: 'Observability',
    items: [
      { id: 'logs', label: 'System Logs', icon: '📝', href: '/dashboard/logs' },
    ],
  },
  {
    label: 'System Admin',
    category: 'System',
    items: [
      { id: 'users', label: 'Users & Roles', icon: '👥', href: '/dashboard/users' },
      { id: 'settings', label: 'Global Settings', icon: '⚙️', href: '/dashboard/settings' },
      { id: 'security_audit', label: 'Security Audit', icon: '🛡️', href: '/dashboard/audit' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggleCollapsed, isOpen, setOpen } = useSidebarStore();
  const user = useAuthStore(state => state.user);
  const setAuth = useAuthStore(state => state.setAuth);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuth(null);
      toast('success', 'Logged Out', 'You have been successfully logged out.');
      router.push('/login');
    } catch {
      toast('error', 'Logout Failed', 'An error occurred during logout.');
    }
  };

  const sidebarClasses = [
    'nx-sidebar',
    isCollapsed && 'nx-sidebar--collapsed',
    isOpen && 'nx-sidebar--open',
  ]
    .filter(Boolean)
    .join(' ');

  // Filter sections based on RBAC rules
  const role = user?.role || 'developer';
  const visibleSections = NAV_SECTIONS.filter(section => hasAccess(section.category, role));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="nx-sidebar-backdrop nx-sidebar-backdrop--visible"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Brand */}
        <div className="nx-sidebar__brand">
          <div className="nx-sidebar__logo">N</div>
          <div className="nx-sidebar__brand-text">
            <span className="nx-sidebar__product-name">NEXORA</span>
            <span className="nx-sidebar__product-tagline">
              {ADMIN_ROLES.includes(role) ? 'System Admin' : 'AI Engineering'}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="nx-sidebar__nav">
          {visibleSections.map((section) => (
            <div key={section.label} className="nx-sidebar__section">
              <div className="nx-sidebar__section-label">
                {isCollapsed ? '—' : section.label}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`nx-sidebar__item ${isActive ? 'nx-sidebar__item--active' : ''}`}
                    onClick={() => setOpen(false)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="nx-sidebar__item-icon">{item.icon}</span>
                    <span className="nx-sidebar__item-label">{item.label}</span>
                    {item.badge && (
                      <span className="nx-sidebar__item-badge">{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout button */}
        <button 
          className="nx-sidebar__toggle" 
          onClick={handleLogout} 
          style={{ 
            color: 'var(--nx-error)', 
            borderBottom: '1px solid var(--nx-border)',
            borderTop: 'none',
            justifyContent: isCollapsed ? 'center' : 'flex-start'
          }}
          title="Log out"
        >
          {isCollapsed ? '🚪' : '🚪 Log Out'}
        </button>

        {/* Collapse toggle */}
        <button className="nx-sidebar__toggle" onClick={toggleCollapsed} aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {isCollapsed ? '→' : '← Collapse'}
        </button>
      </aside>
    </>
  );
}

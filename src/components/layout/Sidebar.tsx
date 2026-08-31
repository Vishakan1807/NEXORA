'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebarStore, useAuthStore, toast } from '@/lib/stores';
import type { NavItem, UserRole } from '@/types';
import { isAdmin } from '@/types';

// Define which roles can access which items
const hasAccess = (itemCategory: string, itemId: string, userRole: UserRole) => {
  if (isAdmin(userRole)) {
    // Admin: System admin tools, Observability, and general settings. NO code, NO Q&A, NO AI keys.
    if (itemCategory === 'System' || itemCategory === 'Observability') return true;
    if (itemId === 'settings') return true;
    return false;
  } else if (userRole === 'developer') {
    // Developer: Everything EXCEPT Q&A and Admin stuff (System/Logs). HAS AI Keys.
    if (itemId === 'qa' || itemCategory === 'System' || itemCategory === 'Observability') return false;
    return true;
  } else if (userRole === 'client') {
    // Client: Q&A, AI Keys, and Settings ONLY.
    if (itemId === 'qa' || itemId === 'settings' || itemId === 'ai_keys') return true;
    return false;
  } else if (userRole === 'organizer') {
    // Organizer: Dashboard, Workspace, Users & Roles, Settings
    if (itemId === 'dashboard' || itemId === 'workspace' || itemId === 'users' || itemId === 'settings') return true;
    return false;
  }
  return false;
};

const NAV_SECTIONS: { label: string; category: string; items: NavItem[] }[] = [
  {
    label: 'Platform',
    category: 'Platform',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/dashboard' },
      { id: 'workspace', label: 'Workspace', icon: '📂', href: '/dashboard/workspace' },
      { id: 'qa', label: 'Client Q&A', icon: '❓', href: '/dashboard/qa' },
    ],
  },
  {
    label: 'Engineering',
    category: 'Engineering',
    items: [
      { id: 'code', label: 'Code Studio', icon: '🔧', href: '/dashboard/code' },
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
      { id: 'security_audit', label: 'Security Audit', icon: '🛡️', href: '/dashboard/audit' },
    ],
  },
  {
    label: 'Account',
    category: 'Account',
    items: [
      { id: 'ai_keys', label: 'AI API Keys', icon: '🔑', href: '/dashboard/ai-keys' },
      { id: 'settings', label: 'General Settings', icon: '⚙️', href: '/dashboard/settings' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggleCollapsed, isOpen, setOpen } = useSidebarStore();
  const user = useAuthStore(state => state.user);
  const setAuth = useAuthStore(state => state.setAuth);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  // Filter sections and items based on RBAC rules
  const role = user?.role || 'developer';
  
  const visibleSections = NAV_SECTIONS.map(section => {
    // Filter items inside the section
    const filteredItems = section.items.filter(item => hasAccess(section.category, item.id, role));
    return { ...section, items: filteredItems };
  }).filter(section => section.items.length > 0); // Hide empty sections

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
              {isAdmin(role) ? 'System Admin' : role === 'client' ? 'Client Portal' : role === 'organizer' ? 'Project Management' : 'AI Engineering'}
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
          onClick={() => setShowLogoutConfirm(true)} 
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

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--nx-bg-primary)',
            padding: 'var(--nx-space-6)',
            borderRadius: 'var(--nx-radius-lg)',
            border: '1px solid var(--nx-border)',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: 'var(--nx-text-lg)', fontWeight: 'bold', marginBottom: 'var(--nx-space-2)', color: 'var(--nx-text-primary)' }}>Log Out</h3>
            <p style={{ color: 'var(--nx-text-secondary)', marginBottom: 'var(--nx-space-6)' }}>Are you sure you want to log out of your account?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--nx-space-3)' }}>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: 'var(--nx-space-2) var(--nx-space-4)',
                  borderRadius: 'var(--nx-radius-md)',
                  background: 'transparent',
                  border: '1px solid var(--nx-border)',
                  color: 'var(--nx-text-primary)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                style={{
                  padding: 'var(--nx-space-2) var(--nx-space-4)',
                  borderRadius: 'var(--nx-radius-md)',
                  background: 'var(--nx-error)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

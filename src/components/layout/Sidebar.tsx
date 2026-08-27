'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/lib/stores';
import type { NavItem } from '@/types';

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Platform',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/dashboard' },
      { id: 'chat', label: 'Command', icon: '💬', href: '/dashboard/chat' },
      { id: 'workspace', label: 'Workspace', icon: '📂', href: '/dashboard/workspace' },
    ],
  },
  {
    label: 'Engineering',
    items: [
      { id: 'code', label: 'Code', icon: '🔧', href: '/dashboard/code' },
      { id: 'qa', label: 'QA', icon: '🧪', href: '/dashboard/qa' },
      { id: 'security', label: 'Security', icon: '🔒', href: '/dashboard/security' },
      { id: 'performance', label: 'Performance', icon: '⚡', href: '/dashboard/performance' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'runtime', label: 'Runtime', icon: '🚀', href: '/dashboard/runtime' },
      { id: 'certification', label: 'Certification', icon: '✅', href: '/dashboard/certification' },
      { id: 'providers', label: 'AI Providers', icon: '🤖', href: '/dashboard/providers' },
      { id: 'observability', label: 'Observability', icon: '📈', href: '/dashboard/observability' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: '⚙️', href: '/dashboard/settings' },
      { id: 'admin', label: 'Admin', icon: '🛡️', href: '/dashboard/admin' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed, isOpen, setOpen } = useSidebarStore();

  const sidebarClasses = [
    'nx-sidebar',
    isCollapsed && 'nx-sidebar--collapsed',
    isOpen && 'nx-sidebar--open',
  ]
    .filter(Boolean)
    .join(' ');

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
            <span className="nx-sidebar__product-tagline">AI Engineering</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="nx-sidebar__nav">
          {NAV_SECTIONS.map((section) => (
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

        {/* Collapse toggle */}
        <button className="nx-sidebar__toggle" onClick={toggleCollapsed} aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {isCollapsed ? '→' : '← Collapse'}
        </button>
      </aside>
    </>
  );
}

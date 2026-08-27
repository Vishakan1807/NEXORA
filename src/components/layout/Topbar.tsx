'use client';

import { useThemeStore, useSidebarStore, useNotificationStore, useCommandPaletteStore } from '@/lib/stores';
import { THEMES } from '@/types';
import type { NexoraTheme } from '@/types';
import { Avatar } from '@/components/ui';

export function Topbar() {
  const { theme, setTheme } = useThemeStore();
  const { setOpen: openSidebar } = useSidebarStore();
  const { unreadCount, setOpen: openNotifications } = useNotificationStore();
  const { toggle: toggleCommandPalette } = useCommandPaletteStore();

  return (
    <header className="nx-topbar">
      {/* Left */}
      <div className="nx-topbar__left">
        {/* Mobile menu button */}
        <button
          className="nx-topbar__icon-btn"
          onClick={() => openSidebar(true)}
          aria-label="Open menu"
          style={{ display: 'none' }}
          id="mobile-menu-btn"
        >
          ☰
        </button>

        <div className="nx-topbar__breadcrumb">
          <span className="nx-topbar__breadcrumb-item">NEXORA</span>
          <span className="nx-topbar__breadcrumb-separator">/</span>
          <span className="nx-topbar__breadcrumb-item nx-topbar__breadcrumb-item--active">
            Dashboard
          </span>
        </div>
      </div>

      {/* Center — Command search */}
      <div className="nx-topbar__center">
        <button className="nx-topbar__search" onClick={toggleCommandPalette} id="command-search-btn">
          <span>🔍</span>
          <span>Search or run a command...</span>
          <span className="nx-topbar__search-shortcut">⌘K</span>
        </button>
      </div>

      {/* Right */}
      <div className="nx-topbar__right">
        {/* Theme switcher */}
        <div className="nx-topbar__theme-switcher">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`nx-topbar__theme-btn ${theme === t.id ? 'nx-topbar__theme-btn--active' : ''}`}
              onClick={() => setTheme(t.id as NexoraTheme)}
              title={`${t.name}: ${t.description}`}
              aria-label={`Switch to ${t.name} theme`}
            >
              {t.icon}
            </button>
          ))}
        </div>

        {/* Notifications */}
        <button
          className={`nx-topbar__icon-btn ${unreadCount > 0 ? 'nx-topbar__icon-btn--badge' : ''}`}
          onClick={() => openNotifications(true)}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          id="notifications-btn"
        >
          🔔
        </button>

        {/* User avatar */}
        <button className="nx-topbar__icon-btn" aria-label="User menu" id="user-menu-btn">
          <Avatar name="User" size="sm" />
        </button>
      </div>
    </header>
  );
}

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NexoraTheme, Toast, Notification, NotificationSeverity, UserRole } from '@/types';
import { DEFAULT_THEME } from '@/types';

// ============================================================
// AUTH STORE (Mock for Phase 1 development)
// ============================================================
interface AuthState {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: 'developer', // Default non-admin role
      setRole: (role) => set({ role }),
      isAuthenticated: true, // Mocked to true
    }),
    {
      name: 'nexora-auth',
    }
  )
);

// ============================================================
// THEME STORE
// ============================================================
interface ThemeState {
  theme: NexoraTheme;
  setTheme: (theme: NexoraTheme) => void;
  cycleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => set({ theme }),
      cycleTheme: () => {
        const order: NexoraTheme[] = ['aurora', 'eclipse', 'signature'];
        const current = order.indexOf(get().theme);
        const next = order[(current + 1) % order.length];
        set({ theme: next });
      },
    }),
    {
      name: 'nexora-theme',
    }
  )
);

// ============================================================
// SIDEBAR STORE
// ============================================================
interface SidebarState {
  isCollapsed: boolean;
  isOpen: boolean; // for mobile
  activeModule: string;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  setOpen: (open: boolean) => void;
  setActiveModule: (module: string) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isOpen: false,
      activeModule: 'dashboard',
      setCollapsed: (isCollapsed) => set({ isCollapsed }),
      toggleCollapsed: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
      setOpen: (isOpen) => set({ isOpen }),
      setActiveModule: (activeModule) => set({ activeModule }),
    }),
    {
      name: 'nexora-sidebar',
      partialize: (state) => ({
        isCollapsed: state.isCollapsed,
        activeModule: state.activeModule,
      }),
    }
  )
);

// ============================================================
// TOAST STORE
// ============================================================
interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++toastCounter}-${Date.now()}`;
    const newToast: Toast = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Auto-remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }

    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}));

// ============================================================
// NOTIFICATION STORE
// ============================================================
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  setOpen: (open: boolean) => void;
}

let notifCounter = 0;

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  addNotification: (notification) => {
    const id = `notif-${++notifCounter}-${Date.now()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
  markRead: (id) =>
    set((state) => {
      const notif = state.notifications.find((n) => n.id === id);
      const wasUnread = notif && !notif.isRead;
      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
      };
    }),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
  removeNotification: (id) =>
    set((state) => {
      const notif = state.notifications.find((n) => n.id === id);
      const wasUnread = notif && !notif.isRead;
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
      };
    }),
  setOpen: (isOpen) => set({ isOpen }),
}));

// ============================================================
// GLOBAL COMMAND PALETTE STORE
// ============================================================
interface CommandPaletteState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>()((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));

// ============================================================
// HELPER: Quick toast
// ============================================================
export function toast(
  severity: NotificationSeverity,
  title: string,
  message?: string,
  duration?: number
) {
  return useToastStore.getState().addToast({ severity, title, message, duration });
}

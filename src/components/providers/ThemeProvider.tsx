'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/stores';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Prevent flash of wrong theme on hydration
  useEffect(() => {
    const stored = localStorage.getItem('nexora-theme');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.theme) {
          document.documentElement.setAttribute('data-theme', parsed.state.theme);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  return <>{children}</>;
}

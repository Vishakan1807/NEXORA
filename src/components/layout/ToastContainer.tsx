'use client';

import { useToastStore } from '@/lib/stores';
import type { NotificationSeverity } from '@/types';

const SEVERITY_ICONS: Record<NotificationSeverity, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  critical: '🚨',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="nx-toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`nx-toast nx-toast--${t.severity}`} role="alert">
          <span className="nx-toast__icon">{SEVERITY_ICONS[t.severity]}</span>
          <div className="nx-toast__content">
            <div className="nx-toast__title">{t.title}</div>
            {t.message && <div className="nx-toast__message">{t.message}</div>}
            {t.action && (
              <button
                className="nx-btn nx-btn--ghost nx-btn--xs"
                onClick={t.action.onClick}
                style={{ marginTop: 4, padding: '0 8px' }}
              >
                {t.action.label}
              </button>
            )}
          </div>
          <button className="nx-toast__close" onClick={() => removeToast(t.id)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

'use client';

import { StatusDot } from '@/components/ui';

export function Statusbar() {
  return (
    <footer className="nx-statusbar">
      <div className="nx-statusbar__left">
        <div className="nx-statusbar__item">
          <StatusDot status="success" pulse />
          <span>System Online</span>
        </div>
        <div className="nx-statusbar__separator" />
        <div className="nx-statusbar__item">
          <span>No workspace selected</span>
        </div>
      </div>
      <div className="nx-statusbar__right">
        <div className="nx-statusbar__item">
          <span>Provider: Not configured</span>
        </div>
        <div className="nx-statusbar__separator" />
        <div className="nx-statusbar__item">
          <span>NEXORA v0.1.0</span>
        </div>
      </div>
    </footer>
  );
}

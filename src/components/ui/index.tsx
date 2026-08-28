'use client';

import React, { forwardRef } from 'react';

// ============================================================
// BUTTON
// ============================================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isIcon?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isIcon = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const classes = [
      'nx-btn',
      `nx-btn--${variant}`,
      size !== 'md' && `nx-btn--${size}`,
      isIcon && 'nx-btn--icon',
      fullWidth && 'nx-btn--full',
      isLoading && 'nx-btn--loading',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} className={classes} disabled={disabled || isLoading} {...props}>
        {isLoading && <span className="nx-btn__spinner" />}
        {!isLoading && leftIcon}
        {!isIcon && children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ============================================================
// CARD
// ============================================================
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'glass' | 'glow' | 'accent';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className = '', children, ...props }, ref) => {
    const classes = [
      'nx-card',
      variant !== 'default' && `nx-card--${variant}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export function CardHeader({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`nx-card__header ${className}`} {...props}>{children}</div>;
}

export function CardBody({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`nx-card__body ${className}`} {...props}>{children}</div>;
}

export function CardFooter({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`nx-card__footer ${className}`} {...props}>{children}</div>;
}

// ============================================================
// INPUT
// ============================================================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  isRequired?: boolean;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, isRequired, wrapperClassName = '', className = '', id, ...props }, ref) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    return (
      <div className={`nx-input-wrapper ${wrapperClassName}`}>
        {label && (
          <label htmlFor={inputId} className={`nx-input-label ${isRequired ? 'nx-input-label--required' : ''}`}>
            {label}
          </label>
        )}
        <div className="nx-input-container">
          {icon && <span className="nx-input-icon">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={`nx-input ${icon ? 'nx-input--with-icon' : ''} ${error ? 'nx-input--error' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <span className="nx-input-error">{error}</span>}
        {!error && hint && <span className="nx-input-hint">{hint}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================================
// BADGE
// ============================================================
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'info' | 'success' | 'warning' | 'error' | 'accent' | 'neutral';
  dot?: boolean;
}

export function Badge({ variant = 'neutral', dot = false, children, className = '', ...props }: BadgeProps) {
  const classes = [
    'nx-badge',
    `nx-badge--${variant}`,
    dot && 'nx-badge--dot',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}

// ============================================================
// PROGRESS
// ============================================================
export interface ProgressProps {
  value?: number; // 0-100
  variant?: 'default' | 'success' | 'warning' | 'error';
  indeterminate?: boolean;
  className?: string;
}

export function Progress({ value = 0, variant = 'default', indeterminate = false, className = '' }: ProgressProps) {
  return (
    <div className={`nx-progress ${indeterminate ? 'nx-progress--indeterminate' : ''} ${className}`} role="progressbar" aria-valuenow={indeterminate ? undefined : value} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`nx-progress__bar ${variant !== 'default' ? `nx-progress__bar--${variant}` : ''}`}
        style={indeterminate ? undefined : { width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ============================================================
// SPINNER
// ============================================================
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return <div className={`nx-spinner nx-spinner--${size} ${className}`} role="status" aria-label="Loading" />;
}

// ============================================================
// STATUS DOT
// ============================================================
export function StatusDot({ status, pulse = false, className = '' }: { status: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent'; pulse?: boolean; className?: string }) {
  return (
    <span className={`nx-status-dot nx-status-dot--${status} ${pulse ? 'nx-status-dot--pulse' : ''} ${className}`} />
  );
}

// ============================================================
// AVATAR
// ============================================================
export function Avatar({ name, src, size = 'md', className = '' }: { name: string; src?: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`nx-avatar nx-avatar--${size} ${className}`} title={name}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt={name} /> : initials}
    </div>
  );
}

// ============================================================
// MODAL
// ============================================================
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'default' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, size = 'default', children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="nx-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`nx-modal ${size !== 'default' ? `nx-modal--${size}` : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="nx-modal__header">
          <h2 className="nx-modal__title">{title}</h2>
          <button className="nx-modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="nx-modal__body">{children}</div>
        {footer && <div className="nx-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}

// ============================================================
// PANEL
// ============================================================
export function Panel({ title, icon, actions, children, className = '' }: { title: string; icon?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`nx-panel ${className}`}>
      <div className="nx-panel__header">
        <span className="nx-panel__title">
          {icon}
          {title}
        </span>
        {actions}
      </div>
      <div className="nx-panel__body">{children}</div>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================
export function EmptyState({ icon, title, description, action }: { icon?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="nx-empty">
      {icon && <div className="nx-empty__icon">{icon}</div>}
      <h3 className="nx-empty__title">{title}</h3>
      {description && <p className="nx-empty__description">{description}</p>}
      {action}
    </div>
  );
}

// ============================================================
// TABS
// ============================================================
export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export function Tabs({ tabs, activeTab, onTabChange, className = '' }: { tabs: Tab[]; activeTab: string; onTabChange: (id: string) => void; className?: string }) {
  return (
    <div className={`nx-tabs ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nx-tab ${activeTab === tab.id ? 'nx-tab--active' : ''}`}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

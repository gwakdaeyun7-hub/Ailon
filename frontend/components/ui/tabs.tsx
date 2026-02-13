/**
 * Tabs Component - minimal monochrome design
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={className} data-value={value}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            _value: value,
            _onValueChange: onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  _value?: string;
  _onValueChange?: (value: string) => void;
}

export function TabsList({ children, className, _value, _onValueChange }: TabsListProps) {
  return (
    <div
      className={cn(
        'flex gap-1 overflow-x-auto scrollbar-hide pb-1 -mb-px',
        className
      )}
      role="tablist"
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            _value,
            _onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  _value?: string;
  _onValueChange?: (value: string) => void;
}

export function TabsTrigger({
  value,
  children,
  className,
  _value,
  _onValueChange,
}: TabsTriggerProps) {
  const isActive = _value === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => _onValueChange?.(value)}
      className={cn(
        'flex-shrink-0 px-3 py-1.5 text-sm rounded-full transition-colors duration-150 whitespace-nowrap',
        isActive
          ? 'bg-foreground text-background font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  _value?: string;
}

export function TabsContent({
  value,
  children,
  className,
  _value,
}: TabsContentProps) {
  if (_value !== value) return null;

  return (
    <div role="tabpanel" className={cn('animate-fade-in', className)}>
      {children}
    </div>
  );
}

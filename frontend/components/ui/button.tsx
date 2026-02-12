/**
 * Button Component (shadcn/ui style)
 *
 * UX Improvements:
 * - Smoother transition timing (200ms with ease-out)
 * - Better focus-visible ring using brand color
 * - Increased touch targets (minimum h-10 for mobile accessibility)
 * - Added ring-offset for background contrast on focus
 * - Rounded-lg default for softer, more modern feel
 * - Text sizing uses system-friendly sizes
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md active:shadow-sm':
              variant === 'default',
            'border border-input bg-background hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/20':
              variant === 'outline',
            'hover:bg-accent/50 hover:text-accent-foreground':
              variant === 'ghost',
            'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90':
              variant === 'destructive',
          },
          {
            'h-10 px-4 py-2 text-sm': size === 'default',
            'h-9 rounded-lg px-3 text-caption': size === 'sm',
            'h-12 rounded-lg px-8 text-base': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };

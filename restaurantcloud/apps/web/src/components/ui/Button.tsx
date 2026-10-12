import React from 'react';
import { cn } from '@/shared/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-aurea-copper focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          {
            // Variantes ÁUREA
            'bg-aurea-navy text-aurea-ivory hover:bg-opacity-90 shadow-sm': variant === 'primary',
            'bg-aurea-champagne text-aurea-navy hover:bg-opacity-90 font-semibold': variant === 'secondary',
            'border-2 border-aurea-copper text-aurea-navy hover:bg-aurea-champagne/20': variant === 'outline',
            'text-aurea-navy hover:bg-aurea-champagne/20': variant === 'ghost',

            // Tamaños
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2.5 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

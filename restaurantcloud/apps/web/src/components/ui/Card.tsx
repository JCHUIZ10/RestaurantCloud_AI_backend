import React from 'react';
import { cn } from '@/shared/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline';
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-xl p-5 bg-white transition-all',
        {
          'border border-aurea-copper/20 shadow-sm': variant === 'default',
          'border border-aurea-copper/30 shadow-md': variant === 'elevated',
          'border-2 border-aurea-copper/40': variant === 'outline',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

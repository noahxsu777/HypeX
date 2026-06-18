'use client';
import { cn } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white shadow-sm hover:opacity-90 active:opacity-80 disabled:opacity-50',
  secondary:
    'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 disabled:opacity-50',
  outline:
    'border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 disabled:opacity-50',
  ghost:
    'bg-transparent text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 disabled:opacity-50',
  danger:
    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:opacity-50',
};

const sizeClass: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 h-8 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2 h-10 rounded-xl gap-2',
  lg: 'text-base px-6 py-3 h-12 rounded-2xl gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className,
  onClick,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
        variantClass[variant],
        sizeClass[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading && <LoadingSpinner size={size === 'sm' ? 14 : 16} className="flex-shrink-0" />}
      {children}
    </button>
  );
}

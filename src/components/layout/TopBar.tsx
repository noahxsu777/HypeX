'use client';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  transparent?: boolean;
  right?: React.ReactNode;
  /** Shows a search bar in the center (used by explore page) */
  showSearch?: boolean;
}

export default function TopBar({ title, showBack, transparent, right, showSearch }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-30 pt-safe',
        transparent
          ? 'bg-transparent'
          : 'backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-gray-200/60 dark:border-gray-800/60'
      )}
    >
      <div className="relative flex items-center h-14 px-4">
        {/* Left */}
        <div className="flex items-center flex-1">
          {showBack ? (
            <button
              type="button"
              onClick={() => router.back()}
              className={cn(
                'flex items-center gap-1 -ml-1.5 px-1.5 py-1 rounded-lg transition-colors',
                transparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
              aria-label="Volver"
            >
              <ChevronLeft size={26} />
            </button>
          ) : isHome ? (
            <span
              className="text-2xl font-extrabold gradient-text select-none tracking-tight"
              aria-label="HypeX"
            >
              HypeX
            </span>
          ) : null}
        </div>

        {/* Center title or search */}
        {showSearch ? (
          <div className="absolute left-1/2 -translate-x-1/2 w-[55%]">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="search"
                placeholder="Buscar"
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>
        ) : title ? (
          <h1
            className={cn(
              'absolute left-1/2 -translate-x-1/2 text-base font-semibold truncate max-w-[60%]',
              transparent
                ? 'text-white'
                : 'text-gray-900 dark:text-white'
            )}
          >
            {title}
          </h1>
        ) : null}

        {/* Right slot */}
        <div className="flex items-center justify-end flex-1">
          {right}
        </div>
      </div>
    </header>
  );
}

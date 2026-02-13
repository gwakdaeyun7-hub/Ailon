/**
 * Bottom Navigation - mobile only, 4 tabs
 * Monochrome design with active states
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Archive, Bookmark, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const NAV_ITEMS = [
  {
    href: '/',
    label: '홈',
    icon: Home,
  },
  {
    href: '/archive',
    label: '아카이브',
    icon: Archive,
  },
  {
    href: '/bookmarks',
    label: '북마크',
    icon: Bookmark,
  },
  {
    href: '/profile',
    label: '프로필',
    icon: User,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground active:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

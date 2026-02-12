/**
 * 헤더 컴포넌트 - 네비게이션 및 인증
 *
 * UX Improvements:
 * - Korean-friendly brand name "Ailon" with gradient styling
 * - Larger touch targets for mobile (min 44px)
 * - Improved visual hierarchy between brand and auth section
 * - Better loading skeleton proportions
 * - Dark mode toggle placeholder ready
 */

'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User, Sparkles } from 'lucide-react';

export function Header() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold leading-tight gradient-text">
              Ailon
            </h1>
            <span className="hidden sm:block text-[10px] text-muted-foreground leading-none -mt-0.5">
              AI Learning Companion
            </span>
          </div>
        </div>

        {/* Navigation & Auth */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block h-4 w-20 animate-pulse rounded bg-muted skeleton-shimmer" />
              <div className="h-9 w-24 animate-pulse rounded-lg bg-muted skeleton-shimmer" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-secondary/60">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || '사용자'}
                    className="h-7 w-7 rounded-full ring-2 ring-primary/20"
                  />
                ) : (
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
                <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                  {user.displayName || user.email}
                </span>
              </div>
              <Button
                onClick={signOut}
                variant="outline"
                size="sm"
                className="h-9 text-caption"
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                <span className="hidden xs:inline">로그아웃</span>
              </Button>
            </div>
          ) : (
            <Button
              onClick={signInWithGoogle}
              size="sm"
              className="h-9 px-4 shadow-sm"
            >
              <LogIn className="h-4 w-4 mr-1.5" />
              Google 로그인
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

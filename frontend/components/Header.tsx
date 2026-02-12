/**
 * Header - minimal navigation inspired by Newneek
 * Clean text logo, simple auth, white background
 */

'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User } from 'lucide-react';

export function Header() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
      <div className="container mx-auto max-w-3xl flex h-14 items-center justify-between px-6">
        {/* Logo */}
        <h1 className="text-lg font-extrabold tracking-tight text-foreground">
          Ailon
        </h1>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || '사용자'}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm text-foreground max-w-[120px] truncate">
                  {user.displayName || user.email}
                </span>
              </div>
              <Button
                onClick={signOut}
                variant="ghost"
                size="sm"
                className="text-caption text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">로그아웃</span>
              </Button>
            </div>
          ) : (
            <Button
              onClick={signInWithGoogle}
              variant="outline"
              size="sm"
              className="text-sm"
            >
              <LogIn className="h-4 w-4 mr-1.5" />
              로그인
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

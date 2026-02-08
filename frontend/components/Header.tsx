/**
 * 헤더 컴포넌트 - 네비게이션 및 인증
 */

'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User, Sparkles } from 'lucide-react';

export function Header() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">AI Learning Companion</h1>
        </div>

        {/* Navigation & Auth */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-10 w-20 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
                <span className="text-sm">{user.displayName || user.email}</span>
              </div>
              <Button onClick={signOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </Button>
            </div>
          ) : (
            <Button onClick={signInWithGoogle} size="sm">
              <LogIn className="h-4 w-4 mr-2" />
              Google 로그인
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

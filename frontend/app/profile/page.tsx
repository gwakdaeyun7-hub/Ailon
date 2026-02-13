/**
 * Profile Page - User settings and preferences
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUserPreferences } from '@/lib/hooks/useUserPreferences';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, LogIn, User as UserIcon, Bell, Settings } from 'lucide-react';
import { NEWS_CATEGORY_LABELS, type NewsCategory } from '@/lib/types';

const DISCIPLINES = [
  '물리학',
  '화학',
  '생물학',
  '수학',
  '의학/신경과학',
  '컴퓨터과학',
  '전기공학',
  '심리학/인지과학',
  '철학/윤리학',
  '경제학',
];

export default function ProfilePage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { preferences, updatePreferences, loading: prefsLoading } =
    useUserPreferences();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setSigningOut(false);
    }
  };

  const toggleCategory = (category: NewsCategory) => {
    const newCategories = preferences.newsCategories.includes(category)
      ? preferences.newsCategories.filter((c) => c !== category)
      : [...preferences.newsCategories, category];
    updatePreferences({ newsCategories: newCategories });
  };

  const toggleDiscipline = (discipline: string) => {
    const newDisciplines = preferences.disciplines.includes(discipline)
      ? preferences.disciplines.filter((d) => d !== discipline)
      : [...preferences.disciplines, discipline];
    updatePreferences({ disciplines: newDisciplines });
  };

  const toggleNotifications = () => {
    updatePreferences({ notificationsEnabled: !preferences.notificationsEnabled });
  };

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-6 py-10 mb-20 md:mb-0">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-3xl px-6 py-10 mb-20 md:mb-0">
        <div className="mb-10">
          <h1 className="text-section text-foreground mb-2">프로필</h1>
          <p className="text-body-kr text-muted-foreground">
            개인 설정 및 맞춤 관심사 관리
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-16">
          <LogIn className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">
            로그인이 필요해요
          </h2>
          <p className="text-body-kr text-muted-foreground text-center mb-6">
            프로필 및 설정 기능을 사용하려면 먼저 로그인해 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-6 py-10 mb-20 md:mb-0">
      <div className="mb-8">
        <h1 className="text-section text-foreground mb-2">프로필</h1>
        <p className="text-body-kr text-muted-foreground">
          개인 설정 및 맞춤 관심사 관리
        </p>
      </div>

      <div className="space-y-8">
        <section className="p-6 border border-border rounded-lg">
          <div className="flex items-start gap-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || '프로필'}
                className="w-16 h-16 rounded-full border-2 border-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground mb-1">
                {user.displayName || '사용자'}
              </h2>
              <p className="text-caption text-muted-foreground break-all">
                {user.email}
              </p>
            </div>
          </div>
        </section>

        <section className="p-6 border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">관심 뉴스 카테고리</h3>
          </div>
          <p className="text-caption text-muted-foreground mb-4">
            관심 있는 AI 뉴스 카테고리를 선택하세요
          </p>
          {prefsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(NEWS_CATEGORY_LABELS).map(([key, label]) => {
                const category = key as NewsCategory;
                const isSelected = preferences.newsCategories.includes(category);
                return (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={
                      isSelected
                        ? 'px-3 py-1.5 text-sm rounded-full border-2 border-foreground bg-foreground text-background font-medium transition-colors'
                        : 'px-3 py-1.5 text-sm rounded-full border border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors'
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="p-6 border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">관심 학문 분야</h3>
          </div>
          <p className="text-caption text-muted-foreground mb-4">
            관심 있는 학문 분야를 선택하세요
          </p>
          {prefsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {DISCIPLINES.map((discipline) => {
                const isSelected = preferences.disciplines.includes(discipline);
                return (
                  <button
                    key={discipline}
                    onClick={() => toggleDiscipline(discipline)}
                    className={
                      isSelected
                        ? 'px-3 py-1.5 text-sm rounded-full border-2 border-foreground bg-foreground text-background font-medium transition-colors'
                        : 'px-3 py-1.5 text-sm rounded-full border border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors'
                    }
                  >
                    {discipline}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="p-6 border border-border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-bold text-foreground">알림 설정</h3>
                <p className="text-caption text-muted-foreground mt-0.5">
                  새로운 콘텐츠 알림 받기
                </p>
              </div>
            </div>
            <button
              onClick={toggleNotifications}
              disabled={prefsLoading}
              className={
                preferences.notificationsEnabled
                  ? 'relative w-12 h-6 rounded-full bg-foreground transition-colors'
                  : 'relative w-12 h-6 rounded-full bg-border transition-colors'
              }
            >
              <span
                className={
                  preferences.notificationsEnabled
                    ? 'absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-background transition-transform'
                    : 'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background transition-transform'
                }
              />
            </button>
          </div>
        </section>

        <section className="pt-6 border-t border-border">
          <Button
            onClick={handleLogout}
            disabled={signingOut}
            variant="outline"
            size="lg"
            className="w-full"
          >
            {signingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                로그아웃 중...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </>
            )}
          </Button>
        </section>
      </div>
    </div>
  );
}

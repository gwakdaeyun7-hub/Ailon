/**
 * 뉴스 섹션 컴포넌트 - 에이전트 팀 큐레이션 결과 표시
 * 일일 개요, 하이라이트, 테마별 그룹화 지원
 *
 * UX Improvements:
 * - Section header with colored icon container for visual identity
 * - Improved skeleton loading with shimmer animation
 * - Better highlight card with gradient border accent
 * - Refined theme tags with section-specific color
 * - Cards with interactive hover effects and better touch targets
 * - Improved empty/error states with empathetic messaging
 * - Better information hierarchy: overview > highlight > themes > grid
 */

'use client';

import { useNews } from '@/lib/hooks/useNews';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Newspaper, Star, TrendingUp, RefreshCw } from 'lucide-react';

function SectionHeader({ count }: { count?: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40">
        <Newspaper className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <h2 className="text-section">오늘의 AI 뉴스</h2>
        {count !== undefined && (
          <p className="text-caption text-muted-foreground mt-0.5">
            AI 에이전트가 엄선한 {count}개의 기사
          </p>
        )}
      </div>
    </div>
  );
}

export function NewsSection() {
  const { news, dailyOverview, highlight, themes, loading, error } = useNews();

  if (loading) {
    return (
      <section className="space-y-6">
        <SectionHeader />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <div className="h-3 w-16 bg-muted rounded-full skeleton-shimmer" />
                <div className="h-5 bg-muted rounded skeleton-shimmer mt-2" />
                <div className="h-5 bg-muted rounded w-3/4 skeleton-shimmer" />
                <div className="h-3 bg-muted rounded w-1/3 skeleton-shimmer mt-1" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded skeleton-shimmer" />
                  <div className="h-4 bg-muted rounded skeleton-shimmer" />
                  <div className="h-4 bg-muted rounded w-5/6 skeleton-shimmer" />
                </div>
                <div className="h-9 bg-muted rounded-lg skeleton-shimmer mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-6">
        <SectionHeader />
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  뉴스를 불러오는 데 문제가 있었어요
                </p>
                <p className="text-caption text-muted-foreground">
                  잠시 후 페이지를 새로고침해 주세요.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (news.length === 0) {
    return (
      <section className="space-y-6">
        <SectionHeader />
        <Card className="border-dashed border-2">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-6 gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Newspaper className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  아직 오늘의 뉴스가 준비되지 않았어요
                </p>
                <p className="text-caption text-muted-foreground">
                  AI 에이전트가 뉴스를 수집하고 있어요. 잠시 후 다시 확인해 주세요.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <SectionHeader count={news.length} />

      {/* 일일 개요 */}
      {dailyOverview && (
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/30">
          <CardContent className="py-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mt-0.5">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-caption font-semibold text-blue-700 dark:text-blue-300 mb-1.5 uppercase tracking-wider">
                  오늘의 AI 트렌드 요약
                </h3>
                <p className="text-body-kr text-foreground/80 leading-korean-tight">
                  {dailyOverview}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 테마 태그 */}
      {themes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {themes.map((theme, i) => (
            <span
              key={i}
              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium border border-blue-200/50 dark:border-blue-800/30 transition-colors hover:bg-blue-100 dark:hover:bg-blue-950/50"
            >
              {theme}
            </span>
          ))}
        </div>
      )}

      {/* 하이라이트 기사 */}
      {highlight && highlight.title && (
        <Card className="relative overflow-hidden border-amber-200/60 dark:border-amber-700/30 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/40 dark:from-amber-950/20 dark:via-card dark:to-orange-950/10">
          {/* Accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
          <CardHeader className="pt-7">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                오늘의 하이라이트
              </span>
            </div>
            <CardTitle className="text-xl leading-snug">
              {highlight.title}
            </CardTitle>
            <CardDescription className="text-caption mt-1">
              {highlight.source} &middot; {new Date(highlight.published).toLocaleDateString('ko-KR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-body-kr text-muted-foreground mb-5 leading-korean-tight">
              {highlight.summary || highlight.description}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-300"
              onClick={() => window.open(highlight.link, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              전체 기사 읽기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 전체 기사 그리드 */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {news.map((article, index) => (
          <Card
            key={index}
            className="flex flex-col card-interactive group"
          >
            <CardHeader className="pb-3">
              {article.theme && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1.5 block">
                  {article.theme}
                </span>
              )}
              <CardTitle className="text-card-title line-clamp-2 group-hover:text-primary transition-colors">
                {article.title}
              </CardTitle>
              <CardDescription className="text-caption mt-1">
                {article.source} &middot; {new Date(article.published).toLocaleDateString('ko-KR')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between pt-0">
              <p className="text-body-kr text-muted-foreground mb-4 line-clamp-3 leading-korean-tight">
                {article.summary || article.description}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full group-hover:border-primary/30 group-hover:text-primary transition-colors"
                onClick={() => window.open(article.link, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                전체 기사 읽기
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

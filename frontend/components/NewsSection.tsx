/**
 * News Section - clean minimal design inspired by Newneek
 * Monochrome palette, generous whitespace, content-first
 */

'use client';

import { useNews } from '@/lib/hooks/useNews';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw } from 'lucide-react';

function SectionHeader({ count }: { count?: number }) {
  return (
    <div className="mb-10">
      <h2 className="text-section text-foreground">오늘의 AI 뉴스</h2>
      {count !== undefined && (
        <p className="text-body-kr text-muted-foreground mt-1">
          AI 에이전트가 엄선한 {count}개의 기사
        </p>
      )}
    </div>
  );
}

export function NewsSection() {
  const { news, dailyOverview, highlight, themes, loading, error } = useNews();

  if (loading) {
    return (
      <section>
        <SectionHeader />
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="py-6 border-b border-border last:border-b-0">
              <div className="h-4 w-16 bg-muted rounded skeleton-shimmer mb-3" />
              <div className="h-5 bg-muted rounded skeleton-shimmer mb-2" />
              <div className="h-5 bg-muted rounded w-3/4 skeleton-shimmer mb-3" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded skeleton-shimmer" />
                <div className="h-4 bg-muted rounded w-5/6 skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <SectionHeader />
        <div className="py-12 text-center">
          <RefreshCw className="h-5 w-5 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-foreground mb-1">
            뉴스를 불러오는 데 문제가 있었어요
          </p>
          <p className="text-caption text-muted-foreground">
            잠시 후 페이지를 새로고침해 주세요.
          </p>
        </div>
      </section>
    );
  }

  if (news.length === 0) {
    return (
      <section>
        <SectionHeader />
        <div className="py-12 text-center">
          <p className="text-sm text-foreground mb-1">
            아직 오늘의 뉴스가 준비되지 않았어요
          </p>
          <p className="text-caption text-muted-foreground">
            AI 에이전트가 뉴스를 수집하고 있어요. 잠시 후 다시 확인해 주세요.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader count={news.length} />

      {/* Daily overview */}
      {dailyOverview && (
        <div className="mb-10 pb-10 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            오늘의 AI 트렌드 요약
          </p>
          <p className="text-body-kr text-foreground leading-korean">
            {dailyOverview}
          </p>
        </div>
      )}

      {/* Theme tags */}
      {themes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {themes.map((theme, i) => (
            <span
              key={i}
              className="px-3 py-1 text-xs text-muted-foreground border border-border rounded-full"
            >
              {theme}
            </span>
          ))}
        </div>
      )}

      {/* Highlight article */}
      {highlight && highlight.title && (
        <div className="mb-10 pb-10 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            오늘의 하이라이트
          </p>
          <h3 className="text-xl md:text-2xl font-bold text-foreground leading-snug mb-2">
            {highlight.title}
          </h3>
          <p className="text-caption text-muted-foreground mb-4">
            {highlight.source} &middot; {new Date(highlight.published).toLocaleDateString('ko-KR')}
          </p>
          <p className="text-body-kr text-muted-foreground mb-5 leading-korean-tight">
            {highlight.summary || highlight.description}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(highlight.link, '_blank')}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-2" />
            전체 기사 읽기
          </Button>
        </div>
      )}

      {/* Article list */}
      <div className="divide-y divide-border">
        {news.map((article, index) => (
          <article
            key={index}
            className="py-6 first:pt-0 last:pb-0 group"
          >
            {article.theme && (
              <span className="text-xs text-muted-foreground mb-2 block">
                {article.theme}
              </span>
            )}
            <h3 className="text-card-title text-foreground mb-1 group-hover:opacity-70 transition-opacity cursor-pointer"
                onClick={() => window.open(article.link, '_blank')}>
              {article.title}
            </h3>
            <p className="text-caption text-muted-foreground mb-3">
              {article.source} &middot; {new Date(article.published).toLocaleDateString('ko-KR')}
            </p>
            <p className="text-body-kr text-muted-foreground leading-korean-tight line-clamp-2">
              {article.summary || article.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

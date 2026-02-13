/**
 * News Section - category tabs, short/long form, feedback, detail modal
 * Monochrome palette, generous whitespace, content-first
 */

'use client';

import { useState } from 'react';
import { useNews } from '@/lib/hooks/useNews';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog';
import { FeedbackButtons } from '@/components/FeedbackButtons';
import { BookmarkButton } from '@/components/BookmarkButton';
import {
  ExternalLink, RefreshCw, Brain, Bot, Code, Cpu, Shield,
} from 'lucide-react';
import type { Article } from '@/lib/types';

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  all: { label: '전체', icon: null },
  models_architecture: { label: '모델', icon: <Brain className="h-3.5 w-3.5" /> },
  agentic_reality: { label: '에이전트', icon: <Bot className="h-3.5 w-3.5" /> },
  opensource_code: { label: '오픈소스', icon: <Code className="h-3.5 w-3.5" /> },
  physical_ai: { label: 'Physical', icon: <Cpu className="h-3.5 w-3.5" /> },
  policy_safety: { label: '정책', icon: <Shield className="h-3.5 w-3.5" /> },
};

function SectionHeader({ count }: { count?: number }) {
  return (
    <div className="mb-8">
      <h2 className="text-section text-foreground">오늘의 AI 뉴스</h2>
      {count !== undefined && (
        <p className="text-body-kr text-muted-foreground mt-1">
          AI 에이전트가 엄선한 {count}개의 기사
        </p>
      )}
    </div>
  );
}

function ArticleCard({
  article,
  index,
  compact,
  onOpenDetail,
}: {
  article: Article;
  index: number;
  compact?: boolean;
  onOpenDetail: (article: Article) => void;
}) {
  const category = (article as any).category;
  const catConfig = category ? CATEGORY_CONFIG[category] : null;

  if (compact) {
    return (
      <div
        className="py-4 first:pt-0 last:pb-0 group cursor-pointer"
        onClick={() => onOpenDetail(article)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {catConfig?.icon && (
                <span className="text-muted-foreground">{catConfig.icon}</span>
              )}
              {catConfig && (
                <span className="text-xs text-muted-foreground">{catConfig.label}</span>
              )}
            </div>
            <h4 className="text-sm font-medium text-foreground group-hover:opacity-70 transition-opacity line-clamp-2">
              {article.title}
            </h4>
            <p className="text-caption text-muted-foreground mt-1">
              {article.source}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <FeedbackButtons itemType="news" itemId={`news_${index}`} size="sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <article
      className="py-6 first:pt-0 last:pb-0 group cursor-pointer"
      onClick={() => onOpenDetail(article)}
    >
      <div className="flex items-center gap-2 mb-2">
        {catConfig?.icon && (
          <span className="text-muted-foreground">{catConfig.icon}</span>
        )}
        {article.theme && (
          <span className="text-xs text-muted-foreground">{article.theme}</span>
        )}
        {catConfig && !article.theme && (
          <span className="text-xs text-muted-foreground">{catConfig.label}</span>
        )}
      </div>
      <h3 className="text-card-title text-foreground mb-1 group-hover:opacity-70 transition-opacity">
        {article.title}
      </h3>
      <p className="text-caption text-muted-foreground mb-3">
        {article.source} &middot; {new Date(article.published).toLocaleDateString('ko-KR')}
      </p>
      <p className="text-body-kr text-muted-foreground leading-korean-tight line-clamp-3">
        {article.summary || article.description}
      </p>
      <div className="flex items-center gap-2 mt-3">
        <FeedbackButtons itemType="news" itemId={`news_${index}`} size="sm" />
        <BookmarkButton itemType="news" itemId={`news_${index}`} size="sm" />
      </div>
    </article>
  );
}

function NewsDetailModal({
  article,
  open,
  onClose,
}: {
  article: Article | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!article) return null;

  const howToGuide = (article as any).howToGuide;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader onClose={onClose}>
        <DialogTitle>{article.title}</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <p className="text-caption text-muted-foreground mb-4">
          {article.source} &middot; {new Date(article.published).toLocaleDateString('ko-KR')}
        </p>

        <div className="mb-6">
          <h4 className="text-sm font-semibold text-foreground mb-2">요약</h4>
          <p className="text-body-kr text-muted-foreground leading-korean">
            {article.summary || article.description}
          </p>
        </div>

        {howToGuide && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              How-to Guide: {howToGuide.title}
            </h4>
            {howToGuide.steps && (
              <ol className="space-y-2 mb-4">
                {howToGuide.steps.map((step: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex-shrink-0 text-xs font-medium text-muted-foreground w-5 text-right">
                      {i + 1}.
                    </span>
                    <span className="text-body-kr text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            )}
            {howToGuide.codeSnippet && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">코드 예시</p>
                <pre className="text-xs bg-foreground/5 rounded p-3 overflow-x-auto">
                  <code>{howToGuide.codeSnippet}</code>
                </pre>
              </div>
            )}
            {howToGuide.promptExample && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">프롬프트 예시</p>
                <div className="text-body-kr text-muted-foreground bg-foreground/5 rounded p-3 italic">
                  {howToGuide.promptExample}
                </div>
              </div>
            )}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => window.open(article.link, '_blank')}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-2" />
          원문 기사 읽기
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function NewsSection() {
  const { news, dailyOverview, highlight, themes, loading, error } = useNews();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

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

  // Separate short-form and long-form articles
  const shortFormArticles = news.filter((a: any) => a.type === 'short');
  const longFormArticles = news.filter((a: any) => a.type === 'long' || !a.type);

  // Filter by category
  const filteredLongForm = activeCategory === 'all'
    ? longFormArticles
    : longFormArticles.filter((a: any) => a.category === activeCategory);

  return (
    <section>
      <SectionHeader count={news.length} />

      {/* Daily overview */}
      {dailyOverview && (
        <div className="mb-8 pb-8 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            오늘의 AI 트렌드 요약
          </p>
          <p className="text-body-kr text-foreground leading-korean">
            {dailyOverview}
          </p>
        </div>
      )}

      {/* Short-form section (compact cards) */}
      {shortFormArticles.length > 0 && (
        <div className="mb-8 pb-8 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            핵심 뉴스 5선
          </p>
          <div className="divide-y divide-border">
            {shortFormArticles.slice(0, 5).map((article, index) => (
              <ArticleCard
                key={`short-${index}`}
                article={article}
                index={index}
                compact
                onOpenDetail={setSelectedArticle}
              />
            ))}
          </div>
        </div>
      )}

      {/* Category tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="mb-6">
          {Object.entries(CATEGORY_CONFIG).map(([key, { label, icon }]) => (
            <TabsTrigger key={key} value={key}>
              <span className="flex items-center gap-1.5">
                {icon}
                {label}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Highlight article */}
      {activeCategory === 'all' && highlight && highlight.title && (
        <div className="mb-8 pb-8 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            오늘의 하이라이트
          </p>
          <div
            className="cursor-pointer group"
            onClick={() => setSelectedArticle(highlight)}
          >
            <h3 className="text-xl md:text-2xl font-bold text-foreground leading-snug mb-2 group-hover:opacity-70 transition-opacity">
              {highlight.title}
            </h3>
            <p className="text-caption text-muted-foreground mb-4">
              {highlight.source} &middot; {new Date(highlight.published).toLocaleDateString('ko-KR')}
            </p>
            <p className="text-body-kr text-muted-foreground mb-4 leading-korean-tight">
              {highlight.summary || highlight.description}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(highlight.link, '_blank');
              }}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              전체 기사 읽기
            </Button>
          </div>
        </div>
      )}

      {/* Theme tags */}
      {activeCategory === 'all' && themes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
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

      {/* Long-form article list */}
      <div className="divide-y divide-border">
        {filteredLongForm.map((article, index) => (
          <ArticleCard
            key={`long-${index}`}
            article={article}
            index={shortFormArticles.length + index}
            onOpenDetail={setSelectedArticle}
          />
        ))}
      </div>

      {filteredLongForm.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            이 카테고리에 해당하는 기사가 없어요
          </p>
        </div>
      )}

      {/* Detail Modal */}
      <NewsDetailModal
        article={selectedArticle}
        open={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </section>
  );
}

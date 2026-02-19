/**
 * News Section - highlight, category tabs (main 5 + more 5), official announcements by company
 */

'use client';

import { useState } from 'react';
import { useNews } from '@/lib/hooks/useNews';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog';
import { FeedbackButtons } from '@/components/FeedbackButtons';
import { BookmarkButton } from '@/components/BookmarkButton';
import { ExternalLink, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import type { Article, HorizontalArticle } from '@/lib/types';

const CATEGORY_CONFIG: Record<string, { label: string }> = {
  model_research:    { label: '모델/연구' },
  product_tools:     { label: '제품/도구' },
  industry_business: { label: '산업/비즈니스' },
};

const COMPANY_COLORS: Record<string, string> = {
  OpenAI:   '#10B981',
  Anthropic: '#7C3AED',
  DeepMind: '#1D4ED8',
};

function articleTitle(a: Article | HorizontalArticle) {
  return (a as any).display_title || a.title;
}

// ─── 상세 모달 ───────────────────────────────────────────────────────────────
function NewsDetailModal({ article, open, onClose }: {
  article: Article | HorizontalArticle | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!article) return null;
  const howToGuide = (article as any).howToGuide;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader onClose={onClose}>
        <DialogTitle>{articleTitle(article)}</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <p className="text-caption text-muted-foreground mb-4">
          {article.source} &middot; {new Date(article.published).toLocaleDateString('ko-KR')}
        </p>

        <div className="mb-6">
          <h4 className="text-sm font-semibold text-foreground mb-2">요약</h4>
          <p className="text-body-kr text-muted-foreground leading-korean">
            {(article as any).summary || article.description}
          </p>
        </div>

        {howToGuide && typeof howToGuide === 'string' && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-body-kr text-muted-foreground">{howToGuide}</p>
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

// ─── 기사 카드 ───────────────────────────────────────────────────────────────
function ArticleCard({ article, index, onOpen }: {
  article: Article;
  index: number;
  onOpen: (a: Article) => void;
}) {
  return (
    <article
      className="py-5 first:pt-0 last:pb-0 group cursor-pointer"
      onClick={() => onOpen(article)}
    >
      <h3 className="text-card-title text-foreground mb-1 group-hover:opacity-70 transition-opacity">
        {articleTitle(article)}
      </h3>
      <p className="text-caption text-muted-foreground mb-2">
        {article.source} &middot; {new Date(article.published).toLocaleDateString('ko-KR')}
      </p>
      {(article as any).impact_comment && (
        <p className="text-xs text-blue-600 mb-2">{(article as any).impact_comment}</p>
      )}
      <p className="text-body-kr text-muted-foreground leading-korean-tight line-clamp-2">
        {article.summary || article.description}
      </p>
      <div className="flex items-center gap-2 mt-3">
        <FeedbackButtons itemType="news" itemId={`news_${index}`} size="sm" />
        <BookmarkButton itemType="news" itemId={`news_${index}`} size="sm" />
      </div>
    </article>
  );
}

// ─── 공식 발표 회사별 컨테이너 ───────────────────────────────────────────────
function OfficialSection({
  grouped,
  onOpen,
}: {
  grouped: Record<string, HorizontalArticle[]>;
  onOpen: (a: HorizontalArticle) => void;
}) {
  if (!grouped || Object.keys(grouped).length === 0) return null;

  return (
    <div className="mb-8">
      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-4">
        💫 공식 발표
      </p>
      <div className="space-y-4">
        {Object.entries(grouped).map(([company, articles]) => {
          if (!articles || articles.length === 0) return null;
          const color = COMPANY_COLORS[company] ?? '#7C3AED';
          return (
            <div
              key={company}
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: `${color}40` }}
            >
              {/* 회사 헤더 */}
              <div
                className="flex items-center gap-2 px-4 py-2.5"
                style={{ backgroundColor: `${color}12` }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {company.charAt(0)}
                </div>
                <span className="text-sm font-bold" style={{ color }}>{company}</span>
              </div>
              {/* 기사 목록 */}
              <div className="divide-y divide-border">
                {articles.map((a, i) => (
                  <div
                    key={i}
                    className="px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => onOpen(a)}
                  >
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {articleTitle(a)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 메인 섹션 ───────────────────────────────────────────────────────────────
export function NewsSection() {
  const { news, dailyOverview, highlight, themes, horizontalSections, loading, error } = useNews();
  const [activeCategory, setActiveCategory] = useState('model_research');
  const [expandedMore, setExpandedMore] = useState<Record<string, boolean>>({});
  const [selectedArticle, setSelectedArticle] = useState<Article | HorizontalArticle | null>(null);

  if (loading) {
    return (
      <section>
        <div className="mb-8"><h2 className="text-section text-foreground">오늘의 AI 뉴스</h2></div>
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="py-6 border-b border-border last:border-b-0">
              <div className="h-5 bg-muted rounded skeleton-shimmer mb-2" />
              <div className="h-5 bg-muted rounded w-3/4 skeleton-shimmer mb-3" />
              <div className="h-4 bg-muted rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <div className="mb-8"><h2 className="text-section text-foreground">오늘의 AI 뉴스</h2></div>
        <div className="py-12 text-center">
          <RefreshCw className="h-5 w-5 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-foreground mb-1">뉴스를 불러오는 데 문제가 있었어요</p>
          <p className="text-caption text-muted-foreground">잠시 후 페이지를 새로고침해 주세요.</p>
        </div>
      </section>
    );
  }

  if (news.length === 0) {
    return (
      <section>
        <div className="mb-8"><h2 className="text-section text-foreground">오늘의 AI 뉴스</h2></div>
        <div className="py-12 text-center">
          <p className="text-sm text-foreground mb-1">아직 오늘의 뉴스가 준비되지 않았어요</p>
          <p className="text-caption text-muted-foreground">AI 에이전트가 뉴스를 수집하고 있어요.</p>
        </div>
      </section>
    );
  }

  // is_main 기준으로 분리
  const highlightTitle = highlight?.title;
  const mainByCat: Record<string, Article[]> = {};
  const moreByCat: Record<string, Article[]> = {};
  news.forEach((a: any) => {
    if (a.title === highlightTitle) return;
    const cat = a.category || 'model_research';
    if (a.is_main === false) {
      moreByCat[cat] = [...(moreByCat[cat] || []), a];
    } else {
      mainByCat[cat] = [...(mainByCat[cat] || []), a];
    }
  });

  const mainArticles = mainByCat[activeCategory] || [];
  const moreArticles = moreByCat[activeCategory] || [];
  const showMore = expandedMore[activeCategory] ?? false;

  return (
    <section>
      <div className="mb-8">
        <h2 className="text-section text-foreground">오늘의 AI 뉴스</h2>
        {news.length > 0 && (
          <p className="text-body-kr text-muted-foreground mt-1">AI 에이전트가 엄선한 {news.length}개의 기사</p>
        )}
      </div>

      {/* 일일 개요 */}
      {dailyOverview && (
        <div className="mb-8 pb-8 border-b border-gradient">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">오늘의 AI 트렌드 요약</p>
          <p className="text-body-kr text-foreground leading-korean">{dailyOverview}</p>
        </div>
      )}

      {/* 하이라이트 */}
      {highlight && highlight.title && (
        <div className="mb-8">
          <p className="text-xs font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent uppercase tracking-wider mb-4">
            ⭐ 오늘의 하이라이트
          </p>
          <div
            className="cursor-pointer group p-6 rounded-2xl border-2 border-transparent transition-all duration-300"
            style={{ background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6) border-box' }}
            onClick={() => setSelectedArticle(highlight)}
          >
            {(highlight as any).image_url && (
              <img
                src={(highlight as any).image_url}
                alt=""
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
            )}
            <h3 className="text-xl font-bold text-foreground leading-snug mb-2 group-hover:opacity-70 transition-opacity">
              {articleTitle(highlight)}
            </h3>
            <p className="text-caption text-muted-foreground mb-4">
              {highlight.source} &middot; {new Date(highlight.published).toLocaleDateString('ko-KR')}
            </p>
            <p className="text-body-kr text-muted-foreground mb-4 leading-korean-tight line-clamp-3">
              {highlight.summary || highlight.description}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-500/50 hover:border-blue-500"
              onClick={(e) => { e.stopPropagation(); window.open(highlight.link, '_blank'); }}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              전체 기사 읽기
            </Button>
          </div>
        </div>
      )}

      {/* 카테고리 탭 + 기사 목록 */}
      <div className="mb-8">
        <Tabs value={activeCategory} onValueChange={(v) => { setActiveCategory(v); }}>
          <TabsList className="mb-6 border border-slate-200/80 bg-slate-50/50">
            {Object.entries(CATEGORY_CONFIG).map(([key, { label }]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {mainArticles.length === 0 && moreArticles.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">이 카테고리에 해당하는 기사가 없어요</p>
          </div>
        ) : (
          <>
            {/* main 기사 (이미지 소스) */}
            <div className="space-y-0 divide-y divide-border">
              {mainArticles.map((article, i) => (
                <ArticleCard
                  key={`main-${i}`}
                  article={article}
                  index={i}
                  onOpen={setSelectedArticle}
                />
              ))}
            </div>

            {/* 더보기 버튼 */}
            {moreArticles.length > 0 && (
              <button
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors border border-dashed border-border rounded-xl"
                onClick={() => setExpandedMore(prev => ({ ...prev, [activeCategory]: !showMore }))}
              >
                {showMore
                  ? <><ChevronUp className="h-4 w-4" /> 접기</>
                  : <><ChevronDown className="h-4 w-4" /> 관련 뉴스 {moreArticles.length}개 더보기</>
                }
              </button>
            )}

            {/* more 기사 (비이미지 소스) */}
            {showMore && (
              <div className="mt-4 space-y-0 divide-y divide-border">
                {moreArticles.map((article, i) => (
                  <ArticleCard
                    key={`more-${i}`}
                    article={article}
                    index={mainArticles.length + i}
                    onOpen={setSelectedArticle}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 공식 발표 (회사별) */}
      <OfficialSection
        grouped={horizontalSections?.official_announcements ?? {}}
        onOpen={setSelectedArticle as any}
      />

      {/* 한국 AI */}
      {(horizontalSections?.korean_ai ?? []).length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-4">🇰🇷 한국 AI</p>
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-3 min-w-max">
              {(horizontalSections!.korean_ai!).map((a, i) => (
                <div
                  key={i}
                  className="w-64 flex-shrink-0 p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all"
                  style={{ borderColor: '#E5393540' }}
                  onClick={() => setSelectedArticle(a as any)}
                >
                  <p className="text-xs font-bold text-red-600 mb-1">{a.source}</p>
                  <p className="text-sm font-medium text-foreground line-clamp-3">{articleTitle(a)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 큐레이션 */}
      {(horizontalSections?.curation ?? []).length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-4">📚 큐레이션</p>
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-3 min-w-max">
              {(horizontalSections!.curation!).map((a, i) => (
                <div
                  key={i}
                  className="w-64 flex-shrink-0 p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all"
                  style={{ borderColor: '#0EA5E940' }}
                  onClick={() => setSelectedArticle(a as any)}
                >
                  <p className="text-xs font-bold text-sky-600 mb-1">{a.source}</p>
                  <p className="text-sm font-medium text-foreground line-clamp-3">{articleTitle(a)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      <NewsDetailModal
        article={selectedArticle}
        open={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </section>
  );
}

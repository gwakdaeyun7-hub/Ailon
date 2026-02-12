/**
 * AI-학문 융합 아이디어 섹션
 * 에이전트 팀이 매일 생성한 아이디어 표시 + 온디맨드 추가 생성
 *
 * UX Improvements:
 * - Section-specific amber/warm accent for creative energy feeling
 * - Visual score bars instead of just numbers for quick scanning
 * - Smoother accordion with animated expand/collapse
 * - Better CTA design with gradient button for primary action
 * - Improved error states with empathetic, actionable messaging
 * - Source connection displayed more elegantly
 * - Tags with warm accent color for consistency
 * - Better narrative presentation with reading-friendly typography
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useNews } from '@/lib/hooks/useNews';
import { usePrinciples } from '@/lib/hooks/usePrinciples';
import { useIdeas } from '@/lib/hooks/useIdeas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sparkles, Loader2, AlertCircle, Target, Lightbulb,
  ChevronDown, ChevronUp, Zap, LogIn,
} from 'lucide-react';

function ScoreBar({ label, score }: { label: string; score?: number }) {
  if (!score) return null;

  const percentage = (score / 10) * 100;
  const colorClass =
    score >= 8
      ? 'bg-emerald-500 dark:bg-emerald-400'
      : score >= 5
      ? 'bg-amber-500 dark:bg-amber-400'
      : 'bg-red-500 dark:bg-red-400';

  const textColor =
    score >= 8
      ? 'text-emerald-700 dark:text-emerald-300'
      : score >= 5
      ? 'text-amber-700 dark:text-amber-300'
      : 'text-red-700 dark:text-red-300';

  return (
    <div className="flex-1 min-w-[100px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-xs font-semibold ${textColor}`}>{score}/10</span>
      </div>
      <div className="score-bar">
        <div
          className={`score-bar-fill ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function SectionHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40">
        <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      </div>
      <div>
        <h2 className="text-section">AI-학문 융합 아이디어</h2>
        <p className="text-caption text-muted-foreground mt-0.5">
          뉴스와 학문 원리가 만나 새로운 아이디어가 탄생합니다
        </p>
      </div>
    </div>
  );
}

export function IdeaSection() {
  const { user } = useAuth();
  const { news } = useNews();
  const { getTodayPrinciple } = usePrinciples();
  const { ideas, sourceDiscipline, sourcePrinciple, loading: ideasLoading } = useIdeas();

  const [generating, setGenerating] = useState(false);
  const [generatedIdea, setGeneratedIdea] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedIdea, setExpandedIdea] = useState<number | null>(0);

  const todayPrinciple = getTodayPrinciple();

  const generateIdea = async () => {
    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }
    if (!news || news.length === 0) {
      setError('뉴스 데이터가 없습니다.');
      return;
    }
    if (!todayPrinciple) {
      setError('학문 원리 데이터가 없습니다.');
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratedIdea(null);

    try {
      const randomNews = news[Math.floor(Math.random() * Math.min(5, news.length))];
      const response = await fetch('/api/generate-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          news: {
            title: randomNews.title,
            summary: randomNews.summary || randomNews.description,
            link: randomNews.link,
          },
          principle: {
            title: todayPrinciple.title,
            category: todayPrinciple.category,
            description: todayPrinciple.description,
            explanation: todayPrinciple.explanation,
          },
        }),
      });

      if (!response.ok) throw new Error('아이디어 생성에 실패했습니다.');

      const data = await response.json();
      setGeneratedIdea(data.idea);
    } catch (err) {
      console.error('Error generating idea:', err);
      setError(err instanceof Error ? err.message : '아이디어 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section className="space-y-8">
      <SectionHeader />

      {/* 에이전트 팀이 생성한 아이디어 */}
      {ideasLoading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-5 bg-muted rounded skeleton-shimmer" />
                  <div className="h-6 bg-muted rounded skeleton-shimmer w-2/3" />
                </div>
                <div className="flex gap-3 mt-3">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded skeleton-shimmer w-1/2" />
                    <div className="h-1.5 bg-muted rounded-full skeleton-shimmer" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded skeleton-shimmer w-1/2" />
                    <div className="h-1.5 bg-muted rounded-full skeleton-shimmer" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded skeleton-shimmer w-1/2" />
                    <div className="h-1.5 bg-muted rounded-full skeleton-shimmer" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : ideas.length > 0 ? (
        <div className="space-y-5">
          {/* 소스 정보 */}
          {(sourceDiscipline || sourcePrinciple) && (
            <div className="flex items-center gap-2 text-body-kr text-muted-foreground">
              <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <span>
                오늘의 융합: <span className="font-medium text-foreground">{sourcePrinciple}</span>
                {sourceDiscipline && (
                  <span className="text-muted-foreground"> ({sourceDiscipline})</span>
                )}
                {' '}+ AI 최신 뉴스
              </span>
            </div>
          )}

          {ideas.map((idea, index) => (
            <Card
              key={index}
              className={`transition-all duration-300 cursor-pointer group ${
                expandedIdea === index
                  ? 'shadow-card-active border-amber-200/60 dark:border-amber-800/30'
                  : 'card-interactive'
              }`}
              onClick={() => setExpandedIdea(expandedIdea === index ? null : index)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                      </div>
                      <CardTitle className="text-card-title group-hover:text-primary transition-colors">
                        {idea.concept_name}
                      </CardTitle>
                    </div>
                    {/* Score bars */}
                    <div className="flex gap-4 flex-wrap">
                      <ScoreBar label="실현성" score={idea.feasibility_score} />
                      <ScoreBar label="혁신성" score={idea.novelty_score} />
                      <ScoreBar label="영향력" score={idea.impact_score} />
                    </div>
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      expandedIdea === index
                        ? 'bg-amber-100 dark:bg-amber-900/50'
                        : 'bg-muted'
                    }`}>
                      {expandedIdea === index ? (
                        <ChevronUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              {expandedIdea === index && (
                <CardContent className="space-y-5 pt-0 animate-fade-in">
                  {/* 스토리텔링 내러티브 */}
                  {idea.narrative && (
                    <div className="p-5 bg-gradient-to-br from-amber-50/60 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 rounded-xl border border-amber-200/30 dark:border-amber-800/20">
                      <p className="text-body-kr leading-korean whitespace-pre-wrap text-foreground/85">
                        {idea.narrative}
                      </p>
                    </div>
                  )}

                  {/* 일반 설명 (내러티브가 없을 때) */}
                  {!idea.narrative && idea.description && (
                    <p className="text-body-kr text-muted-foreground leading-korean">
                      {idea.description}
                    </p>
                  )}

                  {/* 핵심 혁신 */}
                  {idea.key_innovation && (
                    <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                        <Target className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-caption font-semibold text-primary mb-1">핵심 혁신</p>
                        <p className="text-body-kr font-medium text-foreground">{idea.key_innovation}</p>
                      </div>
                    </div>
                  )}

                  {/* 구현 방향 */}
                  {idea.implementation_sketch && (
                    <div className="border-l-2 border-amber-200 dark:border-amber-800/50 pl-4">
                      <h5 className="text-sm font-semibold text-foreground mb-1.5">구현 방향</h5>
                      <p className="text-body-kr text-muted-foreground leading-korean-tight">
                        {idea.implementation_sketch}
                      </p>
                    </div>
                  )}

                  {/* 도전 과제 */}
                  {idea.challenges && idea.challenges.length > 0 && (
                    <div className="border-l-2 border-red-200 dark:border-red-800/50 pl-4">
                      <h5 className="text-sm font-semibold text-foreground mb-2">도전 과제</h5>
                      <ul className="space-y-1.5">
                        {idea.challenges.map((c, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-400 dark:bg-red-500 mt-2" />
                            <span className="text-body-kr text-muted-foreground">{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 태그 */}
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {idea.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium border border-amber-200/50 dark:border-amber-800/30"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 소스 연결 */}
                  {idea.news_source?.title && (
                    <div className="pt-3 border-t border-border/50">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-caption text-muted-foreground">
                        {idea.news_source.title && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground/70">뉴스</span>
                            <span className="text-muted-foreground/60">&middot;</span>
                            <span>{idea.news_source.title}</span>
                          </div>
                        )}
                        {idea.principle_source?.title && (
                          <div className="flex items-center gap-1.5">
                            <span className="hidden sm:inline text-muted-foreground/40">|</span>
                            <span className="font-medium text-foreground/70">원리</span>
                            <span className="text-muted-foreground/60">&middot;</span>
                            <span>{idea.principle_source.title}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : null}

      {/* 온디맨드 아이디어 생성 */}
      <Card className="relative overflow-hidden border-2 border-dashed border-amber-300/50 dark:border-amber-700/30 bg-gradient-to-br from-amber-50/30 to-orange-50/20 dark:from-amber-950/10 dark:to-orange-950/5">
        <CardHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">추가 아이디어 생성하기</CardTitle>
          </div>
          <CardDescription className="text-body-kr leading-korean-tight">
            오늘의 AI 뉴스와 학문 원리를 결합하여 새로운 융합 아이디어를 생성합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && (
            <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-xl border border-border/50">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <LogIn className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-0.5">
                  로그인이 필요해요
                </p>
                <p className="text-caption text-muted-foreground">
                  아이디어 생성 기능을 사용하려면 먼저 로그인해 주세요.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-destructive mb-0.5">
                  아이디어 생성에 문제가 있었어요
                </p>
                <p className="text-caption text-muted-foreground">{error}</p>
              </div>
            </div>
          )}

          {generatedIdea && (
            <div className="p-5 bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200/50 dark:border-amber-800/30 rounded-xl animate-fade-in">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-amber-700 dark:text-amber-300">생성된 아이디어</span>
              </h4>
              <p className="text-body-kr leading-korean whitespace-pre-wrap text-foreground/85">
                {generatedIdea}
              </p>
            </div>
          )}

          <Button
            onClick={generateIdea}
            disabled={generating || !user || !news || news.length === 0 || !todayPrinciple}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                아이디어 생성 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                새로운 아이디어 생성
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

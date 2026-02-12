/**
 * Idea Section - minimal monochrome design inspired by Newneek
 * Clean accordion, simple scores, flat CTA button
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useNews } from '@/lib/hooks/useNews';
import { usePrinciples } from '@/lib/hooks/usePrinciples';
import { useIdeas } from '@/lib/hooks/useIdeas';
import { Button } from '@/components/ui/button';
import {
  Loader2, AlertCircle, ChevronDown, ChevronUp, LogIn,
} from 'lucide-react';

function ScoreBar({ label, score }: { label: string; score?: number }) {
  if (!score) return null;

  const percentage = (score / 10) * 100;

  return (
    <div className="flex-1 min-w-[90px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium text-foreground">{score}/10</span>
      </div>
      <div className="score-bar">
        <div
          className="score-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function SectionHeader() {
  return (
    <div className="mb-10">
      <h2 className="text-section text-foreground">AI-학문 융합 아이디어</h2>
      <p className="text-body-kr text-muted-foreground mt-1">
        뉴스와 학문 원리가 만나 새로운 아이디어가 탄생합니다
      </p>
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
    <section>
      <SectionHeader />

      {/* Agent-generated ideas */}
      {ideasLoading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="py-6 border-b border-border">
              <div className="h-5 bg-muted rounded skeleton-shimmer w-2/3 mb-3" />
              <div className="flex gap-4 mt-3">
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted rounded skeleton-shimmer w-1/2" />
                  <div className="h-1 bg-muted rounded-full skeleton-shimmer" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted rounded skeleton-shimmer w-1/2" />
                  <div className="h-1 bg-muted rounded-full skeleton-shimmer" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted rounded skeleton-shimmer w-1/2" />
                  <div className="h-1 bg-muted rounded-full skeleton-shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : ideas.length > 0 ? (
        <div className="mb-12">
          {/* Source info */}
          {(sourceDiscipline || sourcePrinciple) && (
            <p className="text-caption text-muted-foreground mb-6">
              오늘의 융합: <span className="font-medium text-foreground">{sourcePrinciple}</span>
              {sourceDiscipline && (
                <span> ({sourceDiscipline})</span>
              )}
              {' '}+ AI 최신 뉴스
            </p>
          )}

          <div className="divide-y divide-border">
            {ideas.map((idea, index) => (
              <div
                key={index}
                className="py-6 first:pt-0 cursor-pointer"
                onClick={() => setExpandedIdea(expandedIdea === index ? null : index)}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-card-title text-foreground mb-3">
                      {idea.concept_name}
                    </h3>
                    {/* Score bars */}
                    <div className="flex gap-4 flex-wrap">
                      <ScoreBar label="실현성" score={idea.feasibility_score} />
                      <ScoreBar label="혁신성" score={idea.novelty_score} />
                      <ScoreBar label="영향력" score={idea.impact_score} />
                    </div>
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    {expandedIdea === index ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                {expandedIdea === index && (
                  <div className="mt-6 space-y-5 animate-fade-in">
                    {/* Narrative */}
                    {idea.narrative && (
                      <div className="p-5 bg-muted/50 rounded-lg">
                        <p className="text-body-kr leading-korean whitespace-pre-wrap text-foreground/85">
                          {idea.narrative}
                        </p>
                      </div>
                    )}

                    {/* Description fallback */}
                    {!idea.narrative && idea.description && (
                      <p className="text-body-kr text-muted-foreground leading-korean">
                        {idea.description}
                      </p>
                    )}

                    {/* Key innovation */}
                    {idea.key_innovation && (
                      <div>
                        <h5 className="text-sm font-semibold text-foreground mb-2">핵심 혁신</h5>
                        <p className="text-body-kr text-muted-foreground">{idea.key_innovation}</p>
                      </div>
                    )}

                    {/* Implementation */}
                    {idea.implementation_sketch && (
                      <div>
                        <h5 className="text-sm font-semibold text-foreground mb-2">구현 방향</h5>
                        <p className="text-body-kr text-muted-foreground leading-korean-tight">
                          {idea.implementation_sketch}
                        </p>
                      </div>
                    )}

                    {/* Challenges */}
                    {idea.challenges && idea.challenges.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-foreground mb-2">도전 과제</h5>
                        <ul className="space-y-1.5">
                          {idea.challenges.map((c, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="flex-shrink-0 w-1 h-1 rounded-full bg-muted-foreground mt-2.5" />
                              <span className="text-body-kr text-muted-foreground">{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Tags */}
                    {idea.tags && idea.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {idea.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 text-xs text-muted-foreground border border-border rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Source connection */}
                    {idea.news_source?.title && (
                      <div className="pt-4 border-t border-border">
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
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* On-demand idea generation */}
      <div className="pt-8 border-t border-border">
        <h3 className="text-lg font-bold text-foreground mb-2">추가 아이디어 생성하기</h3>
        <p className="text-body-kr text-muted-foreground leading-korean-tight mb-6">
          오늘의 AI 뉴스와 학문 원리를 결합하여 새로운 융합 아이디어를 생성합니다.
        </p>

        {!user && (
          <div className="flex items-start gap-3 py-4 px-5 bg-muted/50 rounded-lg mb-5">
            <LogIn className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
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
          <div className="flex items-start gap-3 py-4 px-5 border border-border rounded-lg mb-5">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground mb-0.5">
                아이디어 생성에 문제가 있었어요
              </p>
              <p className="text-caption text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {generatedIdea && (
          <div className="p-5 bg-muted/50 rounded-lg mb-5 animate-fade-in">
            <h4 className="text-sm font-semibold text-foreground mb-3">생성된 아이디어</h4>
            <p className="text-body-kr leading-korean whitespace-pre-wrap text-foreground/85">
              {generatedIdea}
            </p>
          </div>
        )}

        <Button
          onClick={generateIdea}
          disabled={generating || !user || !news || news.length === 0 || !todayPrinciple}
          size="lg"
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              아이디어 생성 중...
            </>
          ) : (
            '새로운 아이디어 생성'
          )}
        </Button>
      </div>
    </section>
  );
}

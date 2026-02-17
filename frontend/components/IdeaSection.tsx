/**
 * Idea Section - Complete synergy ideas with roadmap & market analysis
 * Monochrome design with accordion, scores, and share functionality
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useNews } from '@/lib/hooks/useNews';
import { usePrinciples } from '@/lib/hooks/usePrinciples';
import { useSynergyIdeas } from '@/lib/hooks/useSynergyIdeas';
import { BookmarkButton } from '@/components/BookmarkButton';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  LogIn,
  Share2,
  Rocket,
  CheckCircle2,
} from 'lucide-react';
import type { SynergyIdea } from '@/lib/types';

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

function FeasibilityScoreBar({ score }: { score: number }) {
  const percentage = score;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">시장 실현 가능성</span>
        <span className="text-sm font-bold text-foreground">{score}점</span>
      </div>
      <div className="h-2 rounded-full bg-border">
        <div
          className="h-full rounded-full bg-foreground/70 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ShareButton({ idea }: { idea: SynergyIdea }) {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      const shareText = `${idea.concept_name}\n\n${idea.description || idea.narrative || '새로운 융합 아이디어'}\n\n#Ailon #AI융합아이디어`;

      if (navigator.share) {
        await navigator.share({
          title: idea.concept_name,
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('아이디어가 클립보드에 복사되었습니다.');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleShare();
      }}
      disabled={sharing}
      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label="공유하기"
    >
      <Share2 className="h-3.5 w-3.5" />
    </button>
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

function RoadmapAccordion({ idea }: { idea: SynergyIdea }) {
  const [expanded, setExpanded] = useState(false);

  if (!idea.technical_roadmap?.phases?.length) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <h5 className="text-sm font-semibold text-foreground">기술 로드맵</h5>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {idea.technical_roadmap.totalDuration}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          {idea.technical_roadmap.phases.map((phase) => (
            <div key={phase.phase} className="border-l-2 border-border pl-4">
              <div className="flex items-start gap-2 mb-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
                  {phase.phase}
                </div>
                <div className="flex-1">
                  <h6 className="text-sm font-semibold text-foreground">
                    {phase.title}
                  </h6>
                  <p className="text-xs text-muted-foreground">{phase.duration}</p>
                </div>
              </div>
              <ul className="space-y-1.5 mt-2">
                {phase.tasks.map((task, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-caption">
                    <CheckCircle2 className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/80">{task}</span>
                  </li>
                ))}
              </ul>
              {phase.techStack.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {phase.techStack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs text-foreground/70 bg-muted rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function IdeaSection() {
  const { user } = useAuth();
  const { news } = useNews();
  const { principle } = usePrinciples();
  const {
    ideas,
    sourceDiscipline,
    sourcePrinciple,
    loading: ideasLoading,
  } = useSynergyIdeas();

  const [generating, setGenerating] = useState(false);
  const [generatedIdea, setGeneratedIdea] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedIdea, setExpandedIdea] = useState<number | null>(0);

  const generateIdea = async () => {
    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }
    if (!news || news.length === 0) {
      setError('뉴스 데이터가 없습니다.');
      return;
    }
    if (!principle) {
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
            title: principle.title,
            category: principle.category,
            description: principle.foundation.principle,
            explanation: principle.integration.solution,
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
              </div>
            </div>
          ))}
        </div>
      ) : ideas.length > 0 ? (
        <div className="mb-12">
          {(sourceDiscipline || sourcePrinciple) && (
            <p className="text-caption text-muted-foreground mb-6">
              <span className="font-medium text-foreground">
                AI x {sourceDiscipline || '학문 융합'}
              </span>
              {sourcePrinciple && (
                <span className="text-muted-foreground/80">
                  {' '}· {sourcePrinciple}
                </span>
              )}
            </p>
          )}

          <div className="divide-y divide-border">
            {ideas.map((idea, index) => (
              <div key={index} className="py-6 first:pt-0">
                <div
                  className="cursor-pointer"
                  onClick={() => setExpandedIdea(expandedIdea === index ? null : index)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-card-title text-foreground mb-3">
                        {idea.concept_name}
                      </h3>
                      <div className="flex gap-4 flex-wrap">
                        <ScoreBar label="실현성" score={idea.feasibility_score} />
                        <ScoreBar label="혁신성" score={idea.novelty_score} />
                        <ScoreBar label="영향력" score={idea.impact_score} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                      <BookmarkButton
                        itemType="idea"
                        itemId={idea.concept_name}
                        size="sm"
                      />
                      <ShareButton idea={idea} />
                      {expandedIdea === index ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground ml-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedIdea === index && (
                  <div className="mt-6 space-y-6 animate-fade-in">
                    {idea.problem_addressed && (
                      <div>
                        <h5 className="text-sm font-semibold text-foreground mb-2">
                          해결하는 문제
                        </h5>
                        <p className="text-body-kr text-muted-foreground leading-korean-tight">
                          {idea.problem_addressed}
                        </p>
                      </div>
                    )}

                    {idea.narrative && (
                      <div className="p-5 bg-muted/50 rounded-lg">
                        <h5 className="text-sm font-semibold text-foreground mb-3">
                          아이디어 설명
                        </h5>
                        <p className="text-body-kr leading-korean whitespace-pre-wrap text-foreground/85">
                          {idea.narrative}
                        </p>
                      </div>
                    )}

                    {!idea.narrative && idea.description && (
                      <div>
                        <h5 className="text-sm font-semibold text-foreground mb-2">
                          아이디어 설명
                        </h5>
                        <p className="text-body-kr text-muted-foreground leading-korean">
                          {idea.description}
                        </p>
                      </div>
                    )}

                    {idea.key_innovation && (
                      <div>
                        <h5 className="text-sm font-semibold text-foreground mb-2">
                          핵심 혁신
                        </h5>
                        <p className="text-body-kr text-muted-foreground leading-korean-tight">
                          {idea.key_innovation}
                        </p>
                      </div>
                    )}

                    <RoadmapAccordion idea={idea} />

                    {idea.market_feasibility && (
                      <div className="border border-border rounded-lg p-5 space-y-4">
                        <h5 className="text-sm font-semibold text-foreground">
                          시장 분석
                        </h5>

                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              시장 규모 (TAM)
                            </p>
                            <p className="text-sm text-foreground">
                              {idea.market_feasibility.tam}
                            </p>
                          </div>

                          {idea.market_feasibility.competitors.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1.5">
                                주요 경쟁자
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {idea.market_feasibility.competitors.map((comp, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 text-xs text-foreground/80 bg-muted rounded"
                                  >
                                    {comp}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {idea.market_feasibility.differentiation && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                차별화 포인트
                              </p>
                              <p className="text-sm text-foreground">
                                {idea.market_feasibility.differentiation}
                              </p>
                            </div>
                          )}

                          {idea.market_feasibility.revenueModel && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                수익 모델
                              </p>
                              <p className="text-sm text-foreground">
                                {idea.market_feasibility.revenueModel}
                              </p>
                            </div>
                          )}

                          <div className="pt-2">
                            <FeasibilityScoreBar
                              score={idea.market_feasibility.feasibilityScore}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        generateIdea();
                      }}
                      size="lg"
                      className="w-full"
                    >
                      <Rocket className="mr-2 h-4 w-4" />
                      프로젝트 시작하기
                    </Button>

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
                              <span className="hidden sm:inline text-muted-foreground/40">
                                |
                              </span>
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

      <div className="pt-8 border-t border-border">
        <h3 className="text-lg font-bold text-foreground mb-2">
          추가 아이디어 생성하기
        </h3>
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
            <h4 className="text-sm font-semibold text-foreground mb-3">
              생성된 아이디어
            </h4>
            <p className="text-body-kr leading-korean whitespace-pre-wrap text-foreground/85">
              {generatedIdea}
            </p>
          </div>
        )}

        <Button
          onClick={generateIdea}
          disabled={generating || !user || !news || news.length === 0 || !principle}
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

/**
 * AI-학문 융합 아이디어 섹션
 * 에이전트 팀이 매일 생성한 아이디어 표시 + 온디맨드 추가 생성
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
  TrendingUp, ChevronDown, ChevronUp,
} from 'lucide-react';

function ScoreBadge({ label, score }: { label: string; score?: number }) {
  if (!score) return null;
  const color =
    score >= 8 ? 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-300' :
    score >= 5 ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-300' :
    'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-300';

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
      {label} {score}/10
    </span>
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
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">AI-학문 융합 아이디어</h2>
      </div>

      {/* 에이전트 팀이 생성한 아이디어 */}
      {ideasLoading ? (
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-4/5" />
            </div>
          </CardContent>
        </Card>
      ) : ideas.length > 0 ? (
        <div className="space-y-4">
          {/* 소스 정보 */}
          {(sourceDiscipline || sourcePrinciple) && (
            <p className="text-sm text-muted-foreground">
              오늘의 융합: <span className="font-medium text-primary">{sourcePrinciple}</span>
              {sourceDiscipline && (
                <> ({sourceDiscipline})</>
              )}
              {' '}+ AI 최신 뉴스
            </p>
          )}

          {ideas.map((idea, index) => (
            <Card
              key={index}
              className={`border-2 transition-all cursor-pointer ${
                expandedIdea === index
                  ? 'border-primary/40 shadow-lg'
                  : 'border-border hover:border-primary/20'
              }`}
              onClick={() => setExpandedIdea(expandedIdea === index ? null : index)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      <CardTitle className="text-lg">{idea.concept_name}</CardTitle>
                    </div>
                    {/* 점수 배지 */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <ScoreBadge label="실현성" score={idea.feasibility_score} />
                      <ScoreBadge label="혁신성" score={idea.novelty_score} />
                      <ScoreBadge label="영향력" score={idea.impact_score} />
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {expandedIdea === index ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedIdea === index && (
                <CardContent className="space-y-4 pt-0">
                  {/* 스토리텔링 내러티브 */}
                  {idea.narrative && (
                    <div className="p-4 bg-primary/5 rounded-lg">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {idea.narrative}
                      </p>
                    </div>
                  )}

                  {/* 일반 설명 (내러티브가 없을 때) */}
                  {!idea.narrative && idea.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {idea.description}
                    </p>
                  )}

                  {/* 핵심 혁신 */}
                  {idea.key_innovation && (
                    <div className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium">{idea.key_innovation}</p>
                    </div>
                  )}

                  {/* 구현 방향 */}
                  {idea.implementation_sketch && (
                    <div>
                      <h5 className="text-sm font-semibold mb-1">구현 방향</h5>
                      <p className="text-xs text-muted-foreground">{idea.implementation_sketch}</p>
                    </div>
                  )}

                  {/* 도전 과제 */}
                  {idea.challenges && idea.challenges.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold mb-1">도전 과제</h5>
                      <ul className="list-disc list-inside space-y-0.5">
                        {idea.challenges.map((c, i) => (
                          <li key={i} className="text-xs text-muted-foreground">{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 태그 */}
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {idea.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 소스 연결 */}
                  {idea.news_source?.title && (
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      <span className="font-medium">뉴스:</span> {idea.news_source.title}
                      {idea.principle_source?.title && (
                        <>
                          {' | '}
                          <span className="font-medium">원리:</span> {idea.principle_source.title}
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : null}

      {/* 온디맨드 아이디어 생성 */}
      <Card className="border-2 border-primary/30">
        <CardHeader>
          <CardTitle>추가 아이디어 생성하기</CardTitle>
          <CardDescription>
            오늘의 AI 뉴스와 학문 원리를 결합하여 새로운 융합 아이디어를 생성합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && (
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                아이디어 생성 기능을 사용하려면 로그인이 필요합니다.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {generatedIdea && (
            <div className="p-6 bg-primary/5 border-2 border-primary/30 rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                생성된 아이디어
              </h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {generatedIdea}
              </p>
            </div>
          )}

          <Button
            onClick={generateIdea}
            disabled={generating || !user || !news || news.length === 0 || !todayPrinciple}
            className="w-full"
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

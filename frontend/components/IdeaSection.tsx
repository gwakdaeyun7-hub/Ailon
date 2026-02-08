/**
 * AI-학문 융합 아이디어 생성 섹션
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useNews } from '@/lib/hooks/useNews';
import { usePrinciples } from '@/lib/hooks/usePrinciples';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

export function IdeaSection() {
  const { user } = useAuth();
  const { news } = useNews();
  const { getTodayPrinciple } = usePrinciples();

  const [generating, setGenerating] = useState(false);
  const [generatedIdea, setGeneratedIdea] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      // 랜덤하게 뉴스 하나 선택
      const randomNews = news[Math.floor(Math.random() * Math.min(5, news.length))];

      const response = await fetch('/api/generate-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      if (!response.ok) {
        throw new Error('아이디어 생성에 실패했습니다.');
      }

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

      <Card className="border-2 border-primary/30">
        <CardHeader>
          <CardTitle>창의적 아이디어 생성하기</CardTitle>
          <CardDescription>
            오늘의 AI 뉴스와 학문 원리를 결합하여 혁신적인 아이디어를 생성합니다.
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

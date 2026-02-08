/**
 * 뉴스 섹션 컴포넌트
 */

'use client';

import { useNews } from '@/lib/hooks/useNews';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Newspaper } from 'lucide-react';

export function NewsSection() {
  const { news, loading, error } = useNews();

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Newspaper className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">오늘의 AI 뉴스</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Newspaper className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">오늘의 AI 뉴스</h2>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (news.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Newspaper className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">오늘의 AI 뉴스</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">아직 뉴스가 수집되지 않았습니다. 잠시 후 다시 확인해주세요.</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Newspaper className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">오늘의 AI 뉴스</h2>
        <span className="ml-2 text-sm text-muted-foreground">({news.length}개)</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {news.map((article, index) => (
          <Card key={index} className="flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg line-clamp-2">
                {article.title}
              </CardTitle>
              <CardDescription className="text-xs">
                {article.source} • {new Date(article.published).toLocaleDateString('ko-KR')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-sm text-muted-foreground mb-4 line-clamp-4">
                {article.summary || article.description}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
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

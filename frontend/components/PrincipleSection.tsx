/**
 * 학문 원리 섹션 컴포넌트
 */

'use client';

import { usePrinciples } from '@/lib/hooks/usePrinciples';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Lightbulb, FlaskConical } from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  physics: <FlaskConical className="h-5 w-5" />,
  chemistry: <FlaskConical className="h-5 w-5" />,
  biology: <FlaskConical className="h-5 w-5" />,
  philosophy: <Lightbulb className="h-5 w-5" />,
  economics: <BookOpen className="h-5 w-5" />,
  psychology: <BookOpen className="h-5 w-5" />,
};

const categoryNames: Record<string, string> = {
  physics: '물리학',
  chemistry: '화학',
  biology: '생물학',
  philosophy: '철학',
  economics: '경제학',
  psychology: '심리학',
};

export function PrincipleSection() {
  const { principles, loading, error, getTodayPrinciple } = usePrinciples();

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">오늘의 학문 원리</h2>
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-1/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">오늘의 학문 원리</h2>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const todayPrinciple = getTodayPrinciple();

  if (!todayPrinciple) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">오늘의 학문 원리</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">학문 원리 데이터를 불러올 수 없습니다.</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">오늘의 학문 원리</h2>
      </div>

      <Card className="border-primary/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            {categoryIcons[todayPrinciple.category]}
            <span className="text-sm font-medium text-primary">
              {categoryNames[todayPrinciple.category]}
            </span>
          </div>
          <CardTitle className="text-2xl">{todayPrinciple.title}</CardTitle>
          <CardDescription className="text-base">
            {todayPrinciple.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">📖 상세 설명</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {todayPrinciple.explanation}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">🌍 실생활 예시</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {todayPrinciple.realWorldExample}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">💡 응용 아이디어</h4>
            <ul className="list-disc list-inside space-y-1">
              {todayPrinciple.applicationIdeas.map((idea, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {idea}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

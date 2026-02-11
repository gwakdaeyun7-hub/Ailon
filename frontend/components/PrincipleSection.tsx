/**
 * 학문 원리 섹션 컴포넌트 - 10개 학문 분야, AI 관련성 표시
 */

'use client';

import { usePrinciples } from '@/lib/hooks/usePrinciples';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen, Lightbulb, FlaskConical, Cpu, Brain, Sigma,
  Zap, HeartPulse, Scale, Users,
} from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  mathematics: <Sigma className="h-5 w-5" />,
  physics: <FlaskConical className="h-5 w-5" />,
  chemistry: <FlaskConical className="h-5 w-5" />,
  biology: <HeartPulse className="h-5 w-5" />,
  medicine_neuroscience: <Brain className="h-5 w-5" />,
  computer_science: <Cpu className="h-5 w-5" />,
  electrical_engineering: <Zap className="h-5 w-5" />,
  economics: <BookOpen className="h-5 w-5" />,
  psychology_cognitive_science: <Users className="h-5 w-5" />,
  philosophy_ethics: <Scale className="h-5 w-5" />,
  // 기존 카테고리 호환
  philosophy: <Lightbulb className="h-5 w-5" />,
  psychology: <Users className="h-5 w-5" />,
};

const categoryNames: Record<string, string> = {
  mathematics: '수학',
  physics: '물리학',
  chemistry: '화학',
  biology: '생물학',
  medicine_neuroscience: '의학/뇌과학',
  computer_science: '컴퓨터공학',
  electrical_engineering: '전기전자공학',
  economics: '경제학',
  psychology_cognitive_science: '심리학/인지과학',
  philosophy_ethics: '철학/윤리학',
  // 기존 카테고리 호환
  philosophy: '철학',
  psychology: '심리학',
};

const superCategoryColors: Record<string, string> = {
  '기초과학': 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  '생명과학': 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  '공학': 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  '사회과학': 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  '인문학': 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
};

const difficultyLabels: Record<string, { text: string; color: string }> = {
  beginner: { text: '입문', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  intermediate: { text: '중급', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' },
  advanced: { text: '심화', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
};

export function PrincipleSection() {
  const { principles, loading, error, disciplineInfo, getTodayPrinciple } = usePrinciples();

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

  const superCategory = todayPrinciple.superCategory || disciplineInfo?.superCategory || '';
  const difficulty = todayPrinciple.difficulty;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">오늘의 학문 원리</h2>
      </div>

      <Card className="border-primary/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {/* 상위 카테고리 배지 */}
            {superCategory && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${superCategoryColors[superCategory] || 'bg-gray-100 text-gray-700'}`}>
                {superCategory}
              </span>
            )}
            {/* 학문 분야 */}
            <div className="flex items-center gap-1">
              {categoryIcons[todayPrinciple.category]}
              <span className="text-sm font-medium text-primary">
                {categoryNames[todayPrinciple.category] || todayPrinciple.category}
              </span>
            </div>
            {/* 난이도 배지 */}
            {difficulty && difficultyLabels[difficulty] && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyLabels[difficulty].color}`}>
                {difficultyLabels[difficulty].text}
              </span>
            )}
          </div>
          <CardTitle className="text-2xl">{todayPrinciple.title}</CardTitle>
          <CardDescription className="text-base">
            {todayPrinciple.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">상세 설명</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {todayPrinciple.explanation}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">실생활 예시</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {todayPrinciple.realWorldExample}
            </p>
          </div>

          {/* AI 관련성 (에이전트 생성 필드) */}
          {todayPrinciple.aiRelevance && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                AI와의 연결
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {todayPrinciple.aiRelevance}
              </p>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-2">응용 아이디어</h4>
            <ul className="list-disc list-inside space-y-1">
              {todayPrinciple.applicationIdeas.map((idea, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {idea}
                </li>
              ))}
            </ul>
          </div>

          {/* 타 학문 연결 (에이전트 생성 필드) */}
          {todayPrinciple.crossDisciplineLinks && todayPrinciple.crossDisciplineLinks.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">학문 간 연결</h4>
              <div className="flex flex-wrap gap-2">
                {todayPrinciple.crossDisciplineLinks.map((link, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                  >
                    {link}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 오늘의 다른 원리들 (에이전트가 여러 개 생성한 경우) */}
      {principles.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-muted-foreground">
            {categoryNames[todayPrinciple.category] || todayPrinciple.category} 분야의 다른 원리
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {principles
              .filter((p) => p.title !== todayPrinciple.title)
              .map((principle, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{principle.title}</CardTitle>
                    <CardDescription className="text-sm">{principle.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {principle.explanation}
                    </p>
                    {principle.aiRelevance && (
                      <p className="text-xs text-primary mt-2 line-clamp-2">
                        AI 연결: {principle.aiRelevance}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </section>
  );
}

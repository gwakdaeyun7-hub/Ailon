/**
 * 학문 원리 섹션 컴포넌트 - 10개 학문 분야, AI 관련성 표시
 *
 * UX Improvements:
 * - Section-specific purple/violet accent for visual differentiation from news (blue)
 * - Cleaner badge design with consistent sizing and spacing
 * - Content sub-sections with subtle left border for scanability
 * - AI Relevance section visually elevated as a key insight
 * - Better visual hierarchy between main principle and supplementary ones
 * - Improved Korean text readability with optimized line heights
 * - Application ideas use numbered list for sequential reading
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
  philosophy: '철학',
  psychology: '심리학',
};

const superCategoryColors: Record<string, string> = {
  '기초과학': 'bg-sky-50 text-sky-700 border-sky-200/60 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800/30',
  '생명과학': 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/30',
  '공학': 'bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800/30',
  '사회과학': 'bg-violet-50 text-violet-700 border-violet-200/60 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800/30',
  '인문학': 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/30',
};

const difficultyLabels: Record<string, { text: string; color: string }> = {
  beginner: {
    text: '입문',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/30',
  },
  intermediate: {
    text: '중급',
    color: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/30',
  },
  advanced: {
    text: '심화',
    color: 'bg-red-50 text-red-700 border-red-200/60 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/30',
  },
};

function SectionHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/40">
        <BookOpen className="h-5 w-5 text-violet-600 dark:text-violet-400" />
      </div>
      <div>
        <h2 className="text-section">오늘의 학문 원리</h2>
        <p className="text-caption text-muted-foreground mt-0.5">
          매일 새로운 학문의 핵심 원리를 탐구합니다
        </p>
      </div>
    </div>
  );
}

export function PrincipleSection() {
  const { principles, loading, error, disciplineInfo, getTodayPrinciple } = usePrinciples();

  if (loading) {
    return (
      <section className="space-y-6">
        <SectionHeader />
        <Card>
          <CardHeader>
            <div className="flex gap-2 mb-3">
              <div className="h-6 w-16 bg-muted rounded-full skeleton-shimmer" />
              <div className="h-6 w-20 bg-muted rounded-full skeleton-shimmer" />
              <div className="h-6 w-12 bg-muted rounded-full skeleton-shimmer" />
            </div>
            <div className="h-7 bg-muted rounded skeleton-shimmer w-2/3" />
            <div className="h-5 bg-muted rounded skeleton-shimmer w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded skeleton-shimmer" />
                <div className="h-4 bg-muted rounded skeleton-shimmer" />
                <div className="h-4 bg-muted rounded w-5/6 skeleton-shimmer" />
              </div>
              <div className="h-24 bg-muted rounded-lg skeleton-shimmer" />
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-6">
        <SectionHeader />
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <p className="text-sm font-medium text-foreground">
                학문 원리를 불러오는 데 문제가 있었어요
              </p>
              <p className="text-caption text-muted-foreground">
                잠시 후 다시 시도해 주세요.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  const todayPrinciple = getTodayPrinciple();

  if (!todayPrinciple) {
    return (
      <section className="space-y-6">
        <SectionHeader />
        <Card className="border-dashed border-2">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-6 gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                아직 오늘의 학문 원리가 준비되지 않았어요
              </p>
              <p className="text-caption text-muted-foreground">
                잠시 후 다시 확인해 주세요.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  const superCategory = todayPrinciple.superCategory || disciplineInfo?.superCategory || '';
  const difficulty = todayPrinciple.difficulty;

  return (
    <section className="space-y-8">
      <SectionHeader />

      <Card className="relative overflow-hidden shadow-card-active border-violet-200/40 dark:border-violet-800/30">
        {/* Accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500" />

        <CardHeader className="pt-7 pb-4">
          {/* Badge row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {superCategory && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${superCategoryColors[superCategory] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                {superCategory}
              </span>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/30 border border-violet-200/60 dark:border-violet-800/30">
              <span className="text-violet-600 dark:text-violet-400">
                {categoryIcons[todayPrinciple.category]}
              </span>
              <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                {categoryNames[todayPrinciple.category] || todayPrinciple.category}
              </span>
            </div>
            {difficulty && difficultyLabels[difficulty] && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${difficultyLabels[difficulty].color}`}>
                {difficultyLabels[difficulty].text}
              </span>
            )}
          </div>

          <CardTitle className="text-xl md:text-2xl leading-snug">
            {todayPrinciple.title}
          </CardTitle>
          <CardDescription className="text-body-kr mt-2 leading-korean-tight">
            {todayPrinciple.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 상세 설명 */}
          <div className="border-l-2 border-violet-200 dark:border-violet-800/50 pl-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">상세 설명</h4>
            <p className="text-body-kr text-muted-foreground leading-korean">
              {todayPrinciple.explanation}
            </p>
          </div>

          {/* 실생활 예시 */}
          <div className="border-l-2 border-emerald-200 dark:border-emerald-800/50 pl-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">실생활 예시</h4>
            <p className="text-body-kr text-muted-foreground leading-korean">
              {todayPrinciple.realWorldExample}
            </p>
          </div>

          {/* AI 관련성 -- elevated design as key insight */}
          {todayPrinciple.aiRelevance && (
            <div className="p-5 bg-gradient-to-br from-violet-50/80 to-indigo-50/50 dark:from-violet-950/30 dark:to-indigo-950/20 border border-violet-200/50 dark:border-violet-800/30 rounded-xl">
              <h4 className="text-sm font-semibold mb-2.5 flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-900/50">
                  <Cpu className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-violet-700 dark:text-violet-300">AI와의 연결</span>
              </h4>
              <p className="text-body-kr text-foreground/80 leading-korean">
                {todayPrinciple.aiRelevance}
              </p>
            </div>
          )}

          {/* 응용 아이디어 */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">응용 아이디어</h4>
            <ul className="space-y-2">
              {todayPrinciple.applicationIdeas.map((idea, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 text-xs font-semibold flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-body-kr text-muted-foreground leading-korean-tight">
                    {idea}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 학문 간 연결 태그 */}
          {todayPrinciple.crossDisciplineLinks && todayPrinciple.crossDisciplineLinks.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <h4 className="text-sm font-semibold text-foreground mb-3">학문 간 연결</h4>
              <div className="flex flex-wrap gap-2">
                {todayPrinciple.crossDisciplineLinks.map((link, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 rounded-full text-xs font-medium border border-violet-200/50 dark:border-violet-800/30"
                  >
                    {link}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 오늘의 다른 원리들 */}
      {principles.length > 1 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-muted-foreground">
            {categoryNames[todayPrinciple.category] || todayPrinciple.category} 분야의 다른 원리
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {principles
              .filter((p) => p.title !== todayPrinciple.title)
              .map((principle, index) => (
                <Card key={index} className="card-interactive group">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-card-title group-hover:text-primary transition-colors">
                      {principle.title}
                    </CardTitle>
                    <CardDescription className="text-body-kr leading-korean-tight">
                      {principle.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-caption text-muted-foreground line-clamp-3 leading-korean-tight">
                      {principle.explanation}
                    </p>
                    {principle.aiRelevance && (
                      <div className="mt-3 p-2.5 bg-violet-50/50 dark:bg-violet-950/20 rounded-lg">
                        <p className="text-caption text-violet-600 dark:text-violet-400 line-clamp-2 leading-relaxed">
                          AI 연결: {principle.aiRelevance}
                        </p>
                      </div>
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

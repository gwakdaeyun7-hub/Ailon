/**
 * Principle Section - minimal monochrome design inspired by Newneek
 * Clean typography, whitespace-driven layout, no colored accents
 */

'use client';

import { usePrinciples } from '@/lib/hooks/usePrinciples';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

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

const difficultyLabels: Record<string, string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '심화',
};

function SectionHeader() {
  return (
    <div className="mb-10">
      <h2 className="text-section text-foreground">오늘의 학문 원리</h2>
      <p className="text-body-kr text-muted-foreground mt-1">
        매일 새로운 학문의 핵심 원리를 탐구합니다
      </p>
    </div>
  );
}

export function PrincipleSection() {
  const { principles, loading, error, disciplineInfo, getTodayPrinciple } = usePrinciples();

  if (loading) {
    return (
      <section>
        <SectionHeader />
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <div className="h-5 w-14 bg-muted rounded-full skeleton-shimmer" />
            <div className="h-5 w-18 bg-muted rounded-full skeleton-shimmer" />
          </div>
          <div className="h-7 bg-muted rounded skeleton-shimmer w-2/3 mb-3" />
          <div className="h-5 bg-muted rounded skeleton-shimmer w-1/2 mb-6" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded skeleton-shimmer" />
            <div className="h-4 bg-muted rounded skeleton-shimmer" />
            <div className="h-4 bg-muted rounded w-5/6 skeleton-shimmer" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <SectionHeader />
        <div className="py-12 text-center">
          <p className="text-sm text-foreground mb-1">
            학문 원리를 불러오는 데 문제가 있었어요
          </p>
          <p className="text-caption text-muted-foreground">
            잠시 후 다시 시도해 주세요.
          </p>
        </div>
      </section>
    );
  }

  const todayPrinciple = getTodayPrinciple();

  if (!todayPrinciple) {
    return (
      <section>
        <SectionHeader />
        <div className="py-12 text-center">
          <BookOpen className="h-5 w-5 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-foreground mb-1">
            아직 오늘의 학문 원리가 준비되지 않았어요
          </p>
          <p className="text-caption text-muted-foreground">
            잠시 후 다시 확인해 주세요.
          </p>
        </div>
      </section>
    );
  }

  const superCategory = todayPrinciple.superCategory || disciplineInfo?.superCategory || '';
  const difficulty = todayPrinciple.difficulty;

  return (
    <section>
      <SectionHeader />

      {/* Main principle */}
      <div className="mb-12">
        {/* Tags */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {superCategory && (
            <span className="px-3 py-1 rounded-full text-xs text-muted-foreground border border-border">
              {superCategory}
            </span>
          )}
          <span className="px-3 py-1 rounded-full text-xs text-muted-foreground border border-border">
            {categoryNames[todayPrinciple.category] || todayPrinciple.category}
          </span>
          {difficulty && difficultyLabels[difficulty] && (
            <span className="px-3 py-1 rounded-full text-xs text-muted-foreground border border-border">
              {difficultyLabels[difficulty]}
            </span>
          )}
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-foreground leading-snug mb-3">
          {todayPrinciple.title}
        </h3>
        <p className="text-body-kr text-muted-foreground leading-korean-tight mb-8">
          {todayPrinciple.description}
        </p>

        {/* Detailed explanation */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-foreground mb-3">상세 설명</h4>
          <p className="text-body-kr text-muted-foreground leading-korean">
            {todayPrinciple.explanation}
          </p>
        </div>

        {/* Real-world example */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-foreground mb-3">실생활 예시</h4>
          <p className="text-body-kr text-muted-foreground leading-korean">
            {todayPrinciple.realWorldExample}
          </p>
        </div>

        {/* AI relevance */}
        {todayPrinciple.aiRelevance && (
          <div className="mb-8 p-5 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-semibold text-foreground mb-3">AI와의 연결</h4>
            <p className="text-body-kr text-foreground/80 leading-korean">
              {todayPrinciple.aiRelevance}
            </p>
          </div>
        )}

        {/* Application ideas */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-foreground mb-4">응용 아이디어</h4>
          <ol className="space-y-3">
            {todayPrinciple.applicationIdeas.map((idea, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 text-sm font-medium text-muted-foreground w-5 text-right">
                  {index + 1}.
                </span>
                <span className="text-body-kr text-muted-foreground leading-korean-tight">
                  {idea}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Cross-discipline links */}
        {todayPrinciple.crossDisciplineLinks && todayPrinciple.crossDisciplineLinks.length > 0 && (
          <div className="pt-6 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-3">학문 간 연결</h4>
            <div className="flex flex-wrap gap-2">
              {todayPrinciple.crossDisciplineLinks.map((link, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-xs text-muted-foreground border border-border rounded-full"
                >
                  {link}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Other principles */}
      {principles.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-6">
            {categoryNames[todayPrinciple.category] || todayPrinciple.category} 분야의 다른 원리
          </h3>
          <div className="divide-y divide-border">
            {principles
              .filter((p) => p.title !== todayPrinciple.title)
              .map((principle, index) => (
                <div key={index} className="py-5 first:pt-0 last:pb-0">
                  <h4 className="text-card-title text-foreground mb-1">
                    {principle.title}
                  </h4>
                  <p className="text-body-kr text-muted-foreground leading-korean-tight mb-2">
                    {principle.description}
                  </p>
                  <p className="text-caption text-muted-foreground line-clamp-2 leading-relaxed">
                    {principle.explanation}
                  </p>
                  {principle.aiRelevance && (
                    <p className="text-caption text-muted-foreground mt-2 line-clamp-2">
                      AI 연결: {principle.aiRelevance}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </section>
  );
}

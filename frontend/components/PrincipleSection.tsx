/**
 * Principle Section - "오늘의 학문 스낵" rebranding
 * Friendly tone, academic snap cards, AI importance callout
 */

'use client';

import { useState } from 'react';
import { usePrinciples } from '@/lib/hooks/usePrinciples';
import { BookmarkButton } from '@/components/BookmarkButton';
import {
  BookOpen, Lightbulb, ExternalLink, ChevronDown, ChevronUp,
  Atom, Dna, Cpu, TrendingUp, BookMarked,
} from 'lucide-react';

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

const superCategoryIcons: Record<string, React.ReactNode> = {
  '기초과학': <Atom className="h-4 w-4" />,
  '생명과학': <Dna className="h-4 w-4" />,
  '공학': <Cpu className="h-4 w-4" />,
  '사회과학': <TrendingUp className="h-4 w-4" />,
  '인문학': <BookMarked className="h-4 w-4" />,
};

const difficultyLabels: Record<string, string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '심화',
};

function SectionHeader() {
  return (
    <div className="mb-8">
      <h2 className="text-section text-foreground">오늘의 학문 스낵</h2>
      <p className="text-body-kr text-muted-foreground mt-1">
        매일 한 입 크기로 즐기는 학문의 핵심 원리
      </p>
    </div>
  );
}

export function PrincipleSection() {
  const { principles, loading, error, disciplineInfo, getTodayPrinciple } = usePrinciples();
  const [expandedSnap, setExpandedSnap] = useState<number | null>(0);

  if (loading) {
    return (
      <section>
        <SectionHeader />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-5 border border-border rounded-lg">
              <div className="flex gap-2 mb-3">
                <div className="h-5 w-14 bg-muted rounded-full skeleton-shimmer" />
                <div className="h-5 w-18 bg-muted rounded-full skeleton-shimmer" />
              </div>
              <div className="h-6 bg-muted rounded skeleton-shimmer w-2/3 mb-2" />
              <div className="h-4 bg-muted rounded skeleton-shimmer w-full mb-1" />
              <div className="h-4 bg-muted rounded skeleton-shimmer w-5/6" />
            </div>
          ))}
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
            학문 스낵을 불러오는 데 문제가 있었어요
          </p>
          <p className="text-caption text-muted-foreground">
            잠시 후 다시 시도해 주세요.
          </p>
        </div>
      </section>
    );
  }

  const todayPrinciple = getTodayPrinciple();

  if (!todayPrinciple && principles.length === 0) {
    return (
      <section>
        <SectionHeader />
        <div className="py-12 text-center">
          <BookOpen className="h-5 w-5 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-foreground mb-1">
            아직 오늘의 학문 스낵이 준비되지 않았어요
          </p>
          <p className="text-caption text-muted-foreground">
            잠시 후 다시 확인해 주세요.
          </p>
        </div>
      </section>
    );
  }

  const allSnaps = principles.length > 0 ? principles : (todayPrinciple ? [todayPrinciple] : []);
  const superCategory = todayPrinciple?.superCategory || disciplineInfo?.superCategory || '';

  return (
    <section>
      <SectionHeader />

      {/* Discipline info badge */}
      {disciplineInfo && (
        <div className="flex items-center gap-2 mb-6">
          {superCategoryIcons[superCategory] && (
            <span className="text-muted-foreground">{superCategoryIcons[superCategory]}</span>
          )}
          <span className="text-sm text-muted-foreground">
            오늘의 분야: <span className="font-medium text-foreground">{disciplineInfo.name}</span>
            {superCategory && <span> ({superCategory})</span>}
          </span>
        </div>
      )}

      {/* Snap cards */}
      <div className="space-y-3">
        {allSnaps.map((principle, index) => {
          const isExpanded = expandedSnap === index;
          const difficulty = principle.difficulty;
          const learnMoreLinks = (principle as any).learnMoreLinks || (principle as any).learn_more_links;

          return (
            <div
              key={index}
              className="border border-border rounded-lg overflow-hidden"
            >
              {/* Card header - always visible */}
              <div
                className="p-5 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedSnap(isExpanded ? null : index)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-xs text-muted-foreground border border-border">
                        {categoryNames[principle.category] || principle.category}
                      </span>
                      {difficulty && difficultyLabels[difficulty] && (
                        <span className="px-2 py-0.5 rounded-full text-xs text-muted-foreground border border-border">
                          {difficultyLabels[difficulty]}
                        </span>
                      )}
                    </div>
                    <h3 className="text-card-title text-foreground mb-1">
                      {principle.title}
                    </h3>
                    <p className="text-body-kr text-muted-foreground line-clamp-2 leading-korean-tight">
                      {principle.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                    <BookmarkButton itemType="snap" itemId={`snap_${index}`} size="sm" />
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-5 pb-5 space-y-5 animate-fade-in border-t border-border pt-5">
                  {/* Detailed explanation */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">알고 계셨나요?</h4>
                    <p className="text-body-kr text-muted-foreground leading-korean">
                      {principle.explanation}
                    </p>
                  </div>

                  {/* Real-world example (everyday analogy) */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">일상 속 예시</h4>
                    <p className="text-body-kr text-muted-foreground leading-korean">
                      {principle.realWorldExample}
                    </p>
                  </div>

                  {/* AI importance callout */}
                  {principle.aiRelevance && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-foreground" />
                        <h4 className="text-sm font-semibold text-foreground">이것이 AI에 중요한 이유</h4>
                      </div>
                      <p className="text-body-kr text-foreground/80 leading-korean">
                        {principle.aiRelevance}
                      </p>
                    </div>
                  )}

                  {/* Application ideas */}
                  {principle.applicationIdeas && principle.applicationIdeas.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-3">AI에 이렇게 적용해요</h4>
                      <ol className="space-y-2">
                        {principle.applicationIdeas.map((idea, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="flex-shrink-0 text-xs font-medium text-muted-foreground w-5 text-right">
                              {i + 1}.
                            </span>
                            <span className="text-body-kr text-muted-foreground leading-korean-tight">
                              {idea}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Cross-discipline links */}
                  {principle.crossDisciplineLinks && principle.crossDisciplineLinks.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <h4 className="text-sm font-semibold text-foreground mb-2">관련 학문 분야</h4>
                      <div className="flex flex-wrap gap-2">
                        {principle.crossDisciplineLinks.map((link, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 text-xs text-muted-foreground border border-border rounded-full"
                          >
                            {link}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Learn more links */}
                  {learnMoreLinks && learnMoreLinks.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <h4 className="text-sm font-semibold text-foreground mb-3">더 알아보기</h4>
                      <div className="space-y-2">
                        {learnMoreLinks.map((link: any, i: number) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{link.title || link.url}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded border border-border">
                              {link.type === 'youtube' ? 'YouTube' : link.type === 'wikipedia' ? 'Wiki' : '링크'}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

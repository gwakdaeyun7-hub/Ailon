/**
 * Principle Section - 새로운 3단계 구조
 * Foundation (기본 원리) → Application (응용) → Integration (융합 사례)
 */

'use client';

import { useState } from 'react';
import { usePrinciples } from '@/lib/hooks/usePrinciples';
import {
  BookOpen, Lightbulb, Zap, Target, ExternalLink,
  CheckCircle, Sparkles
} from 'lucide-react';

const superCategoryColors: Record<string, string> = {
  '기초과학': 'bg-blue-100 text-blue-700 border-blue-200',
  '생명과학': 'bg-green-100 text-green-700 border-green-200',
  '공학': 'bg-orange-100 text-orange-700 border-orange-200',
  '사회과학': 'bg-red-100 text-red-700 border-red-200',
  '인문학': 'bg-purple-100 text-purple-700 border-purple-200',
};

function SectionHeader() {
  return (
    <div className="mb-8">
      <h2 className="text-section text-foreground">오늘의 학문 스낵</h2>
      <p className="text-body-kr text-muted-foreground mt-1">
        3단계로 배우는 학문의 융합 사례
      </p>
    </div>
  );
}

export function PrincipleSection() {
  const { principle, disciplineInfo, loading, error } = usePrinciples();
  const [activeStage, setActiveStage] = useState<number>(1);

  if (loading) {
    return (
      <section>
        <SectionHeader />
        <div className="p-8 border border-border rounded-lg">
          <div className="h-6 bg-muted rounded w-1/2 mb-4 skeleton-shimmer" />
          <div className="h-4 bg-muted rounded w-full mb-2 skeleton-shimmer" />
          <div className="h-4 bg-muted rounded w-3/4 skeleton-shimmer" />
        </div>
      </section>
    );
  }

  if (error || !principle) {
    return (
      <section>
        <SectionHeader />
        <div className="py-12 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-foreground mb-1">
            {error || '아직 오늘의 학문 스낵이 준비되지 않았어요'}
          </p>
          <p className="text-caption text-muted-foreground">
            잠시 후 다시 확인해 주세요.
          </p>
        </div>
      </section>
    );
  }

  const superCategoryClass = superCategoryColors[principle.superCategory] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <section>
      <SectionHeader />

      {/* Discipline Info */}
      {disciplineInfo && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-900">오늘의 학문</span>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">{disciplineInfo.name}</h3>
          <p className="text-sm text-muted-foreground">{disciplineInfo.focus}</p>
        </div>
      )}

      {/* Main Card */}
      <div className="border-2 border-primary/20 rounded-xl overflow-hidden shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-primary/20">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-xl font-bold text-foreground flex-1">{principle.title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${superCategoryClass}`}>
              {principle.superCategory}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            <span>{principle.integration.targetField}에 적용</span>
          </div>
        </div>

        {/* 3 Stages */}
        <div className="bg-white">
          {/* Stage Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveStage(1)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 transition-colors ${activeStage === 1
                  ? 'bg-blue-50 border-b-2 border-blue-500 text-blue-700'
                  : 'text-muted-foreground hover:bg-muted/30'
                }`}
            >
              <Lightbulb className="h-4 w-4" />
              <span className="font-semibold text-sm">1. 기본 원리</span>
              {activeStage === 1 && <CheckCircle className="h-4 w-4 ml-auto" />}
            </button>

            <button
              onClick={() => setActiveStage(2)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 transition-colors ${activeStage === 2
                  ? 'bg-green-50 border-b-2 border-green-500 text-green-700'
                  : 'text-muted-foreground hover:bg-muted/30'
                }`}
            >
              <Zap className="h-4 w-4" />
              <span className="font-semibold text-sm">2. 응용</span>
              {activeStage === 2 && <CheckCircle className="h-4 w-4 ml-auto" />}
            </button>

            <button
              onClick={() => setActiveStage(3)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 transition-colors ${activeStage === 3
                  ? 'bg-red-50 border-b-2 border-red-500 text-red-700'
                  : 'text-muted-foreground hover:bg-muted/30'
                }`}
            >
              <Target className="h-4 w-4" />
              <span className="font-semibold text-sm">3. 융합 사례</span>
              {activeStage === 3 && <CheckCircle className="h-4 w-4 ml-auto" />}
            </button>
          </div>

          {/* Stage Content */}
          <div className="p-6 animate-fade-in">
            {activeStage === 1 && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-bold text-blue-900 mb-2">핵심 아이디어</h4>
                  <p className="text-sm text-blue-800">{principle.foundation.keyIdea}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">원리 설명</h4>
                  <p className="text-body-kr text-muted-foreground leading-korean">
                    {principle.foundation.principle}
                  </p>
                </div>
                {principle.foundation.everydayAnalogy && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-yellow-900 mb-2">💡 일상 비유</h4>
                    <p className="text-sm text-yellow-800 leading-relaxed">
                      {principle.foundation.everydayAnalogy}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeStage === 2 && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-bold text-green-900 mb-2">응용 분야</h4>
                  <p className="text-sm text-green-800">{principle.application.applicationField}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">응용 설명</h4>
                  <p className="text-body-kr text-muted-foreground leading-korean mb-4">
                    {principle.application.description}
                  </p>
                  <p className="text-sm text-muted-foreground italic">
                    {principle.application.mechanism}
                  </p>
                </div>
                {principle.application.technicalTerms?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">관련 기술 용어</h4>
                    <div className="flex flex-wrap gap-2">
                      {principle.application.technicalTerms.map((term, i) => (
                        <span key={i} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeStage === 3 && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-bold text-red-900 mb-2">해결한 문제</h4>
                  <p className="text-sm text-red-800">{principle.integration.problemSolved}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">해결 방법</h4>
                  <p className="text-body-kr text-muted-foreground leading-korean">
                    {principle.integration.solution}
                  </p>
                </div>
                {principle.integration.realWorldExamples?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">실제 사례</h4>
                    <ul className="space-y-2">
                      {principle.integration.realWorldExamples.map((example, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs flex items-center justify-center font-bold mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-sm text-muted-foreground leading-relaxed">{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-bold text-green-900 mb-2">✨ 왜 효과적인가요?</h4>
                  <p className="text-sm text-green-800 leading-relaxed">
                    {principle.integration.whyItWorks}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Verification */}
          {principle.verification && (
            <div className={`px-6 py-3 border-t ${principle.verification.verified ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
              }`}>
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-4 w-4 ${principle.verification.verified ? 'text-green-600' : 'text-amber-600'
                  }`} />
                <span className={`text-xs font-semibold ${principle.verification.verified ? 'text-green-700' : 'text-amber-700'
                  }`}>
                  {principle.verification.verified
                    ? `검증 완료 (신뢰도 ${(principle.verification.confidence * 100).toFixed(0)}%)`
                    : '검증 필요'}
                </span>
              </div>
            </div>
          )}

          {/* Learn More */}
          {principle.learn_more_links && principle.learn_more_links.length > 0 && (
            <div className="px-6 py-4 bg-muted/30 border-t border-border">
              <h4 className="text-sm font-semibold text-foreground mb-3">더 알아보기</h4>
              <div className="flex flex-wrap gap-2">
                {principle.learn_more_links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-lg hover:bg-muted/50 transition-colors text-sm"
                  >
                    <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{link.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${link.type === 'youtube' ? 'bg-red-100 text-red-700' :
                      link.type === 'wikipedia' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                      {link.type === 'youtube' ? 'YouTube' : link.type === 'wikipedia' ? 'Wiki' : '링크'}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

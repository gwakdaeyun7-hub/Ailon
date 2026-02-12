/**
 * 홈페이지 - 메인 대시보드
 *
 * UX Improvements:
 * - Time-of-day contextual greeting for daily ritual feeling
 * - Formatted date display (Korean locale)
 * - Increased section spacing with visual dividers
 * - Subtle entry animations for content sections
 * - Reduced hero section visual weight to let content shine
 */

import { NewsSection } from '@/components/NewsSection';
import { PrincipleSection } from '@/components/PrincipleSection';
import { IdeaSection } from '@/components/IdeaSection';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '새벽에도 학습하시는군요';
  if (hour < 12) return '좋은 아침이에요';
  if (hour < 17) return '오늘도 성장하는 중이에요';
  if (hour < 21) return '저녁 시간, 함께 배워볼까요';
  return '오늘의 학습을 마무리해볼까요';
}

function getFormattedDate(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  };
  return now.toLocaleDateString('ko-KR', options);
}

export default function HomePage() {
  const greeting = getGreeting();
  const formattedDate = getFormattedDate();

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-6 md:py-10 mb-4">
        {/* Date badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10">
          <span className="text-caption text-primary font-medium">
            {formattedDate}
          </span>
        </div>

        <h1 className="text-hero-sm md:text-hero gradient-text text-shadow-sm">
          {greeting}
        </h1>
        <p className="text-body-kr text-muted-foreground max-w-xl mx-auto leading-korean-tight">
          최신 AI 뉴스와 학문의 기본 원리를 학습하고,
          <br className="hidden sm:block" />
          이를 융합한 창의적인 아이디어를 발견하세요.
        </p>
      </section>

      {/* Content Sections with increased spacing and visual separation */}
      <div className="space-y-16 md:space-y-22">
        {/* 뉴스 섹션 */}
        <div className="animate-fade-in-up">
          <NewsSection />
        </div>

        {/* 학문 원리 섹션 */}
        <div className="section-divider animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <PrincipleSection />
        </div>

        {/* 아이디어 생성 섹션 */}
        <div className="section-divider animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <IdeaSection />
        </div>
      </div>
    </div>
  );
}

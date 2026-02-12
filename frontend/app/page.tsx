/**
 * Homepage - clean, minimal layout inspired by Newneek (뉴닉)
 * Content-first approach with generous whitespace
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
    <div className="container mx-auto max-w-3xl px-6 py-12 md:py-20">
      {/* Hero Section */}
      <section className="mb-16 md:mb-24">
        <p className="text-caption text-muted-foreground mb-4">
          {formattedDate}
        </p>
        <h1 className="text-hero-sm md:text-hero text-foreground mb-4">
          {greeting}
        </h1>
        <p className="text-body-kr text-muted-foreground max-w-lg leading-korean-tight">
          최신 AI 뉴스와 학문의 기본 원리를 학습하고,
          이를 융합한 창의적인 아이디어를 발견하세요.
        </p>
      </section>

      {/* Content Sections */}
      <div className="space-y-20 md:space-y-28">
        <NewsSection />
        <PrincipleSection />
        <IdeaSection />
      </div>
    </div>
  );
}

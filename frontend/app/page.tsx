/**
 * 홈페이지 - 메인 대시보드
 */

import { NewsSection } from '@/components/NewsSection';
import { PrincipleSection } from '@/components/PrincipleSection';
import { IdeaSection } from '@/components/IdeaSection';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          매일 성장하는 AI 학습 동반자
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          매일 최신 AI 뉴스와 학문의 기본 원리를 학습하고,
          <br />
          이를 융합한 창의적인 아이디어를 발견하세요.
        </p>
      </section>

      {/* 뉴스 섹션 */}
      <NewsSection />

      {/* 학문 원리 섹션 */}
      <PrincipleSection />

      {/* 아이디어 생성 섹션 */}
      <IdeaSection />
    </div>
  );
}

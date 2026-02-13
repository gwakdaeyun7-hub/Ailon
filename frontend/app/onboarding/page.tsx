'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUserPreferences } from '@/lib/hooks/useUserPreferences';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import type { NewsCategory } from '@/lib/types';

const NEWS_CATEGORIES: { key: NewsCategory; label: string; desc: string }[] = [
  { key: 'models_architecture', label: '모델&아키텍처', desc: 'LLM, 트랜스포머, 벤치마크' },
  { key: 'agentic_reality', label: '에이전틱리얼리티', desc: 'AI 에이전트, 자율 워크플로우' },
  { key: 'opensource_code', label: '오픈소스&코드', desc: '프레임워크, 라이브러리, 도구' },
  { key: 'physical_ai', label: 'Physical AI', desc: '로봇, 엣지 AI, 하드웨어' },
  { key: 'policy_safety', label: '정책&안전', desc: '규제, 윤리, AI 안전' },
];

const DISCIPLINES = [
  { key: 'mathematics', label: '수학' },
  { key: 'physics', label: '물리학' },
  { key: 'chemistry', label: '화학' },
  { key: 'biology', label: '생물학' },
  { key: 'medicine_neuroscience', label: '의학/뇌과학' },
  { key: 'computer_science', label: '컴퓨터공학' },
  { key: 'electrical_engineering', label: '전기전자공학' },
  { key: 'economics', label: '경제학' },
  { key: 'psychology_cognitive_science', label: '심리학/인지과학' },
  { key: 'philosophy_ethics', label: '철학/윤리학' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { updatePreferences } = useUserPreferences();
  const [step, setStep] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>([
    'models_architecture', 'agentic_reality', 'opensource_code', 'physical_ai', 'policy_safety',
  ]);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const toggleCategory = (key: NewsCategory) => {
    setSelectedCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleDiscipline = (key: string) => {
    setSelectedDisciplines(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleComplete = async () => {
    if (user) {
      await updatePreferences({
        newsCategories: selectedCategories,
        disciplines: selectedDisciplines,
        notificationsEnabled,
        onboardingCompleted: true,
      });
    }
    router.push('/');
  };

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="text-center">
      <h1 className="text-3xl font-bold text-foreground mb-4">
        Ailon에 오신 것을 환영합니다
      </h1>
      <p className="text-body-kr text-muted-foreground leading-korean mb-2">
        매일 AI 뉴스, 학문 원리, 융합 아이디어를
      </p>
      <p className="text-body-kr text-muted-foreground leading-korean mb-8">
        한 곳에서 만나보세요.
      </p>
      <div className="space-y-3 text-left max-w-sm mx-auto">
        {[
          '엄선된 AI 트렌드 뉴스',
          '매일 새로운 학문 스낵',
          'AI x 학문 융합 아이디어',
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <Check className="h-4 w-4 text-foreground flex-shrink-0" />
            <span className="text-sm text-foreground">{item}</span>
          </div>
        ))}
      </div>
    </div>,

    // Step 1: News categories
    <div key="categories">
      <h2 className="text-xl font-bold text-foreground mb-2 text-center">
        관심 있는 뉴스 카테고리를 선택하세요
      </h2>
      <p className="text-caption text-muted-foreground text-center mb-8">
        선택한 카테고리의 뉴스를 우선 표시합니다 (나중에 변경 가능)
      </p>
      <div className="space-y-3 max-w-sm mx-auto">
        {NEWS_CATEGORIES.map(({ key, label, desc }) => (
          <button
            key={key}
            onClick={() => toggleCategory(key)}
            className={`w-full text-left p-4 rounded-lg border transition-colors ${
              selectedCategories.includes(key)
                ? 'border-foreground bg-foreground/5'
                : 'border-border hover:border-foreground/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-caption text-muted-foreground">{desc}</p>
              </div>
              {selectedCategories.includes(key) && (
                <Check className="h-4 w-4 text-foreground flex-shrink-0" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>,

    // Step 2: Disciplines
    <div key="disciplines">
      <h2 className="text-xl font-bold text-foreground mb-2 text-center">
        관심 있는 학문 분야를 선택하세요
      </h2>
      <p className="text-caption text-muted-foreground text-center mb-8">
        선택한 분야의 학문 스낵과 융합 아이디어를 더 자주 볼 수 있어요 (선택사항)
      </p>
      <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
        {DISCIPLINES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggleDiscipline(key)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              selectedDisciplines.includes(key)
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground hover:border-foreground/30'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>,

    // Step 3: Notifications
    <div key="notifications" className="text-center">
      <h2 className="text-xl font-bold text-foreground mb-2">
        알림 설정
      </h2>
      <p className="text-body-kr text-muted-foreground leading-korean mb-8">
        매일 아침 새로운 콘텐츠가 준비되면 알려드릴까요?
      </p>
      <div className="space-y-3 max-w-sm mx-auto">
        <button
          onClick={() => setNotificationsEnabled(true)}
          className={`w-full text-left p-4 rounded-lg border transition-colors ${
            notificationsEnabled
              ? 'border-foreground bg-foreground/5'
              : 'border-border hover:border-foreground/30'
          }`}
        >
          <p className="text-sm font-medium text-foreground">알림 받기</p>
          <p className="text-caption text-muted-foreground">
            매일 아침 6시에 새 콘텐츠 알림
          </p>
        </button>
        <button
          onClick={() => setNotificationsEnabled(false)}
          className={`w-full text-left p-4 rounded-lg border transition-colors ${
            !notificationsEnabled
              ? 'border-foreground bg-foreground/5'
              : 'border-border hover:border-foreground/30'
          }`}
        >
          <p className="text-sm font-medium text-foreground">알림 받지 않기</p>
          <p className="text-caption text-muted-foreground">
            나중에 설정에서 변경 가능
          </p>
        </button>
      </div>
    </div>,
  ];

  return (
    <div className="container mx-auto max-w-3xl px-6 py-12">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-12">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all ${
              i <= step ? 'w-8 bg-foreground' : 'w-4 bg-border'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-full animate-fade-in">
          {steps[step]}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-12">
        {step > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep(step - 1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            이전
          </Button>
        ) : (
          <div />
        )}

        {step < steps.length - 1 ? (
          <Button
            size="sm"
            onClick={() => setStep(step + 1)}
          >
            다음
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleComplete}
          >
            시작하기
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

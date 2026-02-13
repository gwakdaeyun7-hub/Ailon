'use client';

import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="container mx-auto max-w-3xl px-6 py-20">
      <div className="text-center">
        <WifiOff className="h-8 w-8 text-muted-foreground mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-foreground mb-3">
          오프라인 상태입니다
        </h1>
        <p className="text-body-kr text-muted-foreground mb-2">
          인터넷 연결이 끊어져 콘텐츠를 불러올 수 없어요.
        </p>
        <p className="text-caption text-muted-foreground mb-8">
          Wi-Fi 또는 모바일 데이터를 확인한 후 다시 시도해 주세요.
        </p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          다시 시도
        </Button>
      </div>
    </div>
  );
}

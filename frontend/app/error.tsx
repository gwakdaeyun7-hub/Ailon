'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h2 className="text-2xl font-bold mb-4">오류가 발생했습니다</h2>
      <p className="text-muted-foreground mb-6">{error.message}</p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
      >
        다시 시도
      </button>
    </div>
  );
}

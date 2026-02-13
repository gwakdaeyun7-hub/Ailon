import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-6">
      <h1 className="text-4xl font-bold">404</h1>
      <h2 className="text-2xl font-semibold">페이지를 찾을 수 없습니다</h2>
      <p className="text-muted-foreground">요청하신 페이지가 존재하지 않습니다.</p>
      <Link
        href="/"
        className="px-6 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}

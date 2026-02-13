import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { InstallPrompt } from '@/components/InstallPrompt';

export const metadata: Metadata = {
  title: 'Ailon - 매일 성장하는 AI 학습 동반자',
  description: '매일 AI 뉴스와 학문 원리를 학습하고, 창의적인 융합 아이디어를 발견하세요.',
  manifest: '/manifest.json',
  themeColor: '#111111',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-border mb-16 md:mb-0">
          <div className="container mx-auto max-w-3xl px-6 py-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Ailon</span>
                <span className="text-caption text-muted-foreground">
                  매일 성장하는 AI 학습 동반자
                </span>
              </div>
              <p className="text-caption text-muted-foreground">
                &copy; {new Date().getFullYear()} Ailon
              </p>
            </div>
          </div>
        </footer>
        <BottomNav />
        <InstallPrompt />
      </body>
    </html>
  );
}

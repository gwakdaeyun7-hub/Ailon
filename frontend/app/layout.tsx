import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-sans-kr',
});

export const metadata: Metadata = {
  title: 'Ailon - 매일 성장하는 AI 학습 동반자',
  description: '매일 AI 뉴스와 학문 원리를 학습하고, 창의적인 융합 아이디어를 발견하세요.',
  manifest: '/manifest.json',
  themeColor: '#5b46d6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={notoSansKR.variable}>
      <body className={`${notoSansKR.className} min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-border/50 bg-secondary/30">
          <div className="container mx-auto px-4 py-8 md:py-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold gradient-text">Ailon</span>
                <span className="text-caption text-muted-foreground">
                  매일 성장하는 AI 학습 동반자
                </span>
              </div>
              <p className="text-caption text-muted-foreground">
                &copy; {new Date().getFullYear()} Ailon. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

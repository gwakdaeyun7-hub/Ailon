import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Learning Companion - 매일 성장하는 AI 학습 동반자',
  description: '매일 AI 뉴스와 학문 원리를 학습하고, 창의적인 아이디어를 생성하세요.',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t py-6 md:py-8">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              <p>© 2026 AI Learning Companion. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

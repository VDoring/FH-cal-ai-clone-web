import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from '@/components/auth-provider'
import { BottomNav } from '@/components/layout/bottom-nav'
import "./globals.css";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI 식단 기록 서비스',
  description: '원클릭으로 간편한 식단 관리',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AuthProvider>
          <div className="pb-16"> {/* 바텀 네비게이션 공간 확보 */}
            {children}
          </div>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}

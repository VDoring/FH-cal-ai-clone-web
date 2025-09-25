import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DemoAuthProvider as AuthProvider } from '@/components/demo-auth-provider'
import { AppContent } from '@/components/app-content'
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
          <AppContent>
            {children}
          </AppContent>
        </AuthProvider>
      </body>
    </html>
  );
}

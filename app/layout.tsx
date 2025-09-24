import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CalAI CAM - 원클릭 AI 식단 기록",
  description: "사진 한 장으로 완성되는 스마트한 식단 관리. AI가 자동으로 음식을 분석하고 칼로리를 계산해드립니다.",
  keywords: ["AI", "식단 관리", "칼로리", "음식 인식", "다이어트", "건강"],
  authors: [{ name: "CalAI CAM Team" }],
  openGraph: {
    title: "CalAI CAM - 원클릭 AI 식단 기록",
    description: "사진 한 장으로 완성되는 스마트한 식단 관리",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

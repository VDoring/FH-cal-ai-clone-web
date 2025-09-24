"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from '@/components/ui/loading';

export default function Home() {
  const router = useRouter();

  // 로그인 bypass - 바로 대시보드로 리다이렉트
  useEffect(() => {
    router.push('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loading size="lg" text="서비스 로딩 중..." />
    </div>
  );
}


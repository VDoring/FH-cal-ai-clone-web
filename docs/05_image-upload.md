# 📸 이미지 업로드 기능

## 📋 작업 개요
사용자 이미지 선택부터 Supabase Storage 업로드까지의 전체 플로우 구현

## ✅ 체크리스트

### 1. 이미지 업로드 유틸리티 함수
- [ ] `lib/storage.ts` 파일 생성
```typescript
import { supabase } from './supabase'

export async function uploadImage(file: File, userId: string): Promise<{
  data: { path: string; url: string } | null
  error: Error | null
}> {
  try {
    // 파일명 생성 (중복 방지)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // Supabase Storage에 업로드
    const { error: uploadError } = await supabase.storage
      .from('food-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('food-images')
      .getPublicUrl(filePath)

    return {
      data: { path: filePath, url: publicUrl },
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: error as Error
    }
  }
}

export async function deleteImage(path: string) {
  const { error } = await supabase.storage
    .from('food-images')
    .remove([path])
  
  return { error }
}

// 이미지 파일 검증
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // 파일 타입 검증
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: '이미지 파일만 업로드 가능합니다.' }
  }

  // 파일 크기 검증 (10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: '파일 크기는 10MB 이하여야 합니다.' }
  }

  // 지원되는 이미지 형식
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!supportedTypes.includes(file.type)) {
    return { valid: false, error: 'JPEG, PNG, WebP 형식만 지원됩니다.' }
  }

  return { valid: true }
}
```

### 2. 이미지 압축 유틸리티
- [ ] 이미지 압축 라이브러리 설치
```bash
pnpm add browser-image-compression
```

- [ ] `lib/image-compression.ts` 파일 생성
```typescript
import imageCompression from 'browser-image-compression'

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1, // 최대 1MB
    maxWidthOrHeight: 1920, // 최대 해상도
    useWebWorker: true,
    fileType: 'image/jpeg' as const
  }

  try {
    const compressedFile = await imageCompression(file, options)
    return compressedFile
  } catch (error) {
    console.warn('이미지 압축 실패, 원본 사용:', error)
    return file
  }
}

// 이미지 미리보기 URL 생성
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file)
}

// 메모리 정리
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url)
}
```

### 3. 업로드 상태 관리 훅
- [ ] `hooks/use-image-upload.ts` 파일 생성
```typescript
'use client'

import { useState } from 'react'
import { uploadImage, validateImageFile } from '@/lib/storage'
import { compressImage } from '@/lib/image-compression'
import { useAuth } from '@/components/auth-provider'

interface UploadState {
  loading: boolean
  error: string | null
  progress: number
  imageUrl: string | null
  imagePath: string | null
}

export function useImageUpload() {
  const { user } = useAuth()
  const [state, setState] = useState<UploadState>({
    loading: false,
    error: null,
    progress: 0,
    imageUrl: null,
    imagePath: null
  })

  const uploadFile = async (file: File) => {
    if (!user) {
      setState(prev => ({ ...prev, error: '로그인이 필요합니다.' }))
      return null
    }

    // 파일 검증
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setState(prev => ({ ...prev, error: validation.error || '파일이 유효하지 않습니다.' }))
      return null
    }

    setState(prev => ({ ...prev, loading: true, error: null, progress: 0 }))

    try {
      // 이미지 압축
      setState(prev => ({ ...prev, progress: 25 }))
      const compressedFile = await compressImage(file)

      // 업로드
      setState(prev => ({ ...prev, progress: 50 }))
      const { data, error } = await uploadImage(compressedFile, user.id)

      if (error) {
        throw error
      }

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        progress: 100,
        imageUrl: data!.url,
        imagePath: data!.path
      }))

      return data
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '업로드 실패' 
      }))
      return null
    }
  }

  const reset = () => {
    setState({
      loading: false,
      error: null,
      progress: 0,
      imageUrl: null,
      imagePath: null
    })
  }

  return {
    ...state,
    uploadFile,
    reset
  }
}
```

### 4. 이미지 선택 컴포넌트
- [ ] `components/image-picker.tsx` 파일 생성
```typescript
'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Upload, X } from 'lucide-react'
import { createImagePreview, revokeImagePreview } from '@/lib/image-compression'

interface ImagePickerProps {
  onImageSelect: (file: File) => void
  loading?: boolean
  error?: string | null
}

export function ImagePicker({ onImageSelect, loading, error }: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (file: File) => {
    if (previewUrl) {
      revokeImagePreview(previewUrl)
    }

    const preview = createImagePreview(file)
    setPreviewUrl(preview)
    setSelectedFile(file)
  }

  const handleGalleryClick = () => {
    fileInputRef.current?.click()
  }

  const handleCameraClick = () => {
    cameraInputRef.current?.click()
  }

  const handleConfirm = () => {
    if (selectedFile) {
      onImageSelect(selectedFile)
    }
  }

  const handleReset = () => {
    if (previewUrl) {
      revokeImagePreview(previewUrl)
    }
    setPreviewUrl(null)
    setSelectedFile(null)
  }

  return (
    <div className="space-y-4">
      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
        }}
        className="hidden"
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
        }}
        className="hidden"
      />

      {/* 미리보기 또는 선택 버튼 */}
      {previewUrl ? (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <img
                src={previewUrl}
                alt="선택된 이미지"
                className="w-full h-64 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleReset}
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mt-4 space-y-2">
              <Button 
                onClick={handleConfirm} 
                className="w-full"
                disabled={loading}
              >
                {loading ? '업로드 중...' : '이 사진으로 식단 기록하기'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <div className="text-gray-500">
                  <Camera className="h-16 w-16 mx-auto mb-4" />
                  <p>음식 사진을 선택해주세요</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={handleCameraClick}
                    className="h-16"
                  >
                    <Camera className="h-6 w-6 mr-2" />
                    카메라
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleGalleryClick}
                    className="h-16"
                  >
                    <Upload className="h-6 w-6 mr-2" />
                    갤러리
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="text-red-500 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  )
}
```

### 5. 업로드 진행률 컴포넌트
- [ ] `components/upload-progress.tsx` 파일 생성
```typescript
'use client'

import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface UploadProgressProps {
  progress: number
  loading: boolean
  stage: 'compressing' | 'uploading' | 'analyzing' | 'saving' | 'complete'
}

const stageMessages = {
  compressing: '이미지를 최적화하고 있습니다...',
  uploading: '이미지를 업로드하고 있습니다...',
  analyzing: 'AI가 음식을 분석하고 있습니다...',
  saving: '식단 기록을 저장하고 있습니다...',
  complete: '기록이 완료되었습니다!'
}

export function UploadProgress({ progress, loading, stage }: UploadProgressProps) {
  if (!loading && stage !== 'complete') return null

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
          
          <div className="text-center">
            <p className="text-sm font-medium">{stageMessages[stage]}</p>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="text-center text-xs text-gray-500">
            {progress}% 완료
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 6. 메인 업로드 페이지
- [ ] `app/upload/page.tsx` 파일 생성
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePicker } from '@/components/image-picker'
import { UploadProgress } from '@/components/upload-progress'
import { Navbar } from '@/components/navbar'
import { useImageUpload } from '@/hooks/use-image-upload'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

type UploadStage = 'selecting' | 'compressing' | 'uploading' | 'analyzing' | 'saving' | 'complete'

export default function UploadPage() {
  const router = useRouter()
  const { loading, error, progress, uploadFile } = useImageUpload()
  const [stage, setStage] = useState<UploadStage>('selecting')

  const handleImageSelect = async (file: File) => {
    setStage('compressing')
    
    // 이미지 업로드 및 처리 시뮬레이션
    const result = await uploadFile(file)
    
    if (result) {
      setStage('analyzing')
      // TODO: n8n 웹훅 호출 (다음 단계에서 구현)
      
      setTimeout(() => {
        setStage('complete')
        // 완료 후 대시보드로 이동
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로가기
          </Button>
          
          <h1 className="text-xl font-bold">식단 기록하기</h1>
          <div className="w-20" /> {/* 공간 확보용 */}
        </div>

        {stage === 'selecting' && (
          <ImagePicker
            onImageSelect={handleImageSelect}
            loading={loading}
            error={error}
          />
        )}

        {stage !== 'selecting' && (
          <UploadProgress
            progress={progress}
            loading={loading}
            stage={stage}
          />
        )}

        {stage === 'complete' && (
          <div className="text-center space-y-4">
            <div className="text-green-600 text-lg font-medium">
              ✅ 식단 기록이 완료되었습니다!
            </div>
            <p className="text-gray-600">
              대시보드로 이동합니다...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

### 7. 홈페이지 업로드 버튼
- [ ] `app/page.tsx` 파일 생성/수정
```typescript
'use client'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">AI 식단 기록 서비스</CardTitle>
            <p className="text-gray-600">원클릭으로 간편한 식단 관리</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/login">
              <Button className="w-full">로그인</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" className="w-full">회원가입</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 space-y-8">
        <div className="text-center pt-8">
          <h1 className="text-3xl font-bold mb-2">안녕하세요!</h1>
          <p className="text-gray-600">오늘의 식단을 기록해보세요</p>
        </div>

        {/* 메인 업로드 버튼 */}
        <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
          <CardContent className="p-8">
            <Button
              onClick={() => router.push('/upload')}
              className="w-full h-20 text-lg"
              size="lg"
            >
              <Camera className="h-8 w-8 mr-3" />
              식단 기록하기
            </Button>
          </CardContent>
        </Card>

        {/* 대시보드 링크 */}
        <Card>
          <CardContent className="p-6">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full h-16">
                <BarChart3 className="h-6 w-6 mr-3" />
                나의 식단 보기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

## 🧪 테스트 체크리스트

### 기능 테스트
- [ ] 이미지 파일 선택 (갤러리)
- [ ] 카메라로 사진 촬영
- [ ] 이미지 파일 검증 (크기, 형식)
- [ ] 이미지 압축 기능
- [ ] Supabase Storage 업로드

### UI/UX 테스트
- [ ] 모바일 반응형 디자인
- [ ] 이미지 미리보기
- [ ] 업로드 진행률 표시
- [ ] 에러 메시지 표시

### 에러 처리 테스트
- [ ] 잘못된 파일 형식
- [ ] 파일 크기 초과
- [ ] 네트워크 오류
- [ ] 권한 오류

## 🚨 주의사항
- 모바일 카메라 접근 권한 필요
- 이미지 압축으로 용량 최적화
- 메모리 누수 방지 (URL.revokeObjectURL)

## 📝 다음 단계
이미지 업로드 완료 후 **06_n8n-integration.md**로 진행

---
**예상 소요 시간**: 4-5시간  
**난이도**: ⭐⭐⭐⭐☆  
**의존성**: 04_database-design.md 완료 필요

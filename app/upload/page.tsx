'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { MobileLayout } from '@/components/layout/mobile-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Upload, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { Loading } from '@/components/ui/loading'
import Image from 'next/image'

export default function UploadPage() {
  const router = useRouter()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // 파일 선택 핸들러
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setUploadStatus('idle')
      setErrorMessage('')
    }
  }

  // 파일 선택 버튼 클릭
  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  // 업로드 처리 (임시 구현)
  const handleUpload = async () => {
    if (!selectedFile || !user) return

    setIsUploading(true)
    setUploadStatus('uploading')

    try {
      // 실제로는 n8n 웹훅으로 전송하는 로직이 들어갈 예정
      // 지금은 임시로 3초 후 성공 처리
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // 임시 성공 처리
      setUploadStatus('success')
      
      // 2초 후 대시보드로 이동
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
      
    } catch (error) {
      setUploadStatus('error')
      setErrorMessage('업로드 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsUploading(false)
    }
  }

  // 다시 선택하기
  const handleReset = () => {
    setSelectedFile(null)
    setPreviewUrl('')
    setUploadStatus('idle')
    setErrorMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <MobileLayout showPadding={false}>
      <Header title="식단 기록하기" showBack />
      
      <div className="p-4 space-y-6">
        {/* 메인 업로드 카드 */}
        <Card>
          <CardContent className="p-6">
            {!selectedFile ? (
              // 파일 선택 상태
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Camera className="w-12 h-12 text-emerald-500" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    음식 사진을 선택해주세요
                  </h2>
                  <p className="text-gray-600 text-sm">
                    사진 선택만으로 AI가 자동으로 음식을 분석하고<br />
                    칼로리와 영양성분을 계산해드립니다
                  </p>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={triggerFileSelect}
                    className="w-full h-14 text-lg"
                    size="lg"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    사진 촬영하기
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={triggerFileSelect}
                    className="w-full h-14 text-lg"
                    size="lg"
                  >
                    <ImageIcon className="w-5 h-5 mr-2" />
                    갤러리에서 선택
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              // 미리보기 및 업로드 상태
              <div className="space-y-6">
                {/* 이미지 미리보기 */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={previewUrl}
                    alt="선택된 음식 사진"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                {/* 파일 정보 */}
                <div className="text-center space-y-2">
                  <h3 className="font-medium text-gray-900">{selectedFile.name}</h3>
                  <p className="text-sm text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {/* 상태별 UI */}
                {uploadStatus === 'idle' && (
                  <div className="space-y-3">
                    <Button 
                      onClick={handleUpload}
                      className="w-full h-12"
                      size="lg"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      식단 기록하기
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleReset}
                      className="w-full"
                    >
                      다른 사진 선택
                    </Button>
                  </div>
                )}

                {uploadStatus === 'uploading' && (
                  <div className="text-center space-y-4">
                    <Loading size="lg" />
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">AI가 음식을 분석하고 있습니다</h3>
                      <p className="text-sm text-gray-600">
                        잠시만 기다려주세요...
                      </p>
                    </div>
                  </div>
                )}

                {uploadStatus === 'success' && (
                  <div className="text-center space-y-4">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">기록 완료!</h3>
                      <p className="text-sm text-gray-600">
                        식단이 성공적으로 기록되었습니다.<br />
                        대시보드로 이동합니다...
                      </p>
                    </div>
                  </div>
                )}

                {uploadStatus === 'error' && (
                  <div className="text-center space-y-4">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">업로드 실패</h3>
                      <p className="text-sm text-gray-600">{errorMessage}</p>
                    </div>
                    <div className="space-y-2">
                      <Button onClick={handleUpload} className="w-full">
                        다시 시도
                      </Button>
                      <Button variant="outline" onClick={handleReset} className="w-full">
                        다른 사진 선택
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 도움말 */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">📝 촬영 팁</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 음식이 잘 보이도록 충분한 조명에서 촬영하세요</li>
              <li>• 음식 전체가 프레임에 들어오도록 촬영하세요</li>
              <li>• 여러 음식이 있는 경우 모두 포함해서 촬영하세요</li>
              <li>• 손이나 그릇이 너무 많이 보이지 않도록 주의하세요</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  )
}


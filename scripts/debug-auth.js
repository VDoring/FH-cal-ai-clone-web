// Supabase 인증 디버깅 스크립트
const { createClient } = require('@supabase/supabase-js')

async function debugAuth() {
  try {
    console.log('🔍 Supabase 인증 설정을 확인합니다...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kzrlybhxqmalqtiiwhjn.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmx5Ymh4cW1hbHF0aWl3aGpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODEwMzMsImV4cCI6MjA3NDI1NzAzM30._d2Uy294lHorZ27Bmj6Gr0LzrBJLSNfn2FpGp_3D2QU'
    
    console.log(`📍 URL: ${supabaseUrl}`)
    console.log(`🔑 Key: ${supabaseAnonKey.substring(0, 20)}...`)
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // 1. 익명 로그인 테스트
    console.log('\n🔐 익명 로그인 테스트...')
    try {
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously()
      if (anonError) {
        console.log(`❌ 익명 로그인 실패: ${anonError.message}`)
      } else {
        console.log('✅ 익명 로그인 성공')
        console.log(`👤 사용자 ID: ${anonData.user?.id}`)
        await supabase.auth.signOut()
      }
    } catch (error) {
      console.log(`❌ 익명 로그인 예외: ${error.message}`)
    }
    
    // 2. 간단한 이메일로 회원가입 테스트
    console.log('\n📧 간단한 이메일로 회원가입 테스트...')
    const testEmails = [
      'test@example.com',
      'user@domain.com',
      'admin@localhost.com',
      'test123@test123.com'
    ]
    
    for (const email of testEmails) {
      try {
        console.log(`  테스트 중: ${email}`)
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: 'password123456',
          options: {
            emailRedirectTo: undefined // 이메일 확인 비활성화 시도
          }
        })
        
        if (error) {
          console.log(`    ❌ ${error.message}`)
        } else {
          console.log(`    ✅ 성공 (사용자 ID: ${data.user?.id})`)
          // 테스트 사용자 삭제 (가능하다면)
          await supabase.auth.signOut()
          break
        }
      } catch (error) {
        console.log(`    ❌ 예외: ${error.message}`)
      }
    }
    
    // 3. 다양한 도메인으로 테스트
    console.log('\n🌐 다양한 도메인으로 테스트...')
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
    
    for (const domain of domains) {
      const email = `testuser@${domain}`
      try {
        console.log(`  테스트 중: ${email}`)
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: 'test123456789'
        })
        
        if (error) {
          console.log(`    ❌ ${error.message}`)
        } else {
          console.log(`    ✅ ${domain} 도메인 사용 가능`)
          await supabase.auth.signOut()
          return email // 성공한 이메일 반환
        }
      } catch (error) {
        console.log(`    ❌ 예외: ${error.message}`)
      }
    }
    
    return null
    
  } catch (error) {
    console.error('❌ 디버깅 중 오류:', error)
    return null
  }
}

// 스크립트 실행
debugAuth().then(workingEmail => {
  if (workingEmail) {
    console.log(`\n🎉 사용 가능한 이메일 형식 발견: ${workingEmail}`)
    console.log('이 형식을 기반으로 테스트 계정을 생성하세요!')
  } else {
    console.log('\n⚠️ 이메일 인증 설정에 문제가 있을 수 있습니다.')
    console.log('Supabase 대시보드에서 Authentication 설정을 확인하세요.')
    console.log('1. Authentication > Settings')
    console.log('2. "Confirm email" 설정 확인')
    console.log('3. "Site URL" 설정 확인')
    console.log('4. "Redirect URLs" 설정 확인')
  }
  process.exit(0)
})

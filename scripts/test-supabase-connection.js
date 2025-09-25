// Supabase 연결 테스트 스크립트
// 터미널에서 실행: node scripts/test-supabase-connection.js

const { createClient } = require('@supabase/supabase-js')

async function testConnection() {
  try {
    console.log('🔄 Supabase 연결을 테스트합니다...')
    
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kzrlybhxqmalqtiiwhjn.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmx5Ymh4cW1hbHF0aWl3aGpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODEwMzMsImV4cCI6MjA3NDI1NzAzM30._d2Uy294lHorZ27Bmj6Gr0LzrBJLSNfn2FpGp_3D2QU'
    
    console.log(`📍 Supabase URL: ${supabaseUrl}`)
    console.log(`🔑 Anon Key: ${supabaseAnonKey.substring(0, 20)}...`)
    
    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // 테이블 존재 확인
    console.log('\n📋 테이블 존재 확인...')
    const { data: tables, error: tablesError } = await supabase
      .from('food_logs')
      .select('*')
      .limit(1)
    
    if (tablesError) {
      console.log('❌ food_logs 테이블이 존재하지 않습니다.')
      console.log('📝 다음 SQL을 Supabase 대시보드에서 실행하세요:')
      console.log('   docs/supabase-migration.sql 파일 참조')
      return false
    }
    
    console.log('✅ food_logs 테이블이 존재합니다.')
    
    // 익명 인증 테스트
    console.log('\n🔐 익명 인증 테스트...')
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
    
    if (authError) {
      console.log(`❌ 익명 인증 실패: ${authError.message}`)
      return false
    }
    
    console.log('✅ 익명 인증 성공')
    console.log(`👤 사용자 ID: ${authData.user?.id}`)
    
    // 데이터 삽입/조회 테스트
    console.log('\n💾 데이터 삽입/조회 테스트...')
    const testData = {
      user_id: authData.user?.id,
      image_url: null,
      meal_type: 'breakfast',
      food_items: [
        {
          foodName: '테스트 음식',
          confidence: 0.95,
          quantity: '1개',
          calories: 100,
          nutrients: {
            carbohydrates: { value: 10, unit: 'g' },
            protein: { value: 5, unit: 'g' },
            fat: { value: 2, unit: 'g' },
            sugars: { value: 1, unit: 'g' },
            sodium: { value: 50, unit: 'mg' }
          }
        }
      ],
      total_calories: 100,
      total_nutrients: {
        carbohydrates: { value: 10, unit: 'g' },
        protein: { value: 5, unit: 'g' },
        fat: { value: 2, unit: 'g' },
        sugars: { value: 1, unit: 'g' },
        sodium: { value: 50, unit: 'mg' }
      },
      confidence_score: 0.95
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('food_logs')
      .insert(testData)
      .select()
      .single()
    
    if (insertError) {
      console.log(`❌ 데이터 삽입 실패: ${insertError.message}`)
      return false
    }
    
    console.log('✅ 테스트 데이터 삽입 성공')
    console.log(`📄 삽입된 데이터 ID: ${insertData.id}`)
    
    // 삽입된 데이터 조회
    const { data: queryData, error: queryError } = await supabase
      .from('food_logs')
      .select('*')
      .eq('id', insertData.id)
      .single()
    
    if (queryError) {
      console.log(`❌ 데이터 조회 실패: ${queryError.message}`)
      return false
    }
    
    console.log('✅ 데이터 조회 성공')
    
    // 테스트 데이터 삭제
    const { error: deleteError } = await supabase
      .from('food_logs')
      .delete()
      .eq('id', insertData.id)
    
    if (deleteError) {
      console.log(`❌ 테스트 데이터 삭제 실패: ${deleteError.message}`)
    } else {
      console.log('🗑️ 테스트 데이터 삭제 완료')
    }
    
    // 로그아웃
    await supabase.auth.signOut()
    
    console.log('\n🎉 모든 테스트가 성공했습니다!')
    console.log('✅ Supabase 연결이 정상적으로 작동합니다.')
    
    return true
    
  } catch (error) {
    console.error('❌ 연결 테스트 중 오류 발생:', error)
    return false
  }
}

// 테스트 사용자 생성 함수
async function createTestUser() {
  try {
    console.log('\n👤 테스트 사용자 생성을 시도합니다...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kzrlybhxqmalqtiiwhjn.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmx5Ymh4cW1hbHF0aWl3aGpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODEwMzMsImV4cCI6MjA3NDI1NzAzM30._d2Uy294lHorZ27Bmj6Gr0LzrBJLSNfn2FpGp_3D2QU'
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // 테스트 사용자 회원가입 시도
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@gmail.com',
      password: 'admin123456',
      options: {
        data: {
          full_name: '관리자'
        }
      }
    })
    
    if (error) {
      if (error.message.includes('User already registered')) {
        console.log('✅ 테스트 사용자가 이미 존재합니다.')
        
        // 로그인 테스트
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: 'admin@gmail.com',
          password: 'admin123456'
        })
        
        if (loginError) {
          console.log(`❌ 테스트 사용자 로그인 실패: ${loginError.message}`)
          return false
        }
        
        console.log('✅ 테스트 사용자 로그인 성공')
        await supabase.auth.signOut()
        return true
      } else {
        console.log(`❌ 테스트 사용자 생성 실패: ${error.message}`)
        return false
      }
    }
    
    console.log('✅ 테스트 사용자 생성 성공')
    console.log(`📧 이메일: admin@gmail.com`)
    console.log(`🔑 비밀번호: admin123456`)
    
    await supabase.auth.signOut()
    return true
    
  } catch (error) {
    console.error('❌ 테스트 사용자 생성 중 오류:', error)
    return false
  }
}

// 스크립트 실행
testConnection().then(async success => {
  if (success) {
    const userSuccess = await createTestUser()
    if (userSuccess) {
      console.log('\n🎉 설정 완료!')
      console.log('📧 테스트 계정: admin@gmail.com / admin123456')
      console.log('🚀 애플리케이션을 실행할 준비가 되었습니다!')
      process.exit(0)
    } else {
      console.log('\n⚠️ 테스트 사용자 설정에 문제가 있습니다.')
      process.exit(1)
    }
  } else {
    console.log('\n⚠️ 설정을 확인하고 다시 시도해주세요.')
    process.exit(1)
  }
})

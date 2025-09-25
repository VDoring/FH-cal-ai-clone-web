import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 클라이언트 사이드용 (익명 키)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 서버 사이드용 (서비스 키) - RLS 우회 가능
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase // 서비스 키가 없으면 일반 클라이언트 사용

// Database helper functions
export async function getSupabaseUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Database types
export interface FoodLog {
  id: string
  user_id: string
  image_url: string | null
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  food_items: FoodItem[]
  total_calories: number
  total_nutrients: {
    carbohydrates: { value: number; unit: string }
    protein: { value: number; unit: string }
    fat: { value: number; unit: string }
    sugars: { value: number; unit: string }
    sodium: { value: number; unit: string }
  }
  confidence_score: number
  created_at: string
  updated_at: string
}

export interface FoodItem {
  foodName: string
  confidence: number
  quantity: string
  calories: number
  nutrients: {
    carbohydrates: { value: number; unit: string }
    protein: { value: number; unit: string }
    fat: { value: number; unit: string }
    sugars: { value: number; unit: string }
    sodium: { value: number; unit: string }
  }
}

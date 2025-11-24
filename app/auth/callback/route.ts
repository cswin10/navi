import { createClient } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[Auth Callback] Error exchanging code:', error)
      return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin))
    }

    // Create user profile if it doesn't exist
    if (data.user) {
      const { data: existingProfile } = await (supabase
        .from('user_profiles') as any)
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        const { error: profileError } = await (supabase
          .from('user_profiles') as any)
          .insert({
            id: data.user.id,
            name: data.user.user_metadata?.name || null,
            email: data.user.email,
            preferences: {},
            context_memory: {},
            knowledge_base: '',
            email_signature: '',
          })

        if (profileError) {
          console.error('[Auth Callback] Error creating profile:', profileError)
        }
      }
    }
  }

  return NextResponse.redirect(new URL('/voice', requestUrl.origin))
}

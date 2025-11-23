import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createClient } from '@/lib/auth'
import { encrypt } from '@/lib/encryption'

/**
 * Connect user's email integration
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    const { email, appPassword } = body

    if (!email || !appPassword) {
      return NextResponse.json(
        { error: 'Email and app password are required' },
        { status: 400 }
      )
    }

    // Encrypt the app password
    const encryptedPassword = encrypt(appPassword)

    const supabase = await createClient()

    // Check if integration already exists
    const { data: existing } = await supabase
      .from('user_integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('integration_type', 'email')
      .maybeSingle()

    if (existing) {
      // Update existing integration
      const { error } = await supabase
        .from('user_integrations')
        .update({
          credentials: {
            email,
            app_password: encryptedPassword,
          },
          is_active: true,
        })
        .eq('id', existing.id)

      if (error) {
        throw new Error(`Failed to update email integration: ${error.message}`)
      }
    } else {
      // Create new integration
      const { error } = await supabase
        .from('user_integrations')
        .insert({
          user_id: user.id,
          integration_type: 'email',
          credentials: {
            email,
            app_password: encryptedPassword,
          },
          is_active: true,
        })

      if (error) {
        throw new Error(`Failed to create email integration: ${error.message}`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Email Integration] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to connect email' },
      { status: 500 }
    )
  }
}

/**
 * Disconnect user's email integration
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = await createClient()

    const { error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('user_id', user.id)
      .eq('integration_type', 'email')

    if (error) {
      throw new Error(`Failed to disconnect email: ${error.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Email Integration] Disconnect error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect email' },
      { status: 500 }
    )
  }
}

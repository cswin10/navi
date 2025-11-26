import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Insert into waitlist
    const { error } = await (supabase
      .from('waitlist') as any)
      .insert({
        email: email.toLowerCase().trim(),
        name: name || null,
        source: 'landing_page',
      })

    if (error) {
      // Check for unique constraint violation (already signed up)
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'This email is already on the waitlist!' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the waitlist!',
    })
  } catch (error: any) {
    console.error('Waitlist signup error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    // Validation
    if (!token) {
      return NextResponse.json(
        { valid: false, message: 'Token is required' },
        { status: 400 }
      )
    }

    // Check if token exists and is not expired
    const { data: adminUser, error: userError } = await supabase
      .from('admin_users')
      .select('id, email, reset_token_expiry')
      .eq('reset_token', token)
      .eq('status', 'active')
      .single()

    if (userError || !adminUser) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid reset token'
      })
    }

    // Check if token is expired
    const now = new Date()
    const expiry = new Date(adminUser.reset_token_expiry)
    
    if (now > expiry) {
      // Clean up expired token
      await supabase
        .from('admin_users')
        .update({
          reset_token: null,
          reset_token_expiry: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminUser.id)

      return NextResponse.json({
        valid: false,
        message: 'Reset token has expired. Please request a new password reset.'
      })
    }

    return NextResponse.json({
      valid: true,
      message: 'Token is valid'
    })

  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { valid: false, message: 'Failed to validate token' },
      { status: 500 }
    )
  }
}

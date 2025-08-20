import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    // Validation
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Find admin user with valid token
    const { data: adminUser, error: userError } = await supabase
      .from('admin_users')
      .select('id, email, name, reset_token_expiry')
      .eq('reset_token', token)
      .eq('status', 'active')
      .single()

    if (userError || !adminUser) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
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

      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new password reset.' },
        { status: 400 }
      )
    }

    // Hash the new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminUser.id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    // Log the password reset activity
    try {
      await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: adminUser.id,
          action: 'password_reset_completed',
          details: { 
            email: adminUser.email,
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Error logging password reset:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again later.' },
      { status: 500 }
    )
  }
}

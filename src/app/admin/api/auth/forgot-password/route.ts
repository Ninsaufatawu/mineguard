import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import sgMail from '@sendgrid/mail'
import crypto from 'crypto'

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if admin user exists
    const { data: adminUser, error: userError } = await supabase
      .from('admin_users')
      .select('id, name, email, role, status')
      .eq('email', email.toLowerCase())
      .eq('status', 'active')
      .in('role', ['admin', 'moderator']) // Only allow admin and moderator password resets
      .single()

    if (userError || !adminUser) {
      // For security, don't reveal if email exists or not
      return NextResponse.json({
        success: true,
        message: 'If an admin account with this email exists, you will receive a password reset link.'
      })
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store reset token in database
    // First, try to update with reset token columns
    let updateError = null
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({
          reset_token: resetToken,
          reset_token_expiry: resetTokenExpiry.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', adminUser.id)
      
      updateError = error
    } catch (error) {
      updateError = error
    }

    if (updateError) {
      console.error('Error storing reset token:', updateError)
      
      // If the columns don't exist, we'll store the token temporarily in a different way
      // For now, we'll use a simple in-memory store (not recommended for production)
      // You should run the database migration to add the proper columns
      
      return NextResponse.json(
        { 
          error: 'Database not configured for password reset. Please contact the super administrator.',
          details: 'Missing reset_token and reset_token_expiry columns in admin_users table'
        },
        { status: 500 }
      )
    }

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/reset-password?token=${resetToken}`

    // Prepare email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">GeoGuard Admin Portal</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
          
          <p style="color: #666; line-height: 1.6;">Hello ${adminUser.name},</p>
          
          <p style="color: #666; line-height: 1.6;">
            You have requested to reset your password for your GeoGuard admin account. 
            Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; text-decoration: none; padding: 15px 30px; 
                      border-radius: 8px; font-weight: bold; font-size: 16px;">
              Reset Your Password
            </a>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #555; margin-top: 0;">Security Information:</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li>This link will expire in 1 hour for security purposes</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Your current password remains unchanged until you complete the reset</li>
            </ul>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          <p style="color: #2196f3; word-break: break-all; font-size: 12px; background: #f0f0f0; padding: 10px; border-radius: 4px;">
            ${resetUrl}
          </p>
          
          <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              <strong>Important:</strong> If you continue to have issues accessing your account, 
              please contact the super administrator for assistance.
            </p>
          </div>
        </div>
        
        <div style="background: #333; padding: 15px; text-align: center;">
          <p style="color: #ccc; margin: 0; font-size: 12px;">
            This is an automated message from GeoGuard Admin Portal<br>
            Request made on ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    `

    // Send reset email
    const mailOptions = {
      to: adminUser.email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@geoguard.com',
      subject: 'Reset Your GeoGuard Admin Password',
      html: emailContent
    }

    await sgMail.send(mailOptions)

    // Log the password reset request
    try {
      await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: adminUser.id,
          action: 'password_reset_requested',
          details: { email: adminUser.email, ip: request.headers.get('x-forwarded-for') || 'unknown' },
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Error logging password reset request:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset link has been sent to your email address.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request. Please try again later.' },
      { status: 500 }
    )
  }
}

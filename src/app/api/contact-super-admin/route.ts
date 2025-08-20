import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import sgMail from '@sendgrid/mail'

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const { email, message, type } = await request.json()

    // Validation
    if (!email || !message) {
      return NextResponse.json(
        { error: 'Email and message are required' },
        { status: 400 }
      )
    }

    // Get super admin email from database
    const { data: superAdmin, error: superAdminError } = await supabase
      .from('admin_users')
      .select('email, name')
      .eq('role', 'super_admin')
      .eq('status', 'active')
      .single()

    if (superAdminError || !superAdmin) {
      console.error('Error fetching super admin:', superAdminError)
      return NextResponse.json(
        { error: 'Unable to contact super admin at this time' },
        { status: 500 }
      )
    }

    // Prepare email content
    const emailSubject = type === 'admin_login_help' 
      ? 'Admin Login Help Request - GeoGuard' 
      : 'Contact Request - GeoGuard'

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">GeoGuard Admin Portal</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Admin Login Help Request</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #555; margin-top: 0;">Contact Details:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Request Type:</strong> ${type === 'admin_login_help' ? 'Admin Login Help' : 'General Contact'}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <h3 style="color: #555; margin-top: 0;">Message:</h3>
            <p style="line-height: 1.6; color: #666;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
            <p style="margin: 0; color: #1976d2;">
              <strong>Action Required:</strong> Please review this admin access request and respond to the user directly at ${email}.
            </p>
          </div>
        </div>
        
        <div style="background: #333; padding: 15px; text-align: center;">
          <p style="color: #ccc; margin: 0; font-size: 12px;">
            This is an automated message from GeoGuard Admin Portal
          </p>
        </div>
      </div>
    `

    // Send email to super admin
    const mailOptions = {
      to: superAdmin.email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@geoguard.com',
      subject: emailSubject,
      html: emailContent,
      replyTo: email // Allow super admin to reply directly to the requester
    }

    await sgMail.send(mailOptions)

    // Log the contact request in database (optional)
    try {
      await supabase
        .from('contact_requests')
        .insert({
          email,
          message,
          type,
          super_admin_email: superAdmin.email,
          status: 'sent',
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Error logging contact request:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully to super admin'
    })

  } catch (error) {
    console.error('Contact super admin error:', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    )
  }
}

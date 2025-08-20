import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { verifyAdminAuth } from '../../../middleware'
import { sendEmailNotification, createAdminInviteNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    // Verify super admin authentication
    const user = await verifyAdminAuth(request)
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({
        success: false,
        error: 'Super admin access required'
      }, { status: 403 })
    }

    const { email, password, name } = await request.json()

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json({
        success: false,
        error: 'Email, password, and name are required'
      }, { status: 400 })
    }

    // Check if admin already exists
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'Admin with this email already exists'
      }, { status: 400 })
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 12)

    // Create the admin user
    const { data: newUser, error: createError } = await supabase
      .from('admin_users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: hashedPassword,
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        login_count: 0
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating admin:', createError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create admin user'
      }, { status: 500 })
    }

    // Send email notification with login credentials
    const loginUrl = `${process.env.NEXTAUTH_URL}/admin/login`
    const emailNotification = createAdminInviteNotification(
      email,
      loginUrl,
      password,
      user.name
    )
    
    const emailSent = await sendEmailNotification(emailNotification)
    
    // Log the activity
    await supabase
      .from('admin_activity_logs')
      .insert({
        user_id: user.id,
        action: 'create_admin',
        details: {
          created_admin_email: email,
          created_admin_name: name,
          created_by: user.email,
          email_sent: emailSent
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? `Admin created successfully! Invitation email sent to ${email}` 
        : `Admin created successfully! Warning: Could not send email to ${email}`,
      admin: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        created_at: newUser.created_at
      },
      email_sent: emailSent
    })

  } catch (error) {
    console.error('Create admin error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

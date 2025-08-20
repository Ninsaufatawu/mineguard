import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { sendEmailNotification, createAdminInviteNotification } from '@/lib/email'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'ninsawfatawu@gmail.com'

// Middleware to verify admin authentication
async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Verify user exists and is active
    const { data: admin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', decoded.userId)
      .eq('status', 'active')
      .single()

    return admin
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminAuth(request)
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Only super admin can create invites
    if (admin.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      )
    }

    const { email, role = 'admin', message } = await request.json()

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'An admin with this email already exists' },
        { status: 400 }
      )
    }

    // Check if there's already a pending invite
    const { data: existingInvite } = await supabase
      .from('admin_invites')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return NextResponse.json(
        { error: 'A pending invite already exists for this email' },
        { status: 400 }
      )
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    const inviteId = uuidv4()

    // Create invite record
    const { data: invite, error: inviteError } = await supabase
      .from('admin_invites')
      .insert({
        id: inviteId,
        email: email.toLowerCase(),
        token: token,
        role: role,
        message: message || null,
        created_by: admin.id,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invite:', inviteError)
      return NextResponse.json(
        { error: 'Failed to create invite' },
        { status: 500 }
      )
    }

    // Log the invite creation
    await supabase
      .from('admin_activity_logs')
      .insert({
        admin_id: admin.id,
        action: 'invite_created',
        details: {
          invited_email: email,
          role: role,
          message: message
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        created_at: new Date().toISOString()
      })

    // Generate invite URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/admin/register?token=${token}`

    // Send email notification with invite link
    const emailNotification = createAdminInviteNotification(
      email,
      inviteUrl,
      null, // No password for invite-based registration
      admin.name
    )
    
    const emailSent = await sendEmailNotification(emailNotification)
    
    // Update activity log with email status
    await supabase
      .from('admin_activity_logs')
      .update({
        details: {
          invited_email: email,
          role: role,
          message: message,
          email_sent: emailSent
        }
      })
      .eq('admin_id', admin.id)
      .eq('action', 'invite_created')

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? `Admin invite created successfully! Invitation email sent to ${email}` 
        : `Admin invite created successfully! Warning: Could not send email to ${email}`,
      invite: {
        id: inviteId,
        email: email,
        role: role,
        token: token,
        invite_url: inviteUrl,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        created_at: invite.created_at
      },
      email_sent: emailSent
    })

  } catch (error) {
    console.error('Invite creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminAuth(request)
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Only super admin can view invites
    if (admin.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      )
    }

    // Get all invites
    const { data: invites, error } = await supabase
      .from('admin_invites')
      .select(`
        *,
        created_by_user:admin_users!admin_invites_created_by_fkey(name, email),
        used_by_user:admin_users!admin_invites_used_by_fkey(name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invites:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invites' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invites: invites
    })

  } catch (error) {
    console.error('Fetch invites error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, token } = await request.json()

    // Validation
    if (!name || !email || !password || !token) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Validate invite token
    const { data: invite, error: inviteError } = await supabase
      .from('admin_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invalid or expired invite token' },
        { status: 400 }
      )
    }

    // Check if token has expired (24 hours)
    const tokenAge = Date.now() - new Date(invite.created_at).getTime()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    
    if (tokenAge > maxAge) {
      // Mark token as expired
      await supabase
        .from('admin_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id)

      return NextResponse.json(
        { error: 'Invite token has expired' },
        { status: 400 }
      )
    }

    // Check if email matches invite
    if (email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email does not match the invite' },
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

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create admin user
    const adminId = uuidv4()
    const { data: newAdmin, error: createError } = await supabase
      .from('admin_users')
      .insert({
        id: adminId,
        name: name.trim(),
        email: email.toLowerCase(),
        password_hash: passwordHash,
        role: invite.role || 'admin',
        status: 'active',
        created_by: invite.created_by,
        created_at: new Date().toISOString(),
        login_count: 0
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating admin user:', createError)
      return NextResponse.json(
        { error: 'Failed to create admin account' },
        { status: 500 }
      )
    }

    // Mark invite as used
    await supabase
      .from('admin_invites')
      .update({ 
        status: 'used',
        used_at: new Date().toISOString(),
        used_by: adminId
      })
      .eq('id', invite.id)

    // Log the registration
    await supabase
      .from('admin_activity_logs')
      .insert({
        admin_id: adminId,
        action: 'account_created',
        details: {
          name: name,
          email: email,
          role: invite.role || 'admin',
          invited_by: invite.created_by
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: adminId,
        name: name,
        email: email,
        role: invite.role || 'admin'
      }
    })

  } catch (error) {
    console.error('Admin registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Find invite by token
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

    // Get creator info
    const { data: creator } = await supabase
      .from('admin_users')
      .select('name, email')
      .eq('id', invite.created_by)
      .single()

    return NextResponse.json({
      success: true,
      invite: {
        email: invite.email,
        role: invite.role,
        created_at: invite.created_at,
        expires_at: new Date(new Date(invite.created_at).getTime() + maxAge).toISOString(),
        created_by: creator?.name || 'Super Admin'
      }
    })

  } catch (error) {
    console.error('Invite validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

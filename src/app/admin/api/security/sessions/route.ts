import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Fetch user's login sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch active login sessions for the user
    const { data: sessions, error } = await supabase
      .from('admin_login_sessions')
      .select('*')
      .eq('admin_user_id', userId)
      .is('logged_out_at', null)
      .order('last_activity', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessions: sessions || []
    });

  } catch (error) {
    console.error('Error in sessions GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Logout specific session or all other sessions
export async function DELETE(request: NextRequest) {
  try {
    const { userId, sessionId, logoutAll } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (logoutAll) {
      // Logout all other sessions (keep current session active)
      const currentToken = request.headers.get('authorization')?.replace('Bearer ', '');
      
      const { error } = await supabase
        .from('admin_login_sessions')
        .update({ 
          logged_out_at: new Date().toISOString(),
          is_current: false 
        })
        .eq('admin_user_id', userId)
        .neq('session_token', currentToken || '')
        .is('logged_out_at', null);

      if (error) {
        console.error('Error logging out all sessions:', error);
        return NextResponse.json(
          { error: 'Failed to logout all sessions' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'All other sessions logged out successfully'
      });

    } else if (sessionId) {
      // Logout specific session
      const { error } = await supabase
        .from('admin_login_sessions')
        .update({ 
          logged_out_at: new Date().toISOString(),
          is_current: false 
        })
        .eq('id', sessionId)
        .eq('admin_user_id', userId);

      if (error) {
        console.error('Error logging out session:', error);
        return NextResponse.json(
          { error: 'Failed to logout session' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Session logged out successfully'
      });
    }

    return NextResponse.json(
      { error: 'Either sessionId or logoutAll must be provided' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in sessions DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

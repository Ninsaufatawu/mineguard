import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, currentPassword, newPassword } = await request.json();

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 12) {
      return NextResponse.json(
        { error: 'Password must be at least 12 characters long' },
        { status: 400 }
      );
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUppercase || !hasNumber || !hasSpecialChar) {
      return NextResponse.json(
        { error: 'Password must include uppercase letter, number, and special character' },
        { status: 400 }
      );
    }

    // Get current admin user
    const { data: adminUser, error: fetchError } = await supabase
      .from('admin_users')
      .select('id, password_hash')
      .eq('id', userId)
      .single();

    if (fetchError || !adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, adminUser.password_hash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Check password history (prevent reuse of last 5 passwords)
    const { data: passwordHistory } = await supabase
      .from('admin_password_history')
      .select('password_hash')
      .eq('admin_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (passwordHistory) {
      for (const oldPassword of passwordHistory) {
        const isReused = await bcrypt.compare(newPassword, oldPassword.password_hash);
        if (isReused) {
          return NextResponse.json(
            { error: 'Cannot reuse any of your last 5 passwords' },
            { status: 400 }
          );
        }
      }
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in admin_users table
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        password_hash: hashedNewPassword,
        password_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Add current password to history
    const { error: historyError } = await supabase
      .from('admin_password_history')
      .insert({
        admin_user_id: userId,
        password_hash: adminUser.password_hash
      });

    if (historyError) {
      console.error('Error saving password history:', historyError);
      // Don't fail the request if history save fails
    }

    // Log the password change activity
    console.log(`Password changed for admin user ${userId} at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error in password change:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

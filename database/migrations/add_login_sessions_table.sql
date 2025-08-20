-- Create login sessions table for tracking admin user sessions
-- Run this SQL in your Supabase SQL editor

-- Create the login sessions table
CREATE TABLE IF NOT EXISTS admin_login_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255),
    device_info JSONB DEFAULT '{}', -- Store device, browser, OS info
    ip_address VARCHAR(45), -- Changed from INET to VARCHAR for better compatibility
    location VARCHAR(255), -- City, Country
    user_agent TEXT,
    is_current BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active', -- Added status column that login API expects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    logged_out_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_login_sessions_user_id ON admin_login_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_login_sessions_token ON admin_login_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_login_sessions_current ON admin_login_sessions(admin_user_id, is_current);
CREATE INDEX IF NOT EXISTS idx_admin_login_sessions_active ON admin_login_sessions(admin_user_id, logged_out_at) WHERE logged_out_at IS NULL;

-- Add password change history table for security tracking
CREATE TABLE IF NOT EXISTS admin_password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for password history
CREATE INDEX IF NOT EXISTS idx_admin_password_history_user_id ON admin_password_history(admin_user_id, created_at DESC);

-- Add security settings columns to admin_users table
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS backup_codes JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create function to clean up old sessions (optional)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    -- Mark expired sessions as logged out
    UPDATE admin_login_sessions 
    SET logged_out_at = NOW()
    WHERE expires_at < NOW() 
    AND logged_out_at IS NULL;
    
    -- Delete sessions older than 90 days
    DELETE FROM admin_login_sessions 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Disable RLS and remove any existing policies for unrestricted access
-- Drop any existing policies first
DROP POLICY IF EXISTS "Admin users can view own login sessions" ON admin_login_sessions;
DROP POLICY IF EXISTS "Admin users can insert own login sessions" ON admin_login_sessions;
DROP POLICY IF EXISTS "Admin users can update own login sessions" ON admin_login_sessions;
DROP POLICY IF EXISTS "Admin users can delete own login sessions" ON admin_login_sessions;
DROP POLICY IF EXISTS "Super admin can view all login sessions" ON admin_login_sessions;
DROP POLICY IF EXISTS "Admin users can view own password history" ON admin_password_history;
DROP POLICY IF EXISTS "Admin users can insert own password history" ON admin_password_history;
DROP POLICY IF EXISTS "Super admin can view all password history" ON admin_password_history;

-- Disable RLS on tables to make them completely unrestricted
ALTER TABLE admin_login_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_password_history DISABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE admin_login_sessions IS 'Tracks admin user login sessions for security monitoring';
COMMENT ON COLUMN admin_login_sessions.device_info IS 'JSON object containing device, browser, OS information';
COMMENT ON COLUMN admin_login_sessions.is_current IS 'Marks the current active session';
COMMENT ON COLUMN admin_login_sessions.location IS 'Approximate location based on IP address';

COMMENT ON TABLE admin_password_history IS 'Stores password history to prevent reuse of recent passwords';
COMMENT ON COLUMN admin_users.two_factor_enabled IS 'Whether 2FA is enabled for this admin user';
COMMENT ON COLUMN admin_users.two_factor_method IS 'Method used for 2FA (app, sms, email, security_key)';
COMMENT ON COLUMN admin_users.failed_login_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN admin_users.locked_until IS 'Timestamp until which the account is locked due to failed attempts';

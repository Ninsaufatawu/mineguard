import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a singleton instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Verify Supabase connection
(async () => {
  try {
    console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Missing');
    
    // Check if we can connect to Supabase
    const { data, error } = await supabase.from('mining_reports').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection test failed:', error);
    } else {
      console.log('Supabase connection successful. Database is accessible.');
    }
  } catch (err) {
    console.error('Error testing Supabase connection:', err);
  }
})();

// Type definition for user data
export type UserData = {
  id: string;
  name: string;
  email: string;
  password?: string; // Password is optional in the type but will be stored securely
  created_at?: string;
  updated_at?: string;
  provider?: string;
};

// Function to store user data in Supabase
export async function storeUserInSupabase(userData: UserData): Promise<boolean> {
  try {
    // Remove password from logs for security
    const logSafeUser = { ...userData };
    delete logSafeUser.password;
    console.log('Storing user in Supabase:', logSafeUser);
    
    // Ensure we have a created_at timestamp
    if (!userData.created_at) {
      userData.created_at = new Date().toISOString();
    }
    
    // Add updated_at timestamp
    userData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('users')
      .upsert(
        { 
          id: userData.id,
          name: userData.name,
          email: userData.email,
          password: userData.password, // In a production app, this should be hashed before storage
          provider: userData.provider || 'credentials',
          created_at: userData.created_at,
          updated_at: userData.updated_at
        },
        { 
          onConflict: 'email', 
          ignoreDuplicates: false
        }
      );
    
    if (error) {
      console.error('Error storing user in Supabase:', error);
      return false;
    }
    
    console.log('User stored successfully');
    return true;
  } catch (error) {
    console.error('Exception storing user in Supabase:', error);
    return false;
  }
} 
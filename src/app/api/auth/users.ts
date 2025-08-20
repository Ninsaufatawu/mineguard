import { supabase, UserData } from '@/lib/supabase';

// Functions to interact with users in Supabase
export async function findUserByEmail(email: string): Promise<UserData | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error || !data) {
    console.log('User not found:', email);
    return null;
  }
  
  return data as UserData;
}

export async function createUser(userData: UserData): Promise<UserData | null> {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating user:', error);
    return null;
  }
  
  return data as UserData;
}

export async function getAllUsers(): Promise<UserData[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*');
  
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  
  return data as UserData[];
}

// For backward compatibility during transition
export const users: UserData[] = []; 
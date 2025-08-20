import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '../users';
import { storeUserInSupabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists in Supabase
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    // Create new user with UUID
    const newUser = {
      id: uuidv4(),
      name,
      email,
      password, // In production, this would be hashed
      provider: 'credentials',
      created_at: new Date().toISOString()
    };

    // Store user directly in Supabase
    const createdUser = await storeUserInSupabase(newUser);

    if (!createdUser) {
      return NextResponse.json(
        { error: 'Failed to create user in database' },
        { status: 500 }
      );
    }

    // Return success without exposing password
    return NextResponse.json(
      { 
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email
        },
        message: 'User registered successfully' 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
} 
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { findUserByEmail } from "../users"
import { storeUserInSupabase } from "@/lib/supabase"
import { v4 as uuidv4 } from 'uuid'

// Determine the URL based on environment
const isProduction = process.env.NODE_ENV === "production";
const BASE_URL = isProduction 
  ? "https://illegal-mining-detection.vercel.app"
  : process.env.NEXTAUTH_URL || "http://localhost:3000";

// Configure NextAuth with Google and credentials providers
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Only set explicit redirect_uri in production
      ...(isProduction && {
        authorization: {
          params: {
            redirect_uri: `${BASE_URL}/api/auth/callback/google`,
          },
        },
      }),
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        // Look up the user in Supabase
        const user = await findUserByEmail(credentials.email);
        
        // Check if user exists and password matches
        // In production, you would use a proper password comparison method
        if (user && user.password === credentials.password) {
          // Return only what you want to store in the token
          return {
            id: user.id,
            name: user.name,
            email: user.email,
          }
        }
        
        return null
      },
    }),
  ],
  pages: {
    signIn: '/auth',
    signOut: '/',
    error: '/auth', 
  },
  callbacks: {
    // Conditionally handle redirects based on environment
    redirect({ url, baseUrl }) {
      // For relative URLs, use the appropriate base URL
      if (url.startsWith('/')) {
        return `${BASE_URL}${url}`;
      }
      
      // For URLs that don't include our domain, redirect to our base URL
      if (!url.startsWith(BASE_URL)) {
        return BASE_URL;
      }
      
      // Otherwise return as is
      return url;
    },
    
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        
        // Store user in Supabase when they sign in
        // For Google auth, we need to create a new user record
        if (account?.provider === 'google') {
          // Check if Google user already exists in Supabase
          const existingUser = await findUserByEmail(user.email || '');
          
          if (!existingUser) {
            // Create new user for Google authentication
            await storeUserInSupabase({
              id: uuidv4(),
              name: user.name || '',
              email: user.email || '',
              provider: 'google',
              created_at: new Date().toISOString()
            });
          }
        }
        // For credentials provider, the user is already stored during registration
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  // Help debug auth issues by enabling in both environments
  debug: true,
})

export { handler as GET, handler as POST } 
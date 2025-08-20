"use client"

import { SessionProvider } from "next-auth/react"
import { useEffect } from "react"
import "@/app/utils/fontawesome" // Import the FontAwesome configuration
 
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
} 
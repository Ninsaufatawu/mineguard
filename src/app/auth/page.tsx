import AuthPage from "@/app/components/auth/AuthPage"
import { Suspense } from "react"

export default function Auth() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPage />
    </Suspense>
  )
} 
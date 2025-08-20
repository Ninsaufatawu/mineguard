import { Suspense } from "react"
import RegisterPage from "@/app/components/auth/RegisterPage"

export default function Register() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterPage />
    </Suspense>
  )
} 
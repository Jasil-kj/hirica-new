import { AuthForm } from '@/components/auth/AuthForm'

export default function RecruiterLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <AuthForm role="recruiter" />
    </div>
  )
}

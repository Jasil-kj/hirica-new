import Link from 'next/link'
import { LayoutDashboard, Briefcase, FileText, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NotificationBell } from '@/components/notifications/NotificationBell'

export default async function JobseekerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center space-x-8">
          <Link href="/jobseeker/dashboard" className="flex items-center">
            <span className="text-brand-blue font-bold text-2xl mr-1">H</span>
            <span className="font-bold text-xl tracking-tight text-brand-navy">Hirica</span>
            <span className="ml-2 text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">Job Seeker</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/jobseeker/dashboard" className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition">
              Dashboard
            </Link>
            <Link href="/jobseeker/jobs" className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition">
              Find Jobs
            </Link>
            <Link href="/jobseeker/applications" className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition">
              My Applications
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {user && <NotificationBell userId={user.id} />}
          
          <form action={async () => {
            'use server'
            const { signout } = await import('@/app/actions/auth')
            await signout()
          }}>
            <button type="submit" className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition">
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  )
}

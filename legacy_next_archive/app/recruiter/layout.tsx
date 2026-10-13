import Link from 'next/link'
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  FileCheck, 
  Video, 
  BarChart2, 
  FileText, 
  Settings,
  Bell,
  Search
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { NotificationBell } from '@/components/notifications/NotificationBell'

export default async function RecruiterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-brand-blue font-bold text-2xl mr-1">H</span>
          <span className="font-bold text-xl tracking-tight text-brand-navy">Hirica</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1">
          <Link href="/recruiter/dashboard" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors">
            <LayoutDashboard className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            Overview
          </Link>
          <Link href="/recruiter/jobs" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors">
            <Briefcase className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            Jobs Management
          </Link>
          <Link href="/recruiter/jobs/create" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors">
            <Users className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            Post New Job
          </Link>
          <Link href="/recruiter/assessments" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors">
            <FileCheck className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            Assessments
          </Link>
          <Link href="/recruiter/analytics" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors">
            <BarChart2 className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            Analytics & Reports
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <form action={async () => {
            'use server'
            const { signout } = await import('@/app/actions/auth')
            await signout()
          }}>
            <button type="submit" className="w-full text-left text-red-600 hover:bg-red-50 font-medium px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center">
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <h1 className="text-xl font-bold text-gray-900">Overview</h1>
          <div className="flex items-center space-x-6">
            <button className="text-gray-400 hover:text-gray-500">
              <Search className="h-5 w-5" />
            </button>
            {user && <NotificationBell userId={user.id} />}
            <div className="flex items-center">
              <img className="h-8 w-8 rounded-full" src="https://i.pravatar.cc/100?img=1" alt="User avatar" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

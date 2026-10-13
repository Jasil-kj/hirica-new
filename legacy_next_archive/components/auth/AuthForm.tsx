'use client'

import { useState } from 'react'
import { login, signup } from '@/app/actions/auth'
import { ArrowRight, Briefcase, User, Loader2 } from 'lucide-react'

type AuthFormProps = {
  role: 'recruiter' | 'candidate'
}


export function AuthForm({ role }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    
    try {
        let result;
        if (isLogin) {
            result = await login(formData, role)
        } else {
            result = await signup(formData, role)
        }

        if (result?.error) {
            setError(result.error)
        }
    } catch (err: any) {
        if (err?.message === 'NEXT_REDIRECT' || err?.message?.includes('REDIRECT')) {
            throw err
        }
        console.error("AuthForm caught error:", err)
        setError(err?.message || "An unexpected error occurred.")
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-brand-blue">
          {role === 'recruiter' ? <Briefcase className="w-5 h-5" /> : <User className="w-5 h-5" />}
        </div>
        <div>
          <h2 className="font-bold text-2xl text-black">
            {role === 'recruiter' ? 'Recruiter Portal' : 'Job Seeker Portal'}
          </h2>
          <p className="text-sm text-gray-500">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
            <input 
              name="fullName"
              type="text" 
              required 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors"
              placeholder="John Doe"
            />
          </div>
        )}

        {!isLogin && role === 'recruiter' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Company</label>
              <input 
                name="companyName"
                type="text" 
                required 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Designation</label>
              <input 
                name="designation"
                type="text" 
                required 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors"
                placeholder="HR Manager"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
          <input 
            name="email"
            type="email" 
            required 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
          <input 
            name="password"
            type="password" 
            required 
            minLength={6}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-brand-black text-white font-bold py-3.5 px-4 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-6 shadow-lg shadow-gray-200"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4 ml-2 opacity-80" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm">
        <span className="text-gray-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
        </span>
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="ml-2 font-bold text-brand-blue hover:underline"
        >
          {isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </div>
    </div>
  )
}

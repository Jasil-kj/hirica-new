'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const baseAuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const recruiterSignupSchema = baseAuthSchema.extend({
  role: z.literal('recruiter'),
  fullName: z.string().min(2),
  companyName: z.string().min(2),
  companyEmail: z.string().email(),
  designation: z.string().min(2),
})

const jobseekerSignupSchema = baseAuthSchema.extend({
  role: z.literal('candidate'),
  fullName: z.string().min(2),
})

export async function login(formData: FormData, role: 'recruiter' | 'candidate') {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  // Check the role
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
      // Use admin client to bypass RLS when checking role
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const adminSupabase = createAdminClient();
      
      const { data: profile } = await adminSupabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== role) {
          // Prevent a candidate logging in through recruiter portal and vice versa
          await supabase.auth.signOut()
          return { error: `Invalid account type. This portal is for ${role}s only.` }
      }
  }

  revalidatePath('/', 'layout')
  redirect(role === 'recruiter' ? '/recruiter/dashboard' : '/jobseeker/dashboard')
}

export async function signup(formData: FormData, role: 'recruiter' | 'candidate') {
  const supabase = await createClient()
  
  // Basic Signup
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    fullName: formData.get('fullName') as string,
  }

  // 1. Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  })

  if (authError) {
    return { error: authError.message }
  }

  const userId = authData.user?.id
  if (!userId) {
    return { error: 'Failed to create user' }
  }

  // Use admin client to bypass any Row Level Security (RLS) restrictions for initial profile creation
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  // 2. Insert into profiles table
  const { error: profileError } = await adminSupabase.from('profiles').insert([
    {
      id: userId,
      role: role,
      full_name: data.fullName,
      email: data.email,
    }
  ])

  if (profileError) {
    // Note: in a real production system you'd want compensation logic if this fails
    console.error("Profile creation error", profileError)
    return { error: `DB Error: ${profileError.message} - ${profileError.details || ''} - Code: ${profileError.code || ''}` }
  }

  // 3. Insert into specific profile table
  if (role === 'recruiter') {
      const { error: recError } = await adminSupabase.from('recruiter_profiles').insert([
          {
              user_id: userId,
              company_name: formData.get('companyName') as string,
              designation: formData.get('designation') as string,
          }
      ])
      if (recError) {
          console.error("Recruiter profile error", recError)
          return { error: `DB Error (Recruiter): ${recError.message} - Code: ${recError.code}` }
      }
  }

  revalidatePath('/', 'layout')
  redirect(role === 'recruiter' ? '/recruiter/dashboard' : '/jobseeker/dashboard')
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
}

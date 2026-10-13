import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { project_id, github_url, live_url, comments, file_url } = await request.json()

    if (!project_id || (!github_url && !file_url)) {
      return NextResponse.json({ error: 'Must provide either a code link or file upload' }, { status: 400 })
    }

    const { error } = await supabase
      .from('project_submissions')
      .insert({
        project_id,
        candidate_id: user.id,
        github_url,
        live_url,
        comments,
        file_url,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Project Submission Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

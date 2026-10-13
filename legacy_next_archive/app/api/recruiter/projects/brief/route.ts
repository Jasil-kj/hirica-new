import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { project_id, title, description, submission_requirements, deadline } = await request.json()

    if (!project_id || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: projectBrief, error } = await supabase
      .from('project_briefs')
      .upsert({
        id: project_id,
        recruiter_id: user.id,
        title,
        description,
        submission_requirements,
        deadline,
        status: 'published',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, projectBrief })
  } catch (error) {
    console.error('Project Brief Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

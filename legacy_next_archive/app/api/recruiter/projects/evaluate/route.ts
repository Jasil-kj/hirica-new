import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submission_id, result } = await request.json()

    if (!submission_id || !result || !['passed', 'failed'].includes(result)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const { error } = await supabase
      .from('project_submissions')
      .update({
        status: 'evaluated',
        result,
        evaluated_by: user.id,
        evaluated_at: new Date().toISOString()
      })
      .eq('id', submission_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Project Evaluation Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

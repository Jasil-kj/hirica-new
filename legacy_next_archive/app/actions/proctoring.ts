'use server'

import { createClient } from '@/lib/supabase/server'

export async function logProctoringEvent(sessionId: string, eventType: string, eventData: any = {}) {
  const supabase = await createClient()

  // Note: we can skip strict auth check here if we want the event to log quickly, 
  // but let's ensure the user is logged in.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('assessment_events')
    .insert([{
        session_id: sessionId,
        event_type: eventType,
        event_data: eventData
    }])

  if (error) {
      console.error("Proctoring log error:", error)
      return { error: 'Failed to log event' }
  }

  return { success: true }
}

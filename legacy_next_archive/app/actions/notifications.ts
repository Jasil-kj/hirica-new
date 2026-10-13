'use server'

import { createClient } from '@/lib/supabase/server'

export async function createNotification(userId: string, title: string, message: string) {
    const supabase = await createClient()

    // Assuming a generic notifications table exists
    const { error } = await supabase
        .from('notifications')
        .insert([{
            user_id: userId,
            title,
            message,
            read_status: false
        }])
        
    if (error) {
        console.error("Failed to create notification. Check if 'notifications' table exists.", error)
    }
}

export async function getNotifications(userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) {
        return []
    }
    
    return data || []
}

export async function markNotificationsRead(userId: string) {
    const supabase = await createClient()

    await supabase
        .from('notifications')
        .update({ read_status: true })
        .eq('user_id', userId)
}

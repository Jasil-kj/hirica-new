'use client'

import { useState, useEffect } from 'react'
import { Bell, Check } from 'lucide-react'
import { getNotifications, markNotificationsRead } from '@/app/actions/notifications'

type Notification = {
    id: string
    title: string
    message: string
    read_status: boolean
    created_at: string
}

export function NotificationBell({ userId }: { userId: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [hasUnread, setHasUnread] = useState(false)

    useEffect(() => {
        const fetchNotifs = async () => {
            const data = await getNotifications(userId)
            setNotifications(data)
            setHasUnread(data.some(n => !n.read_status))
        }
        
        fetchNotifs()
        
        // Polling every 10s for mock live-updates
        const interval = setInterval(fetchNotifs, 10000)
        return () => clearInterval(interval)
    }, [userId])

    const handleOpen = async () => {
        setIsOpen(!isOpen)
        if (!isOpen && hasUnread) {
            await markNotificationsRead(userId)
            setHasUnread(false)
            setNotifications(prev => prev.map(n => ({...n, read_status: true})))
        }
    }

    return (
        <div className="relative">
            <button 
                onClick={handleOpen}
                className="relative p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
            >
                <Bell className="w-6 h-6" />
                {hasUnread && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                )}
            </button>
            
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden z-50">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-black">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                No new notifications
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read_status ? 'bg-blue-50/30' : ''}`}>
                                    <h4 className="font-bold text-sm text-black mb-1">{n.title}</h4>
                                    <p className="text-xs text-gray-500">{n.message}</p>
                                    <p className="text-[10px] text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

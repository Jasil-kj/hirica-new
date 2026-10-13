'use client'

import { useState } from 'react'
import { submitProject } from '@/app/actions/projects'
import { Link as LinkIcon, Loader2 } from 'lucide-react'

export function ProjectSubmitter({ instanceId }: { instanceId: string }) {
    const [link, setLink] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!link) return
        
        setIsLoading(true)
        await submitProject(instanceId, link)
        setIsLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Submit Project Link</p>
            <div className="flex items-center space-x-2">
                <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="url" 
                        required
                        placeholder="https://github.com/..."
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue outline-none w-48 text-black"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={isLoading || !link}
                    className="bg-brand-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 flex items-center"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
                </button>
            </div>
        </form>
    )
}

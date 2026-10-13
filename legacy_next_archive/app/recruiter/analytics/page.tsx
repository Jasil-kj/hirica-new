import { getRecruiterAnalytics } from '@/app/actions/analytics'
import { Briefcase, Users, FileCheck, TrendingUp, CheckCircle2, XCircle, Clock } from 'lucide-react'

export default async function AnalyticsPage() {
    const data = await getRecruiterAnalytics()
    
    if (!data) return <div>Failed to load analytics or not authenticated.</div>

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-black text-black mb-2">Analytics Overview</h1>
                <p className="text-gray-500">Track your hiring pipeline health and metrics.</p>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Active Jobs</p>
                        <h2 className="text-3xl font-black text-black">{data.activeJobs}</h2>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-brand-blue rounded-xl flex items-center justify-center">
                        <Briefcase className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Total Candidates</p>
                        <h2 className="text-3xl font-black text-black">{data.totalCandidates}</h2>
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Avg Score</p>
                        <h2 className="text-3xl font-black text-black">{data.avgScore}%</h2>
                    </div>
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                        <FileCheck className="w-6 h-6" />
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-brand-navy to-brand-black p-6 rounded-2xl shadow-lg flex items-center justify-between text-white">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Conversion Rate</p>
                        <h2 className="text-3xl font-black text-white">
                            {data.totalCandidates > 0 ? Math.round((data.candidatesByStatus.hired / data.totalCandidates) * 100) : 0}%
                        </h2>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Funnel Breakdown */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-black mb-6">Candidate Pipeline Funnel</h3>
                
                <div className="space-y-6">
                    <div className="flex items-center">
                        <div className="w-32 shrink-0 flex items-center text-gray-600 font-medium text-sm">
                            <Clock className="w-4 h-4 mr-2" /> Applied
                        </div>
                        <div className="flex-1 ml-4 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                            <div 
                                className="absolute top-0 left-0 h-full bg-yellow-400 rounded-full transition-all duration-1000" 
                                style={{ width: `${data.totalCandidates > 0 ? (data.candidatesByStatus.applied / data.totalCandidates) * 100 : 0}%` }}
                            ></div>
                        </div>
                        <div className="w-16 text-right font-bold">{data.candidatesByStatus.applied}</div>
                    </div>
                    
                    <div className="flex items-center">
                        <div className="w-32 shrink-0 flex items-center text-gray-600 font-medium text-sm">
                            <Users className="w-4 h-4 mr-2" /> In Progress
                        </div>
                        <div className="flex-1 ml-4 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                            <div 
                                className="absolute top-0 left-0 h-full bg-brand-blue rounded-full transition-all duration-1000" 
                                style={{ width: `${data.totalCandidates > 0 ? (data.candidatesByStatus.in_progress / data.totalCandidates) * 100 : 0}%` }}
                            ></div>
                        </div>
                        <div className="w-16 text-right font-bold">{data.candidatesByStatus.in_progress}</div>
                    </div>

                    <div className="flex items-center">
                        <div className="w-32 shrink-0 flex items-center text-gray-600 font-medium text-sm">
                            <XCircle className="w-4 h-4 mr-2" /> Rejected
                        </div>
                        <div className="flex-1 ml-4 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                            <div 
                                className="absolute top-0 left-0 h-full bg-red-500 rounded-full transition-all duration-1000" 
                                style={{ width: `${data.totalCandidates > 0 ? (data.candidatesByStatus.rejected / data.totalCandidates) * 100 : 0}%` }}
                            ></div>
                        </div>
                        <div className="w-16 text-right font-bold">{data.candidatesByStatus.rejected}</div>
                    </div>

                    <div className="flex items-center">
                        <div className="w-32 shrink-0 flex items-center text-gray-600 font-medium text-sm">
                            <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Hired
                        </div>
                        <div className="flex-1 ml-4 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                            <div 
                                className="absolute top-0 left-0 h-full bg-green-500 rounded-full transition-all duration-1000" 
                                style={{ width: `${data.totalCandidates > 0 ? (data.candidatesByStatus.hired / data.totalCandidates) * 100 : 0}%` }}
                            ></div>
                        </div>
                        <div className="w-16 text-right font-bold">{data.candidatesByStatus.hired}</div>
                    </div>
                </div>
            </div>
            
        </div>
    )
}

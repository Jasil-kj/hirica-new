import Link from 'next/link'
import { ArrowLeft, Search, Filter, Settings, LayoutDashboard, Video, Users, CheckCircle2 } from 'lucide-react'

export default function ApplicantsPipelinePage() {
  const candidates = [
    { name: 'Arlene McCoy', role: 'Product Designer', img: 5, match: 92, status: 'Shortlisted', color: 'green', applied: '2d ago' },
    { name: 'Cameron Williamson', role: 'Full Stack Developer', img: 11, match: 88, status: 'Shortlisted', color: 'green', applied: '3d ago' },
    { name: 'Leslie Alexander', role: 'UI/UX Designer', img: 9, match: 85, status: 'Shortlisted', color: 'green', applied: '4d ago' },
    { name: 'Robert Fox', role: 'Backend Developer', img: 33, match: 78, status: 'Review', color: 'yellow', applied: '1w ago' },
    { name: 'Wade Warren', role: 'Frontend Developer', img: 12, match: 72, status: 'Review', color: 'yellow', applied: '1w ago' },
    { name: 'Esther Howard', role: 'Product Manager', img: 41, match: 65, status: 'Rejected', color: 'gray', applied: '2w ago' },
  ]

  return (
    <div className="max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <Link href="/recruiter/jobs" className="text-sm font-bold text-gray-500 hover:text-brand-blue flex items-center mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Jobs
          </Link>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-black text-brand-black">Senior Frontend Developer</h1>
            <span className="bg-green-50 text-green-700 border border-green-100 text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Active</span>
          </div>
          <p className="text-sm text-gray-500 font-medium">Engineering • Remote • Full-time</p>
        </div>
        
        <div className="flex space-x-3">
          <button className="bg-white border border-gray-200 text-brand-black px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm flex items-center text-sm">
            <Settings className="w-4 h-4 mr-2 text-gray-500" /> Edit Job
          </button>
          <button className="bg-brand-blue text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-[0_4px_14px_0_rgba(0,118,255,0.39)] flex items-center text-sm">
            Share Job
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center mr-4">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-xl text-brand-black">124</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Applications</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center shadow-sm">
          <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mr-4">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-xl text-brand-black">45</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI Shortlisted</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center shadow-sm">
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mr-4">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-xl text-brand-black">82%</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Match Accuracy</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center shadow-sm">
          <div className="w-10 h-10 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center mr-4">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-xl text-brand-black">12</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Interviews Scheduled</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4 bg-gray-50/50">
          <div className="flex space-x-2">
            <button className="bg-white border-2 border-brand-blue text-brand-blue px-4 py-2 rounded-lg font-bold text-sm shadow-sm">
              All Candidates
            </button>
            <button className="bg-transparent text-gray-500 hover:text-brand-black hover:bg-gray-100 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
              Shortlisted
            </button>
            <button className="bg-transparent text-gray-500 hover:text-brand-black hover:bg-gray-100 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
              Interviewing
            </button>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input type="text" placeholder="Search candidates..." className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-brand-blue focus:ring-0 w-full md:w-64" />
            </div>
            <button className="bg-white border border-gray-200 p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-brand-black transition-colors shadow-sm">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Premium Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Candidate</th>
                <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Match Score</th>
                <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 hidden md:table-cell">Skills</th>
                <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 hidden sm:table-cell">Applied</th>
                <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {candidates.map((c, i) => (
                <tr key={i} className="bg-white hover:bg-gray-50/80 transition-colors group cursor-pointer">
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <img src={`https://i.pravatar.cc/100?img=${c.img}`} className="w-10 h-10 rounded-full mr-4 border border-gray-100 shadow-sm" />
                      <div>
                        <p className="text-sm font-bold text-brand-black group-hover:text-brand-blue transition-colors">{c.name}</p>
                        <p className="text-xs text-gray-500 font-medium">{c.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <span className="text-sm font-black text-brand-black mr-3 w-8">{c.match}%</span>
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div className={`h-full rounded-full transition-all duration-1000 ${c.match > 80 ? 'bg-green-500' : c.match > 70 ? 'bg-yellow-400' : 'bg-gray-400'}`} style={{ width: `${c.match}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 hidden md:table-cell">
                     <div className="flex space-x-1.5">
                        <div className="w-6 h-6 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-600">Re</div>
                        <div className="w-6 h-6 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-600">Ts</div>
                        <div className="w-6 h-6 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-600">Nx</div>
                     </div>
                  </td>
                  <td className="py-4 px-6 hidden sm:table-cell text-sm text-gray-500 font-medium">
                    {c.applied}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      c.color === 'green' ? 'bg-green-50 text-green-700 border border-green-100' : 
                      c.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : 
                      'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center text-sm text-gray-500 font-medium">
          <p>Showing 1 to 6 of 124 candidates</p>
          <div className="flex space-x-1">
            <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <button className="px-3 py-1 border border-brand-blue bg-brand-blue text-white rounded-md">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50">2</button>
            <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50">3</button>
            <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50">Next</button>
          </div>
        </div>

      </div>
    </div>
  )
}

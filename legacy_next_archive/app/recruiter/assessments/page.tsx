import Link from 'next/link'
import { Search, Filter, ShieldCheck, PlayCircle, Users, CheckCircle2, Clock } from 'lucide-react'

export default function AssessmentsPage() {
  const activeAssessments = [
    { id: '1', title: 'Frontend Developer Screen', candidate: 'Arlene McCoy', candidateImg: 5, score: 92, status: 'Live', time: '00:25:13 / 60:00' },
    { id: '2', title: 'Backend Architecture Test', candidate: 'Cameron Williamson', candidateImg: 11, score: 88, status: 'Completed', time: '58:12 / 60:00' },
    { id: '3', title: 'UI/UX Design Challenge', candidate: 'Leslie Alexander', candidateImg: 9, score: 45, status: 'Flagged', time: '14:22 / 60:00' },
  ]

  return (
    <div className="max-w-7xl mx-auto pb-12">
      
      <div className="flex justify-between items-end mb-10">
        <div>
          <p className="text-brand-blue font-bold text-xs tracking-widest uppercase mb-2">Evaluation</p>
          <h1 className="text-3xl font-black text-brand-black">AI Assessments</h1>
        </div>
        <button className="bg-brand-black text-white px-6 py-2.5 rounded-full font-bold hover:bg-gray-800 transition-colors flex items-center shadow-lg">
          <ShieldCheck className="w-4 h-4 mr-2 text-brand-blue" /> Create Assessment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
             <div className="w-10 h-10 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center">
               <PlayCircle className="w-5 h-5" />
             </div>
             <span className="text-xs font-bold text-brand-blue bg-blue-50 px-2 py-1 rounded-md">12 Active</span>
          </div>
          <div>
            <p className="text-3xl font-black text-brand-black mb-1">128</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Tests Taken</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
             <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
               <ShieldCheck className="w-5 h-5" />
             </div>
             <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">94%</span>
          </div>
          <div>
            <p className="text-3xl font-black text-brand-black mb-1">Low Risk</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Integrity Score</p>
          </div>
        </div>

        <div className="bg-brand-blue rounded-2xl shadow-lg shadow-blue-500/30 p-6 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
             <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
               <CheckCircle2 className="w-5 h-5 text-white" />
             </div>
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-black mb-1">8</p>
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Requires Review (Flagged)</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-gray-100 p-8 mb-8">
        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-brand-black">Live & Recent Assessments</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 bg-gray-50 border-transparent rounded-lg text-sm focus:border-brand-blue focus:bg-white focus:ring-0 w-full md:w-48 transition-colors" />
            </div>
            <button className="bg-gray-50 border-transparent p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-black transition-colors shadow-sm">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {activeAssessments.map((assessment) => (
            <div key={assessment.id} className="border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow group flex flex-col lg:flex-row gap-6 items-center">
              
              <div className="flex-1 w-full">
                <div className="flex justify-between items-start mb-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    assessment.status === 'Live' ? 'bg-green-50 text-green-700 border border-green-100' :
                    assessment.status === 'Completed' ? 'bg-blue-50 text-brand-blue border border-blue-100' :
                    'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    {assessment.status === 'Live' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>}
                    {assessment.status}
                  </span>
                  <div className="flex items-center text-xs font-bold text-gray-400">
                    <Clock className="w-3.5 h-3.5 mr-1" /> {assessment.time}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-brand-black mb-1">{assessment.title}</h3>
                
                <div className="flex items-center mt-4">
                  <img src={`https://i.pravatar.cc/100?img=${assessment.candidateImg}`} className="w-8 h-8 rounded-full mr-3 border border-gray-100 shadow-sm" />
                  <div>
                    <p className="text-sm font-bold text-brand-black">{assessment.candidate}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Candidate</p>
                  </div>
                </div>
              </div>

              {/* Integrity Score Widget from Mockup */}
              <div className="w-full lg:w-64 bg-gray-50/50 rounded-xl border border-gray-100 p-4 flex flex-col items-center justify-center shrink-0">
                <p className="text-xs font-bold text-gray-500 self-start mb-2">Integrity Score</p>
                <div className="relative w-20 h-20 flex items-center justify-center mb-1">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-gray-200" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className={`${assessment.score > 80 ? 'text-green-500' : assessment.score > 60 ? 'text-yellow-500' : 'text-red-500'}`} strokeWidth="4" strokeDasharray={`${assessment.score}, 100`} stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-xl font-black text-black leading-none">{assessment.score}</p>
                  </div>
                </div>
                <p className={`text-[10px] font-bold ${assessment.score > 80 ? 'text-green-500' : assessment.score > 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {assessment.score > 80 ? 'Low Risk' : assessment.score > 60 ? 'Medium Risk' : 'High Risk!'}
                </p>
              </div>

              <div className="shrink-0 flex items-center w-full lg:w-auto mt-4 lg:mt-0">
                <button className="w-full lg:w-auto bg-white border-2 border-brand-blue text-brand-blue px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-sm whitespace-nowrap">
                  View Report
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

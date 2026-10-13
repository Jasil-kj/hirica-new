'use client'

import { useState } from 'react'
import { createJob, generateAIJobDescription } from '@/app/actions/jobs'
import { Loader2, Sparkles, Briefcase, DollarSign, Award, Tag, Code } from 'lucide-react'

export function JobForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAiGenerating, setIsAiGenerating] = useState(false)

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('Remote / Calicut')
  const [workMode, setWorkMode] = useState('Remote')
  const [employmentType, setEmploymentType] = useState('Full-time')
  const [experienceLevel, setExperienceLevel] = useState('Mid-Senior Level (3-5 yrs)')
  const [salaryRange, setSalaryRange] = useState('$90,000 - $130,000 / yr')
  const [skills, setSkills] = useState('React, TypeScript, Node.js, PostgreSQL, System Design')
  const [assessmentFocus, setAssessmentFocus] = useState('Balanced (Coding + Technical + Logic)')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')

  const handleAiGenerate = async () => {
    if (!title.trim()) {
      setError("Please enter a Job Title first (e.g. 'Senior Full Stack Engineer').")
      return
    }
    setError(null)
    setIsAiGenerating(true)

    const res = await generateAIJobDescription(title, experienceLevel, skills)
    setIsAiGenerating(false)

    if (res?.success) {
      if (res.description) setDescription(res.description)
      if (res.requirements) setRequirements(res.requirements)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    try {
        const result = await createJob(formData)
        if (result?.error) {
            setError(result.error)
        }
    } catch (err: any) {
        if (err?.message === 'NEXT_REDIRECT' || err?.message?.includes('REDIRECT')) {
            throw err
        }
        setError(err?.message || "An unexpected error occurred.")
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100 max-w-3xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-gray-100">
        <div>
          <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-3 py-1 rounded-full tracking-widest">
            LinkedIn & Indeed Style Job Studio
          </span>
          <h2 className="text-3xl font-black text-gray-900 mt-2">Create Job & AI Assessment Blueprint</h2>
          <p className="text-xs text-gray-500 mt-1">
            Job specifications directly calibrate the AI Question Generator and Candidate Evaluation engine.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAiGenerate}
          disabled={isAiGenerating}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center shadow-lg shadow-purple-500/20 transition shrink-0 disabled:opacity-50"
        >
          {isAiGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          AI Auto-Generate JD
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Title */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center">
            <Briefcase className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Job Title
          </label>
          <input 
            name="title"
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-sm font-medium"
            placeholder="e.g. Senior Full Stack Engineer"
          />
        </div>

        {/* Work Mode & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Work Mode</label>
            <select 
              name="workMode" 
              value={workMode} 
              onChange={(e) => setWorkMode(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-sm font-medium"
            >
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Location</label>
            <input 
              name="location"
              type="text" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-sm font-medium"
              placeholder="Calicut / Bengaluru / Remote"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Employment Type</label>
            <select 
              name="employmentType" 
              value={employmentType} 
              onChange={(e) => setEmploymentType(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-sm font-medium"
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
        </div>

        {/* Experience Level & Salary Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center">
              <Award className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Experience Level
            </label>
            <select 
              name="experienceLevel" 
              value={experienceLevel} 
              onChange={(e) => setExperienceLevel(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-sm font-medium"
            >
              <option value="Entry Level (0-2 yrs)">Entry Level (0-2 yrs)</option>
              <option value="Mid-Senior Level (3-5 yrs)">Mid-Senior Level (3-5 yrs)</option>
              <option value="Senior / Lead Level (5+ yrs)">Senior / Lead Level (5+ yrs)</option>
              <option value="Executive / Director">Executive / Director</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center">
              <DollarSign className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Salary Range
            </label>
            <input 
              name="salaryRange"
              type="text" 
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-sm font-medium"
              placeholder="$90,000 - $130,000 / yr or ₹12 - ₹20 LPA"
            />
          </div>
        </div>

        {/* Technical Skills & AI Blueprint Calibration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center">
              <Tag className="w-3.5 h-3.5 mr-1.5 text-purple-600" /> Key Technical Skills (Affects AI Questions)
            </label>
            <input 
              name="skills"
              type="text" 
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              required 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-sm font-medium"
              placeholder="React, TypeScript, Node.js, PostgreSQL"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center">
              <Code className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> AI Assessment Test Focus
            </label>
            <select 
              name="assessmentFocus" 
              value={assessmentFocus} 
              onChange={(e) => setAssessmentFocus(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-sm font-medium"
            >
              <option value="Balanced (Coding + Technical + Logic)">Balanced (Coding + Technical + Logic)</option>
              <option value="Deep Coding & Algorithm Challenge">Deep Coding & Algorithm Challenge</option>
              <option value="System Design & Architecture">System Design & Architecture</option>
              <option value="Aptitude & Problem Solving">Aptitude & Problem Solving</option>
            </select>
          </div>
        </div>

        {/* Detailed JD */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Job Description & Responsibilities
          </label>
          <textarea 
            name="description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-sm"
            placeholder="Describe role responsibilities, team structure, and projects..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Core Qualifications & Requirements
          </label>
          <textarea 
            name="requirements"
            rows={4}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            required 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-sm"
            placeholder="List degree, years of experience, and specific tech stack requirements..."
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-70 shadow-lg shadow-blue-500/30 text-base"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Job & Calibrate AI Blueprint →'}
        </button>
      </form>
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { updateWorkflowStages } from '@/app/actions/workflows'
import { GripVertical, Plus, Trash2, ArrowRight, Loader2, Save } from 'lucide-react'

type Stage = {
  id?: string
  name: string
  stage_type: string
}

type Props = {
  workflowId: string
  initialStages: Stage[]
  jobId: string
}

export function WorkflowBuilder({ workflowId, initialStages, jobId }: Props) {
  const [stages, setStages] = useState<Stage[]>(
    initialStages.length > 0 ? initialStages : [{ name: 'Application Review', stage_type: 'application' }]
  )
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAddStage = (type: string, name: string) => {
    setStages([...stages, { name, stage_type: type }])
  }

  const handleRemoveStage = (index: number) => {
    // Prevent removing the first application stage
    if (index === 0) return
    const newStages = [...stages]
    newStages.splice(index, 1)
    setStages(newStages)
  }

  const handleSave = async () => {
    setIsLoading(true)
    setMessage('')
    try {
        const result = await updateWorkflowStages(workflowId, stages)
        if (result?.error) {
            setMessage(result.error)
        } else {
            setMessage('Workflow saved successfully!')
        }
    } catch (e) {
        setMessage('Unexpected error occurred.')
    } finally {
        setIsLoading(false)
    }
  }

  const stageIcons: Record<string, React.ReactNode> = {
      application: <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold">1</div>,
      assessment: <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">A</div>,
      interview: <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold">I</div>,
      project: <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold">P</div>,
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-black">Hiring Pipeline</h2>
            <p className="text-sm text-gray-500">Define the stages candidates will go through.</p>
        </div>
        <button 
            onClick={handleSave}
            disabled={isLoading}
            className="bg-brand-black text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center disabled:opacity-70"
        >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Pipeline
        </button>
      </div>

      {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${message.includes('success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {message}
          </div>
      )}

      {/* The Timeline */}
      <div className="space-y-4 mb-10">
          {stages.map((stage, idx) => (
              <div key={idx} className="flex items-center group relative">
                  {/* Timeline connector line */}
                  {idx !== stages.length - 1 && (
                      <div className="absolute left-[31px] top-12 bottom-[-16px] w-0.5 bg-gray-200"></div>
                  )}
                  
                  <div className="mr-4 text-gray-300 cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-5 h-5" />
                  </div>
                  
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-gray-50 shadow-sm flex items-center justify-center z-10 flex-shrink-0">
                      {stageIcons[stage.stage_type]}
                  </div>
                  
                  <div className="ml-4 flex-1 bg-gray-50 border border-gray-100 rounded-xl p-4 flex justify-between items-center transition-colors group-hover:border-gray-200">
                      <div>
                          <p className="font-bold text-black">{stage.name}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">{stage.stage_type}</p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                          {stage.stage_type === 'assessment' && stage.id && (
                              <a href={`/recruiter/jobs/${jobId}/stages/${stage.id}/config`} className="text-xs font-bold text-brand-blue hover:underline bg-blue-50 px-3 py-1.5 rounded-full">
                                  Configure
                              </a>
                          )}
                          {idx !== 0 && (
                              <button onClick={() => handleRemoveStage(idx)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          ))}
      </div>

      {/* Add new stage buttons */}
      <div className="border-t border-gray-100 pt-6">
          <p className="text-xs font-bold text-gray-400 uppercase mb-4">Add a new stage</p>
          <div className="flex flex-wrap gap-3">
              <button 
                  onClick={() => handleAddStage('assessment', 'AI Assessment')}
                  className="flex items-center bg-blue-50 text-blue-600 border border-blue-100 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors"
              >
                  <Plus className="w-4 h-4 mr-2" /> Assessment
              </button>
              <button 
                  onClick={() => handleAddStage('interview', 'Technical Interview')}
                  className="flex items-center bg-purple-50 text-purple-600 border border-purple-100 px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-100 transition-colors"
              >
                  <Plus className="w-4 h-4 mr-2" /> Interview
              </button>
              <button 
                  onClick={() => handleAddStage('project', 'Take-home Project')}
                  className="flex items-center bg-orange-50 text-orange-600 border border-orange-100 px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-100 transition-colors"
              >
                  <Plus className="w-4 h-4 mr-2" /> Project
              </button>
          </div>
      </div>
    </div>
  )
}

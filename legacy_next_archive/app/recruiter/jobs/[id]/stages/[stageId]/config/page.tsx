import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AssessmentConfigForm } from '@/components/assessments/AssessmentConfigForm'
import { QuestionBank } from '@/components/assessments/QuestionBank'

export default async function ConfigStagePage({ params }: { params: { id: string, stageId: string } }) {
  const supabase = await createClient()

  // Await the params properly as Next.js 15+ sometimes requires it
  const { id, stageId } = await Promise.resolve(params);

  // Fetch stage name and existing config
  const { data: stage } = await supabase
    .from('workflow_stages')
    .select('name, stage_type')
    .eq('id', stageId)
    .single()

  if (!stage || stage.stage_type !== 'assessment') {
      return <div>Invalid stage type for this configuration.</div>
  }

  const { data: existingConfig } = await supabase
    .from('assessment_configs')
    .select('*')
    .eq('stage_id', stageId)
    .single()

  // Fetch latest assessment version and its questions
  const { data: version } = await supabase
    .from('assessment_versions')
    .select('id')
    .eq('stage_id', stageId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()
    
  let questions = []
  if (version) {
      const { data: qData } = await supabase
        .from('questions')
        .select(`
            *,
            question_options (*)
        `)
        .eq('assessment_version_id', version.id)
      
      questions = qData || []
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <Link href={`/recruiter/jobs/${id}/workflow`} className="text-sm font-bold text-brand-blue flex items-center hover:underline">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pipeline
            </Link>
        </div>
        
        <AssessmentConfigForm stageId={stageId} jobId={id} existingConfig={existingConfig} />
        
        {existingConfig && (
            <QuestionBank stageId={stageId} jobId={id} questions={questions} />
        )}
      </div>
    </div>
  )
}

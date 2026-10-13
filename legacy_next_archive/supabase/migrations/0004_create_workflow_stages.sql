-- Create workflow_stages table
CREATE TABLE public.workflow_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES public.hiring_workflows(id) ON DELETE CASCADE,
  stage_order int NOT NULL,
  stage_name text NOT NULL,
  stage_type text NOT NULL CHECK (stage_type IN (
    'assessment', 'technical_interview', 'hr_interview',
    'ai_technical_interview', 'ai_hr_interview',
    'recruiter_interview', 'project_assignment',
    'final_review', 'custom'
  )),
  config jsonb DEFAULT '{}'::jsonb,
  pass_score numeric,
  retry_allowed boolean DEFAULT false,
  max_retries int DEFAULT 1,
  permission_mode text DEFAULT 'automatic' CHECK (permission_mode IN ('automatic', 'manual')),
  progression_mode text DEFAULT 'automatic' CHECK (progression_mode IN ('automatic', 'manual')),
  monitoring_enabled boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workflow_stages ENABLE ROW LEVEL SECURITY;

-- Workflow Stages Policies
CREATE POLICY "Recruiters can view stages for their workflows." 
  ON public.workflow_stages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.hiring_workflows hw
      JOIN public.jobs j ON j.id = hw.job_id
      WHERE hw.id = public.workflow_stages.workflow_id AND j.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can modify stages for their workflows." 
  ON public.workflow_stages FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.hiring_workflows hw
      JOIN public.jobs j ON j.id = hw.job_id
      WHERE hw.id = public.workflow_stages.workflow_id AND j.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can view stages for published jobs." 
  ON public.workflow_stages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.hiring_workflows hw
      JOIN public.jobs j ON j.id = hw.job_id
      WHERE hw.id = public.workflow_stages.workflow_id AND j.status = 'published'
    )
  );

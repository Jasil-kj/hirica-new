-- Create applications table
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'received' CHECK (status IN (
    'received', 'reviewing', 'in_pipeline',
    'hired', 'rejected', 'withdrawn', 'on_hold'
  )),
  cover_letter text,
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (job_id, candidate_id)
);

-- Create candidate_stage_instances table
CREATE TABLE public.candidate_stage_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES public.workflow_stages(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN (
    'pending', 'awaiting_approval', 'approved',
    'in_progress', 'submitted', 'evaluating',
    'passed', 'failed', 'retry_requested',
    'retry_approved', 'skipped', 'rejected'
  )),
  attempt_number int DEFAULT 1,
  started_at timestamptz,
  completed_at timestamptz,
  result_summary jsonb,
  recruiter_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stage_history table
CREATE TABLE public.stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_instance_id uuid REFERENCES public.candidate_stage_instances(id) ON DELETE CASCADE,
  from_status text,
  to_status text,
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  change_reason text,
  changed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_stage_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_history ENABLE ROW LEVEL SECURITY;

-- Applications Policies
CREATE POLICY "Candidates can view their own applications." 
  ON public.applications FOR SELECT 
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates can insert their own applications." 
  ON public.applications FOR INSERT 
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidates can update their own applications (e.g. withdraw)." 
  ON public.applications FOR UPDATE 
  USING (auth.uid() = candidate_id);

CREATE POLICY "Recruiters can view applications for their jobs." 
  ON public.applications FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs WHERE id = public.applications.job_id AND recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can update applications for their jobs." 
  ON public.applications FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs WHERE id = public.applications.job_id AND recruiter_id = auth.uid()
    )
  );

-- Candidate Stage Instances Policies
CREATE POLICY "Candidates can view their own stage instances." 
  ON public.candidate_stage_instances FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = public.candidate_stage_instances.application_id AND a.candidate_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can update their own stage instances." 
  ON public.candidate_stage_instances FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = public.candidate_stage_instances.application_id AND a.candidate_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can view stage instances for their jobs." 
  ON public.candidate_stage_instances FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.id = public.candidate_stage_instances.application_id AND j.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can modify stage instances for their jobs." 
  ON public.candidate_stage_instances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.id = public.candidate_stage_instances.application_id AND j.recruiter_id = auth.uid()
    )
  );

-- Stage History Policies
CREATE POLICY "Recruiters can view stage history for their jobs." 
  ON public.stage_history FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.candidate_stage_instances csi
      JOIN public.applications a ON a.id = csi.application_id
      JOIN public.jobs j ON j.id = a.job_id
      WHERE csi.id = public.stage_history.stage_instance_id AND j.recruiter_id = auth.uid()
    )
  );

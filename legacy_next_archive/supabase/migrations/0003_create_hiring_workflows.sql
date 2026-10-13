-- Create hiring_workflows table
CREATE TABLE public.hiring_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE UNIQUE,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hiring_workflows ENABLE ROW LEVEL SECURITY;

-- Hiring Workflows Policies
CREATE POLICY "Recruiters can view workflows for their jobs." 
  ON public.hiring_workflows FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs WHERE id = public.hiring_workflows.job_id AND recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can insert workflows for their jobs." 
  ON public.hiring_workflows FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs WHERE id = public.hiring_workflows.job_id AND recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can update workflows for their jobs." 
  ON public.hiring_workflows FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs WHERE id = public.hiring_workflows.job_id AND recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can view workflows for jobs they applied to." 
  ON public.hiring_workflows FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs WHERE id = public.hiring_workflows.job_id AND status = 'published'
    )
  );

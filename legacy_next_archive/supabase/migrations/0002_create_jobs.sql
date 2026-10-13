-- Create jobs table
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  department text,
  description text,
  responsibilities text,
  required_skills text[],
  preferred_skills text[],
  experience_level text,
  education text,
  location text,
  work_mode text CHECK (work_mode IN ('remote', 'onsite', 'hybrid')),
  employment_type text,
  salary_min numeric,
  salary_max numeric,
  openings int DEFAULT 1,
  deadline timestamptz,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  ai_generated boolean DEFAULT false,
  keywords text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Jobs Policies
CREATE POLICY "Anyone can view published jobs." 
  ON public.jobs FOR SELECT 
  USING (status = 'published');

CREATE POLICY "Recruiters can view all their own jobs." 
  ON public.jobs FOR SELECT 
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can insert their own jobs." 
  ON public.jobs FOR INSERT 
  WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can update their own jobs." 
  ON public.jobs FOR UPDATE 
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can delete their own jobs." 
  ON public.jobs FOR DELETE 
  USING (auth.uid() = recruiter_id);

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('recruiter', 'candidate')),
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create recruiter_profiles table
CREATE TABLE public.recruiter_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name text,
  company_website text,
  company_size text,
  industry text,
  designation text,
  created_at timestamptz DEFAULT now()
);

-- Create candidate_profiles table
CREATE TABLE public.candidate_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline text,
  summary text,
  github_url text,
  linkedin_url text,
  portfolio_url text,
  resume_url text,
  skills text[],
  experience_years int,
  location text,
  created_at timestamptz DEFAULT now()
);

-- Create candidate_education table
CREATE TABLE public.candidate_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  institution text,
  degree text,
  field text,
  start_year int,
  end_year int,
  grade text
);

-- Create candidate_experience table
CREATE TABLE public.candidate_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  company text,
  role text,
  start_date date,
  end_date date,
  is_current boolean DEFAULT false,
  description text
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_experience ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile." 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Recruiters can view candidate profiles they interact with." 
  ON public.profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'recruiter'
    ) 
    AND role = 'candidate'
  );

CREATE POLICY "Users can update their own profile." 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Recruiter Profiles Policies
CREATE POLICY "Recruiters can view their own recruiter profile." 
  ON public.recruiter_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Recruiters can update their own recruiter profile." 
  ON public.recruiter_profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Candidate Profiles Policies
CREATE POLICY "Candidates can view their own candidate profile." 
  ON public.candidate_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Candidates can update their own candidate profile." 
  ON public.candidate_profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Recruiters can view candidate profiles." 
  ON public.candidate_profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'recruiter'
    )
  );

-- Candidate Education Policies
CREATE POLICY "Candidates can view their own education." 
  ON public.candidate_education FOR SELECT 
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates can update their own education." 
  ON public.candidate_education FOR UPDATE 
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates can insert their own education." 
  ON public.candidate_education FOR INSERT 
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidates can delete their own education." 
  ON public.candidate_education FOR DELETE 
  USING (auth.uid() = candidate_id);

CREATE POLICY "Recruiters can view candidate education." 
  ON public.candidate_education FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'recruiter'
    )
  );

-- Candidate Experience Policies
CREATE POLICY "Candidates can view their own experience." 
  ON public.candidate_experience FOR SELECT 
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates can update their own experience." 
  ON public.candidate_experience FOR UPDATE 
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates can insert their own experience." 
  ON public.candidate_experience FOR INSERT 
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidates can delete their own experience." 
  ON public.candidate_experience FOR DELETE 
  USING (auth.uid() = candidate_id);

CREATE POLICY "Recruiters can view candidate experience." 
  ON public.candidate_experience FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'recruiter'
    )
  );

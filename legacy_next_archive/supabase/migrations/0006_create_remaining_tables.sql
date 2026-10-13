-- Create assessment_configs table
CREATE TABLE public.assessment_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid REFERENCES public.workflow_stages(id) ON DELETE CASCADE UNIQUE,
  config_mode text DEFAULT 'automatic' CHECK (config_mode IN ('automatic', 'manual')),
  total_questions int,
  duration_minutes int,
  pass_score numeric,
  config_detail jsonb DEFAULT '{}'::jsonb,
  ai_generated boolean DEFAULT false,
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create assessment_versions table
CREATE TABLE public.assessment_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid REFERENCES public.workflow_stages(id) ON DELETE CASCADE,
  version_number int DEFAULT 1,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'archived')),
  total_pool_size int,
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_version_id uuid REFERENCES public.assessment_versions(id) ON DELETE CASCADE,
  category text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('mcq', 'coding', 'written', 'true_false', 'fill_blank')),
  question_text text NOT NULL,
  options jsonb,
  correct_answer text,
  expected_output text,
  test_cases jsonb,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  time_seconds int,
  skill_tags text[],
  validation_status text DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'failed_validation', 'approved', 'rejected')),
  usage_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create question_options table
CREATE TABLE public.question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text text,
  is_correct boolean DEFAULT false,
  display_order int
);

-- Create candidate_assessments table
CREATE TABLE public.candidate_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_instance_id uuid REFERENCES public.candidate_stage_instances(id) ON DELETE CASCADE,
  assessment_version_id uuid REFERENCES public.assessment_versions(id) ON DELETE CASCADE,
  question_ids uuid[],
  randomization_seed text,
  created_at timestamptz DEFAULT now()
);

-- Create assessment_sessions table
CREATE TABLE public.assessment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_assessment_id uuid REFERENCES public.candidate_assessments(id) ON DELETE CASCADE,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'system_check', 'disclosed', 'in_progress', 'paused', 'submitted', 'expired')),
  server_start_time timestamptz,
  server_end_time timestamptz,
  duration_seconds int,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create answers table
CREATE TABLE public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text text,
  selected_option_id uuid REFERENCES public.question_options(id) ON DELETE SET NULL,
  code_submission text,
  time_taken_seconds int,
  saved_at timestamptz DEFAULT now()
);

-- Create coding_submissions table
CREATE TABLE public.coding_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id uuid REFERENCES public.answers(id) ON DELETE CASCADE,
  language text,
  code text,
  test_results jsonb,
  passed_cases int,
  total_cases int,
  runtime_ms int,
  memory_kb int,
  status text,
  executed_at timestamptz DEFAULT now()
);

-- Create evaluation_results table
CREATE TABLE public.evaluation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_instance_id uuid REFERENCES public.candidate_stage_instances(id) ON DELETE CASCADE,
  total_score numeric,
  max_score numeric,
  percentage numeric,
  passed boolean,
  category_scores jsonb,
  timing_analysis jsonb,
  integrity_score numeric,
  integrity_level text CHECK (integrity_level IN ('normal', 'low_concern', 'moderate_concern', 'high_concern')),
  strengths text[],
  weaknesses text[],
  recommendation text,
  ai_summary text,
  evaluated_at timestamptz DEFAULT now()
);

-- Create evaluation_items table
CREATE TABLE public.evaluation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid REFERENCES public.evaluation_results(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
  is_correct boolean,
  score_awarded numeric,
  max_score numeric,
  ai_feedback text,
  code_quality jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create monitoring_events table
CREATE TABLE public.monitoring_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_instance_id uuid REFERENCES public.candidate_stage_instances(id) ON DELETE CASCADE,
  session_id uuid,
  event_type text NOT NULL,
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence numeric,
  duration_seconds numeric,
  source text,
  metadata jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Create integrity_scores table
CREATE TABLE public.integrity_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_instance_id uuid REFERENCES public.candidate_stage_instances(id) ON DELETE CASCADE,
  overall_score numeric,
  integrity_level text CHECK (integrity_level IN ('normal', 'low_concern', 'moderate_concern', 'high_concern')),
  event_summary jsonb,
  reviewer_decision text,
  reviewer_note text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  calculated_at timestamptz DEFAULT now()
);

-- Create interview_configs table
CREATE TABLE public.interview_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid REFERENCES public.workflow_stages(id) ON DELETE CASCADE UNIQUE,
  interview_mode text CHECK (interview_mode IN ('recruiter_led', 'ai_led', 'ai_assisted')),
  duration_minutes int,
  domains text[],
  question_count int,
  difficulty text,
  pass_score numeric,
  monitoring_enabled boolean DEFAULT true,
  recording_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create interview_sessions table
CREATE TABLE public.interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_instance_id uuid REFERENCES public.candidate_stage_instances(id) ON DELETE CASCADE,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'system_check', 'in_progress', 'completed', 'cancelled', 'no_show')),
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  meeting_url text,
  recording_url text,
  created_at timestamptz DEFAULT now()
);

-- Create interview_questions table
CREATE TABLE public.interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  question_text text,
  question_type text,
  domain text,
  difficulty text,
  order_in_session int,
  asked_at timestamptz DEFAULT now()
);

-- Create interview_responses table
CREATE TABLE public.interview_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES public.interview_questions(id) ON DELETE CASCADE,
  response_text text,
  response_duration_seconds int,
  ai_score numeric,
  ai_feedback text,
  recorded_at timestamptz DEFAULT now()
);

-- Create interview_evaluations table
CREATE TABLE public.interview_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  technical_score numeric,
  communication_score numeric,
  problem_solving_score numeric,
  depth_score numeric,
  domain_scores jsonb,
  overall_score numeric,
  passed boolean,
  strengths text[],
  concerns text[],
  recommendation text,
  ai_summary text,
  evaluator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  evaluated_at timestamptz DEFAULT now()
);

-- Create project_submissions table
CREATE TABLE public.project_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_instance_id uuid REFERENCES public.candidate_stage_instances(id) ON DELETE CASCADE,
  github_url text,
  deployed_url text,
  file_url text,
  description text,
  submitted_at timestamptz DEFAULT now()
);

-- Create retry_requests table
CREATE TABLE public.retry_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_instance_id uuid REFERENCES public.candidate_stage_instances(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text,
  body text,
  data jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create ai_generation_logs table
CREATE TABLE public.ai_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text,
  input_prompt text,
  output_raw text,
  output_parsed jsonb,
  model_used text,
  tokens_used int,
  success boolean,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text,
  resource_type text,
  resource_id uuid,
  before_state jsonb,
  after_state jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for all
ALTER TABLE public.assessment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retry_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Add Indexes to optimize RLS queries and general lookups

CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON public.jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_hiring_workflows_job_id ON public.hiring_workflows(job_id);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_workflow_id ON public.workflow_stages(workflow_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON public.applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_stage_instances_app_id ON public.candidate_stage_instances(application_id);
CREATE INDEX IF NOT EXISTS idx_candidate_stage_instances_stage_id ON public.candidate_stage_instances(stage_id);
CREATE INDEX IF NOT EXISTS idx_assessment_versions_stage_id ON public.assessment_versions(stage_id);
CREATE INDEX IF NOT EXISTS idx_questions_assessment_version_id ON public.questions(assessment_version_id);
CREATE INDEX IF NOT EXISTS idx_candidate_assessments_stage_instance_id ON public.candidate_assessments(stage_instance_id);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_candidate_assessment_id ON public.assessment_sessions(candidate_assessment_id);
CREATE INDEX IF NOT EXISTS idx_answers_session_id ON public.answers(session_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_results_stage_instance_id ON public.evaluation_results(stage_instance_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_stage_instance_id ON public.monitoring_events(stage_instance_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_stage_instance_id ON public.interview_sessions(stage_instance_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_stage_instance_id ON public.project_submissions(stage_instance_id);

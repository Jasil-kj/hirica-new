-- Add RLS Policies for tables created in 0006

-- Assessment Configs
CREATE POLICY "Recruiters can manage assessment configs for their stages"
  ON public.assessment_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_stages ws
      JOIN public.hiring_workflows hw ON ws.workflow_id = hw.id
      JOIN public.jobs j ON hw.job_id = j.id
      WHERE ws.id = public.assessment_configs.stage_id AND j.recruiter_id = auth.uid()
    )
  );

-- Assessment Versions
CREATE POLICY "Recruiters can manage assessment versions for their stages"
  ON public.assessment_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_stages ws
      JOIN public.hiring_workflows hw ON ws.workflow_id = hw.id
      JOIN public.jobs j ON hw.job_id = j.id
      WHERE ws.id = public.assessment_versions.stage_id AND j.recruiter_id = auth.uid()
    )
  );

-- Questions
CREATE POLICY "Recruiters can manage questions for their assessments"
  ON public.questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_versions av
      JOIN public.workflow_stages ws ON av.stage_id = ws.id
      JOIN public.hiring_workflows hw ON ws.workflow_id = hw.id
      JOIN public.jobs j ON hw.job_id = j.id
      WHERE av.id = public.questions.assessment_version_id AND j.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can view questions in their active assessment"
  ON public.questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.candidate_assessments ca
      JOIN public.assessment_sessions sess ON sess.candidate_assessment_id = ca.id
      JOIN public.candidate_stage_instances csi ON ca.stage_instance_id = csi.id
      JOIN public.applications app ON csi.application_id = app.id
      WHERE ca.assessment_version_id = public.questions.assessment_version_id 
        AND app.candidate_id = auth.uid() 
        AND sess.status = 'in_progress'
        AND public.questions.id = ANY(ca.question_ids)
    )
  );

-- Question Options
CREATE POLICY "Recruiters can manage question options"
  ON public.question_options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.assessment_versions av ON q.assessment_version_id = av.id
      JOIN public.workflow_stages ws ON av.stage_id = ws.id
      JOIN public.hiring_workflows hw ON ws.workflow_id = hw.id
      JOIN public.jobs j ON hw.job_id = j.id
      WHERE q.id = public.question_options.question_id AND j.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can view question options for their active assessment"
  ON public.question_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.candidate_assessments ca ON q.assessment_version_id = ca.assessment_version_id
      JOIN public.assessment_sessions sess ON sess.candidate_assessment_id = ca.id
      JOIN public.candidate_stage_instances csi ON ca.stage_instance_id = csi.id
      JOIN public.applications app ON csi.application_id = app.id
      WHERE q.id = public.question_options.question_id
        AND app.candidate_id = auth.uid()
        AND sess.status = 'in_progress'
        AND q.id = ANY(ca.question_ids)
    )
  );

-- Candidate Assessments
CREATE POLICY "Recruiters can view candidate assessments"
  ON public.candidate_assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.candidate_stage_instances csi
      JOIN public.applications app ON csi.application_id = app.id
      JOIN public.jobs j ON app.job_id = j.id
      WHERE csi.id = public.candidate_assessments.stage_instance_id AND j.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can view their own candidate assessments"
  ON public.candidate_assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.candidate_stage_instances csi
      JOIN public.applications app ON csi.application_id = app.id
      WHERE csi.id = public.candidate_assessments.stage_instance_id AND app.candidate_id = auth.uid()
    )
  );

-- Assessment Sessions
CREATE POLICY "Candidates can manage their own assessment sessions"
  ON public.assessment_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.candidate_assessments ca
      JOIN public.candidate_stage_instances csi ON ca.stage_instance_id = csi.id
      JOIN public.applications app ON csi.application_id = app.id
      WHERE ca.id = public.assessment_sessions.candidate_assessment_id AND app.candidate_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can view assessment sessions for their jobs"
  ON public.assessment_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.candidate_assessments ca
      JOIN public.candidate_stage_instances csi ON ca.stage_instance_id = csi.id
      JOIN public.applications app ON csi.application_id = app.id
      JOIN public.jobs j ON app.job_id = j.id
      WHERE ca.id = public.assessment_sessions.candidate_assessment_id AND j.recruiter_id = auth.uid()
    )
  );

-- Answers
CREATE POLICY "Candidates can manage their own answers"
  ON public.answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions sess
      JOIN public.candidate_assessments ca ON sess.candidate_assessment_id = ca.id
      JOIN public.candidate_stage_instances csi ON ca.stage_instance_id = csi.id
      JOIN public.applications app ON csi.application_id = app.id
      WHERE sess.id = public.answers.session_id AND app.candidate_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can view answers for their jobs"
  ON public.answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions sess
      JOIN public.candidate_assessments ca ON sess.candidate_assessment_id = ca.id
      JOIN public.candidate_stage_instances csi ON ca.stage_instance_id = csi.id
      JOIN public.applications app ON csi.application_id = app.id
      JOIN public.jobs j ON app.job_id = j.id
      WHERE sess.id = public.answers.session_id AND j.recruiter_id = auth.uid()
    )
  );

-- Coding Submissions
CREATE POLICY "Candidates can manage their own coding submissions"
  ON public.coding_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.answers a
      JOIN public.assessment_sessions sess ON a.session_id = sess.id
      JOIN public.candidate_assessments ca ON sess.candidate_assessment_id = ca.id
      JOIN public.candidate_stage_instances csi ON ca.stage_instance_id = csi.id
      JOIN public.applications app ON csi.application_id = app.id
      WHERE a.id = public.coding_submissions.answer_id AND app.candidate_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can view coding submissions for their jobs"
  ON public.coding_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.answers a
      JOIN public.assessment_sessions sess ON a.session_id = sess.id
      JOIN public.candidate_assessments ca ON sess.candidate_assessment_id = ca.id
      JOIN public.candidate_stage_instances csi ON ca.stage_instance_id = csi.id
      JOIN public.applications app ON csi.application_id = app.id
      JOIN public.jobs j ON app.job_id = j.id
      WHERE a.id = public.coding_submissions.answer_id AND j.recruiter_id = auth.uid()
    )
  );

-- Evaluation Results
CREATE POLICY "Recruiters can manage evaluation results for their jobs"
  ON public.evaluation_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.candidate_stage_instances csi
      JOIN public.applications app ON csi.application_id = app.id
      JOIN public.jobs j ON app.job_id = j.id
      WHERE csi.id = public.evaluation_results.stage_instance_id AND j.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can view their own evaluation results"
  ON public.evaluation_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.candidate_stage_instances csi
      JOIN public.applications app ON csi.application_id = app.id
      WHERE csi.id = public.evaluation_results.stage_instance_id AND app.candidate_id = auth.uid()
    )
  );

-- Monitoring Events
CREATE POLICY "Candidates can insert their own monitoring events"
  ON public.monitoring_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.candidate_stage_instances csi
      JOIN public.applications app ON csi.application_id = app.id
      WHERE csi.id = public.monitoring_events.stage_instance_id AND app.candidate_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can view monitoring events for their jobs"
  ON public.monitoring_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.candidate_stage_instances csi
      JOIN public.applications app ON csi.application_id = app.id
      JOIN public.jobs j ON app.job_id = j.id
      WHERE csi.id = public.monitoring_events.stage_instance_id AND j.recruiter_id = auth.uid()
    )
  );

-- Interview Configs
CREATE POLICY "Recruiters can manage interview configs"
  ON public.interview_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_stages ws
      JOIN public.hiring_workflows hw ON ws.workflow_id = hw.id
      JOIN public.jobs j ON hw.job_id = j.id
      WHERE ws.id = public.interview_configs.stage_id AND j.recruiter_id = auth.uid()
    )
  );

-- Interview Sessions
CREATE POLICY "Recruiters can manage interview sessions"
  ON public.interview_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.candidate_stage_instances csi
      JOIN public.applications app ON csi.application_id = app.id
      JOIN public.jobs j ON app.job_id = j.id
      WHERE csi.id = public.interview_sessions.stage_instance_id AND j.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can view their own interview sessions"
  ON public.interview_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.candidate_stage_instances csi
      JOIN public.applications app ON csi.application_id = app.id
      WHERE csi.id = public.interview_sessions.stage_instance_id AND app.candidate_id = auth.uid()
    )
  );

-- Project Submissions
CREATE POLICY "Candidates can manage their own project submissions"
  ON public.project_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.candidate_stage_instances csi
      JOIN public.applications app ON csi.application_id = app.id
      WHERE csi.id = public.project_submissions.stage_instance_id AND app.candidate_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can view project submissions for their jobs"
  ON public.project_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.candidate_stage_instances csi
      JOIN public.applications app ON csi.application_id = app.id
      JOIN public.jobs j ON app.job_id = j.id
      WHERE csi.id = public.project_submissions.stage_instance_id AND j.recruiter_id = auth.uid()
    )
  );

-- Notifications
CREATE POLICY "Users can manage their own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = recipient_id);

-- Audit Logs
CREATE POLICY "Users can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

CREATE POLICY "Recruiters can view audit logs related to their jobs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'recruiter'
    )
  );

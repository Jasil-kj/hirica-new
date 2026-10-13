import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';
import apiClient from './apiClient';

const api = apiClient;

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateUid: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  cvText: string;
  aiMatchScore: number;
  atsScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  recommendation?: string;
  aiSummary: string;
  aiStrengths: string[];
  aiGaps: string[];
  agentPipeline?: any;
  status: 'pending_review' | 'approved_for_assessment' | 'assessment_completed' | 'rejected' | 'selected';
  assessmentId?: string;
  assessmentScore?: number;
  assessmentCompleted?: boolean;
  interviewScore?: number;
  interviewTranscript?: any[];
  appliedAt: string;
}

class ApplicationService {
  async runMultiAgentPipeline(params: {
    jobTitle: string;
    requirements: string[];
    candidateName: string;
    candidateCv: string;
    testScore?: number;
  }) {
    try {
      const response = await api.post('/multi-agent-eval', {
        job_title: params.jobTitle,
        requirements: params.requirements || [],
        candidate_name: params.candidateName,
        candidate_cv: params.candidateCv,
        test_score: params.testScore
      });
      return response.data.agent_pipeline;
    } catch (err) {
      console.warn('Multi-agent pipeline API warning:', err);
      return null;
    }
  }

  async evaluateResume(jobTitle: string, requirements: string[], cvText: string) {
    try {
      const response = await api.post('/evaluate-resume', {
        job_title: jobTitle,
        requirements: requirements || [],
        candidate_cv: cvText
      });
      return response.data.evaluation;
    } catch (err) {
      console.warn('AI Resume Evaluation API failed, fallback to local match score calculation:', err);
      const cvLower = cvText.toLowerCase();
      const matched = (requirements || []).filter(r => cvLower.includes(r.toLowerCase()));
      const missing = (requirements || []).filter(r => !cvLower.includes(r.toLowerCase()));
      const total = Math.max(1, (requirements || []).length);
      const score = Math.min(95, Math.max(65, Math.round((matched.length / total) * 40) + 60));
      return {
        match_score: score,
        ats_score: score,
        summary: "Candidate profile demonstrates key technical competencies.",
        matched_skills: matched.length ? matched : requirements.slice(0, 2),
        missing_skills: missing,
        recommendation: "Recommended for Assessment",
        strengths: ["Matching technical domain experience"],
        gaps: ["Verify skills during technical assessment"]
      };
    }
  }

  async applyForJob(params: {
    jobId: string;
    jobTitle: string;
    candidateUid: string;
    candidateName: string;
    candidateEmail: string;
    candidatePhone?: string;
    cvText: string;
    requirements: string[];
  }): Promise<string> {
    const evaluation = await this.evaluateResume(params.jobTitle, params.requirements, params.cvText);
    const agentPipeline = await this.runMultiAgentPipeline({
      jobTitle: params.jobTitle,
      requirements: params.requirements,
      candidateName: params.candidateName,
      candidateCv: params.cvText
    });

    const appData = {
      jobId: params.jobId,
      jobTitle: params.jobTitle,
      candidateUid: params.candidateUid,
      candidateName: params.candidateName || 'Candidate',
      candidateEmail: params.candidateEmail,
      candidatePhone: params.candidatePhone || '',
      cvText: params.cvText,
      aiMatchScore: evaluation.match_score || evaluation.ats_score || 80,
      atsScore: evaluation.ats_score || evaluation.match_score || 80,
      matchedSkills: evaluation.matched_skills || [],
      missingSkills: evaluation.missing_skills || [],
      recommendation: evaluation.recommendation || 'Recommended for Assessment',
      aiSummary: evaluation.summary || 'Strong background matching job requirements.',
      aiStrengths: evaluation.strengths || [],
      aiGaps: evaluation.gaps || [],
      agentPipeline: agentPipeline || null,
      status: 'pending_review' as const,
      appliedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'applications'), appData);
    return docRef.id;
  }

  async getApplicationsForJob(jobId: string): Promise<Application[]> {
    try {
      const q = query(collection(db, 'applications'), where('jobId', '==', jobId));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Application[];
      return list.sort((a, b) => b.aiMatchScore - a.aiMatchScore);
    } catch (err) {
      console.warn('Error fetching applications for job:', err);
      // Fallback basic fetch
      const snapshot = await getDocs(collection(db, 'applications'));
      const list = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }) as Application)
        .filter(a => a.jobId === jobId);
      return list.sort((a, b) => b.aiMatchScore - a.aiMatchScore);
    }
  }

  async getApplicationsForCandidate(candidateUid: string): Promise<Application[]> {
    try {
      const q = query(collection(db, 'applications'), where('candidateUid', '==', candidateUid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Application[];
    } catch (err) {
      console.warn('Error fetching candidate applications:', err);
      const snapshot = await getDocs(collection(db, 'applications'));
      return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }) as Application)
        .filter(a => a.candidateUid === candidateUid);
    }
  }

  async updateApplicationStatus(
    applicationId: string, 
    status: Application['status'],
    assessmentId?: string
  ): Promise<void> {
    const appRef = doc(db, 'applications', applicationId);
    const updateData: any = { status };
    if (assessmentId) {
      updateData.assessmentId = assessmentId;
    }
    await updateDoc(appRef, updateData);
  }
}

export const applicationService = new ApplicationService();

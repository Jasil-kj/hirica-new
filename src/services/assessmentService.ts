import { 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../firebase';
import apiClient from './apiClient';

const api = apiClient;

// Add response interceptor for better error handling
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', {
            config: error.config,
            response: error.response,
            message: error.message
        });
        return Promise.reject(error);
    }
);

export interface Question {
  id?: string;
  type: 'multiple-choice' | 'coding' | 'written';
  question: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  difficulty: string;
  time_limit?: number;
  timeEstimate?: number;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  timeLimit: number;
  rules: {
    allowCopyPaste: boolean;
    allowAITools: boolean;
    preventTabSwitching: boolean;
    preventMinimization: boolean;
    trackIP: boolean;
  };
  status: 'pending' | 'in-progress' | 'completed' | 'expired';
  startTime: Date | null;
  endTime: Date | null;
  score?: number;
  feedback?: string;
  createdAt: Date;
  answers?: {
    [questionId: string]: {
      answer: string | null;
      isCorrect?: boolean;
      timestamp?: Date;
    };
  };
  suspiciousActivities?: {
    count: number;
    events: Array<{
      type: string;
      timestamp: Date;
      details: string;
    }>;
  };
}

export interface AssessmentRules {
  timeLimit: number;
  allowCopyPaste: boolean;
  allowAITools: boolean;
  preventTabSwitching: boolean;
  preventMinimization: boolean;
  trackIP: boolean;
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  numberOfQuestions?: number;
  assessmentRules: {
    timeLimit: number;
    allowCopyPaste: boolean;
    allowAITools: boolean;
    preventTabSwitching: boolean;
    preventMinimization: boolean;
    trackIP: boolean;
  };
}

export interface JobRequirements {
    job_title: string;
    skills: string[];
    responsibilities: string[];
    time_limit?: number;
    num_questions?: number;
}

interface AssessmentResponse {
    status: 'success' | 'error';
    message?: string;
    assessment?: Assessment;
}

class AssessmentService {
    async generateAssessment(jobPosting: JobPosting): Promise<Assessment> {
        try {
            const requirements: JobRequirements = {
                job_title: jobPosting.title,
                skills: jobPosting.requirements,
                responsibilities: jobPosting.responsibilities,
                time_limit: jobPosting.assessmentRules?.timeLimit || 60,
                num_questions: jobPosting.numberOfQuestions || 5
            };

            console.log('Sending assessment generation request:', requirements);

            const response = await api.post<AssessmentResponse>(
                '/generate-assessment',
                requirements
            );
            
            console.log('Received assessment response:', response.data);
            
            if (!response.data.assessment) {
                throw new Error('No assessment data received from server');
            }

            const assessmentData: Assessment = {
                ...response.data.assessment,
                timeLimit: jobPosting.assessmentRules?.timeLimit || response.data.assessment.timeLimit || 60,
                createdAt: new Date(),
                status: 'pending',
                startTime: null,
                endTime: null,
                rules: {
                    allowCopyPaste: jobPosting.assessmentRules.allowCopyPaste,
                    allowAITools: jobPosting.assessmentRules.allowAITools,
                    preventTabSwitching: jobPosting.assessmentRules.preventTabSwitching,
                    preventMinimization: jobPosting.assessmentRules.preventMinimization,
                    trackIP: jobPosting.assessmentRules.trackIP
                }
            };

            console.log('Storing assessment in Firebase:', assessmentData);

            const assessmentRef = await addDoc(collection(db, 'assessments'), assessmentData);
            const finalAssessment = { ...assessmentData, id: assessmentRef.id };
            
            console.log('Assessment stored successfully:', finalAssessment);
            return finalAssessment;
        } catch (error) {
            console.error('Error in generateAssessment:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to generate assessment: ${error.message}`);
            } else {
                throw new Error('Failed to generate assessment: Unknown error');
            }
        }
    }

    async checkHealth(): Promise<boolean> {
        try {
            const response = await api.get('/health');
            return response.data.status === 'healthy';
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }

    async getAssessment(assessmentId: string): Promise<Assessment> {
        try {
            const assessmentDoc = await getDoc(doc(db, 'assessments', assessmentId));
            if (!assessmentDoc.exists()) {
                throw new Error('Assessment not found');
            }
            return { id: assessmentDoc.id, ...assessmentDoc.data() } as Assessment;
        } catch (error) {
            console.error('Error getting assessment:', error);
            throw error;
        }
    }

    async startAssessment(assessmentId: string): Promise<void> {
        const assessmentRef = doc(db, 'assessments', assessmentId);
        await updateDoc(assessmentRef, {
            status: 'in-progress',
            startTime: serverTimestamp()
        });
    }

    async submitAssessment(
        assessmentId: string,
        answers: {
            [questionId: string]: {
                answer: string | null;
                isCorrect?: boolean;
                timestamp?: Date;
            };
        }
    ): Promise<Assessment> {
        const assessmentRef = doc(db, 'assessments', assessmentId);
        await updateDoc(assessmentRef, {
            status: 'completed',
            endTime: serverTimestamp(),
            answers
        });
        
        return this.getAssessment(assessmentId);
    }

    async recordSuspiciousActivity(
        assessmentId: string,
        eventType: string,
        details: string
    ): Promise<void> {
        const assessmentRef = doc(db, 'assessments', assessmentId);
        const event = {
            type: eventType,
            timestamp: serverTimestamp(),
            details
        };
        
        await updateDoc(assessmentRef, {
            'suspiciousActivities.count': increment(1),
            'suspiciousActivities.events': arrayUnion(event)
        });
    }
}

// Remove the old functions that use API_URL
export const generateAssessment = undefined;
export const getAssessment = undefined;
export const startAssessment = undefined;
export const submitAssessment = undefined;
export const recordSuspiciousActivity = undefined;

// Export only the service instance
export const assessmentService = new AssessmentService(); 
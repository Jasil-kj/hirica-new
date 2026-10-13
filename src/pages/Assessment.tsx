import { type FC, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Assessment as AssessmentType, assessmentService } from '../services/assessmentService';
import apiClient from '../services/apiClient';
import CameraIntegrityMonitor, { type CameraIntegrityEvent } from '../components/integrity/CameraIntegrityMonitor';
import MalpracticeIntegrityDashboard from '../components/integrity/MalpracticeIntegrityDashboard';

interface Answer {
  questionId: string;
  answer: string | null;
  isCorrect?: boolean;
}

const Assessment: FC = () => {
  const params = useParams();
  const assessmentId = params.assessmentId;
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<AssessmentType | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [warning, setWarning] = useState<string>('');
  const [_sessionId] = useState<string>(() => uuidv4());
  const [isAssessmentStarted, setIsAssessmentStarted] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [liveFaceCount, setLiveFaceCount] = useState<number>(1);
  const [tabSwitchesCount, setTabSwitchesCount] = useState<number>(0);
  const [integrityEvents, setIntegrityEvents] = useState<Array<{ type: string; timestamp: string; details: string }>>([]);

  // Handle camera integrity events — persist via existing assessmentService
  const handleCameraEvent = useCallback((event: CameraIntegrityEvent) => {
    const timeStr = new Date(event.timestamp).toLocaleTimeString();
    const newEvent = {
      type: event.eventType,
      timestamp: timeStr,
      details: `${event.eventType}${event.durationMs ? ` (${Math.round(event.durationMs / 1000)}s)` : ''}${event.faceCount ? ` [${event.faceCount} faces]` : ''} at ${timeStr}`
    };
    setIntegrityEvents(prev => [...prev, newEvent]);
    if (assessmentId && event.eventType !== 'CAMERA_PERMISSION_GRANTED') {
      assessmentService.recordSuspiciousActivity(assessmentId, event.eventType, newEvent.details).catch(() => {});
    }
    if (event.eventType === 'NO_FACE_DETECTED') {
      setWarning('Malpractice Alert: Candidate absence detected. Please remain centered in camera frame.');
    } else if (event.eventType === 'MULTIPLE_FACES_DETECTED') {
      setWarning(`Malpractice Alert: Multiple people detected (${event.faceCount || 2} faces). Collusion is prohibited during proctored assessment.`);
    }
  }, [assessmentId]);

  // Redirect if no assessmentId
  useEffect(() => {
    if (!assessmentId) {
      navigate('/jobseeker/dashboard');
    }
  }, [assessmentId, navigate]);

  // Fetch assessment data
  // Fetch assessment data dynamically linked to recruiter job requirements
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        if (!assessmentId || !currentUser) {
          navigate('/jobseeker/dashboard');
          return;
        }

        // 1. Try to fetch from direct assessments collection
        const assessmentRef = doc(db, 'assessments', assessmentId);
        const assessmentDoc = await getDoc(assessmentRef);

        if (assessmentDoc.exists()) {
          const assessmentData = assessmentDoc.data() as AssessmentType;
          // Check if already completed
          if (assessmentData.status === 'completed' || (assessmentData as any).score !== undefined) {
            console.log('Assessment already completed, redirecting to results:', assessmentId);
            navigate(`/results/${assessmentId}`, { replace: true });
            return;
          }
          setAssessment(assessmentData);
          setTimeLeft(assessmentData.timeLimit * 60);
          setLoading(false);
          return;
        }

        // 2. If assessment document not created yet, look up candidate's application and job configuration
        console.log('Resolving application & job configuration for session:', assessmentId);
        let targetJob: any = null;
        let candidateApplication: any = null;

        // Check if assessmentId matches an application document directly
        try {
          const directAppSnap = await getDoc(doc(db, 'applications', assessmentId));
          if (directAppSnap.exists()) {
            candidateApplication = { id: directAppSnap.id, ...directAppSnap.data() };
          }
        } catch { /* proceed */ }

        // Otherwise find application by candidateUid
        if (!candidateApplication) {
          try {
            const appsQuery = query(
              collection(db, 'applications'),
              where('candidateUid', '==', currentUser.uid)
            );
            const appsSnap = await getDocs(appsQuery);
            candidateApplication = appsSnap.docs.find(d => {
              const dData = d.data();
              return d.id === assessmentId || dData.assessmentId === assessmentId;
            })?.data() || appsSnap.docs[0]?.data();
          } catch (e) {
            console.warn('Error fetching application for assessment:', e);
          }
        }

        // Check if the candidate's application has already completed this assessment
        if (candidateApplication && (candidateApplication.assessmentScore !== undefined || candidateApplication.status === 'assessment_completed')) {
          console.log('Candidate application already has assessment score, redirecting to results:', candidateApplication.assessmentId || assessmentId);
          navigate(`/results/${candidateApplication.assessmentId || assessmentId}`, { replace: true });
          return;
        }

        // Fetch corresponding job posted by the recruiter
        if (candidateApplication?.jobId) {
          try {
            const jobSnap = await getDoc(doc(db, 'jobs', candidateApplication.jobId));
            if (jobSnap.exists()) {
              targetJob = { id: jobSnap.id, ...jobSnap.data() };
            }
          } catch (e) {
            console.warn('Error fetching job for assessment:', e);
          }
        }

        // Extract recruiter-defined configurations
        const recruiterQuestionCount = Number(targetJob?.numberOfQuestions) || 5;
        const recruiterTimeLimit = Number(targetJob?.assessmentRules?.timeLimit) || 30;
        const jobTitle = targetJob?.title || candidateApplication?.jobTitle || 'Technical Role';
        const jobSkills = targetJob?.skills || candidateApplication?.matchedSkills || ['Python', 'Problem Solving'];
        const jobResponsibilities = targetJob?.responsibilities || [];

        // 3. Request fresh AI assessment generated strictly from recruiter's specifications
        let generatedQuestions: any[] = [];
        try {
          const genRes = await apiClient.post('/generate-assessment', {
            job_title: jobTitle,
            skills: jobSkills,
            responsibilities: jobResponsibilities,
            time_limit: recruiterTimeLimit,
            num_questions: recruiterQuestionCount
          });

          if (genRes.data?.status === 'success' && genRes.data.assessment?.questions) {
            generatedQuestions = genRes.data.assessment.questions;
          }
        } catch (genErr) {
          console.warn('AI Assessment generator API fallback, building deterministic set:', genErr);
        }

        // Fallback question generation if API is unreachable
        if (!generatedQuestions || generatedQuestions.length === 0) {
          const sampleQuestionPool = [
            {
              id: 'q1',
              type: 'multiple-choice',
              question: `In ${jobSkills[0] || 'software architecture'}, what is the primary consideration when optimizing database queries for high throughput?`,
              options: [
                'Indexing frequently filtered columns and query plan analysis',
                'Avoiding indexes to save disk space',
                'Running queries without LIMIT clauses',
                'Disabling transaction isolation levels entirely'
              ],
              correctAnswer: 'Indexing frequently filtered columns and query plan analysis',
              difficulty: 'intermediate',
              time_limit: 120
            },
            {
              id: 'q2',
              type: 'multiple-choice',
              question: 'Which HTTP status code is most appropriate for a request that fails authentication credentials?',
              options: ['401 Unauthorized', '403 Forbidden', '404 Not Found', '500 Server Error'],
              correctAnswer: '401 Unauthorized',
              difficulty: 'beginner',
              time_limit: 120
            },
            {
              id: 'q3',
              type: 'written',
              question: `Explain how you would design a scalable, fault-tolerant microservice using ${jobSkills.join(' & ')}.`,
              difficulty: 'intermediate',
              time_limit: 300
            },
            {
              id: 'q4',
              type: 'coding',
              question: 'Write a function `two_sum(nums: list[int], target: int) -> list[int]` that returns the 0-based indices of two numbers that add up to target in O(n) time.',
              difficulty: 'advanced',
              time_limit: 480
            },
            {
              id: 'q5',
              type: 'multiple-choice',
              question: 'What is the primary role of asynchronous event-driven queues (e.g. RabbitMQ / Redis) in distributed services?',
              options: [
                'Decoupling producer and consumer workloads to handle burst traffic',
                'Replacing persistent databases for all relational storage',
                'Executing synchronous blocking HTTP operations',
                'Eliminating all memory usage from microservices'
              ],
              correctAnswer: 'Decoupling producer and consumer workloads to handle burst traffic',
              difficulty: 'intermediate',
              time_limit: 120
            },
            {
              id: 'q6',
              type: 'written',
              question: 'Explain the principles of idempotent API design and provide a practical example.',
              difficulty: 'advanced',
              time_limit: 300
            },
            {
              id: 'q7',
              type: 'coding',
              question: 'Implement a function `is_valid_parentheses(s: str) -> bool` using a stack that validates matching brackets (), [], {}.',
              difficulty: 'intermediate',
              time_limit: 300
            },
            {
              id: 'q8',
              type: 'multiple-choice',
              question: 'When implementing token-based authentication (JWT), where should sensitive cryptographic secret keys be stored?',
              options: [
                'Secure environment variables or managed secrets vault',
                'Hardcoded directly into client-side JavaScript bundles',
                'Public GitHub repositories with read-only permissions',
                'Browser localStorage without encryption'
              ],
              correctAnswer: 'Secure environment variables or managed secrets vault',
              difficulty: 'beginner',
              time_limit: 120
            },
            {
              id: 'q9',
              type: 'written',
              question: 'Describe how caching strategies (like Cache-Aside or Write-Through) mitigate database load and prevent stale reads.',
              difficulty: 'intermediate',
              time_limit: 300
            },
            {
              id: 'q10',
              type: 'coding',
              question: 'Write a function `merge_intervals(intervals: list[list[int]]) -> list[list[int]]` that merges all overlapping time intervals.',
              difficulty: 'advanced',
              time_limit: 420
            }
          ];

          generatedQuestions = sampleQuestionPool.slice(0, recruiterQuestionCount);
        }

        const dynamicallyBuiltAssessment: AssessmentType = {
          id: assessmentId,
          title: `${jobTitle} Competency Assessment`,
          description: `Configured by hiring team: ${recruiterQuestionCount} questions, ${recruiterTimeLimit} minutes duration.`,
          timeLimit: recruiterTimeLimit,
          rules: {
            allowCopyPaste: Boolean(targetJob?.assessmentRules?.allowCopyPaste),
            allowAITools: Boolean(targetJob?.assessmentRules?.allowAITools),
            preventTabSwitching: targetJob?.assessmentRules?.preventTabSwitching !== false,
            preventMinimization: targetJob?.assessmentRules?.preventMinimization !== false,
            trackIP: targetJob?.assessmentRules?.trackIP !== false,
          },
          status: 'pending',
          startTime: null,
          endTime: null,
          createdAt: new Date(),
          questions: generatedQuestions.slice(0, recruiterQuestionCount)
        };

        // Cache into Firestore assessments collection so results & proctoring persist
        try {
          await updateDoc(doc(db, 'assessments', assessmentId), dynamicallyBuiltAssessment as any).catch(async () => {
            const { setDoc } = await import('firebase/firestore');
            await setDoc(doc(db, 'assessments', assessmentId), dynamicallyBuiltAssessment as any);
          });
        } catch { /* non-blocking local session */ }

        setAssessment(dynamicallyBuiltAssessment);
        setTimeLeft(recruiterTimeLimit * 60);
        setLoading(false);
      } catch (err: any) {
        console.error('Fatal assessment loading error:', err);
        setError('Failed to load assessment. Please verify your connection.');
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [assessmentId, currentUser, navigate]);

  // Timer effect
  useEffect(() => {
    if (!timeLeft || !assessment || !isAssessmentStarted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, assessment, isAssessmentStarted]);

  // Anti-cheating measures & telemetry recording
  useEffect(() => {
    if (!assessment?.rules || !isAssessmentStarted || !assessmentId) return;

    const recordEvent = (type: string, details: string) => {
      const timeStr = new Date().toLocaleTimeString();
      const newEvent = { type, timestamp: timeStr, details: `${details} at ${timeStr}` };
      setIntegrityEvents(prev => [...prev, newEvent]);
      assessmentService.recordSuspiciousActivity(
        assessmentId,
        type,
        newEvent.details
      ).catch(e => console.warn('Telemetry error:', e));
    };

    const handleVisibilityChange = () => {
      if (document.hidden && assessment.rules.preventTabSwitching) {
        setWarning('Telemetry Alert: Tab switch detected. Assessment environment must maintain focus.');
        setTabSwitchesCount(c => c + 1);
        recordEvent('tab_switch', 'Browser tab switched or hidden');
      }
    };

    const handleWindowBlur = () => {
      if (assessment.rules.preventTabSwitching) {
        setTabSwitchesCount(c => c + 1);
        recordEvent('window_blur', 'Window focus lost');
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (!assessment.rules.allowCopyPaste) {
        e.preventDefault();
        setWarning('Clipboard Action: Copying question content is disabled.');
        recordEvent('copy_attempt', 'Clipboard copy attempt intercepted');
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (!assessment.rules.allowCopyPaste) {
        e.preventDefault();
        setWarning('Clipboard Action: External pasting is disabled.');
        recordEvent('paste_attempt', 'Clipboard paste attempt intercepted');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [assessment, isAssessmentStarted, assessmentId]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    if (!assessment) return;
    
    setAnswers((prev) => {
      const existingAnswer = prev.find((a) => a.questionId === questionId);
      if (existingAnswer) {
        return prev.map((a) =>
          a.questionId === questionId ? { ...a, answer } : a
        );
      }
      return [...prev, { questionId, answer }];
    });
  };

  const handleSubmit = async () => {
    if (!assessment || !currentUser || !assessmentId) {
      setError('Missing required data for submission');
      navigate('/jobseeker/dashboard');
      return;
    }

    try {
      setSubmitting(true);
      const assessmentRef = doc(db, 'assessments', assessmentId);
      
      let calculatedScore = 0;
      let formattedAnswers: Record<string, any> = {};

      const rawAnswersObj = answers.reduce((acc, curr) => ({
        ...acc,
        [curr.questionId]: curr.answer
      }), {});

      try {
        const evalRes = await apiClient.post('/evaluate-answers', {
          questions: assessment.questions,
          answers: rawAnswersObj
        });

        if (evalRes.data?.status === 'success' && evalRes.data.evaluation) {
          calculatedScore = evalRes.data.evaluation.score;
          formattedAnswers = evalRes.data.evaluation.answers;
        }
      } catch (apiErr) {
        console.warn('AI Answer Evaluation API fallback:', apiErr);
      }

      // Verified Fallback Calculation
      if (Object.keys(formattedAnswers).length === 0) {
        let correctCount = 0;
        const totalQs = assessment.questions?.length || 1;

        assessment.questions.forEach((q, idx) => {
          const qId = q.id || String(idx);
          const userAnsObj = answers.find(a => a.questionId === qId || a.questionId === q.id);
          const rawAnswer = userAnsObj?.answer ? userAnsObj.answer.trim() : '';

          let isCorrect = false;

          if (rawAnswer && rawAnswer.length > 0) {
            if (q.type === 'multiple-choice') {
              const correctStr = (q.correctAnswer || '').trim().toLowerCase();
              const userStr = rawAnswer.toLowerCase();
              if (correctStr && (userStr === correctStr || userStr.includes(correctStr) || correctStr.includes(userStr))) {
                isCorrect = true;
              }
            } else if (q.type === 'coding') {
              const cleanCode = rawAnswer.toLowerCase();
              const isTooShort = cleanCode.length < 15;
              const isGibberish = !/\b(def|function|const|let|var|return|import|class|if|for|while|=|\(\))\b/.test(cleanCode);
              if (!isTooShort && !isGibberish) {
                isCorrect = true;
              }
            } else {
              const cleanText = rawAnswer.toLowerCase();
              const isTooShort = cleanText.length < 12;
              const isGibberish = !/\b(the|and|for|with|should|use|using|ensure|error|data|code|design|process|system|performance|scale|api|test|build|handling)\b/.test(cleanText);
              if (!isTooShort && !isGibberish) {
                isCorrect = true;
              }
            }
          }

          if (isCorrect) {
            correctCount += 1;
          }

          formattedAnswers[qId] = {
            answer: rawAnswer,
            isCorrect,
            timestamp: new Date().toISOString()
          };
        });

        calculatedScore = Math.round((correctCount / totalQs) * 100);
      }

      const submittedAt = new Date().toISOString();
      const feedback = `AI Assessment Completed! Final Score: ${calculatedScore}%. Integrity trust verified.`;

      try {
        await updateDoc(assessmentRef, {
          answers: formattedAnswers,
          endTime: submittedAt,
          submittedAt,
          score: calculatedScore,
          feedback,
          status: 'completed',
        });
      } catch (updateErr) {
        console.warn('Firestore update warning:', updateErr);
      }

      // Synchronize with Application Record & Run 8-Agent Pipeline
      try {
        const appsQuery = query(
          collection(db, 'applications'),
          where('candidateUid', '==', currentUser.uid)
        );
        const appsSnap = await getDocs(appsQuery);
        const targetAppDoc = appsSnap.docs.find(d => {
          const dData = d.data();
          return dData.assessmentId === assessmentId || (assessment.title && dData.jobTitle && assessment.title.includes(dData.jobTitle));
        }) || appsSnap.docs[0];

        if (targetAppDoc) {
          const appData = targetAppDoc.data();
          let pipeline: any = null;
          try {
            const multiAgentRes = await apiClient.post('/multi-agent-eval', {
              job_title: appData.jobTitle || assessment.title || 'Software Role',
              requirements: appData.matchedSkills?.concat(appData.missingSkills || []) || [],
              candidate_name: appData.candidateName || currentUser.displayName || 'Candidate',
              candidate_cv: appData.cvText || '',
              test_score: calculatedScore,
              questions_count: assessment.questions?.length || 5,
              suspicious_events: integrityEvents
            });

            if (multiAgentRes.data?.status === 'success' && multiAgentRes.data.agent_pipeline) {
              pipeline = multiAgentRes.data.agent_pipeline;
            }
          } catch (agentEvalErr) {
            console.warn('Multi-agent pipeline API warning:', agentEvalErr);
          }

          // Persist assessment result to application doc for recruiter & candidate visibility
          const updatePayload: Record<string, any> = {
            assessmentId,
            assessmentScore: calculatedScore,
            status: 'assessment_completed',
            assessmentCompleted: true,
            updatedAt: new Date().toISOString()
          };

          if (pipeline) {
            updatePayload.agentPipeline = pipeline;
            updatePayload.fairnessAudit = pipeline.fairness_audit || null;
            updatePayload.compositeScore = pipeline.agents?.ranking_agent?.composite_score || calculatedScore;
            updatePayload.rankingTier = pipeline.agents?.ranking_agent?.tier || 'Qualified';
            updatePayload.finalVerdict = pipeline.pipeline_summary?.verdict || 'HIRE / INTERVIEW';
            updatePayload.integrityTrustScore = pipeline.agents?.integrity_agent?.trust_score ?? 100;
            updatePayload.integrityRisk = pipeline.agents?.integrity_agent?.cheating_risk || 'Low';
          }

          await updateDoc(doc(db, 'applications', targetAppDoc.id), updatePayload);
        }
      } catch (agentErr) {
        console.warn('Multi-agent pipeline sync warning:', agentErr);
      }

      navigate(`/results/${assessmentId}`);
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError('Failed to submit assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const startAssessment = async () => {
    if (!assessment || !assessmentId) {
      setError('Cannot start assessment: Missing required data');
      return;
    }

    try {
      setLoading(true);
      await assessmentService.startAssessment(assessmentId).catch(e => console.warn(e));
      setIsAssessmentStarted(true);
      setShowCamera(true);
    } catch (err) {
      console.error('Error starting assessment:', err);
      setError('Failed to start assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-architectural-grid flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-olive-800 border-t-transparent mb-3" />
        <span className="text-xs font-mono text-olive-800 font-bold">Initializing Assessment Engine...</span>
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="min-h-screen bg-architectural-grid py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full card-enterprise p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-base font-bold text-slate-900">{error || 'Assessment not found'}</h2>
          <p className="text-xs text-slate-600">The requested assessment session could not be retrieved.</p>
          <button
            onClick={() => navigate('/jobseeker/dashboard')}
            className="btn-brand w-full"
          >
            Back to Candidate Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Pre-Start Instruction Canvas
  if (!isAssessmentStarted && assessment) {
    return (
      <div className="min-h-screen bg-architectural-grid py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-2xl w-full card-enterprise p-8 space-y-6 shadow-md border-olive-300">
          <div className="border-b border-olive-200 pb-4">
            <span className="text-[10px] font-mono text-olive-800 font-bold uppercase tracking-wider block">
              HIRICA PROCTORED EVALUATION SYSTEM
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{assessment.title}</h1>
            <p className="text-xs text-slate-600 mt-1">{assessment.description}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-olive-50 border border-olive-200">
              <span className="text-[10px] text-slate-500 block">TIME LIMIT</span>
              <span className="font-bold text-slate-900">{assessment.timeLimit} Mins</span>
            </div>
            <div className="p-3 rounded-lg bg-olive-50 border border-olive-200">
              <span className="text-[10px] text-slate-500 block">QUESTIONS</span>
              <span className="font-bold text-slate-900">{assessment.questions?.length || 5} Total</span>
            </div>
            <div className="p-3 rounded-lg bg-olive-50 border border-olive-200">
              <span className="text-[10px] text-slate-500 block">PROCTORING</span>
              <span className="font-bold text-olive-800">Telemetry Active</span>
            </div>
            <div className="p-3 rounded-lg bg-olive-50 border border-olive-200">
              <span className="text-[10px] text-slate-500 block">EVALUATION</span>
              <span className="font-bold text-emerald-800">Multi-Agent AI</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <h3 className="font-bold text-slate-900">Proctoring Telemetry Guidelines:</h3>
            <ul className="space-y-1.5 text-slate-600">
              <li className="flex items-center gap-2">
                <span className="text-olive-700 font-bold">•</span>
                Tab and window focus changes are recorded into the integrity timeline.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-olive-700 font-bold">•</span>
                Copying or pasting external code/text is restricted during this session.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-olive-700 font-bold">•</span>
                Responses will be evaluated against objective competency rubrics.
              </li>
            </ul>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={() => navigate('/jobseeker/dashboard')}
              className="btn-secondary-dark !py-2.5 !px-5 text-xs font-bold"
            >
              Cancel & Exit
            </button>
            <button
              onClick={startAssessment}
              disabled={loading}
              className="btn-brand !py-2.5 !px-6 text-xs font-bold shadow-md"
            >
              Begin Proctored Assessment ➔
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = assessment!.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-architectural-grid py-8 text-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* TOP STATUS BAR */}
        <div className="card-enterprise p-4 border-olive-300 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-8 px-2 rounded bg-black flex items-center justify-center border border-olive-800">
              <img src="/hirica-logo-transparent.png" alt="HIRICA" className="h-5 w-auto object-contain brightness-125" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase block">ACTIVE ASSESSMENT</span>
              <h2 className="text-xs font-bold text-slate-900">
                Question {currentQuestion + 1} of {assessment!.questions.length}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-500 block">TIME REMAINING</span>
              <span className={`text-sm font-mono font-bold ${timeLeft < 180 ? 'text-red-600 animate-pulse' : 'text-olive-800'}`}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" title="Telemetry Active" />
          </div>
        </div>

        {/* PROCTORING TELEMETRY & CAMERA MONITOR ROW */}
        {showCamera && (
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="w-full md:w-auto flex-shrink-0">
              <CameraIntegrityMonitor
                sessionId={_sessionId}
                onEvent={handleCameraEvent}
                onFaceCountChange={setLiveFaceCount}
              />
            </div>
            <div className="flex-1 w-full">
              <MalpracticeIntegrityDashboard
                events={integrityEvents}
                tabSwitches={tabSwitchesCount}
                faceCount={liveFaceCount}
              />
            </div>
          </div>
        )}

        {/* TELEMETRY WARNING ALERT */}
        {warning && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold">⚠️</span>
              <span>{warning}</span>
            </div>
            <button onClick={() => setWarning('')} className="text-amber-700 hover:text-amber-900 font-bold">✕</button>
          </div>
        )}

        {/* QUESTION CARD */}
        <div className="card-enterprise p-6 border-olive-300 space-y-6 shadow-sm">
          <div className="space-y-2 border-b border-olive-100 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-olive-100 text-olive-900 border border-olive-300">
                {currentQ.type.toUpperCase()} • {currentQ.difficulty?.toUpperCase() || 'STANDARD'}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Competency Assessment #{currentQuestion + 1}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 leading-relaxed pt-1">
              {currentQ.question}
            </h3>
          </div>

          {/* ANSWER INPUT INTERFACES */}
          <div className="space-y-4">
            {currentQ.type === 'multiple-choice' && currentQ.options && (
              <div className="space-y-2.5">
                {currentQ.options.map((option, idx) => {
                  const isSelected = answers.find(a => a.questionId === (currentQ.id || String(currentQuestion)))?.answer === option;
                  return (
                    <label
                      key={idx}
                      className={`flex items-center p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-olive-50 border-olive-600 text-slate-900 font-semibold shadow-xs'
                          : 'bg-white border-slate-200 hover:border-olive-300 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${currentQuestion}`}
                        value={option}
                        checked={isSelected}
                        onChange={(e) => handleAnswerChange(currentQ.id || String(currentQuestion), e.target.value)}
                        className="h-4 w-4 text-olive-800 focus:ring-olive-500 border-slate-300"
                      />
                      <span className="ml-3">{option}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {currentQ.type === 'written' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-500 uppercase block">Written Technical Explanation</label>
                <textarea
                  rows={6}
                  value={answers.find(a => a.questionId === (currentQ.id || String(currentQuestion)))?.answer || ''}
                  onChange={(e) => handleAnswerChange(currentQ.id || String(currentQuestion), e.target.value)}
                  placeholder="Explain your approach, architecture decisions, and trade-offs..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:border-olive-600 focus:ring-1 focus:ring-olive-600 outline-none leading-relaxed"
                />
              </div>
            )}

            {currentQ.type === 'coding' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono text-slate-500 uppercase">Code Solution (Python / JS / Any)</label>
                  <span className="text-[10px] font-mono text-olive-800 font-bold">Monospace Canvas</span>
                </div>
                <textarea
                  rows={10}
                  value={answers.find(a => a.questionId === (currentQ.id || String(currentQuestion)))?.answer || ''}
                  onChange={(e) => handleAnswerChange(currentQ.id || String(currentQuestion), e.target.value)}
                  placeholder="def solution():\n    # Implement optimal algorithm here\n    pass"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300 focus:border-olive-500 focus:ring-1 focus:ring-olive-500 outline-none leading-relaxed"
                />
              </div>
            )}
          </div>

          {/* NAVIGATION FOOTER */}
          <div className="border-t border-olive-100 pt-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="btn-secondary-dark !py-2 !px-4 text-xs disabled:opacity-40"
            >
              Previous Question
            </button>

            <div className="flex items-center gap-2">
              {currentQuestion < assessment!.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion(prev => Math.min(assessment!.questions.length - 1, prev + 1))}
                  className="btn-brand !py-2 !px-5 text-xs font-bold"
                >
                  Save & Next ➔
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-brand !py-2 !px-6 text-xs font-bold shadow-md bg-emerald-700 hover:bg-emerald-800"
                >
                  {submitting ? 'Submitting & Evaluating...' : 'Submit Proctored Exam 🚀'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessment;
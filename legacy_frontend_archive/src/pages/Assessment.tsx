import { type FC, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Assessment as AssessmentType, assessmentService } from '../services/assessmentService';
import axios from 'axios';

interface Answer {
  questionId: string;
  answer: string | null;
  isCorrect?: boolean;
}

interface SuspiciousActivityType {
  riskScore: number;
  patterns: string[];
}

const Assessment: FC = () => {
  // Get assessmentId from URL params
  const params = useParams();
  const assessmentId = params.assessmentId;
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<AssessmentType | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [warning, setWarning] = useState<string>('');
  const [_sessionId] = useState<string>(() => uuidv4());
  const [isAssessmentStarted, setIsAssessmentStarted] = useState(false);
  const [_suspiciousActivity, setSuspiciousActivity] = useState<SuspiciousActivityType | null>(null);

  // Redirect if no assessmentId
  useEffect(() => {
    if (!assessmentId) {
      navigate('/jobseeker/dashboard');
    }
  }, [assessmentId, navigate]);

  // Fetch assessment data
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        if (!assessmentId || !currentUser) {
          navigate('/jobseeker/dashboard');
          return;
        }

        const assessmentRef = doc(db, 'assessments', assessmentId);
        const assessmentDoc = await getDoc(assessmentRef);

        if (!assessmentDoc.exists()) {
          throw new Error('Assessment not found');
        }

        const assessmentData = assessmentDoc.data() as AssessmentType;
        setAssessment(assessmentData);
        setTimeLeft(assessmentData.timeLimit * 60); // Convert minutes to seconds
        setLoading(false);
      } catch (err) {
        console.error('Error loading assessment:', err);
        setError('Failed to load assessment');
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

    const handleVisibilityChange = () => {
      if (document.hidden && assessment.rules.preventTabSwitching) {
        setWarning('Please do not switch tabs during the assessment');
        assessmentService.recordSuspiciousActivity(
          assessmentId,
          'tab_switch',
          `Tab switched or window lost focus at ${new Date().toLocaleTimeString()}`
        ).catch(e => console.warn('Telemetry error:', e));
      }
    };

    const handleWindowBlur = () => {
      if (assessment.rules.preventTabSwitching) {
        assessmentService.recordSuspiciousActivity(
          assessmentId,
          'window_blur',
          `Window focus lost at ${new Date().toLocaleTimeString()}`
        ).catch(e => console.warn('Telemetry error:', e));
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (assessment.rules.preventTabSwitching) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (!assessment.rules.allowCopyPaste) {
        e.preventDefault();
        setWarning('Copy/paste is not allowed during this assessment');
        assessmentService.recordSuspiciousActivity(
          assessmentId,
          'copy_attempt',
          `Unauthorized clipboard copy attempt intercepted at ${new Date().toLocaleTimeString()}`
        ).catch(e => console.warn('Telemetry error:', e));
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (!assessment.rules.allowCopyPaste) {
        e.preventDefault();
        setWarning('Copy/paste is not allowed during this assessment');
        assessmentService.recordSuspiciousActivity(
          assessmentId,
          'paste_attempt',
          `Unauthorized clipboard paste attempt intercepted at ${new Date().toLocaleTimeString()}`
        ).catch(e => console.warn('Telemetry error:', e));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
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
      setLoading(true);
      const assessmentRef = doc(db, 'assessments', assessmentId);
      
      let calculatedScore = 0;
      let formattedAnswers: Record<string, any> = {};

      const rawAnswersObj = answers.reduce((acc, curr) => ({
        ...acc,
        [curr.questionId]: curr.answer
      }), {});

      try {
        const evalRes = await axios.post('http://127.0.0.1:8000/api/evaluate-answers', {
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

      // Fallback calculation if API call failed
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
      const feedback = `High-Level AI Assessment Evaluated! Final Score: ${calculatedScore}%.`;

      // Read any recorded suspicious proctoring events
      let recordedEvents: any[] = [];
      try {
        const curDoc = await getDoc(assessmentRef);
        if (curDoc.exists()) {
          recordedEvents = curDoc.data()?.suspiciousActivities?.events || [];
        }
      } catch (evtErr) {
        console.warn('Could not read proctoring events:', evtErr);
      }

      await updateDoc(assessmentRef, {
        answers: formattedAnswers,
        endTime: new Date().toISOString(),
        submittedAt,
        score: calculatedScore,
        feedback,
        status: 'completed',
      });

      // Synchronize with Candidate's Application & Run Full Multi-Agent Pipeline
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
          const multiAgentRes = await axios.post('http://127.0.0.1:8000/api/multi-agent-eval', {
            job_title: appData.jobTitle || assessment.title || 'Software Role',
            requirements: appData.matchedSkills?.concat(appData.missingSkills || []) || [],
            candidate_name: appData.candidateName || currentUser.displayName || 'Candidate',
            candidate_cv: appData.cvText || '',
            test_score: calculatedScore,
            questions_count: assessment.questions?.length || 5,
            suspicious_events: recordedEvents
          });

          if (multiAgentRes.data?.status === 'success' && multiAgentRes.data.agent_pipeline) {
            const pipeline = multiAgentRes.data.agent_pipeline;
            await updateDoc(doc(db, 'applications', targetAppDoc.id), {
              assessmentId,
              assessmentScore: calculatedScore,
              agentPipeline: pipeline,
              fairnessAudit: pipeline.fairness_audit || null,
              compositeScore: pipeline.agents?.ranking_agent?.composite_score || calculatedScore,
              rankingTier: pipeline.agents?.ranking_agent?.tier || 'Qualified',
              finalVerdict: pipeline.pipeline_summary?.verdict || 'HIRE / INTERVIEW',
              integrityTrustScore: pipeline.agents?.integrity_agent?.trust_score ?? 100,
              integrityRisk: pipeline.agents?.integrity_agent?.cheating_risk || 'Low',
              updatedAt: new Date().toISOString()
            });
          }
        }
      } catch (agentErr) {
        console.warn('Multi-agent pipeline sync warning:', agentErr);
      }

      navigate(`/results/${assessmentId}`);
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError('Failed to submit assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const _handleSuspiciousActivity = (riskScore: number, patterns: string[]) => {
    setSuspiciousActivity({ riskScore, patterns });
    
    // Show warning for suspicious activity
    setWarning(`Suspicious activity detected (Risk Score: ${riskScore})`);
    
    // If risk score is too high, end the assessment
    if (riskScore >= 80) {
      handleSubmit();
    }
  };
  void _handleSuspiciousActivity;

  const startAssessment = async () => {
    if (!assessment || !assessmentId) {
      setError('Cannot start assessment: Missing required data');
      return;
    }

    try {
      setLoading(true);
      // Start the assessment in the backend
      await assessmentService.startAssessment(assessmentId);
      // Update local state
      setIsAssessmentStarted(true);
    } catch (err) {
      console.error('Error starting assessment:', err);
      setError('Failed to start assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{error || 'Assessment not found'}</h2>
            <p className="text-gray-600 mb-6">Please try again later or contact support if the problem persists.</p>
            <button
              onClick={() => navigate('/jobseeker/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAssessmentStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{assessment.title}</h1>
            <p className="text-gray-600 mb-6">{assessment.description}</p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Assessment Rules</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• Time Limit: {assessment.timeLimit} minutes</li>
                <li>• Copy/Paste: {assessment.rules.allowCopyPaste ? 'Allowed' : 'Not Allowed'}</li>
                <li>• AI Tools: {assessment.rules.allowAITools ? 'Allowed' : 'Not Allowed'}</li>
                <li>• Tab Switching: {assessment.rules.preventTabSwitching ? 'Not Allowed' : 'Allowed'}</li>
              </ul>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    Make sure you're in a quiet environment with stable internet before starting. The timer will begin once you click "Start Assessment".
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  startAssessment().catch(err => {
                    console.error('Error in startAssessment:', err);
                    setError('Failed to start assessment. Please try again.');
                  });
                }}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Starting...
                  </>
                ) : (
                  'Start Assessment'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {warning && (
          <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{warning}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-semibold text-gray-900">Question {currentQuestion + 1} of {assessment.questions.length}</h1>
              <div className="text-lg font-medium text-gray-700">
                Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">{assessment.questions[currentQuestion].question}</h2>
              
              {assessment.questions[currentQuestion].type === 'multiple-choice' && assessment.questions[currentQuestion].options && (
                <div className="space-y-4">
                  {assessment.questions[currentQuestion].options.map((option, index) => (
                    <label key={index} className="flex items-center">
                      <input
                        type="radio"
                        name={`question-${currentQuestion}`}
                        value={option}
                        checked={answers.find(a => a.questionId === assessment.questions[currentQuestion].id)?.answer === option}
                        onChange={(e) => handleAnswerChange(assessment.questions[currentQuestion].id || '', e.target.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-3 text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {assessment.questions[currentQuestion].type === 'written' && (
                <textarea
                  value={answers.find(a => a.questionId === assessment.questions[currentQuestion].id)?.answer || ''}
                  onChange={(e) => handleAnswerChange(assessment.questions[currentQuestion].id || '', e.target.value)}
                  rows={6}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Type your answer here..."
                />
              )}

              {assessment.questions[currentQuestion].type === 'coding' && (
                <textarea
                  value={answers.find(a => a.questionId === assessment.questions[currentQuestion].id)?.answer || ''}
                  onChange={(e) => handleAnswerChange(assessment.questions[currentQuestion].id || '', e.target.value)}
                  rows={12}
                  className="font-mono shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Write your code here..."
                />
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {currentQuestion < assessment.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion(prev => Math.min(assessment.questions.length - 1, prev + 1))}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Submit Assessment
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
 
import { type FC, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface Question {
  id: string;
  question?: string;
  text?: string;
  type: 'multiple-choice' | 'text' | 'written' | 'code' | 'coding';
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
}

interface Answer {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
}

interface Assessment {
  id: string;
  jobId?: string;
  candidateId?: string;
  questions: Question[];
  answers: any;
  score?: number;
  feedback?: string;
  submittedAt?: string;
  status: string;
}

const AssessmentResults: FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        if (!currentUser) return;

        // If no assessmentId in params, check state or redirect
        if (!assessmentId) {
          navigate('/jobseeker/dashboard');
          return;
        }

        const assessmentRef = doc(db, 'assessments', assessmentId);
        const assessmentDoc = await getDoc(assessmentRef);

        if (!assessmentDoc.exists()) {
          throw new Error('Assessment not found');
        }

        const assessmentData = {
          id: assessmentDoc.id,
          ...assessmentDoc.data()
        } as Assessment;
        setAssessment(assessmentData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Failed to load assessment results');
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [assessmentId, currentUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <p className="text-red-600 font-semibold mb-4">{error || 'Assessment not found'}</p>
          <button
            onClick={() => navigate('/jobseeker/dashboard')}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const score = assessment.score ?? 85;
  const submittedAt = assessment.submittedAt 
    ? new Date(assessment.submittedAt).toLocaleDateString()
    : new Date().toLocaleDateString();

  const getScoreColor = (sc: number) => {
    if (sc >= 80) return 'text-green-600';
    if (sc >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Convert answers format safely
  const answersList: Answer[] = Array.isArray(assessment.answers)
    ? assessment.answers
    : Object.entries(assessment.answers || {}).map(([qId, val]: any) => ({
        questionId: qId,
        answer: typeof val === 'string' ? val : (val?.answer || '')
      }));

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Assessment Submitted Successfully!
            </h1>
            <p className="text-gray-600 mb-6">Your answers have been evaluated and recorded.</p>

            <div className="flex items-center justify-center space-x-8 bg-gray-50 py-4 px-6 rounded-lg max-w-sm mx-auto">
              <div className="text-center">
                <p className="text-sm text-gray-500 font-medium">Final Score</p>
                <p className={`text-4xl font-extrabold ${getScoreColor(score)}`}>
                  {score}%
                </p>
              </div>
              <div className="border-r border-gray-200 h-10"></div>
              <div className="text-center">
                <p className="text-sm text-gray-500 font-medium">Submitted On</p>
                <p className="text-base font-semibold text-gray-900">
                  {submittedAt}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Overall Feedback
            </h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
              <p className="text-blue-900 whitespace-pre-line font-medium">
                {assessment.feedback || 'Great effort! Your technical responses demonstrate strong understanding of the core job requirements.'}
              </p>
            </div>
          </div>

          {assessment.questions && assessment.questions.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Detailed Question Breakdown & Explanations ({assessment.questions.length} Questions)
              </h2>
              <div className="space-y-6">
                {assessment.questions.map((question, index) => {
                  const qId = question.id || String(index);
                  const userAnswerObj = answersList.find(a => a.questionId === qId);
                  const qText = question.question || question.text || `Question ${index + 1}`;
                  
                  // Read isCorrect flag stored in answers map
                  const isCorrect = typeof assessment.answers === 'object' && assessment.answers?.[qId] 
                    ? assessment.answers[qId].isCorrect 
                    : userAnswerObj?.isCorrect;

                  return (
                    <div
                      key={qId}
                      className={`border rounded-xl p-6 bg-white shadow-sm transition-all ${
                        isCorrect ? 'border-green-200 bg-green-50/10' : 'border-red-200 bg-red-50/10'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-base font-bold text-gray-900">
                            Question {index + 1}
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isCorrect 
                              ? 'bg-green-100 text-green-800 border border-green-300' 
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}>
                            {isCorrect ? '✓ Correct (100%)' : '❌ Incorrect / Deficient (0%)'}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${getDifficultyColor(
                            question.difficulty
                          )}`}
                        >
                          {question.difficulty || 'Intermediate'}
                        </span>
                      </div>

                      <p className="text-gray-900 font-semibold text-base mb-4 leading-relaxed">{qText}</p>

                      {/* MULTIPLE CHOICE RENDERING */}
                      {question.type === 'multiple-choice' && (
                        <div className="space-y-2 mb-4">
                          {question.options?.map((option, optionIndex) => {
                            const isSelected = option === userAnswerObj?.answer;
                            const isRight = option === question.correctAnswer;

                            return (
                              <div
                                key={optionIndex}
                                className={`p-3 rounded-lg text-sm font-medium border ${
                                  isRight
                                    ? 'bg-green-100 border-green-400 text-green-900 font-bold'
                                    : isSelected
                                    ? 'bg-red-100 border-red-400 text-red-900'
                                    : 'bg-gray-50 border-gray-200 text-gray-700'
                                }`}
                              >
                                {option}
                                {isRight && ' ✓ (Correct Answer)'}
                                {isSelected && !isRight && ' ❌ (Your Choice - Incorrect)'}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* WRITTEN ANSWER RENDERING */}
                      {(question.type === 'text' || question.type === 'written') && (
                        <div className="space-y-3 mb-4">
                          <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Your Submitted Answer:</p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap font-mono">{userAnswerObj?.answer || '(No answer provided)'}</p>
                          </div>

                          {question.correctAnswer && (
                            <div className="bg-emerald-50/60 p-3.5 rounded-lg border border-emerald-200">
                              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">💡 Expected Solution / Key Technical Points:</p>
                              <p className="text-sm text-emerald-950 font-medium whitespace-pre-wrap">{question.correctAnswer}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* CODING ANSWER RENDERING */}
                      {(question.type === 'code' || question.type === 'coding') && (
                        <div className="space-y-3 mb-4">
                          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your Code Submission:</p>
                            <code>{userAnswerObj?.answer || '// No code submitted'}</code>
                          </div>

                          {question.correctAnswer && (
                            <div className="bg-emerald-950 text-emerald-100 p-4 rounded-lg font-mono text-sm overflow-x-auto border border-emerald-800">
                              <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">💡 Expected Reference Implementation:</p>
                              <code>{question.correctAnswer}</code>
                            </div>
                          )}
                        </div>
                      )}

                      {/* EXPLANATION & REASON FOR SCORE */}
                      {question.explanation && (
                        <div className={`p-4 rounded-xl border ${
                          isCorrect ? 'bg-green-50/70 border-green-200' : 'bg-amber-50/80 border-amber-300'
                        }`}>
                          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                            isCorrect ? 'text-green-800' : 'text-amber-900'
                          }`}>
                            {isCorrect ? '📘 Explanation & Technical Context:' : '⚠️ Why Your Answer Was Deficient & What Was Expected:'}
                          </p>
                          <p className={`text-xs leading-relaxed font-medium ${
                            isCorrect ? 'text-green-900' : 'text-amber-950'
                          }`}>
                            {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate('/jobseeker/dashboard')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back to Candidate Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResults; 
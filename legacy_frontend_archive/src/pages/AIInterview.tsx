import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import axios from 'axios';

interface Message {
  role: 'system' | 'interviewer' | 'candidate';
  content: string;
  rating?: number;
  feedback?: string;
  timestamp: string;
}

export default function AIInterview() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [application, setApplication] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [candidateInput, setCandidateInput] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [averageScore, setAverageScore] = useState<number>(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  // Load Application details
  useEffect(() => {
    async function loadApp() {
      if (!applicationId) return;
      try {
        setLoading(true);
        const appSnap = await getDoc(doc(db, 'applications', applicationId));
        if (appSnap.exists()) {
          setApplication({ id: appSnap.id, ...appSnap.data() });
        }
      } catch (err) {
        console.error('Error fetching application for interview:', err);
      } finally {
        setLoading(false);
      }
    }
    loadApp();
  }, [applicationId]);

  // Initialize Interview
  const startInterview = async () => {
    if (!application) return;
    setInterviewStarted(true);
    setIsAiThinking(true);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/ai-interview/turn', {
        job_title: application.jobTitle,
        requirements: application.matchedSkills?.concat(application.missingSkills || []) || [application.jobTitle],
        candidate_name: application.candidateName || currentUser?.displayName || 'Candidate',
        candidate_cv: application.cvText || '',
        identified_gaps: application.missingSkills || ['System Design', 'Performance'],
        conversation_history: [],
        candidate_response: null
      });

      if (res.data?.interviewer_text) {
        setMessages([
          {
            role: 'interviewer',
            content: res.data.interviewer_text,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      }
    } catch (err) {
      console.error('Error initiating interview:', err);
      setMessages([
        {
          role: 'interviewer',
          content: `Hello ${application.candidateName || 'there'}! Welcome to your technical interview for the ${application.jobTitle} position. Could you introduce yourself and explain how you design resilient architectures?`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Submit Candidate Response
  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateInput.trim() || isAiThinking || !application) return;

    const userText = candidateInput.trim();
    setCandidateInput('');

    const newCandidateMsg: Message = {
      role: 'candidate',
      content: userText,
      timestamp: new Date().toLocaleTimeString()
    };

    const updatedHistory = [...messages, newCandidateMsg];
    setMessages(updatedHistory);
    setIsAiThinking(true);

    try {
      const historyPayload = updatedHistory.map(m => ({
        role: m.role === 'interviewer' ? 'assistant' : 'user',
        content: m.content
      }));

      const res = await axios.post('http://127.0.0.1:8000/api/ai-interview/turn', {
        job_title: application.jobTitle,
        requirements: application.matchedSkills?.concat(application.missingSkills || []) || [application.jobTitle],
        candidate_name: application.candidateName || currentUser?.displayName || 'Candidate',
        candidate_cv: application.cvText || '',
        identified_gaps: application.missingSkills || ['System Design'],
        conversation_history: historyPayload,
        candidate_response: userText
      });

      const rating = res.data?.rating || 80;
      const feedback = res.data?.feedback || 'Good depth.';
      const completed = res.data?.is_complete || updatedHistory.filter(m => m.role === 'candidate').length >= 4;

      const aiMsg: Message = {
        role: 'interviewer',
        content: res.data?.interviewer_text || 'Thank you for explaining that clearly.',
        rating,
        feedback,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, aiMsg]);

      if (completed) {
        setIsComplete(true);
        const ratings = updatedHistory.filter(m => m.rating).map(m => m.rating as number).concat([rating]);
        const avg = Math.round(ratings.reduce((a, b) => a + b, 0) / Math.max(1, ratings.length));
        setAverageScore(avg);

        // Update application in Firestore
        await updateDoc(doc(db, 'applications', application.id), {
          interviewCompleted: true,
          interviewScore: avg,
          interviewFeedback: feedback,
          interviewTimestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error submitting interview response:', err);
    } finally {
      setIsAiThinking(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0F4C3A]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="dashboard">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Phase II • Conversational AI
              </span>
              <span className="text-xs text-gray-400">Groq LLaMA-3.1 Powered</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">AI Technical Interview</h1>
            <p className="text-xs text-gray-300 mt-1">
              Position: <span className="text-emerald-300 font-bold">{application?.jobTitle}</span> • Candidate: <span className="font-bold">{application?.candidateName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isComplete ? (
              <div className="bg-emerald-500/20 border border-emerald-400 px-4 py-2 rounded-xl text-center">
                <span className="text-[10px] text-emerald-300 uppercase block font-bold">Interview Score</span>
                <span className="text-2xl font-black text-emerald-400">{averageScore}%</span>
              </div>
            ) : interviewStarted ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-900/40 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Live Session Active
              </div>
            ) : null}
          </div>
        </div>

        {/* Start Screen */}
        {!interviewStarted ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-inner border border-emerald-100">
              🎙️
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Welcome to your AI Technical Interview</h2>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Our Lead AI Technical Interviewer will ask you adaptive, role-specific questions tailored to your resume evidence and technical background.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl max-w-md mx-auto text-left text-xs space-y-2 border border-gray-200">
              <p className="font-bold text-gray-800">📋 Interview Protocol:</p>
              <p className="text-gray-600">• 4 adaptive questions covering system architecture and technical depths.</p>
              <p className="text-gray-600">• Type comprehensive answers explaining your reasoning and trade-offs.</p>
              <p className="text-gray-600">• Responses are scored in real-time and saved directly to your recruiter dossier.</p>
            </div>

            <button
              onClick={startInterview}
              className="px-8 py-3 rounded-xl bg-[#0F4C3A] hover:bg-[#093327] text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all"
            >
              Start Technical Interview 🚀
            </button>
          </div>
        ) : (
          /* Live Chat Window */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    m.role === 'candidate' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      {m.role === 'candidate' ? 'You (Candidate)' : 'HIRICA AI Interviewer'}
                    </span>
                    <span className="text-[10px] text-gray-400">{m.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                      m.role === 'candidate'
                        ? 'bg-[#0F4C3A] text-white rounded-tr-none'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>

                    {m.rating !== undefined && (
                      <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                        <span className="text-emerald-700 font-bold">
                          Rating: {m.rating}% • {m.feedback}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isAiThinking && (
                <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-2xl max-w-xs text-xs text-gray-500 shadow-xs">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  AI Interviewer is analyzing response...
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Bar or Completion Banner */}
            {isComplete ? (
              <div className="p-5 bg-emerald-50 border-t border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">🎉 Interview Complete!</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Your answers and ratings have been evaluated and recorded into the recruiter dossier.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/jobseeker/dashboard')}
                  className="px-5 py-2.5 bg-[#0F4C3A] text-white text-xs font-bold rounded-xl hover:bg-[#093327]"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendResponse} className="p-4 bg-white border-t border-gray-200 flex gap-2">
                <textarea
                  rows={2}
                  required
                  value={candidateInput}
                  onChange={(e) => setCandidateInput(e.target.value)}
                  placeholder="Type your technical response here (explain architecture, reasoning, libraries used)..."
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-[#0F4C3A] focus:border-[#0F4C3A] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendResponse(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!candidateInput.trim() || isAiThinking}
                  className="px-6 py-2.5 bg-[#0F4C3A] hover:bg-[#093327] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all self-end"
                >
                  Send ➔
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

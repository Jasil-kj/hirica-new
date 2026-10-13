import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import apiClient from '../services/apiClient';

interface Message {
  role: 'interviewer' | 'candidate';
  content: string;
  rating?: number;
  feedback?: string;
  timestamp: string;
}

type InterviewState =
  | 'idle'
  | 'connecting'
  | 'ai_speaking'
  | 'listening'
  | 'processing'
  | 'completed';

export default function AIInterview() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [application, setApplication] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewState, setInterviewState] = useState<InterviewState>('idle');
  const [isComplete, setIsComplete] = useState(false);
  const [averageScore, setAverageScore] = useState<number>(0);
  const [currentRating, setCurrentRating] = useState<number | null>(null);

  // Media & Device Controls
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Live Captions & Transcripts
  const [liveTranscript, setLiveTranscript] = useState('');
  const [activeCaption, setActiveCaption] = useState<string>('');
  const [textFallbackInput, setTextFallbackInput] = useState('');
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);

  // Timer & Progress
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const currentTurnRef = useRef<number>(0);
  const isSpeakingRef = useRef<boolean>(false);

  // Track conversation turns count
  const turnCount = messages.filter(m => m.role === 'candidate').length;
  const maxTurns = 5;

  // Format timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  // Timer interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (interviewStarted && !isComplete) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [interviewStarted, isComplete]);

  // Load Application details
  useEffect(() => {
    async function loadApp() {
      if (!applicationId) return;
      try {
        setLoading(true);
        const appSnap = await getDoc(doc(db, 'applications', applicationId));
        if (appSnap.exists()) {
          setApplication({ id: appSnap.id, ...appSnap.data() });
        } else {
          // Fallback demo profile if application doc doesn't exist
          setApplication({
            id: applicationId,
            jobTitle: 'AI / Software Engineer',
            candidateName: currentUser?.displayName || 'Candidate',
            matchedSkills: ['Python', 'System Architecture', 'Machine Learning'],
            missingSkills: ['Distributed Systems', 'Caching']
          });
        }
      } catch (err) {
        console.error('Error fetching application:', err);
      } finally {
        setLoading(false);
      }
    }
    loadApp();
  }, [applicationId, currentUser]);

  // Speech Synthesis: Make AI Speak Audibly
  const speakAiMessage = useCallback((text: string, onEndCallback?: () => void) => {
    if (!('speechSynthesis' in window)) {
      if (onEndCallback) onEndCallback();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Pick a professional natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Guy') || v.name.includes('Samantha')));
      if (preferred) utterance.voice = preferred;

      isSpeakingRef.current = true;
      setInterviewState('ai_speaking');
      setActiveCaption(text);

      utterance.onend = () => {
        isSpeakingRef.current = false;
        if (onEndCallback) onEndCallback();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis notice:', e);
        isSpeakingRef.current = false;
        if (onEndCallback) onEndCallback();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
      isSpeakingRef.current = false;
      if (onEndCallback) onEndCallback();
    }
  }, []);

  // Web Speech API: Initialize Speech Recognition for Candidate Voice Input
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      // Ignore microphone input while the AI interviewer is actively speaking
      if (isSpeakingRef.current) return;

      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          currentTranscript += transcript + ' ';
        } else {
          currentTranscript += transcript;
        }
      }

      const clean = currentTranscript.trim();
      if (clean) {
        setLiveTranscript(clean);
        setActiveCaption(`Candidate: "${clean}"`);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition warning:', event.error);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, []);

  // Camera initialization
  const startCameraStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => videoRef.current?.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Media access note:', err);
      setPermissionError('Camera or microphone permissions were blocked. You can still use text input fallback.');
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
    }
  };

  // Toggle Mic
  const toggleMic = () => {
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicMuted(!audioTrack.enabled);
      if (!audioTrack.enabled && recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      } else if (audioTrack.enabled && interviewState === 'listening' && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch {}
      }
    }
  };

  // Start Candidate Listening Session
  const startListeningSession = useCallback(() => {
    if (isMicMuted) return;
    setInterviewState('listening');
    setLiveTranscript('');
    try {
      recognitionRef.current?.start();
    } catch {
      // Already running or non-blocking
    }
  }, [isMicMuted]);

  // Stop Candidate Listening Session
  const stopListeningSession = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
  }, []);

  // Start Meeting Flow (Phase 1: Introduction)
  const handleJoinMeeting = async () => {
    setInterviewStarted(true);
    setInterviewState('connecting');
    await startCameraStream();

    try {
      const res = await apiClient.post('/ai-interview/turn', {
        job_title: application?.jobTitle || 'Software Engineer',
        requirements: application?.matchedSkills || ['Python', 'System Architecture'],
        candidate_name: application?.candidateName || currentUser?.displayName || 'Candidate',
        candidate_cv: application?.cvText || '',
        identified_gaps: application?.missingSkills || ['Distributed Systems'],
        conversation_history: [],
        candidate_response: null
      });

      const introText = res.data?.interviewer_text ||
        `Hello ${application?.candidateName || 'there'}! Welcome to your technical interview for the ${application?.jobTitle || 'Engineering'} position at HIRICA. Let's begin by discussing how you architect resilient systems.`;

      const introMsg: Message = {
        role: 'interviewer',
        content: introText,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages([introMsg]);
      speakAiMessage(introText, () => {
        startListeningSession();
      });
    } catch (err) {
      console.warn('API Turn start error:', err);
      const fallbackIntro = `Hello ${application?.candidateName || 'there'}! Welcome to your technical interview for the ${application?.jobTitle} position. Could you introduce yourself and explain your architectural approach to scalable systems?`;
      const fallbackMsg: Message = {
        role: 'interviewer',
        content: fallbackIntro,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages([fallbackMsg]);
      speakAiMessage(fallbackIntro, () => {
        startListeningSession();
      });
    }
  };

  // Submit Candidate's Spoken (or Typed) Answer
  const handleProcessCandidateAnswer = async (answerText: string) => {
    const cleanAnswer = answerText.trim();
    if (!cleanAnswer || interviewState === 'processing' || isSpeakingRef.current) return;

    // Stop candidate recording
    stopListeningSession();
    setInterviewState('processing');
    setLiveTranscript('');
    setActiveCaption(`Processing candidate response: "${cleanAnswer}"...`);

    const newCandidateMsg: Message = {
      role: 'candidate',
      content: cleanAnswer,
      timestamp: new Date().toLocaleTimeString()
    };

    const updatedHistory = [...messages, newCandidateMsg];
    setMessages(updatedHistory);

    try {
      // Map history for API
      const historyPayload = updatedHistory.map(m => ({
        role: m.role === 'interviewer' ? 'assistant' : 'user',
        content: m.content
      }));

      const res = await apiClient.post('/ai-interview/turn', {
        job_title: application?.jobTitle || 'Software Engineer',
        requirements: application?.matchedSkills || ['Python', 'System Architecture'],
        candidate_name: application?.candidateName || currentUser?.displayName || 'Candidate',
        candidate_cv: application?.cvText || '',
        identified_gaps: application?.missingSkills || ['Performance', 'Scalability'],
        conversation_history: historyPayload,
        candidate_response: cleanAnswer
      });

      const nextTurnNumber = currentTurnRef.current + 1;
      currentTurnRef.current = nextTurnNumber;

      const rating = res.data?.rating !== undefined && res.data?.rating !== null ? res.data.rating : 75;
      const feedback = res.data?.feedback || 'Technical answer recorded.';
      const completed = Boolean(res.data?.is_complete) || nextTurnNumber >= maxTurns;
      const nextAiText = res.data?.interviewer_text || 'Thank you. Can you elaborate further on how you test and benchmark this design?';

      setCurrentRating(rating);

      const aiMsg: Message = {
        role: 'interviewer',
        content: nextAiText,
        rating,
        feedback,
        timestamp: new Date().toLocaleTimeString()
      };

      const finalMessages = [...updatedHistory, aiMsg];
      setMessages(finalMessages);

      if (completed) {
        setIsComplete(true);
        const ratedTurns = finalMessages.filter(m => typeof m.rating === 'number');
        const avg = Math.round(
          ratedTurns.reduce((sum, m) => sum + (m.rating || 0), 0) / Math.max(1, ratedTurns.length)
        );
        setAverageScore(avg);

        // Persist completed transcript and ratings to Firestore
        if (application?.id) {
          try {
            await updateDoc(doc(db, 'applications', application.id), {
              interviewCompleted: true,
              interviewScore: avg,
              interviewFeedback: feedback,
              interviewTranscript: finalMessages,
              interviewTimestamp: new Date().toISOString()
            });
          } catch (e) {
            console.warn('Firestore interview persistence warning:', e);
          }
        }

        speakAiMessage(nextAiText, () => {
          setInterviewState('completed');
          setActiveCaption('Interview completed successfully. Thank you!');
        });
      } else {
        // AI speaks follow-up question, then re-arms listening mode
        speakAiMessage(nextAiText, () => {
          startListeningSession();
        });
      }
    } catch (err) {
      console.error('Turn submission error:', err);
      setInterviewState('listening');
    }
  };

  // End Interview manually
  const handleEndInterview = async () => {
    window.speechSynthesis?.cancel();
    stopListeningSession();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setIsComplete(true);
    setInterviewState('completed');

    if (application?.id && messages.length > 1) {
      const ratedTurns = messages.filter(m => typeof m.rating === 'number');
      const avg = Math.round(
        ratedTurns.reduce((sum, m) => sum + (m.rating || 0), 0) / Math.max(1, ratedTurns.length)
      );
      try {
        await updateDoc(doc(db, 'applications', application.id), {
          interviewCompleted: true,
          interviewScore: avg || 80,
          interviewTranscript: messages,
          interviewTimestamp: new Date().toISOString()
        });
      } catch {}
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      try { recognitionRef.current?.stop(); } catch {}
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-olive-800 border-t-transparent" />
          <p className="text-xs font-mono text-olive-800 font-bold">Connecting to HIRICA Technical Interview Room...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'HIRICA Portal', href: '/jobseeker/dashboard' },
        { label: 'AI Video Interview Room' }
      ]}
    >
      <div className="max-w-6xl mx-auto space-y-4">
        {/* TOP STATUS BAR */}
        <div className="card-enterprise p-3 px-4 border-olive-300 flex items-center justify-between shadow-xs bg-white">
          <div className="flex items-center gap-3">
            <div className="h-8 px-2 rounded bg-black flex items-center justify-center border border-olive-800">
              <img src="/hirica-logo-transparent.png" alt="HIRICA" className="h-5 w-auto object-contain brightness-125" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{application?.jobTitle}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-olive-100 text-olive-900 font-bold">
                  Stage 3: AI Video Interview
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Candidate: {application?.candidateName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {interviewStarted && (
              <>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">SESSION TIME</span>
                  <span className="text-xs font-mono font-bold text-slate-900">{formatTime(secondsElapsed)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">PROGRESS</span>
                  <span className="text-xs font-mono font-bold text-olive-800">Turn {turnCount} / {maxTurns}</span>
                </div>
              </>
            )}
            <button
              onClick={() => setShowTranscriptDrawer(!showTranscriptDrawer)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
            >
              <span>📄</span>
              <span className="hidden sm:inline">Transcript</span>
            </button>
          </div>
        </div>

        {/* LOBBY / PRE-JOIN CANVAS */}
        {!interviewStarted ? (
          <div className="card-enterprise p-8 text-center space-y-6 border-olive-300 max-w-2xl mx-auto shadow-md">
            <div className="w-20 h-20 bg-olive-50 rounded-full flex items-center justify-center mx-auto text-4xl border-2 border-olive-300 shadow-inner">
              🤖
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-olive-800 font-bold block">
                HIRICA INTELLIGENT RECRUITMENT SUITE
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Ready to join your AI Technical Interview?</h2>
              <p className="text-xs text-slate-600 mt-1.5 max-w-md mx-auto leading-relaxed">
                You will speak with the HIRICA AI Technical Interviewer via voice and camera. The interviewer will ask technical questions, listen to your spoken answers, and evaluate your engineering knowledge.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 text-slate-700">
              <p className="font-bold text-slate-900">Room Guidelines:</p>
              <div className="space-y-1 text-[11px]">
                <p>• <strong>Voice Interaction</strong>: The AI speaks aloud and listens to your microphone.</p>
                <p>• <strong>Objective Technical Rubric</strong>: Answers are evaluated on architecture and logic (irrelevant answers receive low scores).</p>
                <p>• <strong>Google Meet Experience</strong>: Real-time live captions and controls are active throughout.</p>
              </div>
            </div>

            <button
              onClick={handleJoinMeeting}
              className="btn-brand !py-3 !px-8 text-sm font-bold shadow-md tracking-wide"
            >
              Join AI Interview Room ➔
            </button>
          </div>
        ) : (
          /* GOOGLE MEET STYLE INTERVIEW ROOM */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* MAIN VIDEO ROOM (8 or 12 Cols depending on transcript drawer) */}
            <div className={`${showTranscriptDrawer ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
              {/* VIDEO GRID (AI Interviewer + Candidate PiP) */}
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden shadow-xl aspect-video min-h-[420px] flex items-center justify-center border border-slate-800">
                {/* AI INTERVIEWER AVATAR & SPEAKING WAVEFORM */}
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-4 z-10">
                  <div className="relative">
                    {/* Pulsing ring during AI speech */}
                    <div
                      className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                        interviewState === 'ai_speaking'
                          ? 'bg-olive-800/80 ring-8 ring-emerald-500/40 scale-105 shadow-2xl'
                          : 'bg-slate-800/90 border-2 border-slate-700'
                      }`}
                    >
                      <span className="text-6xl select-none">🤖</span>
                    </div>

                    {/* State badge */}
                    <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border shadow uppercase ${
                          interviewState === 'ai_speaking'
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse'
                            : interviewState === 'listening'
                            ? 'bg-blue-500 text-white border-blue-400 animate-pulse'
                            : interviewState === 'processing'
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-700 text-slate-300 border-slate-600'
                        }`}
                      >
                        {interviewState === 'ai_speaking' && 'AI Speaking 🔊'}
                        {interviewState === 'listening' && 'Listening to you 🎙️'}
                        {interviewState === 'processing' && 'Evaluating Answer 🧠'}
                        {interviewState === 'connecting' && 'Connecting...'}
                        {interviewState === 'completed' && 'Interview Concluded'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide">HIRICA Lead AI Interviewer</h3>
                    <p className="text-xs text-slate-400 font-mono">Specialized Technical Assessor • {application?.jobTitle}</p>
                  </div>

                  {/* Audio Waveform visualization */}
                  {interviewState === 'ai_speaking' && (
                    <div className="flex items-center gap-1.5 h-6">
                      <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-3" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-5" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-6" style={{ animationDelay: '0.3s' }} />
                      <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-4" style={{ animationDelay: '0.15s' }} />
                      <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-6" style={{ animationDelay: '0.25s' }} />
                      <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-3" style={{ animationDelay: '0.35s' }} />
                    </div>
                  )}

                  {interviewState === 'listening' && (
                    <div className="flex items-center gap-1.5 h-6">
                      <span className="w-1 bg-blue-400 rounded-full animate-pulse h-3" />
                      <span className="w-1 bg-blue-400 rounded-full animate-pulse h-4" />
                      <span className="w-1 bg-blue-400 rounded-full animate-pulse h-5" />
                      <span className="w-1 bg-blue-400 rounded-full animate-pulse h-3" />
                    </div>
                  )}
                </div>

                {/* CANDIDATE LIVE WEBCAM PiP (Picture-in-Picture) */}
                <div className="absolute bottom-4 right-4 w-44 sm:w-52 aspect-video bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl z-20">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : 'block'}`}
                  />
                  {isCameraOff && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 text-xs">
                      <span>📷</span>
                      <span className="text-[10px] mt-1">Camera Off</span>
                    </div>
                  )}
                  <div className="absolute bottom-1.5 left-2 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-mono text-white flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isMicMuted ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    <span>{application?.candidateName || 'You'}</span>
                  </div>
                </div>

                {/* LIVE SUBTITLES & CAPTIONS OVERLAY */}
                {activeCaption && (
                  <div className="absolute bottom-4 left-4 right-52 sm:right-60 bg-black/85 backdrop-blur-md p-2.5 px-3.5 rounded-xl border border-slate-700/80 text-white shadow-lg pointer-events-none">
                    <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">
                      LIVE TRANSCRIPTION
                    </span>
                    <p className="text-xs leading-relaxed font-sans mt-0.5 line-clamp-2">
                      {activeCaption}
                    </p>
                  </div>
                )}
              </div>

              {/* LIVE CANDIDATE ANSWER BAR / STATUS */}
              {interviewState === 'listening' && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                    <div>
                      <p className="font-bold text-blue-900">
                        Microphone Active — Speak your technical answer
                      </p>
                      <p className="text-[11px] text-blue-700">
                        {liveTranscript ? `"${liveTranscript}"` : 'Listening... explain your engineering trade-offs and approach.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleProcessCandidateAnswer(liveTranscript)}
                    disabled={!liveTranscript.trim()}
                    className="btn-brand !py-1.5 !px-4 text-xs font-bold disabled:opacity-40 whitespace-nowrap self-end sm:self-auto"
                  >
                    Done Speaking ➔
                  </button>
                </div>
              )}

              {/* TEXT FALLBACK INPUT (For browsers without speech recognition or candidate preference) */}
              <div className="card-enterprise p-3 border-olive-200 bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (textFallbackInput.trim()) {
                      handleProcessCandidateAnswer(textFallbackInput);
                      setTextFallbackInput('');
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={textFallbackInput}
                    onChange={(e) => setTextFallbackInput(e.target.value)}
                    placeholder="Or type technical answer here if microphone unavailable..."
                    disabled={interviewState === 'processing' || isComplete}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-olive-600"
                  />
                  <button
                    type="submit"
                    disabled={!textFallbackInput.trim() || interviewState === 'processing' || isComplete}
                    className="btn-brand !py-2 !px-4 text-xs font-bold disabled:opacity-40"
                  >
                    Submit Answer
                  </button>
                </form>
              </div>

              {/* GOOGLE MEET STYLE BOTTOM CONTROL BAR */}
              <div className="p-3 bg-slate-900 rounded-xl flex items-center justify-between text-white shadow-md">
                <div className="text-xs font-mono text-slate-400 pl-2">
                  <span>Room: </span>
                  <strong className="text-white">HIRICA-MEET-{applicationId?.slice(0, 6) || 'ROOM'}</strong>
                </div>

                {/* Center Controls */}
                <div className="flex items-center gap-3">
                  {/* Microphone Toggle */}
                  <button
                    onClick={toggleMic}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isMicMuted ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                    title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                  >
                    {isMicMuted ? '🔇' : '🎙️'}
                  </button>

                  {/* Camera Toggle */}
                  <button
                    onClick={toggleCamera}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isCameraOff ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                    title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  >
                    {isCameraOff ? '🚫' : '📹'}
                  </button>

                  {/* End Call Button */}
                  <button
                    onClick={handleEndInterview}
                    disabled={isComplete}
                    className="h-10 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                    title="End Interview Session"
                  >
                    <span>📞</span>
                    <span>End Interview</span>
                  </button>
                </div>

                {/* Score badge / status */}
                <div className="pr-2 text-right">
                  {currentRating !== null && (
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      Latest Turn: {currentRating}%
                    </span>
                  )}
                </div>
              </div>

              {permissionError && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-900">
                  ⚠️ {permissionError}
                </div>
              )}
            </div>

            {/* SECONDARY TRANSCRIPT & EVALUATION DRAWER (When Toggled) */}
            {showTranscriptDrawer && (
              <div className="lg:col-span-4 card-enterprise p-4 border-olive-200 bg-white space-y-4 max-h-[600px] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Interview Transcript & Rubrics
                  </h4>
                  <button
                    onClick={() => setShowTranscriptDrawer(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs space-y-1.5 border ${
                        m.role === 'candidate'
                          ? 'bg-olive-50 border-olive-200 text-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span className="font-bold uppercase">
                          {m.role === 'candidate' ? 'Candidate Spoken' : 'AI Technical Interviewer'}
                        </span>
                        <span>{m.timestamp}</span>
                      </div>
                      <p className="leading-relaxed">{m.content}</p>
                      {m.rating !== undefined && m.rating !== null && (
                        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono">
                          <span className="font-bold text-olive-800">Score: {m.rating}%</span>
                          {m.feedback && <span className="text-slate-500">{m.feedback}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPLETION POPUP MODAL */}
        {isComplete && (
          <div className="card-enterprise p-6 border-emerald-300 bg-emerald-50/50 shadow-md text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">AI Technical Interview Concluded</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                Your technical responses, trade-off evaluations, and spoken dialogue have been saved. The recruiter can inspect the full transcript in your Candidate Dossier.
              </p>
            </div>
            <div className="flex justify-center gap-4 text-xs font-mono">
              <div className="p-2.5 px-4 bg-white rounded-lg border border-emerald-200">
                <span className="text-[10px] text-slate-500 block">FINAL SCORE</span>
                <span className="text-xl font-bold text-emerald-900">{averageScore}%</span>
              </div>
              <div className="p-2.5 px-4 bg-white rounded-lg border border-emerald-200">
                <span className="text-[10px] text-slate-500 block">COMPLETED TURNS</span>
                <span className="text-xl font-bold text-slate-900">{turnCount} / {maxTurns}</span>
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={() => navigate('/jobseeker/dashboard')}
                className="btn-brand !py-2 !px-6 text-xs font-bold"
              >
                Return to Career Portal ➔
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

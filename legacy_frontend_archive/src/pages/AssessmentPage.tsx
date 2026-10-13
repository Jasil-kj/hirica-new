import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Box, 
    Typography, 
    Paper, 
    CircularProgress, 
    Alert,
    Button,
    TextField,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { Timer, Warning, Fullscreen, FullscreenExit } from '@mui/icons-material';
import { assessmentService, Assessment } from '../services/assessmentService';
import { useFullscreen } from '../hooks/useFullscreen';

export const AssessmentPage: React.FC = () => {
    const { assessmentId } = useParams<{ assessmentId: string }>();
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [showWarning, setShowWarning] = useState(false);
    const { isFullscreen, toggleFullscreen } = useFullscreen();

    // Load assessment
    useEffect(() => {
        const loadAssessment = async () => {
            try {
                if (!assessmentId) {
                    throw new Error('Assessment ID is required');
                }

                const loadedAssessment = await assessmentService.getAssessment(assessmentId);
                setAssessment(loadedAssessment);
                setTimeLeft(loadedAssessment.timeLimit * 60); // Convert to seconds
                
                // Start the assessment
                await assessmentService.startAssessment(assessmentId);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load assessment');
            } finally {
                setLoading(false);
            }
        };

        loadAssessment();
    }, [assessmentId]);

    // Timer effect
    useEffect(() => {
        if (!assessment || timeLeft <= 0) return;

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
    }, [assessment, timeLeft]);

    // Handle tab switching
    useEffect(() => {
        if (!assessment?.rules?.preventTabSwitching) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setShowWarning(true);
                assessmentService.recordSuspiciousActivity(
                    assessmentId!,
                    'tab_switch',
                    'User switched tabs during assessment'
                );
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [assessment]);

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < (assessment?.questions.length || 0) - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            if (!assessmentId) return;

            await assessmentService.submitAssessment(assessmentId, answers);
            navigate('/assessment-complete', { 
                state: { assessmentId } 
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit assessment');
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !assessment) {
        return (
            <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
                <Alert severity="error">
                    {error || 'Failed to load assessment'}
                </Alert>
                <Button 
                    variant="contained" 
                    onClick={() => navigate('/jobs')}
                    sx={{ mt: 2 }}
                >
                    Back to Jobs
                </Button>
            </Box>
        );
    }

    const currentQuestion = assessment.questions[currentQuestionIndex];
    const qId = currentQuestion.id || '';

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, px: 2 }}>
            {/* Header */}
            <Paper elevation={3} sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                    Question {currentQuestionIndex + 1} of {assessment.questions.length}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Timer color="primary" />
                        <Typography variant="body1">
                            {formatTime(timeLeft)}
                        </Typography>
                    </Box>
                    <IconButton onClick={toggleFullscreen}>
                        {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                    </IconButton>
                </Box>
            </Paper>

            {/* Question */}
            <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                    {currentQuestion.question}
                </Typography>

                {currentQuestion.type === 'multiple-choice' && (
                    <FormControl component="fieldset">
                        <RadioGroup
                            value={answers[qId] || ''}
                            onChange={(e) => handleAnswerChange(qId, e.target.value)}
                        >
                            {currentQuestion.options?.map((option, index) => (
                                <FormControlLabel
                                    key={index}
                                    value={option}
                                    control={<Radio />}
                                    label={option}
                                />
                            ))}
                        </RadioGroup>
                    </FormControl>
                )}

                {currentQuestion.type === 'written' && (
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={answers[qId] || ''}
                        onChange={(e) => handleAnswerChange(qId, e.target.value)}
                        placeholder="Type your answer here..."
                    />
                )}

                {currentQuestion.type === 'coding' && (
                    <TextField
                        fullWidth
                        multiline
                        rows={10}
                        value={answers[qId] || ''}
                        onChange={(e) => handleAnswerChange(qId, e.target.value)}
                        placeholder="Write your code here..."
                        sx={{ fontFamily: 'monospace' }}
                    />
                )}
            </Paper>

            {/* Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                    variant="outlined"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                >
                    Previous
                </Button>
                <Button
                    variant="contained"
                    onClick={currentQuestionIndex === assessment.questions.length - 1 ? handleSubmit : handleNext}
                >
                    {currentQuestionIndex === assessment.questions.length - 1 ? 'Submit' : 'Next'}
                </Button>
            </Box>

            {/* Warning Dialog */}
            <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Warning color="warning" />
                        Warning
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Switching tabs or windows during the assessment is not allowed.
                        This incident has been recorded.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowWarning(false)}>I Understand</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AssessmentPage;
 
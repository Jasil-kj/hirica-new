import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { JobPosting, Assessment } from '../services/assessmentService';
import { AssessmentGenerator } from './AssessmentGenerator';
import { 
    Box, 
    Typography, 
    Paper, 
    CircularProgress, 
    Alert,
    Button,
    Stepper,
    Step,
    StepLabel
} from '@mui/material';

const steps = ['Job Details', 'Assessment', 'Review'];

export const JobApplication: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get current user ID (you'll need to implement this based on your auth system)
    const candidateId = "current-user-id"; // Replace with actual user ID

    useEffect(() => {
        const fetchJobPosting = async () => {
            try {
                if (!jobId) {
                    throw new Error('Job ID is required');
                }

                const jobRef = doc(db, 'jobs', jobId);
                const jobSnapshot = await getDoc(jobRef);

                if (!jobSnapshot.exists()) {
                    throw new Error('Job posting not found');
                }

                setJobPosting({ id: jobSnapshot.id, ...jobSnapshot.data() } as JobPosting);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load job posting');
            } finally {
                setLoading(false);
            }
        };

        fetchJobPosting();
    }, [jobId]);

    const handleAssessmentGenerated = (generatedAssessment: Assessment) => {
        setAssessment(generatedAssessment);
        setActiveStep(1);
    };

    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !jobPosting) {
        return (
            <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
                <Alert severity="error">
                    {error || 'Failed to load job posting'}
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

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, px: 2 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {activeStep === 0 && (
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h4" gutterBottom>
                        {jobPosting.title}
                    </Typography>
                    
                    <Typography variant="body1" paragraph>
                        {jobPosting.description}
                    </Typography>

                    <Typography variant="h6" gutterBottom>
                        Requirements:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2 }}>
                        {jobPosting.requirements.map((req, index) => (
                            <Typography key={index} component="li" variant="body1">
                                {req}
                            </Typography>
                        ))}
                    </Box>

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleNext}
                        >
                            Start Assessment
                        </Button>
                    </Box>
                </Paper>
            )}

            {activeStep === 1 && (
                <AssessmentGenerator
                    jobPosting={jobPosting}
                    candidateId={candidateId}
                    onAssessmentGenerated={handleAssessmentGenerated}
                />
            )}

            {activeStep === 2 && assessment && (
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        Assessment Ready
                    </Typography>
                    
                    <Typography variant="body1" paragraph>
                        Your assessment has been generated and is ready to begin.
                        Please note the following rules:
                    </Typography>

                    <Box component="ul" sx={{ pl: 2, mb: 3 }}>
                        <Typography component="li" variant="body1">
                            Time Limit: {jobPosting.assessmentRules.timeLimit} minutes
                        </Typography>
                        <Typography component="li" variant="body1">
                            AI Tools: {jobPosting.assessmentRules.allowAITools ? 'Allowed' : 'Not Allowed'}
                        </Typography>
                        <Typography component="li" variant="body1">
                            Copy-Paste: {jobPosting.assessmentRules.allowCopyPaste ? 'Allowed' : 'Not Allowed'}
                        </Typography>
                        <Typography component="li" variant="body1">
                            Tab Switching: {jobPosting.assessmentRules.preventTabSwitching ? 'Not Allowed' : 'Allowed'}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                        <Button onClick={handleBack}>
                            Back
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate(`/assessment/${assessment.id}`)}
                        >
                            Begin Assessment
                        </Button>
                    </Box>
                </Paper>
            )}
        </Box>
    );
}; 
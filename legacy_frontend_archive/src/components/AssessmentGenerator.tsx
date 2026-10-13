import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentService, Assessment, JobPosting } from '../services/assessmentService';
import { Button, CircularProgress, Alert, Box, Typography, Paper } from '@mui/material';

interface AssessmentGeneratorProps {
    jobPosting: JobPosting;
    candidateId: string;
    onAssessmentGenerated: (assessment: Assessment) => void;
}

export const AssessmentGenerator: React.FC<AssessmentGeneratorProps> = ({
    jobPosting,
    candidateId: _candidateId,
    onAssessmentGenerated
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleGenerateAssessment = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Generating assessment for job:', jobPosting);
            
            // Generate the assessment
            const assessment = await assessmentService.generateAssessment(jobPosting);
            
            console.log('Assessment generated:', assessment);
            
            // Call the callback with the generated assessment
            onAssessmentGenerated(assessment);
            
            // Navigate to the assessment page
            navigate(`/assessment/${assessment.id}`);
        } catch (error) {
            console.error('Error generating assessment:', error);
            setError('Failed to generate assessment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Generate Assessment
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    Click the button below to generate an assessment based on the job requirements.
                </Typography>
                
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGenerateAssessment}
                    disabled={loading}
                    sx={{ minWidth: 200 }}
                >
                    {loading ? (
                        <>
                            <CircularProgress size={24} sx={{ mr: 1 }} />
                            Generating...
                        </>
                    ) : (
                        'Generate Assessment'
                    )}
                </Button>
            </Paper>
        </Box>
    );
}; 
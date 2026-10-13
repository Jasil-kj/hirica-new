import { FC, useEffect, useRef } from 'react';
import { antiCheatService, SessionEvent } from '../services/antiCheatService';

interface AntiCheatMonitorProps {
    assessmentId: string;
    candidateId: string;
    onSuspiciousActivity: (riskScore: number, patterns: string[]) => void;
}

export const AntiCheatMonitor: FC<AntiCheatMonitorProps> = ({
    assessmentId,
    candidateId,
    onSuspiciousActivity
}) => {
    const lastActivityRef = useRef<number>(Date.now());
    const analysisIntervalRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        // Start the session
        const startMonitoring = async () => {
            try {
                await antiCheatService.startSession(assessmentId, candidateId);
                
                // Set up periodic analysis
                analysisIntervalRef.current = setInterval(async () => {
                    try {
                        const analysis = await antiCheatService.getSessionAnalysis();
                        if (analysis.risk_score > 0) {
                            onSuspiciousActivity(analysis.risk_score, analysis.suspicious_patterns);
                        }
                    } catch (error) {
                        console.error('Error getting session analysis:', error);
                    }
                }, 30000); // Check every 30 seconds
            } catch (error) {
                console.error('Error starting anti-cheat monitoring:', error);
            }
        };

        startMonitoring();

        // Set up event listeners
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                await recordEvent('tab_switch', { timestamp: Date.now() });
            }
        };

        const handleCopy = async (e: ClipboardEvent) => {
            e.preventDefault();
            await recordEvent('copy_paste', {
                type: 'copy',
                timestamp: Date.now()
            });
        };

        const handlePaste = async (e: ClipboardEvent) => {
            e.preventDefault();
            await recordEvent('copy_paste', {
                type: 'paste',
                timestamp: Date.now()
            });
        };

        const handleActivity = () => {
            lastActivityRef.current = Date.now();
        };

        // Add event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('mousemove', handleActivity);
        document.addEventListener('keydown', handleActivity);

        // Cleanup function
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('mousemove', handleActivity);
            document.removeEventListener('keydown', handleActivity);
            
            if (analysisIntervalRef.current) {
                clearInterval(analysisIntervalRef.current);
            }
            
            // End the session
            antiCheatService.endSession().catch(error => {
                console.error('Error ending anti-cheat session:', error);
            });
        };
    }, [assessmentId, candidateId, onSuspiciousActivity]);

    const recordEvent = async (type: string, details: Record<string, any>) => {
        try {
            const event: SessionEvent = {
                type,
                details: {
                    ...details,
                    timestamp: Date.now()
                }
            };
            
            await antiCheatService.recordEvent(event);
        } catch (error) {
            console.error('Error recording event:', error);
        }
    };

    return null; // This component doesn't render anything
}; 
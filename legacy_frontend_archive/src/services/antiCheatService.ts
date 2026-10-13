import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/anti-cheat';

export interface SessionEvent {
    type: string;
    details: Record<string, any>;
}

export interface SessionAnalysis {
    risk_score: number;
    suspicious_patterns: string[];
    timestamp: string;
}

export interface SessionReport {
    session_id: string;
    start_time: string;
    end_time: string;
    risk_score: number;
    suspicious_patterns: string[];
    event_statistics: {
        tab_switch: number;
        copy_paste: number;
        total_events: number;
    };
    status: string;
}

class AntiCheatService {
    private sessionId: string | null = null;

    async startSession(assessmentId: string, candidateId: string): Promise<string> {
        try {
            const response = await axios.post(`${API_BASE_URL}/session/start`, {
                assessment_id: assessmentId,
                candidate_id: candidateId
            });
            const sessionId = response.data.session_id as string;
            this.sessionId = sessionId;
            return sessionId;
        } catch (error) {
            console.error('Error starting session:', error);
            throw error;
        }
    }

    async recordEvent(event: SessionEvent): Promise<SessionAnalysis> {
        if (!this.sessionId) {
            throw new Error('No active session');
        }

        try {
            const response = await axios.post(
                `${API_BASE_URL}/session/${this.sessionId}/event`,
                event
            );
            
            return response.data.analysis;
        } catch (error) {
            console.error('Error recording event:', error);
            throw error;
        }
    }

    async endSession(): Promise<SessionReport> {
        if (!this.sessionId) {
            throw new Error('No active session');
        }

        try {
            const response = await axios.post(
                `${API_BASE_URL}/session/${this.sessionId}/end`
            );
            
            this.sessionId = null;
            return response.data.report;
        } catch (error) {
            console.error('Error ending session:', error);
            throw error;
        }
    }

    async getSessionReport(): Promise<SessionReport> {
        if (!this.sessionId) {
            throw new Error('No active session');
        }

        try {
            const response = await axios.get(
                `${API_BASE_URL}/session/${this.sessionId}/report`
            );
            
            return response.data;
        } catch (error) {
            console.error('Error getting session report:', error);
            throw error;
        }
    }

    async getSessionAnalysis(): Promise<SessionAnalysis> {
        if (!this.sessionId) {
            throw new Error('No active session');
        }

        try {
            const response = await axios.get(
                `${API_BASE_URL}/session/${this.sessionId}/analysis`
            );
            
            return response.data;
        } catch (error) {
            console.error('Error getting session analysis:', error);
            throw error;
        }
    }

    getCurrentSessionId(): string | null {
        return this.sessionId;
    }
}

export const antiCheatService = new AntiCheatService(); 
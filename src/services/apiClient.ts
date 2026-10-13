import axios from 'axios';
import { auth } from '../firebase';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://127.0.0.1:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor: automatically attaches current Firebase user ID token if available
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          return config;
        }
      }
      // Presentation Fallback: check cached role
      const cachedRole = localStorage.getItem('hirica_user_role');
      if (cachedRole === 'recruiter') {
        config.headers.Authorization = 'Bearer demo-recruiter-token';
      } else if (cachedRole === 'jobseeker') {
        config.headers.Authorization = 'Bearer demo-candidate-token';
      }
    } catch (err) {
      console.warn('Failed to attach Firebase auth token to API request:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Client Error:', {
      url: error.config?.url,
      status: error.response?.status,
      detail: error.response?.data?.detail || error.message
    });
    return Promise.reject(error);
  }
);

export default apiClient;

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.clear();
        window.location.href = '/signin';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Refresh failed, clear storage and redirect to login
        localStorage.clear();
        window.location.href = '/signin';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Interview API calls
export const interviewAPI = {
  // Get interview history
  getHistory: async () => {
    const response = await api.get('/interview/history');
    return response.data;
  },

  // Get interview statistics
  getStats: async () => {
    const response = await api.get('/interview/stats');
    return response.data;
  },

  // Get interview by ID
  getById: async (id: string) => {
    const response = await api.get(`/interview/${id}`);
    return response.data;
  },

  // Generate questions
  generateQuestions: async (data: {
    technology: string;
    difficulty: string;
    interviewType: string;
    numberOfQuestions: number;
  }) => {
    const response = await api.post('/interview/generate-questions', data);
    return response.data;
  },

  // Score interview
  scoreInterview: async (data: {
    questions: any[];
    userAnswers: any[];
    technology: string;
    difficulty: string;
    interviewType: string;
  }) => {
    const response = await api.post('/interview/score-interview', data);
    return response.data;
  },
};

// Auth API calls
export const authAPI = {
  // Sign up
  signup: async (data: { name: string; email: string; password: string }) => {
    const response = await api.post('/auth/signup', data);
    if (response.data.accessToken && response.data.refreshToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Sign in
  signin: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    if (response.data.accessToken && response.data.refreshToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken: string) => {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
      refreshToken,
    });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default api;

// Speech API calls (Google Cloud TTS + STT)
export const speechAPI = {
  // Text to Speech — returns base64 MP3
  tts: async (text: string, voiceName?: string) => {
    const response = await api.post('/speech/tts', { text, voiceName });
    return response.data;
  },

  // Speech to Text — sends base64 audio, returns transcript
  stt: async (audioBase64: string) => {
    const response = await api.post('/speech/stt', { audio: audioBase64 });
    return response.data;
  },

  // List available Google voices
  listVoices: async () => {
    const response = await api.get('/speech/voices');
    return response.data;
  },
};

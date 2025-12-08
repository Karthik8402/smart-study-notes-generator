import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  register: async (email, password, name) => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Upload API
export const uploadAPI = {
  uploadFile: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        if (onProgress) onProgress(percentCompleted);
      },
    });
    return response.data;
  },
  
  uploadYouTube: async (url, title) => {
    const response = await api.post('/upload/youtube', { url, title });
    return response.data;
  },
  
  uploadText: async (content, title) => {
    const response = await api.post('/upload/text', { content, title });
    return response.data;
  },
  
  getDocuments: async () => {
    const response = await api.get('/upload/documents');
    return response.data;
  },
  
  deleteDocument: async (docId) => {
    const response = await api.delete(`/upload/documents/${docId}`);
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  sendMessage: async (message, sessionId = null) => {
    const response = await api.post('/chat/', {
      message,
      session_id: sessionId,
      include_sources: true,
    });
    return response.data;
  },
  
  getHistory: async (sessionId) => {
    const response = await api.get(`/chat/history/${sessionId}`);
    return response.data;
  },
  
  getSessions: async () => {
    const response = await api.get('/chat/sessions');
    return response.data;
  },
  
  deleteSession: async (sessionId) => {
    const response = await api.delete(`/chat/sessions/${sessionId}`);
    return response.data;
  },
};

// Notes API
export const notesAPI = {
  generate: async (noteType, topic = null, numItems = 5) => {
    const response = await api.post('/notes/generate', {
      note_type: noteType,
      topic,
      num_items: numItems,
    });
    return response.data;
  },
  
  save: async (note) => {
    const response = await api.post('/notes/save', note);
    return response.data;
  },
  
  getAll: async (noteType = null) => {
    const params = noteType ? { note_type: noteType } : {};
    const response = await api.get('/notes/', { params });
    return response.data;
  },
  
  get: async (noteId) => {
    const response = await api.get(`/notes/${noteId}`);
    return response.data;
  },
  
  delete: async (noteId) => {
    const response = await api.delete(`/notes/${noteId}`);
    return response.data;
  },
};

// MCP Tools API
export const mcpAPI = {
  // Reminders
  createReminder: async (reminder) => {
    const response = await api.post('/mcp/reminders', reminder);
    return response.data;
  },
  
  getReminders: async () => {
    const response = await api.get('/mcp/reminders');
    return response.data;
  },
  
  getUpcomingReminders: async (days = 7) => {
    const response = await api.get(`/mcp/reminders/upcoming?days=${days}`);
    return response.data;
  },
  
  completeReminder: async (reminderId) => {
    const response = await api.put(`/mcp/reminders/${reminderId}/complete`);
    return response.data;
  },
  
  deleteReminder: async (reminderId) => {
    const response = await api.delete(`/mcp/reminders/${reminderId}`);
    return response.data;
  },
  
  // Study Schedule
  createSchedule: async (subjects, startDate, days = 7, hoursPerDay = 4) => {
    const response = await api.post('/mcp/schedule', {
      subjects,
      start_date: startDate,
      days,
      hours_per_day: hoursPerDay
    });
    return response.data;
  },
  
  // Saved Files
  getSavedFiles: async (category = null) => {
    const params = category ? `?category=${category}` : '';
    const response = await api.get(`/mcp/saved-files${params}`);
    return response.data;
  },
  
  getSavedFileContent: async (category, filename) => {
    const response = await api.get(`/mcp/saved-files/${category}/${filename}`);
    return response.data;
  },
  
  deleteSavedFile: async (category, filename) => {
    const response = await api.delete(`/mcp/saved-files/${category}/${filename}`);
    return response.data;
  },
  
  saveNote: async (title, content, noteType) => {
    const response = await api.post('/mcp/save-note', null, {
      params: { title, content, note_type: noteType }
    });
    return response.data;
  },
  
  // Stats
  getStats: async () => {
    const response = await api.get('/mcp/stats');
    return response.data;
  },
};

export default api;

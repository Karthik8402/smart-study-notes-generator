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

// MCP Tools API - Calendar, Files, Drive
export const mcpAPI = {
  // ===== Calendar Tool =====
  createReminder: async (reminder) => {
    const response = await api.post('/mcp/calendar/reminders', reminder);
    return response.data;
  },
  
  getReminders: async () => {
    const response = await api.get('/mcp/calendar/reminders');
    return response.data;
  },
  
  getUpcomingReminders: async (days = 7) => {
    const response = await api.get(`/mcp/calendar/reminders/upcoming?days=${days}`);
    return response.data;
  },
  
  getOverdueReminders: async () => {
    const response = await api.get('/mcp/calendar/reminders/overdue');
    return response.data;
  },
  
  completeReminder: async (reminderId) => {
    const response = await api.put(`/mcp/calendar/reminders/${reminderId}/complete`);
    return response.data;
  },
  
  deleteReminder: async (reminderId) => {
    const response = await api.delete(`/mcp/calendar/reminders/${reminderId}`);
    return response.data;
  },
  
  createSchedule: async (subjects, startDate, days = 7, hoursPerDay = 4, timeOfDay = '18:00') => {
    const response = await api.post('/mcp/calendar/schedule', {
      subjects,
      start_date: startDate,
      days,
      hours_per_day: hoursPerDay,
      time_of_day: timeOfDay
    });
    return response.data;
  },
  
  getCalendarStats: async () => {
    const response = await api.get('/mcp/calendar/stats');
    return response.data;
  },
  
  // ===== File Tool =====
  saveNote: async (title, content, noteType = 'other') => {
    const response = await api.post('/mcp/files/save', {
      title,
      content,
      note_type: noteType
    });
    return response.data;
  },
  
  getSavedFiles: async (category = null) => {
    const params = category ? `?category=${category}` : '';
    const response = await api.get(`/mcp/files/list${params}`);
    return response.data;
  },
  
  getSavedFileContent: async (category, filename) => {
    const response = await api.get(`/mcp/files/get/${category}/${filename}`);
    return response.data;
  },
  
  deleteSavedFile: async (category, filename) => {
    const response = await api.delete(`/mcp/files/${category}/${filename}`);
    return response.data;
  },
  
  searchFiles: async (query) => {
    const response = await api.get(`/mcp/files/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
  
  getFileStats: async () => {
    const response = await api.get('/mcp/files/stats');
    return response.data;
  },
  
  // ===== Drive Tool =====
  uploadToDrive: async (file, folder = 'Documents', description = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    if (description) formData.append('description', description);
    
    const response = await api.post('/mcp/drive/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  uploadTextToDrive: async (filename, content, folder = 'Notes') => {
    const response = await api.post('/mcp/drive/upload-text', null, {
      params: { filename, content, folder }
    });
    return response.data;
  },
  
  getDriveFiles: async () => {
    const response = await api.get('/mcp/drive/files');
    return response.data;
  },
  
  getFolderContents: async (folderPath = '') => {
    const response = await api.get(`/mcp/drive/folder/${folderPath}`);
    return response.data;
  },
  
  createFolder: async (folderName, parentFolder = null) => {
    const response = await api.post('/mcp/drive/folders', {
      folder_name: folderName,
      parent_folder: parentFolder
    });
    return response.data;
  },
  
  deleteDriveFile: async (fileId) => {
    const response = await api.delete(`/mcp/drive/files/${fileId}`);
    return response.data;
  },
  
  moveDriveFile: async (fileId, newFolder) => {
    const response = await api.put(`/mcp/drive/files/${fileId}/move?new_folder=${newFolder}`);
    return response.data;
  },
  
  searchDrive: async (query) => {
    const response = await api.get(`/mcp/drive/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
  
  getDriveStats: async () => {
    const response = await api.get('/mcp/drive/stats');
    return response.data;
  },
  
  // ===== Combined Stats =====
  getAllStats: async () => {
    const response = await api.get('/mcp/stats');
    return response.data;
  },
};

export default api;


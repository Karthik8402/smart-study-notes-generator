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

// MCP Tools API - Calendar, Filesystem, Drive
export const mcpAPI = {
  // ===== Calendar Tool =====
  createEvent: async (event) => {
    const response = await api.post('/mcp/calendar/events', event);
    return response.data;
  },
  
  getEvents: async (startDate = null, endDate = null) => {
    let params = '';
    if (startDate) params += `?start_date=${startDate}`;
    if (endDate) params += `${params ? '&' : '?'}end_date=${endDate}`;
    const response = await api.get(`/mcp/calendar/events${params}`);
    return response.data;
  },
  
  getTodayEvents: async () => {
    const response = await api.get('/mcp/calendar/events/today');
    return response.data;
  },
  
  getUpcomingEvents: async (days = 7) => {
    const response = await api.get(`/mcp/calendar/events/upcoming?days=${days}`);
    return response.data;
  },
  
  getEvent: async (eventId) => {
    const response = await api.get(`/mcp/calendar/events/${eventId}`);
    return response.data;
  },
  
  updateEvent: async (eventId, updates) => {
    const response = await api.put(`/mcp/calendar/events/${eventId}`, updates);
    return response.data;
  },
  
  deleteEvent: async (eventId) => {
    const response = await api.delete(`/mcp/calendar/events/${eventId}`);
    return response.data;
  },
  
  createSchedule: async (subjects, startDate, days = 7, hoursPerSession = 2, startHour = 18) => {
    const response = await api.post('/mcp/calendar/schedule', {
      subjects,
      start_date: startDate,
      days,
      hours_per_session: hoursPerSession,
      start_hour: startHour
    });
    return response.data;
  },
  
  // ===== Filesystem Tool =====
  listDirectory: async (path = '.') => {
    const response = await api.get(`/mcp/filesystem/list?path=${encodeURIComponent(path)}`);
    return response.data;
  },
  
  readFile: async (path) => {
    const response = await api.get(`/mcp/filesystem/read?path=${encodeURIComponent(path)}`);
    return response.data;
  },
  
  writeFile: async (path, content) => {
    const response = await api.post('/mcp/filesystem/write', { path, content });
    return response.data;
  },
  
  deleteFile: async (path) => {
    const response = await api.delete(`/mcp/filesystem/delete?path=${encodeURIComponent(path)}`);
    return response.data;
  },
  
  createDirectory: async (path) => {
    const response = await api.post(`/mcp/filesystem/mkdir?path=${encodeURIComponent(path)}`);
    return response.data;
  },
  
  searchFiles: async (query, path = '.') => {
    const response = await api.get(`/mcp/filesystem/search?query=${encodeURIComponent(query)}&path=${encodeURIComponent(path)}`);
    return response.data;
  },
  
  getFileInfo: async (path) => {
    const response = await api.get(`/mcp/filesystem/info?path=${encodeURIComponent(path)}`);
    return response.data;
  },
  
  // ===== Drive Tool =====
  uploadToDrive: async (filename, content, folder = 'Documents', description = '') => {
    const response = await api.post('/mcp/drive/upload', {
      filename,
      content,
      folder,
      is_base64: false,
      description
    });
    return response.data;
  },
  
  downloadFromDrive: async (fileId) => {
    const response = await api.get(`/mcp/drive/download/${fileId}`);
    return response.data;
  },
  
  getDriveFiles: async (folder = null) => {
    const params = folder ? `?folder=${encodeURIComponent(folder)}` : '';
    const response = await api.get(`/mcp/drive/files${params}`);
    return response.data;
  },
  
  getDriveFolders: async () => {
    const response = await api.get('/mcp/drive/folders');
    return response.data;
  },
  
  createFolder: async (name, parent = null) => {
    const response = await api.post('/mcp/drive/folders', { name, parent });
    return response.data;
  },
  
  deleteDriveFile: async (fileId) => {
    const response = await api.delete(`/mcp/drive/files/${fileId}`);
    return response.data;
  },
  
  moveDriveFile: async (fileId, newFolder) => {
    const response = await api.put(`/mcp/drive/files/${fileId}/move?new_folder=${encodeURIComponent(newFolder)}`);
    return response.data;
  },
  
  searchDrive: async (query) => {
    const response = await api.get(`/mcp/drive/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },
  
  getDriveStats: async () => {
    const response = await api.get('/mcp/drive/stats');
    return response.data;
  },
  
  shareDriveFile: async (fileId, shareWith) => {
    const response = await api.post(`/mcp/drive/files/${fileId}/share?share_with=${encodeURIComponent(shareWith)}`);
    return response.data;
  },
  
  // ===== Saved Notes =====
  getSavedNotes: async (category = null) => {
    const params = category ? `?category=${category}` : '';
    const response = await api.get(`/mcp/notes/list${params}`);
    return response.data;
  },
  
  getSavedNoteContent: async (category, filename) => {
    const response = await api.get(`/mcp/notes/read/${category}/${encodeURIComponent(filename)}`);
    return response.data;
  },
  
  deleteSavedNote: async (category, filename) => {
    const response = await api.delete(`/mcp/notes/${category}/${encodeURIComponent(filename)}`);
    return response.data;
  },
  
  // ===== Combined Stats =====
  getAllStats: async () => {
    const response = await api.get('/mcp/stats');
    return response.data;
  },
};

// Google MCP API - Real Google Calendar & Drive Integration
export const googleAPI = {
  // ===== Google Calendar =====
  calendarAuth: async () => {
    const response = await api.get('/mcp/google/calendar/auth');
    return response.data;
  },
  
  calendarStatus: async () => {
    const response = await api.get('/mcp/google/calendar/status');
    return response.data;
  },
  
  createGoogleEvent: async (event) => {
    const response = await api.post('/mcp/google/calendar/events', event);
    return response.data;
  },
  
  getGoogleEvents: async (startDate = null, endDate = null) => {
    let params = '';
    if (startDate) params += `?start_date=${startDate}`;
    if (endDate) params += `${params ? '&' : '?'}end_date=${endDate}`;
    const response = await api.get(`/mcp/google/calendar/events${params}`);
    return response.data;
  },
  
  getGoogleTodayEvents: async () => {
    const response = await api.get('/mcp/google/calendar/events/today');
    return response.data;
  },
  
  getGoogleUpcomingEvents: async (days = 7) => {
    const response = await api.get(`/mcp/google/calendar/events/upcoming?days=${days}`);
    return response.data;
  },
  
  getGoogleEvent: async (eventId) => {
    const response = await api.get(`/mcp/google/calendar/events/${eventId}`);
    return response.data;
  },
  
  updateGoogleEvent: async (eventId, updates) => {
    const response = await api.put(`/mcp/google/calendar/events/${eventId}`, updates);
    return response.data;
  },
  
  deleteGoogleEvent: async (eventId) => {
    const response = await api.delete(`/mcp/google/calendar/events/${eventId}`);
    return response.data;
  },
  
  createGoogleSchedule: async (subjects, startDate, days = 7, hoursPerSession = 2, startHour = 18) => {
    const response = await api.post('/mcp/google/calendar/schedule', {
      subjects,
      start_date: startDate,
      days,
      hours_per_session: hoursPerSession,
      start_hour: startHour
    });
    return response.data;
  },
  
  quickAddEvent: async (text) => {
    const response = await api.post(`/mcp/google/calendar/quick-add?text=${encodeURIComponent(text)}`);
    return response.data;
  },
  
  // ===== Google Drive =====
  driveAuth: async () => {
    const response = await api.get('/mcp/google/drive/auth');
    return response.data;
  },
  
  driveStatus: async () => {
    const response = await api.get('/mcp/google/drive/status');
    return response.data;
  },
  
  uploadToGoogleDrive: async (filename, content, folder = null, description = '') => {
    const response = await api.post('/mcp/google/drive/upload', {
      filename,
      content,
      folder,
      is_base64: false,
      description
    });
    return response.data;
  },
  
  downloadFromGoogleDrive: async (fileId) => {
    const response = await api.get(`/mcp/google/drive/download/${fileId}`);
    return response.data;
  },
  
  getGoogleDriveFiles: async (folder = null) => {
    const params = folder ? `?folder=${encodeURIComponent(folder)}` : '';
    const response = await api.get(`/mcp/google/drive/files${params}`);
    return response.data;
  },
  
  getGoogleDriveFolders: async () => {
    const response = await api.get('/mcp/google/drive/folders');
    return response.data;
  },
  
  createGoogleFolder: async (name, parent = null) => {
    const response = await api.post('/mcp/google/drive/folders', { name, parent });
    return response.data;
  },
  
  deleteGoogleDriveFile: async (fileId) => {
    const response = await api.delete(`/mcp/google/drive/files/${fileId}`);
    return response.data;
  },
  
  moveGoogleDriveFile: async (fileId, newFolder) => {
    const response = await api.put(`/mcp/google/drive/files/${fileId}/move?new_folder=${encodeURIComponent(newFolder)}`);
    return response.data;
  },
  
  searchGoogleDrive: async (query) => {
    const response = await api.get(`/mcp/google/drive/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },
  
  getGoogleDriveStats: async () => {
    const response = await api.get('/mcp/google/drive/stats');
    return response.data;
  },
  
  shareGoogleDriveFile: async (fileId, email, role = 'reader') => {
    const response = await api.post(`/mcp/google/drive/files/${fileId}/share?email=${encodeURIComponent(email)}&role=${role}`);
    return response.data;
  },
};

export default api;

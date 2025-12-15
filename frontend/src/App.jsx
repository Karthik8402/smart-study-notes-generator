import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Notes from './pages/Notes';
import Upload from './pages/Upload';

// MCP Tool Pages
import MCPCalendar from './pages/MCPCalendar';
import MCPDrive from './pages/MCPDrive';
import MCPFilesystem from './pages/MCPFilesystem';
import SavedNotes from './pages/SavedNotes';

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Protected routes */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<Layout />}>
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/chat" element={<Chat />} />
                                <Route path="/notes" element={<Notes />} />
                                <Route path="/upload" element={<Upload />} />

                                {/* MCP Tool Routes */}
                                <Route path="/calendar" element={<MCPCalendar />} />
                                <Route path="/drive" element={<MCPDrive />} />
                                <Route path="/filesystem" element={<MCPFilesystem />} />
                                <Route path="/saved-notes" element={<SavedNotes />} />
                            </Route>
                        </Route>

                        {/* Catch all */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;


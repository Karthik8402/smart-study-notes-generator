import { useState, useEffect } from 'react';
import { mcpAPI } from '../services/api';

export default function Reminders() {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [filter, setFilter] = useState('all'); // all, upcoming, completed

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        due_date: '',
        subject: '',
        priority: 'medium'
    });

    // Schedule form state
    const [scheduleData, setScheduleData] = useState({
        subjects: '',
        days: 7,
        hours_per_day: 4
    });

    useEffect(() => {
        fetchReminders();
    }, []);

    const fetchReminders = async () => {
        try {
            const data = await mcpAPI.getReminders();
            setReminders(data);
        } catch (error) {
            console.error('Failed to fetch reminders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateReminder = async (e) => {
        e.preventDefault();
        try {
            await mcpAPI.createReminder({
                ...formData,
                due_date: new Date(formData.due_date).toISOString()
            });
            setShowForm(false);
            setFormData({ title: '', description: '', due_date: '', subject: '', priority: 'medium' });
            fetchReminders();
        } catch (error) {
            alert('Failed to create reminder');
        }
    };

    const handleCreateSchedule = async (e) => {
        e.preventDefault();
        try {
            const subjects = scheduleData.subjects.split(',').map(s => s.trim()).filter(s => s);
            if (subjects.length === 0) {
                alert('Please enter at least one subject');
                return;
            }

            const result = await mcpAPI.createSchedule(
                subjects,
                new Date().toISOString(),
                scheduleData.days,
                scheduleData.hours_per_day
            );

            alert(result.message);
            setShowScheduleForm(false);
            setScheduleData({ subjects: '', days: 7, hours_per_day: 4 });
            fetchReminders();
        } catch (error) {
            alert('Failed to create schedule');
        }
    };

    const handleComplete = async (id) => {
        try {
            await mcpAPI.completeReminder(id);
            fetchReminders();
        } catch (error) {
            alert('Failed to complete reminder');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this reminder?')) return;
        try {
            await mcpAPI.deleteReminder(id);
            fetchReminders();
        } catch (error) {
            alert('Failed to delete reminder');
        }
    };

    const filteredReminders = reminders.filter(r => {
        if (filter === 'completed') return r.completed;
        if (filter === 'upcoming') return !r.completed;
        return true;
    });

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-400 bg-red-500/20';
            case 'medium': return 'text-yellow-400 bg-yellow-500/20';
            case 'low': return 'text-green-400 bg-green-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">📅 Study Reminders</h1>
                    <p className="text-gray-400 mt-1">Manage your study schedule and reminders</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowScheduleForm(true)}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
                    >
                        📊 Generate Schedule
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
                    >
                        ➕ New Reminder
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {['all', 'upcoming', 'completed'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg capitalize transition ${filter === f
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Reminders List */}
            <div className="grid gap-4">
                {filteredReminders.length === 0 ? (
                    <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
                        <p className="text-gray-400 text-lg">No reminders found</p>
                        <p className="text-gray-500 text-sm mt-2">Create a new reminder to get started</p>
                    </div>
                ) : (
                    filteredReminders.map(reminder => (
                        <div
                            key={reminder.id}
                            className={`p-4 rounded-xl border transition ${reminder.completed
                                    ? 'bg-gray-800/20 border-gray-700/30 opacity-60'
                                    : 'bg-gray-800/50 border-gray-700/50 hover:border-purple-500/50'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className={`text-lg font-semibold ${reminder.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                                            {reminder.title}
                                        </h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(reminder.priority)}`}>
                                            {reminder.priority}
                                        </span>
                                        {reminder.subject && (
                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                                                {reminder.subject}
                                            </span>
                                        )}
                                    </div>
                                    {reminder.description && (
                                        <p className="text-gray-400 text-sm mt-1">{reminder.description}</p>
                                    )}
                                    <p className="text-gray-500 text-sm mt-2">
                                        📆 {formatDate(reminder.due_date)}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {!reminder.completed && (
                                        <button
                                            onClick={() => handleComplete(reminder.id)}
                                            className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition"
                                            title="Mark Complete"
                                        >
                                            ✓
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(reminder.id)}
                                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Reminder Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
                        <h2 className="text-xl font-bold text-white mb-4">Create Reminder</h2>
                        <form onSubmit={handleCreateReminder} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm mb-1">Due Date</label>
                                <input
                                    type="datetime-local"
                                    value={formData.due_date}
                                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 text-sm mb-1">Subject</label>
                                    <input
                                        type="text"
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 text-sm mb-1">Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Generate Schedule Modal */}
            {showScheduleForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
                        <h2 className="text-xl font-bold text-white mb-4">📊 Generate Study Schedule</h2>
                        <form onSubmit={handleCreateSchedule} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm mb-1">Subjects (comma separated)</label>
                                <input
                                    type="text"
                                    value={scheduleData.subjects}
                                    onChange={e => setScheduleData({ ...scheduleData, subjects: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                                    placeholder="Math, Physics, Chemistry"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 text-sm mb-1">Number of Days</label>
                                    <input
                                        type="number"
                                        value={scheduleData.days}
                                        onChange={e => setScheduleData({ ...scheduleData, days: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                                        min={1}
                                        max={30}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 text-sm mb-1">Hours Per Day</label>
                                    <input
                                        type="number"
                                        value={scheduleData.hours_per_day}
                                        onChange={e => setScheduleData({ ...scheduleData, hours_per_day: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                                        min={1}
                                        max={12}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowScheduleForm(false)}
                                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition"
                                >
                                    Generate
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

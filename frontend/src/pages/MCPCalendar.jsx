import { useState, useEffect } from 'react';
import { mcpAPI, googleAPI } from '../services/api';
import { Calendar, Plus, Trash2, Check, Clock, BookOpen, ChevronRight, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';

export default function MCPCalendar() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    // Google integration state
    const [useGoogle, setUseGoogle] = useState(false);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [googleConnecting, setGoogleConnecting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_time: '',
        location: '',
        reminder_minutes: 30
    });

    const [scheduleData, setScheduleData] = useState({
        subjects: '',
        days: 7,
        hours_per_session: 2
    });

    useEffect(() => {
        fetchEvents();
        if (useGoogle) {
            checkGoogleConnection();
        }
    }, [useGoogle]);

    const checkGoogleConnection = async () => {
        try {
            const status = await googleAPI.calendarStatus();
            setGoogleConnected(status.authenticated === true);
        } catch (error) {
            setGoogleConnected(false);
        }
    };

    const connectGoogle = async () => {
        setGoogleConnecting(true);
        try {
            const result = await googleAPI.calendarAuth();
            if (result.success) {
                setGoogleConnected(true);
                fetchEvents();
            } else {
                alert(result.error || 'Failed to connect Google Calendar');
            }
        } catch (error) {
            alert('Failed to connect: ' + error.message);
        } finally {
            setGoogleConnecting(false);
        }
    };

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const data = useGoogle
                ? await googleAPI.getGoogleEvents()
                : await mcpAPI.getEvents();
            setEvents(data.events || []);
        } catch (error) {
            console.error('Failed to fetch events:', error);
            if (useGoogle && error.response?.data?.need_auth) {
                setGoogleConnected(false);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            if (useGoogle) {
                await googleAPI.createGoogleEvent(formData);
            } else {
                await mcpAPI.createEvent(formData);
            }
            setShowForm(false);
            setFormData({ title: '', description: '', start_time: '', location: '', reminder_minutes: 30 });
            fetchEvents();
        } catch (error) {
            alert('Failed to create event');
        }
    };

    const handleCreateSchedule = async (e) => {
        e.preventDefault();
        try {
            if (!scheduleData.subjects.trim()) {
                alert('Please enter at least one subject');
                return;
            }

            if (useGoogle) {
                await googleAPI.createGoogleSchedule(
                    scheduleData.subjects,
                    new Date().toISOString().split('T')[0],
                    scheduleData.days,
                    scheduleData.hours_per_session,
                    18
                );
            } else {
                await mcpAPI.createSchedule(
                    scheduleData.subjects,
                    new Date().toISOString().split('T')[0],
                    scheduleData.days,
                    scheduleData.hours_per_session,
                    18
                );
            }

            alert(`Study schedule created successfully${useGoogle ? ' in Google Calendar!' : '!'}`);
            setShowScheduleForm(false);
            setScheduleData({ subjects: '', days: 7, hours_per_session: 2 });
            fetchEvents();
        } catch (error) {
            alert('Failed to create schedule');
        }
    };

    const handleDelete = async (eventId) => {
        if (!confirm('Delete this event?')) return;
        try {
            if (useGoogle) {
                await googleAPI.deleteGoogleEvent(eventId);
            } else {
                await mcpAPI.deleteEvent(eventId);
            }
            fetchEvents();
        } catch (error) {
            alert('Failed to delete event');
        }
    };

    const handleComplete = async (eventId) => {
        try {
            if (useGoogle) {
                // For Google Calendar, mark as completed by adding [DONE] prefix to title
                const event = events.find(e => e.id === eventId);
                if (event && !event.title.startsWith('[DONE]')) {
                    await googleAPI.updateGoogleEvent(eventId, {
                        title: `[DONE] ${event.title}`
                    });
                    fetchEvents();
                }
                return;
            }
            await mcpAPI.updateEvent(eventId, { status: 'completed' });
            fetchEvents();
        } catch (error) {
            alert('Failed to update event');
        }
    };

    const formatDateTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Check if event is completed (either by status or by [DONE] prefix for Google)
    const isEventCompleted = (event) => {
        return event.status === 'completed' || event.title?.startsWith('[DONE]');
    };

    const filteredEvents = events.filter(event => {
        const completed = isEventCompleted(event);
        if (activeTab === 'completed') return completed;
        if (activeTab === 'upcoming') {
            const eventDate = new Date(event.start_time);
            return eventDate >= new Date() && !completed;
        }
        return true;
    });


    // Skeleton components for Calendar page
    const StatCardSkeleton = () => (
        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 p-4 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
        </div>
    );

    const EventCardSkeleton = () => (
        <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 animate-pulse">
            <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                    <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="flex items-center gap-4">
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="space-y-6 animate-fadeIn">
                {/* Header Skeleton */}
                <div className="relative overflow-hidden rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 backdrop-blur-xl p-6">
                    <div className="flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                            <div className="space-y-2">
                                <div className="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                            <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-3 gap-4">
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                </div>

                {/* Tabs Skeleton */}
                <div className="flex gap-2 animate-pulse">
                    <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                </div>

                {/* Events List Skeleton */}
                <div className="space-y-4">
                    <EventCardSkeleton />
                    <EventCardSkeleton />
                    <EventCardSkeleton />
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header with Theme Awareness */}
            <div className="relative overflow-hidden rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 backdrop-blur-xl p-6 transition-colors duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5"></div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25 shrink-0">
                            <Calendar className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                                Calendar
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300 text-sm md:text-base">
                                {useGoogle ? 'Google Calendar' : 'Local Calendar'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
                        {/* Google Toggle */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 md:flex flex-1 md:flex-none justify-between md:justify-start">
                            <span className="text-sm text-gray-700 dark:text-gray-400">Use Google</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setUseGoogle(!useGoogle)}
                                    className={`relative w-12 h-6 rounded-full transition-all ${useGoogle ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-400 dark:bg-gray-600'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useGoogle ? 'left-7' : 'left-1'
                                        }`}></div>
                                </button>
                                {useGoogle && (
                                    googleConnected ? (
                                        <span className="flex items-center gap-1 text-xs text-emerald-500 dark:text-emerald-400 font-medium">
                                            <Check className="w-3 h-3" />
                                        </span>
                                    ) : (
                                        <button
                                            onClick={connectGoogle}
                                            disabled={googleConnecting}
                                            className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition disabled:opacity-50"
                                        >
                                            {googleConnecting ? '...' : 'Connect'}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => setShowScheduleForm(true)}
                            className="group px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 flex items-center gap-2 flex-1 md:flex-none justify-center"
                        >
                            <BookOpen className="w-4 h-4" />
                            Generate Schedule
                        </button>
                        <button
                            onClick={() => setShowForm(true)}
                            className="group px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 flex items-center gap-2 flex-1 md:flex-none justify-center"
                        >
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                            New Event
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Events', value: events.length, color: 'from-blue-500 to-cyan-500', icon: Calendar },
                    { label: 'Upcoming', value: events.filter(e => new Date(e.start_time) >= new Date() && !isEventCompleted(e)).length, color: 'from-purple-500 to-pink-500', icon: Clock },
                    { label: 'Completed', value: events.filter(e => isEventCompleted(e)).length, color: 'from-emerald-500 to-teal-500', icon: Check }
                ].map((stat, i) => (
                    <div key={i} className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 p-4 hover:border-gray-600/50 transition-all group">
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-700 dark:text-gray-600 dark:text-gray-400 text-sm">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                                <stat.icon className="w-6 h-6 text-gray-900 dark:text-white/80" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 w-fit">
                {['all', 'upcoming', 'completed'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${activeTab === tab
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-gray-900 dark:text-white shadow-lg'
                            : 'text-gray-700 dark:text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Events List */}
            <div className="space-y-3">
                {filteredEvents.length === 0 ? (
                    <div className="text-center py-16 bg-gray-100 dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700/50 border-dashed">
                        <Calendar className="w-16 h-16 text-gray-700 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-700 dark:text-gray-600 dark:text-gray-400 text-lg">No events found</p>
                        <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Create a new event to get started</p>
                    </div>
                ) : (
                    filteredEvents.map(event => {
                        const completed = isEventCompleted(event);
                        const displayTitle = event.title?.startsWith('[DONE] ') ? event.title.replace('[DONE] ', '') : event.title;
                        return (
                            <div
                                key={event.id}
                                className={`group p-5 rounded-xl border transition-all duration-300 hover:scale-[1.01] ${completed
                                    ? 'bg-gray-50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700/30 opacity-60'
                                    : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className={`text-lg font-semibold ${completed ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                                {displayTitle}
                                            </h3>
                                            {completed && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                    ✓ Done
                                                </span>
                                            )}
                                            {event.tags?.includes('study-session') && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                                    Study Session
                                                </span>
                                            )}
                                        </div>
                                        {event.description && (
                                            <p className="text-gray-700 dark:text-gray-600 dark:text-gray-400 text-sm mt-2">{event.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-500">
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4" />
                                                {formatDateTime(event.start_time)}
                                            </span>
                                            {event.location && (
                                                <span className="text-gray-700 dark:text-gray-600">• {event.location}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!completed && (
                                            <button
                                                onClick={() => handleComplete(event.id)}
                                                className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition"
                                                title="Mark Complete"
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

            </div>

            {/* Create Event Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700/50 shadow-2xl animate-slideUp">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-purple-400" />
                            Create Event
                        </h2>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm mb-1.5 font-medium">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
                                    placeholder="Event title..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm mb-1.5 font-medium">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all resize-none"
                                    rows={2}
                                    placeholder="Optional description..."
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm mb-1.5 font-medium">Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={formData.start_time}
                                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm mb-1.5 font-medium">Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
                                    placeholder="Optional location..."
                                />
                            </div>
                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-600 transition-all font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-gray-900 dark:text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-medium"
                                >
                                    Create Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Generate Schedule Modal */}
            {showScheduleForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700/50 shadow-2xl animate-slideUp">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-emerald-400" />
                            Generate Study Schedule
                        </h2>
                        <form onSubmit={handleCreateSchedule} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm mb-1.5 font-medium">Subjects</label>
                                <input
                                    type="text"
                                    value={scheduleData.subjects}
                                    onChange={e => setScheduleData({ ...scheduleData, subjects: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                                    placeholder="Math, Physics, Chemistry"
                                    required
                                />
                                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1.5">Separate subjects with commas</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 text-sm mb-1.5 font-medium">Days</label>
                                    <input
                                        type="number"
                                        value={scheduleData.days}
                                        onChange={e => setScheduleData({ ...scheduleData, days: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                                        min={1}
                                        max={30}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 text-sm mb-1.5 font-medium">Hours/Day</label>
                                    <input
                                        type="number"
                                        value={scheduleData.hours_per_session}
                                        onChange={e => setScheduleData({ ...scheduleData, hours_per_session: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                                        min={1}
                                        max={8}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowScheduleForm(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-600 transition-all font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 dark:text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all font-medium"
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




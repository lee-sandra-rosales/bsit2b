import { useState, useEffect } from 'react';
import { Calendar } from './components/Calendar';
import { EventList } from './components/EventList';
import { AddEventModal } from './components/AddEventModal';
import { AIAssistant } from './components/AIAssistant';
import { CustomizePanel } from './components/CustomizePanel';
import { PrintView } from './components/PrintView';
import { DoodleEditor } from './components/DoodleEditor';
import { NotificationCenter } from './components/NotificationCenter';
import { UserProfile } from './components/UserProfile';
import { Plus, Bot, Palette, Printer, Calendar as CalendarIcon, Moon, Sun, Bell, User, Pencil } from 'lucide-react';

export type EventType = 'meeting' | 'deadline' | 'class' | 'other';

export interface Event {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  description?: string;
  color: string;
  type: EventType;
  location?: string;
  reminder?: number; // minutes before event
  doodle?: string; // base64 image data
}

export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export interface UserData {
  name: string;
  email: string;
  avatar?: string;
  notificationsEnabled: boolean;
  defaultReminder: number;
}

export interface Notification {
  id: string;
  eventId: string;
  message: string;
  time: Date;
  read: boolean;
}

export default function App() {
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Team Standup',
      date: new Date(2025, 10, 27, 10, 0),
      startTime: '10:00',
      endTime: '10:30',
      description: 'Daily team sync-up',
      color: '#3b82f6',
      type: 'meeting',
      location: 'Conference Room A',
      reminder: 15
    },
    {
      id: '2',
      title: 'Project Proposal Due',
      date: new Date(2025, 10, 28, 17, 0),
      startTime: '17:00',
      endTime: '17:00',
      description: 'Submit Q4 project proposal',
      color: '#ef4444',
      type: 'deadline',
      reminder: 60
    },
    {
      id: '3',
      title: 'Web Development Class',
      date: new Date(2025, 10, 29, 14, 0),
      startTime: '14:00',
      endTime: '16:00',
      description: 'React Advanced Patterns',
      color: '#8b5cf6',
      type: 'class',
      location: 'Room 301',
      reminder: 30
    }
  ]);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [showDoodleEditor, setShowDoodleEditor] = useState(false);
  const [doodleEvent, setDoodleEvent] = useState<Event | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [theme, setTheme] = useState<Theme>({
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#10b981',
    background: '#ffffff'
  });

  const [userData, setUserData] = useState<UserData>({
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    notificationsEnabled: true,
    defaultReminder: 15
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Check for upcoming events and create notifications
  useEffect(() => {
    if (!userData.notificationsEnabled) return;

    const checkReminders = () => {
      const now = new Date();
      const newNotifications: Notification[] = [];

      events.forEach(event => {
        if (!event.reminder) return;

        const eventTime = new Date(event.date);
        const reminderTime = new Date(eventTime.getTime() - event.reminder * 60000);

        // Check if reminder should fire (within next minute)
        if (reminderTime > now && reminderTime <= new Date(now.getTime() + 60000)) {
          const existingNotification = notifications.find(n => n.eventId === event.id);
          if (!existingNotification) {
            newNotifications.push({
              id: Date.now().toString() + Math.random(),
              eventId: event.id,
              message: `${event.title} starts in ${event.reminder} minutes`,
              time: now,
              read: false
            });
          }
        }
      });

      if (newNotifications.length > 0) {
        setNotifications(prev => [...prev, ...newNotifications]);
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          newNotifications.forEach(notif => {
            new Notification('SmartScheduler Reminder', {
              body: notif.message,
              icon: '📅'
            });
          });
        }
      }
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Check immediately

    return () => clearInterval(interval);
  }, [events, notifications, userData.notificationsEnabled]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleAddEvent = (event: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...event,
      id: Date.now().toString()
    };
    setEvents([...events, newEvent]);
    setIsAddModalOpen(false);
  };

  const handleUpdateEvent = (updatedEvent: Event) => {
    setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
    setNotifications(notifications.filter(n => n.eventId !== id));
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsAddModalOpen(true);
  };

  const handleAIAddEvents = (newEvents: Omit<Event, 'id'>[]) => {
    const eventsWithIds = newEvents.map(event => ({
      ...event,
      id: Date.now().toString() + Math.random()
    }));
    setEvents([...events, ...eventsWithIds]);
  };

  const handleAddDoodle = (eventId: string, doodleData: string) => {
    setEvents(events.map(e => 
      e.id === eventId ? { ...e, doodle: doodleData } : e
    ));
    setShowDoodleEditor(false);
    setDoodleEvent(null);
  };

  const handleOpenDoodle = (event: Event) => {
    setDoodleEvent(event);
    setShowDoodleEditor(true);
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen transition-colors ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      {/* Header */}
      <header className={`${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border-b shadow-sm transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={isDarkMode ? 'text-white' : 'text-gray-900'}>SmartScheduler</h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  AI-Powered Productivity Assistant
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
                title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>

              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
                title="Notifications"
              >
                <Bell className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowProfile(!showProfile)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
                title="Profile"
              >
                <User className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
              
              <button
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
              >
                <Bot className="w-5 h-5" />
                AI Assistant
              </button>
              
              <button
                onClick={() => setShowCustomize(!showCustomize)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
                title="Customize Design"
              >
                <Palette className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
              
              <button
                onClick={() => setShowPrintView(true)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
                title="Print Schedule"
              >
                <Printer className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
              
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add Event
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Feature Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center text-sm">
            <div className="flex items-center justify-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span>Schedule events</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Pencil className="w-4 h-4" />
              <span>Add doodles & notes</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Bell className="w-4 h-4" />
              <span>Smart reminders</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" />
              <span>Print & customize</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Calendar
              events={events}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onEventClick={handleEditEvent}
              theme={theme}
              isDarkMode={isDarkMode}
            />
          </div>
          
          <div className="space-y-6">
            {showProfile && (
              <UserProfile
                userData={userData}
                onUpdate={setUserData}
                onClose={() => setShowProfile(false)}
                isDarkMode={isDarkMode}
              />
            )}

            {showNotifications && (
              <NotificationCenter
                notifications={notifications}
                events={events}
                onMarkAsRead={(id) => setNotifications(notifications.map(n => 
                  n.id === id ? { ...n, read: true } : n
                ))}
                onClear={() => setNotifications([])}
                onClose={() => setShowNotifications(false)}
                isDarkMode={isDarkMode}
              />
            )}

            {showCustomize && (
              <CustomizePanel
                theme={theme}
                onThemeChange={setTheme}
                onClose={() => setShowCustomize(false)}
                isDarkMode={isDarkMode}
              />
            )}
            
            {showAIAssistant && (
              <AIAssistant
                events={events}
                onAddEvents={handleAIAddEvents}
                onClose={() => setShowAIAssistant(false)}
                isDarkMode={isDarkMode}
              />
            )}
            
            <EventList
              events={events}
              selectedDate={selectedDate}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
              onAddDoodle={handleOpenDoodle}
              theme={theme}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>

        {/* Offline Notice */}
        <div className={`mt-6 rounded-lg shadow-sm p-4 border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
              Works offline • Your data is stored locally
            </span>
          </div>
        </div>
      </main>

      {/* Modals */}
      {isAddModalOpen && (
        <AddEventModal
          event={editingEvent}
          defaultReminder={userData.defaultReminder}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingEvent(null);
          }}
          onSave={editingEvent ? handleUpdateEvent : handleAddEvent}
          isDarkMode={isDarkMode}
        />
      )}

      {showPrintView && (
        <PrintView
          events={events}
          theme={theme}
          onClose={() => setShowPrintView(false)}
          isDarkMode={isDarkMode}
        />
      )}

      {showDoodleEditor && doodleEvent && (
        <DoodleEditor
          event={doodleEvent}
          onSave={handleAddDoodle}
          onClose={() => {
            setShowDoodleEditor(false);
            setDoodleEvent(null);
          }}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}

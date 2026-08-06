'use client';

import React, { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  ChevronLeft, ChevronRight, Calendar, Pin, Trash2, Link2, 
  ExternalLink, Clock, Sparkles, X, AlertCircle 
} from 'lucide-react';

const GET_PINS = gql`
  query GetScheduledPins {
    pins(status: "scheduled") {
      id
      title
      description
      destinationUrl
      mediaUrl
      scheduledAt
      status
    }
  }
`;

const DELETE_PIN = gql`
  mutation CancelPin($id: ID!) {
    deletePin(id: $id)
  }
`;

export default function CalendarPage() {
  const { data, loading, refetch } = useQuery(GET_PINS);
  const [deletePin] = useMutation(DELETE_PIN);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPin, setSelectedPin] = useState<any | null>(null);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleCancelPin = async (id: string) => {
    if (!confirm('Are you sure you want to cancel and delete this scheduled pin?')) return;
    try {
      await deletePin({ variables: { id } });
      setSelectedPin(null);
      refetch();
      if (window.showToast) window.showToast('Scheduled pin cancelled successfully.');
    } catch (e: any) {
      if (window.showToast) window.showToast(e.message || 'Failed to delete pin.', 'error');
    }
  };

  const pins = (data as any)?.pins || [];

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Get total days in month
  const totalDays = new Date(year, month + 1, 0).getDate();
  // Get index of first day of month (0: Sunday, 1: Monday, ...)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Create list of day blocks (empty for offset, then days 1..totalDays)
  const calendarBlocks = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarBlocks.push({ day: null, dateStr: null });
  }
  for (let d = 1; d <= totalDays; d++) {
    const dayDate = new Date(year, month, d);
    const dateStr = dayDate.toISOString().split('T')[0];
    calendarBlocks.push({ day: d, dateStr });
  }

  // Group pins by date string
  const pinsByDate: Record<string, any[]> = {};
  pins.forEach((pin: any) => {
    const dStr = pin.scheduledAt.split('T')[0];
    if (!pinsByDate[dStr]) {
      pinsByDate[dStr] = [];
    }
    pinsByDate[dStr].push(pin);
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Calendar Planner</h2>
            <p className="text-sm text-neutral-500">View and reschedule your upcoming Pinterest schedule.</p>
          </div>
          
          {/* Navigation Month Controls */}
          <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1.5 rounded-2xl self-end sm:self-auto">
            <button 
              onClick={handlePrevMonth}
              className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-extrabold px-3 min-w-[120px] text-center">
              {monthName} {year}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid Container */}
        {loading && pins.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl h-[600px] animate-pulse"></div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
            {/* Weekdays names header */}
            <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
              {weekDays.map(wd => (
                <div key={wd} className="py-3 text-center text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  {wd}
                </div>
              ))}
            </div>

            {/* Days cells */}
            <div className="grid grid-cols-7 auto-rows-[120px] divide-x divide-y divide-neutral-200 dark:divide-neutral-800">
              {calendarBlocks.map((block, idx) => {
                const dayPins = block.dateStr ? pinsByDate[block.dateStr] || [] : [];
                return (
                  <div 
                    key={idx} 
                    className={`p-2.5 flex flex-col relative transition-all duration-100 group ${
                      block.day ? 'bg-white dark:bg-neutral-900 hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20' : 'bg-neutral-50/50 dark:bg-neutral-950/10'
                    }`}
                  >
                    {/* Day number */}
                    {block.day && (
                      <span className="text-xs font-bold text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">
                        {block.day}
                      </span>
                    )}

                    {/* Day pins lists */}
                    <div className="mt-1 flex-1 overflow-y-auto space-y-1.5 scrollbar-thin">
                      {dayPins.map(pin => (
                        <button
                          key={pin.id}
                          onClick={() => setSelectedPin(pin)}
                          className="w-full text-left flex items-center gap-1.5 p-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/10 hover:border-red-500/30 transition-all"
                        >
                          <img src={pin.mediaUrl} alt={pin.title} className="w-5 h-5 rounded object-cover flex-shrink-0" />
                          <span className="text-xxs font-bold truncate flex-1">{pin.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pin Details Modal overlay */}
        {selectedPin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative text-white animate-slide-in">
              <button 
                onClick={() => setSelectedPin(null)}
                className="absolute top-6 right-6 z-10 p-2 rounded-xl bg-neutral-950/80 hover:bg-neutral-950 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2">
                {/* Media Image Side */}
                <div className="relative aspect-[2/3] sm:aspect-auto bg-neutral-950 flex items-center justify-center">
                  <img src={selectedPin.mediaUrl} alt={selectedPin.title} className="w-full h-full object-cover" />
                </div>

                {/* Metadata Side */}
                <div className="p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xxs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 w-fit capitalize">
                        <Clock className="w-3 h-3" />
                        {selectedPin.status}
                      </span>
                      <h4 className="text-lg font-extrabold leading-tight pt-1">
                        {selectedPin.title}
                      </h4>
                    </div>

                    <p className="text-xs text-neutral-400 leading-relaxed whitespace-pre-line">
                      {selectedPin.description || 'No description provided.'}
                    </p>

                    <div className="space-y-1">
                      <span className="text-xxs font-bold text-neutral-500 uppercase tracking-wider block">Scheduled for</span>
                      <p className="text-xs font-semibold text-neutral-300">
                        {new Date(selectedPin.scheduledAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {selectedPin.destinationUrl && (
                      <a 
                        href={selectedPin.destinationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 hover:underline"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        Destination Link
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="pt-6 border-t border-neutral-800">
                    <button
                      onClick={() => handleCancelPin(selectedPin.id)}
                      className="w-full inline-flex items-center justify-center gap-2 border border-red-500/30 hover:bg-red-500/5 text-red-500 font-semibold py-2.5 rounded-xl text-xs active:scale-[0.98] transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Cancel Scheduling
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

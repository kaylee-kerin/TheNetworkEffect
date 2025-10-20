
import React from 'react';
import type { AppEvent } from '../types';

interface EventLogProps {
  events: AppEvent[];
}

export const EventLog: React.FC<EventLogProps> = ({ events }) => {
  return (
    <div className="bg-gray-800/50 p-4 rounded-lg shadow-lg flex flex-col h-1/2">
      <h2 className="text-xl font-bold mb-4 text-teal-300">Event Log</h2>
      <div className="flex-grow overflow-y-auto pr-2 space-y-3">
        {events.length === 0 && (
          <p className="text-gray-400 italic">No events have occurred yet. Trigger an event to begin.</p>
        )}
        {events.map(event => (
          <div key={event.id} className="text-sm p-2 bg-gray-700/50 rounded-md">
            <p className="text-gray-300">{event.description}</p>
            <p className="text-xs text-gray-500 text-right">{new Date(event.timestamp).toLocaleTimeString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

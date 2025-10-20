import React, { useState, useCallback, useMemo } from 'react';
import { NetworkGraph } from './components/NetworkGraph';
import { ControlPanel } from './components/ControlPanel';
import { EventLog } from './components/EventLog';
import type { Participant, Relationship, AppEvent } from './types';

const firstNames = ['Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Ava', 'Elijah', 'Charlotte', 'William', 'Sophia', 'James', 'Amelia', 'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Evelyn', 'Alexander', 'Harper', 'Daniel', 'Camila', 'Michael', 'Gianna', 'Aiden', 'Abigail', 'Matthew', 'Luna', 'Joseph', 'Ella'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Lewis', 'Robinson', 'Walker'];

const initialParticipants: Participant[] = [
  { id: 'AliceSmith', name: 'Alice Smith', commitment: 0, avatarIndex: 0 },
  { id: 'BobJohnson', name: 'Bob Johnson', commitment: 0, avatarIndex: 1 },
  { id: 'CharlieBrown', name: 'Charlie Brown', commitment: 0, avatarIndex: 2 },
  { id: 'DianaMiller', name: 'Diana Miller', commitment: 0, avatarIndex: 3 },
];

const initialRelationships: Relationship[] = [
  { source: 'AliceSmith', target: 'BobJohnson', trust: 0 },
  { source: 'BobJohnson', target: 'AliceSmith', trust: 0 },
  { source: 'AliceSmith', target: 'CharlieBrown', trust: 0 },
  { source: 'CharlieBrown', target: 'AliceSmith', trust: 0 },
  { source: 'BobJohnson', target: 'CharlieBrown', trust: 0 },
  { source: 'CharlieBrown', target: 'BobJohnson', trust: 0 },
  { source: 'DianaMiller', target: 'BobJohnson', trust: 0 },
  { source: 'BobJohnson', target: 'DianaMiller', trust: 0 },
];

export type EventMagnitude = 'minor' | 'medium' | 'major';
export type SocialStructureType = 'mutual' | 'star' | 'chain';

const App: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [relationships, setRelationships] = useState<Relationship[]>(initialRelationships);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [eventMagnitude, setEventMagnitude] = useState<EventMagnitude>('minor');

  const participantCounter = React.useRef(initialParticipants.length);

  const addEvent = useCallback((description: string) => {
    const newEvent: AppEvent = {
      id: `evt-${Date.now()}`,
      description,
      timestamp: Date.now(),
    };
    setEvents(prev => [newEvent, ...prev].slice(0, 100)); // Keep last 100 events
  }, []);

  const addParticipant = useCallback(() => {
    setParticipants(prev => {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const newName = `${firstName} ${lastName}`;
      
      participantCounter.current++;
      const newId = `${newName.replace(/\s+/g, '')}-${participantCounter.current}`;

      const newParticipant: Participant = {
        id: newId,
        name: newName,
        commitment: 0, // New participants start at zero commitment
        avatarIndex: prev.length % 6, // Cycle through 6 avatars
      };

      const newParticipants = [...prev, newParticipant];
      
      // Connect to 1 or 2 existing participants
      const connections: Relationship[] = [];
      const shuffled = [...prev].sort(() => 0.5 - Math.random());
      const numConnections = Math.min(prev.length, Math.floor(Math.random() * 2) + 1);

      for (let i = 0; i < numConnections; i++) {
        const target = shuffled[i];
        // Create a small, non-zero trust so the link is visible
        const initialTrust = 10;
        connections.push({ source: newParticipant.id, target: target.id, trust: initialTrust });
        connections.push({ source: target.id, target: newParticipant.id, trust: initialTrust });
      }
      
      setRelationships(prevRels => [...prevRels, ...connections]);
      addEvent(`${newParticipant.name} joined the network.`);
      return newParticipants;
    });
  }, [addEvent]);

  const addSocialStructure = useCallback((type: SocialStructureType, size: number) => {
    if (size < 2) return;

    let newParticipants: Participant[] = [];
    const currentParticipantCount = participants.length;
    for(let i = 0; i < size; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const newName = `${firstName} ${lastName}`;
        participantCounter.current++;
        const newId = `${newName.replace(/\s+/g, '')}-${participantCounter.current}`;
        newParticipants.push({
            id: newId,
            name: newName,
            commitment: 0,
            avatarIndex: (currentParticipantCount + i) % 6
        });
    }

    const newRelationships: Relationship[] = [];
    let description = '';

    switch (type) {
      case 'mutual': {
        newParticipants = newParticipants.map(p => ({ ...p, commitment: 75 }));
        for (let i = 0; i < newParticipants.length; i++) {
          for (let j = i + 1; j < newParticipants.length; j++) {
            const p1 = newParticipants[i];
            const p2 = newParticipants[j];
            newRelationships.push({ source: p1.id, target: p2.id, trust: 100 });
            newRelationships.push({ source: p2.id, target: p1.id, trust: 100 });
          }
        }
        description = `Added a fully connected mutual group of ${size} members.`;
        break;
      }
      case 'star': {
        if (size < 2) return;
        const [hub, ...spokes] = newParticipants;
        hub.commitment = 20;
        newParticipants = [hub, ...spokes.map(s => ({ ...s, commitment: 50 }))];

        for (const spoke of spokes) {
          // Spokes trust hub fully
          newRelationships.push({ source: spoke.id, target: hub.id, trust: 100 });
          // Hub has little trust in spokes
          newRelationships.push({ source: hub.id, target: spoke.id, trust: 15 });
        }
        // Spokes have slightly more trust in each other
        for (let i = 0; i < spokes.length; i++) {
          for (let j = i + 1; j < spokes.length; j++) {
            newRelationships.push({ source: spokes[i].id, target: spokes[j].id, trust: 25 });
            newRelationships.push({ source: spokes[j].id, target: spokes[i].id, trust: 25 });
          }
        }
        description = `Added a star network with 1 hub and ${size - 1} spokes.`;
        break;
      }
      case 'chain': {
        newParticipants = newParticipants.map(p => ({ ...p, commitment: 40 }));
        for (let i = 0; i < newParticipants.length - 1; i++) {
          const p1 = newParticipants[i];
          const p2 = newParticipants[i + 1];
          newRelationships.push({ source: p1.id, target: p2.id, trust: 80 });
          newRelationships.push({ source: p2.id, target: p1.id, trust: 80 });
        }
        description = `Added a chain network of ${size} members.`;
        break;
      }
    }
    
    addEvent(description);
    setParticipants(prev => [...prev, ...newParticipants]);
    setRelationships(prev => [...prev, ...newRelationships]);

  }, [participants.length, addEvent]);

  const handleEvent = useCallback((
    type: 'mutual-increase' | 'mutual-decrease' | 'unilateral-increase' | 'unilateral-decrease',
    p1Id: string,
    p2Id: string
  ) => {
    const p1 = participants.find(p => p.id === p1Id);
    const p2 = participants.find(p => p.id === p2Id);
    if (!p1 || !p2) return;
    
    const magnitudeValues = { minor: 1, medium: 3, major: 5 };
    const baseChange = magnitudeValues[eventMagnitude];
    const randomFactor = Math.floor(Math.random() * 5) + 1; // 1 to 5
    const changeAmount = baseChange * randomFactor;

    let description = '';
    const commitmentChanges = new Map<string, number>();

    setRelationships(prev => {
      const next = [...prev];
      const updateTrust = (source: string, target: string, change: number) => {
        const relIndex = next.findIndex(r => r.source === source && r.target === target);
        if (relIndex > -1) {
          next[relIndex].trust = Math.max(-100, Math.min(100, next[relIndex].trust + change));
        } else { // Create relationship if it doesn't exist
          next.push({ source, target, trust: Math.max(-100, Math.min(100, change)) });
        }
      };
      
      switch (type) {
        case 'mutual-increase': {
          updateTrust(p1Id, p2Id, changeAmount);
          updateTrust(p2Id, p1Id, changeAmount);
          commitmentChanges.set(p1Id, (commitmentChanges.get(p1Id) || 0) + Math.floor(changeAmount / 4));
          commitmentChanges.set(p2Id, (commitmentChanges.get(p2Id) || 0) + Math.floor(changeAmount / 4));
          description = `A ${eventMagnitude} positive mutual event between ${p1.name} and ${p2.name}.`;
          break;
        }
        case 'mutual-decrease': {
          const change = -changeAmount;
          updateTrust(p1Id, p2Id, change);
          updateTrust(p2Id, p1Id, change);
          commitmentChanges.set(p1Id, (commitmentChanges.get(p1Id) || 0) + Math.floor(change / 4));
          commitmentChanges.set(p2Id, (commitmentChanges.get(p2Id) || 0) + Math.floor(change / 4));
          description = `A ${eventMagnitude} negative mutual event between ${p1.name} and ${p2.name}.`;
          break;
        }
        case 'unilateral-increase': {
          updateTrust(p1Id, p2Id, changeAmount);
          commitmentChanges.set(p1Id, (commitmentChanges.get(p1Id) || 0) + Math.floor(changeAmount / 8));
          commitmentChanges.set(p2Id, (commitmentChanges.get(p2Id) || 0) + Math.floor(changeAmount / 8));
          description = `${p1.name} increased their trust in ${p2.name}.`;
          break;
        }
        case 'unilateral-decrease': {
          const change = -changeAmount;
          updateTrust(p1Id, p2Id, change);
          commitmentChanges.set(p1Id, (commitmentChanges.get(p1Id) || 0) + Math.floor(change / 8));
          commitmentChanges.set(p2Id, (commitmentChanges.get(p2Id) || 0) + Math.floor(change / 8));
          description = `${p1.name} decreased their trust in ${p2.name}.`;
          break;
        }
      }
      
      addEvent(description);
      return next;
    });

    setParticipants(prevParts => {
      return prevParts.map(p => {
        if (commitmentChanges.has(p.id)) {
            const change = commitmentChanges.get(p.id) || 0;
            return {
                ...p,
                commitment: Math.max(0, Math.min(100, p.commitment + change))
            };
        }
        return p;
      })
    });
  }, [participants, addEvent, eventMagnitude]);

  const handleRemoveParticipant = useCallback((participantToRemove: Participant) => {
    if (!participantToRemove) return;
    
    setParticipants(prev => prev.filter(p => p.id !== participantToRemove.id));
    setRelationships(prev => prev.filter(r => r.source !== participantToRemove.id && r.target !== participantToRemove.id));
    setSelectedParticipant(null);
    addEvent(`${participantToRemove.name} has left the network.`);
  }, [addEvent]);

  const handleMutualIncrease = (p1Id: string, p2Id: string) => handleEvent('mutual-increase', p1Id, p2Id);
  const handleMutualDecrease = (p1Id: string, p2Id: string) => handleEvent('mutual-decrease', p1Id, p2Id);
  const handleUnilateralIncrease = (sourceId: string, targetId: string) => handleEvent('unilateral-increase', sourceId, targetId);
  const handleUnilateralDecrease = (sourceId: string, targetId: string) => handleEvent('unilateral-decrease', sourceId, targetId);

  const handleNodeClick = useCallback((nodeId: string) => {
      const participant = participants.find(p => p.id === nodeId);
      if (participant) {
        setSelectedParticipant(participant);
      }
  }, [participants]);

  const handleClearSelection = () => {
      setSelectedParticipant(null);
  }

  const selectedParticipantConnections = useMemo(() => {
    if (!selectedParticipant) return [];

    return participants
      .filter(p => p.id !== selectedParticipant.id) // Get everyone except the selected participant
      .map(otherParticipant => {
        const outgoingRel = relationships.find(r => r.source === selectedParticipant.id && r.target === otherParticipant.id);
        const incomingRel = relationships.find(r => r.source === otherParticipant.id && r.target === selectedParticipant.id);
        
        return {
          participant: otherParticipant,
          outgoingTrust: outgoingRel?.trust || 0,
          incomingTrust: incomingRel?.trust || 0,
        };
      })
      .sort((a, b) => a.participant.name.localeCompare(b.participant.name));
  }, [selectedParticipant, relationships, participants]);


  const graphNodes = useMemo(() => {
    return participants.map(p => {
      const influence = relationships
        .filter(r => r.target === p.id)
        .reduce((sum, r) => sum + Math.abs(r.trust), 0);
      return { ...p, influence };
    });
  }, [participants, relationships]);


  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 p-4 font-sans">
      <header className="w-full pb-4 border-b border-gray-700">
        <h1 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-blue-500">
          Network Effect & Trust Visualization
        </h1>
      </header>
      <main className="flex-grow flex mt-4 overflow-hidden gap-4">
        <div className="flex-grow w-2/3 rounded-lg bg-gray-800/50 shadow-2xl relative">
          <NetworkGraph
            nodes={graphNodes}
            links={relationships}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedParticipant?.id}
          />
           <div className="absolute top-2 right-2 p-2 bg-gray-900/70 backdrop-blur-sm rounded-lg text-sm text-gray-400">
             Click a node to see details
           </div>
        </div>
        <aside className="w-1/3 flex flex-col gap-4">
          <ControlPanel
            onAddParticipant={addParticipant}
            onAddSocialStructure={addSocialStructure}
            onMutualIncrease={handleMutualIncrease}
            onMutualDecrease={handleMutualDecrease}
            onUnilateralIncrease={handleUnilateralIncrease}
            onUnilateralDecrease={handleUnilateralDecrease}
            onRemoveParticipant={handleRemoveParticipant}
            selectedParticipant={selectedParticipant}
            connections={selectedParticipantConnections}
            onClearSelection={handleClearSelection}
            eventMagnitude={eventMagnitude}
            onMagnitudeChange={setEventMagnitude}
          />
          <EventLog events={events} />
        </aside>
      </main>
    </div>
  );
};

export default App;

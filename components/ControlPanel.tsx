import React, { useState } from 'react';
import type { Participant } from '../types';
import { PlusIcon, XCircleIcon, SwitchHorizontalIcon, ArrowRightIcon, MinusIcon, UsersIcon, TrashIcon } from './icons';

type EventMagnitude = 'minor' | 'medium' | 'major';
type SocialStructureType = 'mutual' | 'star' | 'chain';

interface Connection {
    participant: Participant;
    outgoingTrust: number;
    incomingTrust: number;
}

interface ControlPanelProps {
  onAddParticipant: () => void;
  onAddSocialStructure: (type: SocialStructureType, size: number) => void;
  onMutualIncrease: (p1Id: string, p2Id: string) => void;
  onMutualDecrease: (p1Id: string, p2Id: string) => void;
  onUnilateralIncrease: (sourceId: string, targetId: string) => void;
  onUnilateralDecrease: (sourceId: string, targetId: string) => void;
  onRemoveParticipant: (participant: Participant) => void;
  onClearSelection: () => void;
  selectedParticipant: Participant | null;
  connections: Connection[];
  eventMagnitude: EventMagnitude;
  onMagnitudeChange: (magnitude: EventMagnitude) => void;
}

const TrustBar: React.FC<{ value: number }> = ({ value }) => {
  const width = `${value}%`;
  const color = value > 66 ? 'bg-green-500' : value > 33 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="w-full bg-gray-600 rounded-full h-2.5">
      <div className={`${color} h-2.5 rounded-full`} style={{ width }}></div>
    </div>
  );
};

const DivergingTrustBar: React.FC<{ value: number }> = ({ value }) => {
  const isPositive = value >= 0;
  const width = `${Math.abs(value)}%`;
  const barColor = isPositive ? 'bg-green-500' : 'bg-red-500';
  
  return (
      <div className="w-full bg-gray-600 rounded-full h-2.5 relative overflow-hidden">
          <div className="h-full absolute" style={{
              width: '50%',
              left: '50%',
              borderLeft: '1px solid #4a5568'
          }}></div>
          <div
              className={`${barColor} h-2.5 rounded-full absolute`}
              style={{
                  width,
                  left: isPositive ? '50%' : `calc(50% - ${width})`,
              }}
          ></div>
      </div>
  );
};


export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onAddParticipant,
  onAddSocialStructure,
  onMutualIncrease,
  onMutualDecrease,
  onUnilateralIncrease,
  onUnilateralDecrease,
  onRemoveParticipant,
  selectedParticipant, 
  connections, 
  onClearSelection,
  eventMagnitude,
  onMagnitudeChange 
}) => {
  const [structureSize, setStructureSize] = useState(5);

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg shadow-lg flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4 text-teal-300">Controls & Details</h2>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-1">Event Magnitude</label>
            <div className="flex justify-between rounded-lg bg-gray-700 p-1">
                {(['minor', 'medium', 'major'] as const).map((mag) => (
                    <button
                        key={mag}
                        onClick={() => onMagnitudeChange(mag)}
                        className={`w-full px-3 py-1 text-sm font-semibold rounded-md transition-colors capitalize ${
                            eventMagnitude === mag
                                ? 'bg-teal-500 text-white shadow'
                                : 'text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {mag}
                    </button>
                ))}
            </div>
        </div>
         <div className="col-span-1 flex flex-col">
            <label className="block text-sm font-medium text-gray-400 mb-1">Network</label>
            <button
              onClick={onAddParticipant}
              className="flex-grow flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
            >
              <PlusIcon /> Add
            </button>
        </div>
      </div>

       <div className="mt-2 pt-4 border-t border-gray-600/50">
        <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
          <UsersIcon />
          Add Social Structures
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
            <label htmlFor="structure-size" className="col-span-1 text-sm font-medium text-gray-400 my-auto">Group Size:</label>
            <input
              type="number"
              id="structure-size"
              value={structureSize}
              onChange={(e) => setStructureSize(Math.max(2, parseInt(e.target.value, 10)))}
              min="2"
              max="15"
              className="col-span-2 bg-gray-700 text-white p-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
        </div>
        <div className="grid grid-cols-3 gap-2">
           <button onClick={() => onAddSocialStructure('mutual', structureSize)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 rounded-lg transition duration-200 text-sm">Mutual</button>
           <button onClick={() => onAddSocialStructure('star', structureSize)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 rounded-lg transition duration-200 text-sm">Star</button>
           <button onClick={() => onAddSocialStructure('chain', structureSize)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 rounded-lg transition duration-200 text-sm">Chain</button>
        </div>
      </div>


      <div className="flex-grow overflow-y-auto pr-2 mt-4 pt-4 border-t border-gray-600/50">
        {selectedParticipant ? (
          <div>
            <div className="flex justify-between items-start mb-3 gap-4">
                <h3 className="text-lg font-semibold text-gray-100 min-w-0 truncate" title={selectedParticipant.name}>{`${selectedParticipant.name}'s Details`}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button 
                      onClick={() => {
                        if (selectedParticipant) {
                          onRemoveParticipant(selectedParticipant);
                        }
                      }}
                      title="Remove Participant"
                      className="text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-md"
                    >
                      <TrashIcon />
                    </button>
                    <button onClick={onClearSelection} title="Clear Selection" className="text-gray-400 hover:text-white transition-colors"><XCircleIcon /></button>
                </div>
            </div>
            <div className="bg-gray-700/50 p-3 rounded-md mb-4">
                <div className="flex justify-between items-center">
                    <span className="font-medium">Commitment</span>
                    <span className="font-bold text-lg text-teal-300">{selectedParticipant.commitment}</span>
                </div>
                <TrustBar value={selectedParticipant.commitment} />
            </div>

            <h4 className="font-semibold text-gray-300">Connections:</h4>
            <div className="space-y-3 mt-2">
              {connections.length > 0 ? connections.map(conn => (
                <div key={conn.participant.id} className="bg-gray-700/50 p-3 rounded-md text-sm">
                  <p className="font-bold text-base text-teal-400 mb-2">{conn.participant.name}</p>
                  <div className="space-y-1 mb-2">
                    <div className='text-xs text-gray-400'>You trust them: <span className="font-mono float-right">{conn.outgoingTrust}</span></div>
                    <DivergingTrustBar value={conn.outgoingTrust} />
                    <div className='text-xs text-gray-400'>They trust you: <span className="font-mono float-right">{conn.incomingTrust}</span></div>
                    <DivergingTrustBar value={conn.incomingTrust} />
                  </div>
                  <div className="flex justify-around items-center pt-2 border-t border-gray-600/50">
                    <button title="Increase Mutual Trust" onClick={() => onMutualIncrease(selectedParticipant.id, conn.participant.id)} className="flex items-center gap-1 text-gray-300 hover:text-green-400 transition-colors">
                        <SwitchHorizontalIcon /><PlusIcon/>
                    </button>
                     <button title="Decrease Mutual Trust" onClick={() => onMutualDecrease(selectedParticipant.id, conn.participant.id)} className="flex items-center gap-1 text-gray-300 hover:text-red-400 transition-colors">
                        <SwitchHorizontalIcon /><MinusIcon/>
                    </button>
                     <button title="Increase Your Trust" onClick={() => onUnilateralIncrease(selectedParticipant.id, conn.participant.id)} className="flex items-center gap-1 text-gray-300 hover:text-green-400 transition-colors">
                        <ArrowRightIcon /><PlusIcon/>
                    </button>
                     <button title="Decrease Your Trust" onClick={() => onUnilateralDecrease(selectedParticipant.id, conn.participant.id)} className="flex items-center gap-1 text-gray-300 hover:text-red-400 transition-colors">
                        <ArrowRightIcon /><MinusIcon/>
                    </button>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-500 italic">No connections</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 italic">Select a participant to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};


export interface Participant {
  id: string;
  name: string;
  commitment: number; // 0-100
  avatarIndex: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface Relationship {
  source: string; // participant ID
  target: string; // participant ID
  trust: number; // -100 (distrust) to 100 (trust)
}

export interface AppEvent {
  id: string;
  description: string;
  timestamp: number;
}

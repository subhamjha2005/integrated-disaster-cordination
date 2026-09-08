export interface EmergencyHub {
  id: string;
  name: string;
  pos: [number, number];
  color: string;
}

export const EMERGENCY_HUBS: EmergencyHub[] = [
  { id: 'HQ', name: 'HQ Gateway', pos: [26.1158, 91.7582], color: '#10b981' }, // emerald
  { id: 'HOSP', name: 'City Hospital', pos: [26.1112, 91.7512], color: '#f43f5e' }, // rose
  { id: 'FIRE', name: 'Fire Brigade', pos: [26.1445, 91.7362], color: '#3b82f6' }, // blue
  { id: 'CAMP', name: 'Relief Camp Alpha', pos: [26.1859, 91.7477], color: '#f59e0b' }, // amber
  { id: 'POL', name: 'Police HQ', pos: [26.1350, 91.7700], color: '#8b5cf6' }, // violet
  { id: 'MED', name: 'Mobile Clinic', pos: [26.1600, 91.7200], color: '#ec4899' }, // pink
];

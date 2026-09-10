import { create } from 'zustand';
import { Volunteer, Camp, Resource, Task, Donation, Alert, IncidentReport, PriorityMessage, NetworkNode } from '../lib/types';
import { SupportedLanguage } from '../lib/translations';
import { submitIncidentReportAction, processDonationAction } from '../actions/mutations';
import { queueAction } from '../lib/offlineSync';
import { calculatePriorityScore, processMessageQueue } from '../lib/priorityEngine';

// Helper for distance calculation (Haversine Formula)
const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

interface AppState {
  // Core Entities
  volunteers: Volunteer[];
  camps: Camp[];
  resources: Resource[];
  tasks: Task[];
  donations: Donation[];
  alerts: Alert[];
  incidentReports: IncidentReport[];
  isHydrated: boolean;
  userRole: 'public' | 'volunteer' | 'government' | null;
  theme: 'dark' | 'light';
  language: SupportedLanguage;

  // Network Simulation State
  networkMode: 'normal' | 'satellite' | 'degraded';
  networkNodes: NetworkNode[];
  priorityMessages: PriorityMessage[];
  isDroneDeployed: boolean;
  dronePosition: { lat: number; lng: number } | null;
  rfMode: 'lora' | 'cofdm';
  dronePowerMode: 'battery' | 'tethered';
  originHubId: string;
  destHubId: string;
  setMeshRoute: (origin: string, dest: string) => void;

  // Actions
  setHydratedState: (state: Partial<AppState>) => void;
  setRole: (role: 'public' | 'volunteer' | 'government' | null) => void;
  toggleTheme: () => void;
  setLanguage: (lang: SupportedLanguage) => void;
  addVolunteer: (volunteer: Volunteer) => void;
  updateVolunteerStatus: (id: string, status: Volunteer['status']) => void;
  assignVolunteerToTask: (volunteerId: string, taskId: string) => void;

  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void;
  markAlertRead: (id: string) => void;

  consumeResource: (resourceId: string, amount: number) => void;
  addIncidentReport: (report: Omit<IncidentReport, 'id' | 'timestamp' | 'status'>) => void;
  addDonation: (donation: Omit<Donation, 'id' | 'status'>) => void;
  matchTasksForVolunteer: (volunteerId: string) => (Task & { distance: number })[];

  // Network Actions
  triggerInfrastructureFailure: () => void;
  restoreNetwork: () => void;
  sendPriorityMessage: (msg: Omit<PriorityMessage, 'id' | 'priorityScore' | 'status' | 'timestamp'> & { proximityScore?: number }) => void;
  deployDrone: () => void;
  recallDrone: () => void;
  updateDronePosition: (lat: number, lng: number) => void;
  setRfMode: (mode: 'lora' | 'cofdm') => void;
  setDronePowerMode: (mode: 'battery' | 'tethered') => void;
  hopQueuedMessages: () => void;
  deliverQueuedMessages: () => void;

  // Swarm Sync
  syncOfflineActions: (actions: any[]) => void;
}

// Initial Tasks and Alerts remain local for UI demonstration logic
const initialTasks: Task[] = [
  { id: 'task-1', title: 'Triage Incoming Evacuees', description: 'Need medical staff to triage 50 incoming evacuees at AEC Main shelter.', requiredSkills: ['Medical'], campId: 'camp-1', status: 'Open', assignedVolunteerIds: [] },
  { id: 'task-2', title: 'Setup Comm Relay', description: 'Establish satellite uplinks at Jalukbari center.', requiredSkills: ['Communication'], campId: 'camp-2', status: 'In Progress', assignedVolunteerIds: ['vol-2'] },
];

const initialVolunteers: Volunteer[] = [
  { id: 'vol-1', name: 'Dr. Sarah Chen', skills: ['Medical'], status: 'Available', location: { lat: 26.1158, lng: 91.7582 }, assignedCampId: 'camp-1' },
  { id: 'vol-2', name: 'Kabir Das', skills: ['Search & Rescue', 'Logistics'], status: 'Deployed', location: { lat: 26.1445, lng: 91.7362 }, assignedCampId: 'camp-2' },
  { id: 'vol-3', name: 'Elena Rodriguez', skills: ['Water Rescue', 'Medical'], status: 'Available', location: { lat: 26.1112, lng: 91.7512 } },
  { id: 'vol-4', name: 'Arjun Mehta', skills: ['Electrical & Comm'], status: 'Available', location: { lat: 26.1859, lng: 91.7477 } },
];

const initialAlerts: Alert[] = [
  { id: 'alert-1', type: 'Critical', message: 'AEC Campus Main Shelter is nearly over capacity. Divert new evacuees.', timestamp: new Date().toISOString(), relatedCampId: 'camp-1', isRead: false },
  { id: 'alert-2', type: 'Warning', message: 'GU Hub fuel reserves < 24 hrs.', timestamp: new Date(Date.now() - 3600000).toISOString(), relatedCampId: 'camp-3', isRead: false },
];

export const useAppStore = create<AppState>((set, get) => ({
  volunteers: initialVolunteers,
  camps: [],
  resources: [],
  tasks: initialTasks,
  donations: [],
  alerts: initialAlerts,
  incidentReports: [],
  isHydrated: false, // Ensures UI waits for DB load if needed
  userRole: null, // Default to null to force login selection
  theme: 'dark',
  networkMode: 'normal',
  isDroneDeployed: false,
  dronePosition: null,
  rfMode: 'lora',
  dronePowerMode: 'battery',
  originHubId: 'HQ',
  destHubId: 'CAMP',
  priorityMessages: [],
  networkNodes: [
    { id: 'node-gateway', name: 'HQ Gateway', type: 'gateway', status: 'online', location: { lat: 26.1158, lng: 91.7582 } },
    { id: 'node-police', name: 'Police Field Node', type: 'field', status: 'online', location: { lat: 26.1445, lng: 91.7362 } },
    { id: 'node-health', name: 'Health Field Node', type: 'field', status: 'online', location: { lat: 26.1112, lng: 91.7512 } },
    { id: 'node-drone', name: 'Drone Relay Alpha', type: 'drone', status: 'offline', location: { lat: 26.1859, lng: 91.7477 } },
  ],

  setHydratedState: (state) => {
    let parsedVolunteers = undefined;
    let parsedRole: 'public' | 'volunteer' | 'government' | null = null;

    if (typeof window !== 'undefined') {
      try {
        const storedVolunteers = localStorage.getItem('volunteers');
        if (storedVolunteers) parsedVolunteers = JSON.parse(storedVolunteers);
      } catch (e) {
        console.warn('Failed to parse stored volunteers:', e);
      }

      try {
        const storedRole = localStorage.getItem('userRole');
        if (storedRole) {
          try {
            parsedRole = JSON.parse(storedRole);
          } catch {
            parsedRole = storedRole as any;
          }
        }
      } catch (e) {
        console.warn('Failed to parse stored role:', e);
      }
    }

    set((s) => ({
      ...s,
      ...state,
      volunteers: Array.isArray(parsedVolunteers) ? parsedVolunteers : s.volunteers,
      userRole: (parsedRole === 'public' || parsedRole === 'volunteer' || parsedRole === 'government')
        ? parsedRole
        : s.userRole,
      isHydrated: true
    }));
  },
  setRole: (role) => {
    set({ userRole: role });
    if (typeof window !== 'undefined' && role) {
      try {
        localStorage.setItem('userRole', JSON.stringify(role));
      } catch (e) {
        console.error('Failed to persist userRole:', e);
      }
    }
  },

  language: 'en',
  setLanguage: (lang: SupportedLanguage) => {
    set({ language: lang });
    if (typeof window !== 'undefined') localStorage.setItem('quantum_lang', lang);
  },

  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      localStorage.setItem('quantum_theme', newTheme);
      if (newTheme === 'light') {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
    }
    return { theme: newTheme };
  }),

  addVolunteer: (volunteer) => set((state) => {
    const updatedVolunteers = [...state.volunteers, volunteer];
    if (typeof window !== 'undefined') localStorage.setItem('volunteers', JSON.stringify(updatedVolunteers));
    return { volunteers: updatedVolunteers };
  }),

  updateVolunteerStatus: (id, status) => set((state) => ({
    volunteers: state.volunteers.map(v => v.id === id ? { ...v, status } : v)
  })),

  assignVolunteerToTask: (volunteerId, taskId) => set((state) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return state;

    return {
      tasks: state.tasks.map(t =>
        t.id === taskId
          ? { ...t, assignedVolunteerIds: [...t.assignedVolunteerIds, volunteerId], status: 'In Progress' }
          : t
      ),
      volunteers: state.volunteers.map(v =>
        v.id === volunteerId
          ? { ...v, status: 'Deployed', assignedCampId: task.campId }
          : v
      )
    };
  }),

  addAlert: (alertData) => set((state) => ({
    alerts: [{ ...alertData, id: `alert-${Date.now()}`, timestamp: new Date().toISOString() }, ...state.alerts]
  })),

  markAlertRead: (id) => set((state) => ({
    alerts: state.alerts.map(a => a.id === id ? { ...a, isRead: true } : a)
  })),

  consumeResource: (resourceId, amount) => set((state) => {
    let newAlerts = [...state.alerts];
    const newResources = state.resources.map(r => {
      if (r.id === resourceId) {
        const remaining = Math.max(0, r.quantity - amount);
        const isCritical = remaining < 10;

        if (isCritical && !r.isCriticalShortage) {
          newAlerts = [{
            id: `alert-auto-${Date.now()}`,
            type: 'Critical',
            message: `CRITICAL SHORTAGE: ${r.name} running low!`,
            timestamp: new Date().toISOString(),
            relatedCampId: r.campId,
            isRead: false
          }, ...newAlerts];
        }

        return { ...r, quantity: remaining, isCriticalShortage: isCritical };
      }
      return r;
    });

    // Offline Sync Integration
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // If offline, push to the mesh queue for later sync
      queueAction({
        type: 'CONSUME_RESOURCE',
        payload: { resourceId, amount }
      }).catch(console.error);
    }

    return { resources: newResources, alerts: newAlerts };
  }),

  addDonation: async (donation) => {
    // Optimistic UI update
    const tempId = `don-temp-${Date.now()}`;
    const optimisticDonation: Donation = { ...donation, id: tempId, status: 'Processing' } as Donation;

    set((state) => ({
      donations: [optimisticDonation, ...state.donations]
    }));

    // Server Action
    const result = await processDonationAction(donation);
    if (result.success && result.data) {
      set((state) => ({
        donations: state.donations.map(d => d.id === tempId ? result.data as Donation : d)
      }));
    }
  },

  addIncidentReport: async (report) => {
    // Optimistic UI update
    const tempId = `repo-temp-${Date.now()}`;
    const optimisticReport: IncidentReport = { ...report, id: tempId, timestamp: new Date().toISOString(), status: 'Pending' } as IncidentReport;

    set((state) => ({
      incidentReports: [optimisticReport, ...state.incidentReports]
    }));

    // Server Action
    const result = await submitIncidentReportAction(report);
    if (result.success && result.data) {
      set((state) => ({
        incidentReports: state.incidentReports.map(r => r.id === tempId ? result.data as IncidentReport : r)
      }));
    }
  },

  // Intelligent Allocation Helper (Logic only, used in components)
  matchTasksForVolunteer: (volunteerId: string) => {
    const state = get();
    const volunteer = state.volunteers.find(v => v.id === volunteerId);
    if (!volunteer || volunteer.status !== 'Available') return [];

    return state.tasks
      .filter(task =>
        task.status === 'Open' &&
        task.requiredSkills.some(skill =>
          volunteer.skills.some(vSkill => vSkill.toLowerCase() === skill.toLowerCase())
        )
      )
      .map(task => {
        const camp = state.camps.find(c => c.id === task.campId);
        const distance = camp ? getDistance(volunteer.location.lat, volunteer.location.lng, camp.location.lat, camp.location.lng) : 999;
        return { ...task, distance };
      })
      .sort((a, b) => a.distance - b.distance);
  },

  triggerInfrastructureFailure: () => set((state) => {
    // 1. Switch to satellite mode
    // 2. Mark field nodes as offline
    // 3. Process the current message queue
    const newNodes = state.networkNodes.map(node => 
      node.type === 'field' ? { ...node, status: 'offline' as const } : node
    );
    
    return {
      networkMode: 'satellite',
      networkNodes: newNodes,
      priorityMessages: processMessageQueue(state.priorityMessages, 'satellite'),
      alerts: [{
        id: `alert-net-fail-${Date.now()}`,
        type: 'Critical',
        message: 'COMMUNICATION INFRASTRUCTURE FAILURE. Switching to satellite/mesh fallback.',
        timestamp: new Date().toISOString(),
        isRead: false
      }, ...state.alerts]
    };
  }),

  restoreNetwork: () => set((state) => {
    const newNodes = state.networkNodes.map(node => 
      node.type === 'field' ? { ...node, status: 'online' as const } : node
    );
    
    return {
      networkMode: 'normal',
      networkNodes: newNodes,
      isDroneDeployed: false,
      priorityMessages: processMessageQueue(state.priorityMessages, 'normal'),
      alerts: [{
        id: `alert-net-restored-${Date.now()}`,
        type: 'Info',
        message: 'Primary communications restored.',
        timestamp: new Date().toISOString(),
        isRead: false
      }, ...state.alerts]
    };
  }),

  sendPriorityMessage: (msgInput) => set((state) => {
    const score = calculatePriorityScore(msgInput.urgencyLevel, msgInput.senderRole, msgInput.proximityScore || 0);
    
    const newMsg: PriorityMessage = {
      id: `msg-${Date.now()}`,
      sender: msgInput.sender,
      senderRole: msgInput.senderRole,
      urgencyLevel: msgInput.urgencyLevel,
      content: msgInput.content,
      location: msgInput.location,
      timestamp: new Date().toISOString(),
      priorityScore: score,
      status: 'queued' // Default, will be evaluated by processMessageQueue
    };

    const newMessages = processMessageQueue([newMsg, ...state.priorityMessages], state.networkMode);
    
    return { priorityMessages: newMessages };
  }),

  deployDrone: () => set((state) => {
    const newNodes = state.networkNodes.map(node => 
      node.type === 'drone' ? { ...node, status: 'mesh' as const } : node
    );
    
    return {
      isDroneDeployed: true,
      networkNodes: newNodes,
      alerts: [{
        id: `alert-drone-${Date.now()}`,
        type: 'Warning',
        message: 'Drone Relay Alpha deployed to establish mesh network.',
        timestamp: new Date().toISOString(),
        isRead: false
      }, ...state.alerts]
    };
  }),

  recallDrone: () => set((state) => {
    const newNodes = state.networkNodes.map(node => 
      node.type === 'drone' ? { ...node, status: 'offline' as const } : node
    );
    return { isDroneDeployed: false, networkNodes: newNodes };
  }),

  updateDronePosition: (lat, lng) => set({ dronePosition: { lat, lng } }),
  setRfMode: (mode) => set({ rfMode: mode }),
  setDronePowerMode: (mode) => set({ dronePowerMode: mode }),
  setMeshRoute: (origin, dest) => set({ originHubId: origin, destHubId: dest }),

  hopQueuedMessages: () => set((state) => {
    const updatedMessages = state.priorityMessages.map(msg => 
      (msg.status === 'queued' || msg.status === 'delayed') 
        ? { ...msg, status: 'hopping' as const } 
        : msg
    );
    return { priorityMessages: updatedMessages };
  }),

  deliverQueuedMessages: () => set((state) => {
    const updatedMessages = state.priorityMessages.map(msg => 
      (msg.status === 'queued' || msg.status === 'delayed') 
        ? { ...msg, status: 'delivered' as const } 
        : msg
    );
    return { priorityMessages: updatedMessages };
  }),

  syncOfflineActions: (actions) => set((state) => {
    console.log('Swarm Sync: Processed', actions.length, 'offline actions.');
    
    const newResources = [...state.resources];
    let newAlerts = [...state.alerts];

    actions.forEach(action => {
      if (action.type === 'CONSUME_RESOURCE') {
        const { resourceId, amount } = action.payload;
        const rIndex = newResources.findIndex(r => r.id === resourceId);
        if (rIndex !== -1) {
          const r = newResources[rIndex];
          const remaining = Math.max(0, r.quantity - amount);
          const isCritical = remaining < 10;

          // Check if we should trigger a new alert
          if (isCritical && !r.isCriticalShortage) {
            newAlerts = [{
              id: `alert-${Date.now()}-${resourceId}`,
              type: 'Critical',
              message: `CRITICAL SHORTAGE: ${r.name} is below threshold (${remaining} ${r.unit} remaining).`,
              timestamp: new Date().toISOString(),
              relatedCampId: r.campId,
              isRead: false
            }, ...newAlerts];
          }

          newResources[rIndex] = {
            ...r,
            quantity: remaining,
            isCriticalShortage: isCritical
          };
        }
      }
    });

    return { resources: newResources, alerts: newAlerts };
  })
}));

# IDCS — Technical Architecture & Plan

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        IDCS Architecture                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │   Login /     │    │  Public Hub  │    │   Command Center     │  │
│  │   Role Select │    │  (Home)      │    │   (/command)         │  │
│  └──────┬───────┘    └──────┬───────┘    └──────────┬───────────┘  │
│         │                   │                       │               │
│         ▼                   ▼                       ▼               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    DashboardLayout                          │   │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  │   │
│  │  │ Sidebar │  │  Header  │  │  ChatBot   │  │ Alerts   │  │   │
│  │  └─────────┘  └──────────┘  └────────────┘  └──────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Zustand Store                             │   │
│  │  ┌────────────┐ ┌───────────────┐ ┌──────────────────────┐ │   │
│  │  │ Core State │ │ Network State │ │ Priority Engine      │ │   │
│  │  │ - camps    │ │ - networkMode │ │ - priorityMessages   │ │   │
│  │  │ - vols     │ │ - nodes[]     │ │ - scoring algorithm  │ │   │
│  │  │ - tasks    │ │ - dronePos    │ │ - bandwidth throttle │ │   │
│  │  │ - alerts   │ │ - isDrone     │ │                      │ │   │
│  │  └────────────┘ └───────────────┘ └──────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│              ┌───────────────┼───────────────┐                     │
│              ▼               ▼               ▼                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐      │
│  │  IndexedDB   │ │   MongoDB    │ │   Nostr Relays       │      │
│  │  (Offline)   │ │  (Server)    │ │  (Decentralized Chat)│      │
│  └──────────────┘ └──────────────┘ └──────────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Message Prioritization

```
User sends message
       │
       ▼
┌──────────────────┐
│ calculatePriority │
│ Score = (U×0.5)  │
│      + (R×0.3)   │
│      + (P×0.2)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     networkMode === 'normal'
│ Check Network    │────────────────────────────→ DELIVER immediately
│ Mode             │
└────────┬─────────┘
         │ networkMode === 'satellite'
         ▼
┌──────────────────┐     score > SATELLITE_THRESHOLD
│ Bandwidth Gate   │────────────────────────────→ DELIVER via satellite
│ (Throttle)       │
└────────┬─────────┘
         │ score <= threshold
         ▼
┌──────────────────┐
│ QUEUE message    │
│ Status: DELAYED  │
│ Wait for drone   │
└────────┬─────────┘
         │ drone reaches gateway
         ▼
┌──────────────────┐
│ FLUSH queue      │
│ Status: DELIVERED│
└──────────────────┘
```

---

## Data Flow: Infrastructure Failure Simulation

```
User clicks "SIMULATE INFRASTRUCTURE FAILURE"
       │
       ▼
┌──────────────────────────────────────────┐
│ triggerInfrastructureFailure()            │
│ 1. networkMode → 'satellite'             │
│ 2. Field nodes → status: 'offline'       │
│ 3. Gateway node stays 'online'           │
│ 4. System alert pushed                   │
│ 5. Topology graph updates (links → red)  │
└──────────┬───────────────────────────────┘
           │
           ▼
User clicks "DEPLOY DRONE RELAY"
           │
           ▼
┌──────────────────────────────────────────┐
│ deployDrone()                             │
│ 1. isDroneDeployed → true                │
│ 2. Drone node → status: 'mesh'           │
│ 3. Animation starts: incident → gateway  │
│ 4. Topology shows yellow dashed link     │
│ 5. Map shows animated drone icon         │
└──────────┬───────────────────────────────┘
           │
           ▼
Drone reaches gateway (distance < 0.5km)
           │
           ▼
┌──────────────────────────────────────────┐
│ Auto-flush queued messages               │
│ 1. All QUEUED messages → DELIVERED       │
│ 2. Message feed updates with ✅ status   │
│ 3. Drone link turns green momentarily    │
└──────────────────────────────────────────┘
```

---

## Component Architecture

```
/command (Command Center Page)
├── NetworkStatusBar
│   ├── Network Mode Badge (Normal / Satellite)
│   ├── "SIMULATE FAILURE" Button
│   ├── "DEPLOY DRONE" Button
│   └── "RESTORE NETWORK" Button
│
├── MapPanel (60% width)
│   ├── ReliefMap (existing)
│   │   ├── Camp Markers (existing)
│   │   ├── Heat Layer (existing)
│   │   └── DroneRelay (NEW)
│   │       ├── Drone Marker (animated)
│   │       └── Dashed Polyline Trail
│   │
├── TopologyPanel (40% width, top)
│   └── NetworkTopology (NEW)
│       ├── Gateway Node (SVG circle)
│       ├── Police Field Node
│       ├── Health Field Node
│       ├── Drone Node (animated)
│       └── Connection Lines (state-driven)
│
├── MessagePanel (40% width, bottom)
│   └── MessageFeedLive (NEW)
│       ├── Priority Message Cards
│       │   ├── Score Badge
│       │   ├── Role Badge
│       │   ├── Content
│       │   └── Status (QUEUED/HOPPING/DELIVERED)
│       └── Auto-scroll Container
│
└── QuickSendPanel (Bottom overlay)
    ├── Role Selector Dropdown
    ├── Pre-built Demo Messages
    └── Send Button
```

---

## File Structure (New & Modified)

```
src/
├── lib/
│   ├── types.ts              [MODIFY] — Add AgencyRole, PriorityMessage, NetworkNode
│   ├── priorityEngine.ts     [NEW]    — Score calculation + queue processing
│   ├── offlineSync.ts        [EXISTS] — Already has IndexedDB queue
│   └── offlineChat.ts        [EXISTS] — Already has BroadcastChannel
│
├── store/
│   └── useAppStore.ts        [MODIFY] — New network/priority state slices
│
├── components/
│   ├── Network/
│   │   └── NetworkTopology.tsx [NEW]  — SVG topology graph
│   ├── Map/
│   │   ├── MapClient.tsx       [MODIFY] — Add drone rendering
│   │   ├── ReliefMap.tsx       [EXISTS]
│   │   └── DroneRelay.tsx      [NEW]  — Animated drone marker
│   ├── UI/
│   │   └── MessageFeedLive.tsx [NEW]  — Priority message feed
│   └── Layout/
│       └── DashboardLayout.tsx [MODIFY] — Add /command nav link
│
├── app/
│   └── command/
│       └── page.tsx            [NEW]  — Command Center page
│
docs/
├── PRD.md                      [NEW]  — Product Requirements
├── PHASES.md                   [NEW]  — Implementation Phases
├── PLAN.md                     [NEW]  — This file
├── ARCHITECTURE.md             [NEW]  — Architecture diagrams
└── DEMO_SCRIPT.md              [NEW]  — 2-minute demo script
```

---

## Key Design Decisions

### 1. Custom SVG vs React Flow for Topology
**Decision:** Custom SVG + framer-motion  
**Rationale:** Zero npm install time. React Flow is 200KB+ and requires learning its API. A 4-node topology is trivially simple with raw SVG circles and lines. Framer-motion (already installed) handles animations.

### 2. Linear Interpolation vs Turf.js for Drone
**Decision:** Manual `lerp()` function  
**Rationale:** Turf.js is an unnecessary dependency for interpolating between two known points. A 5-line lerp function does the same thing.

### 3. Zustand vs Separate Context for Network State
**Decision:** Extend existing Zustand store  
**Rationale:** All components already consume `useAppStore`. Adding new slices is trivial and avoids prop drilling or multiple providers.

### 4. No WebSocket Server for "Real-Time"
**Decision:** Zustand reactive state simulates real-time  
**Rationale:** In a hackathon context, the demo is local. Zustand's `set()` triggers React re-renders instantly across all consuming components, giving the illusion of real-time updates without needing a WebSocket server.

---

## Performance Considerations

- **Drone Animation:** Uses `requestAnimationFrame` for 60fps, not `setInterval`
- **Message Feed:** Virtualized auto-scroll with max 50 visible messages
- **Topology SVG:** Minimal DOM nodes (4 circles, 4 lines, text labels)
- **Re-render Isolation:** Each component subscribes to specific store slices via Zustand selectors

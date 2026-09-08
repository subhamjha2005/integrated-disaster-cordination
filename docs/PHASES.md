# IDCS — Implementation Phases

## Phase Overview

```
Phase 1 (Foundation)     ──→  Phase 2 (Core Engine)  ──→  Phase 3 (Visual Layer)  ──→  Phase 4 (Integration)
   Types + Store                Priority Engine            Topology + Drone            Command Center
   ~15 min                      ~10 min                    ~25 min                     ~30 min
```

---

## Phase 1: Foundation Layer (Types + Store)
**Estimated Time:** 15 minutes  
**Risk Level:** Low  
**Dependencies:** None

### Tasks
1. **Extend `types.ts`** with new interfaces:
   - `AgencyRole` — typed union for all responder roles
   - `PriorityMessage` — message with score, status, urgency
   - `NetworkNode` — node in the topology graph
   - `ROLE_WEIGHTS` — constant map of role → numeric weight

2. **Expand `useAppStore.ts`** Zustand store:
   - Add state: `networkMode`, `priorityMessages`, `networkNodes`, `dronePosition`, `isDroneDeployed`
   - Add actions: `triggerInfrastructureFailure()`, `restoreNetwork()`, `sendPriorityMessage()`, `deployDrone()`, `updateDronePosition()`, `deliverMessage()`
   - Pre-seed 4 network nodes with initial positions

### Exit Criteria
- [ ] All new types compile with zero errors
- [ ] Store actions can be called from React DevTools without crash
- [ ] `networkMode` toggles between 'normal' and 'satellite'

---

## Phase 2: Core Priority Engine
**Estimated Time:** 10 minutes  
**Risk Level:** Low  
**Dependencies:** Phase 1

### Tasks
1. **Create `priorityEngine.ts`**:
   - `calculatePriorityScore()` — the scoring formula
   - `processMessageQueue()` — bandwidth-aware sorting and throttling
   - Pure functions, fully testable

### Exit Criteria
- [ ] Score for Health + Urgency 5 + Close proximity > Score for Public + Urgency 1 + Far
- [ ] In satellite mode, only top-N messages pass threshold
- [ ] Console.log verification of score calculations

---

## Phase 3: Visual Components
**Estimated Time:** 25 minutes  
**Risk Level:** Medium  
**Dependencies:** Phase 1, Phase 2

### Tasks
1. **Create `NetworkTopology.tsx`** (SVG-based):
   - 4 nodes rendered as animated circles
   - Connection lines with state-driven colors (green/red/yellow)
   - Pulse animations on data transfer
   - Framer-motion transitions on state change

2. **Create `DroneRelay.tsx`** (Leaflet component):
   - Custom drone SVG divIcon
   - `useEffect` animation loop with `requestAnimationFrame`
   - Linear interpolation between incident → gateway coordinates
   - Dashed polyline trail on the map
   - Auto-flush messages on arrival at gateway

3. **Create `MessageFeedLive.tsx`**:
   - Auto-scrolling container with newest messages at bottom
   - Color-coded priority badges (🔥 HIGH / ⚡ MED / 📋 LOW)
   - Status progression animation: QUEUED → HOPPING → DELIVERED
   - Framer-motion staggered entry for new messages

### Exit Criteria
- [ ] Topology graph renders with correct node positions
- [ ] Drone animates smoothly on the map
- [ ] Message feed auto-scrolls and shows correct status colors

---

## Phase 4: Command Center Integration
**Estimated Time:** 30 minutes  
**Risk Level:** Medium-High  
**Dependencies:** Phase 1, 2, 3

### Tasks
1. **Create `/command/page.tsx`** — the judge-facing page:
   - Compose all Phase 3 components into a single dashboard layout
   - Add "SIMULATE INFRASTRUCTURE FAILURE" button with dramatic red styling
   - Add "DEPLOY DRONE RELAY" button
   - Add "RESTORE NETWORK" button
   - Add quick-send message panel with pre-built demo messages
   - Add role selector for demo message sender

2. **Update `DashboardLayout.tsx`**:
   - Add `/command` to `authorityNavigation` array

3. **Update `MapClient.tsx`**:
   - Conditionally render DroneRelay component when `isDroneDeployed` is true

### Exit Criteria
- [ ] Full demo script runs end-to-end on `/command` page
- [ ] All buttons trigger correct state changes
- [ ] Visual quality meets hackathon-winning standard
- [ ] Mobile-responsive layout works on tablet

---

## Phase 5: Polish & Verification
**Estimated Time:** 10 minutes  
**Risk Level:** Low  
**Dependencies:** Phase 4

### Tasks
1. Run full demo script (the 2-minute killer demo)
2. Fix any visual glitches, overlaps, or animation jank
3. Verify offline mode works (disconnect network in DevTools)
4. Test mobile responsiveness
5. Ensure SYSTEM DISPATCH & INCIDENT COMMAND ACTIVE banner is visible

### Exit Criteria
- [ ] Demo runs without errors in console
- [ ] All animations run at 60fps
- [ ] No visual overlaps or text clipping
- [ ] Responsive on 768px+ screens

---

## Total Estimated Time: ~90 minutes

## Risk Mitigation
| Risk | Mitigation |
|------|-----------|
| SVG topology too complex | Simplified 4-node layout with hardcoded positions |
| Drone animation jank | Use requestAnimationFrame, not setInterval |
| Store too large | Keep network state separate, minimal re-renders |
| TypeScript errors | Build incrementally, verify each phase |

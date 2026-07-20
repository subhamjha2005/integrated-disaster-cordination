# IDCS — Product Requirements Document (PRD)

## 1. Product Overview

**Product Name:** IDCS — Integrated Disaster Coordination System  
**Version:** 2.0 (Hackathon Final)  
**Date:** July 20, 2026  
**Team:** Pyro Hackathon Team

### 1.1 Problem Statement

During large-scale natural disasters (floods, earthquakes, cyclones), communication infrastructure (cell towers, fiber optic cables, internet exchanges) is the first casualty. Emergency responders — police, health workers, NDRF teams, and local administrators — are left unable to coordinate, prioritize, or track relief operations. Existing disaster management tools assume always-on internet connectivity, making them useless precisely when they're needed most.

### 1.2 Solution

IDCS is a **software-based disaster coordination platform** that guarantees communication continuity through:

1. **Intelligent Message Prioritization** — A scoring engine that ensures critical medical emergencies get bandwidth before routine administrative requests
2. **Software-Simulated Fallback Networks** — A mesh/drone relay simulator demonstrating how messages can hop between isolated nodes when primary infrastructure fails
3. **Live Command & Control Dashboard** — Real-time network topology visualization, drone tracking, and prioritized message feeds
4. **Offline-First Architecture** — IndexedDB persistence, BroadcastChannel tab-to-tab messaging, and automatic queue flushing on reconnection

### 1.3 Target Users

| Role | Priority Weight | Description |
|------|----------------|-------------|
| Health (Ambulance/Doctor) | 10 | Medical responders handling life-threatening situations |
| NDRF (National Disaster Response Force) | 9 | Specialized disaster response teams |
| Local Admin | 8 | District collectors, municipal officers coordinating relief |
| Police | 6 | Law enforcement maintaining order and security |
| Public | 2 | Citizens reporting incidents and requesting aid |

---

## 2. Core Modules

### Module A: Multi-Agency Identity & Role System

**What:** Role-based access control with priority weights baked into every message.

**Requirements:**
- Pre-defined roles: Police, Health, NDRF, LocalAdmin, Public
- Each role carries a numeric priority weight (used by the scoring engine)
- Role selection at login feeds into message prioritization
- Visual badge showing current role in the dashboard header

**Acceptance Criteria:**
- [ ] User can select a role at login
- [ ] Role weight is applied to every outgoing message
- [ ] Dashboard shows role-specific navigation and badges

---

### Module B: Fallback Network Simulator (Software-Based)

**What:** A software simulation demonstrating how data survives infrastructure collapse through mesh networking, drone relays, and store-and-forward protocols.

**Requirements:**
- Simulate 4-5 network nodes (Gateway, Police Field, Health Field, NDRF Field, Drone Relay)
- "Simulate Infrastructure Failure" button that:
  - Disconnects field nodes from the gateway
  - Introduces simulated packet loss and latency
  - Switches network mode to "Satellite/Mesh"
- Store-and-Forward algorithm: messages queue locally and hop to the next available node
- Drone Relay simulation: animated drone icon moves between isolated node → gateway
- When drone reaches gateway proximity, queued messages auto-flush and deliver

**Acceptance Criteria:**
- [ ] Network topology graph shows nodes and their connection states
- [ ] Clicking "Simulate Failure" turns links red and queues messages
- [ ] Drone relay animation is smooth and visible on the map
- [ ] Messages flush and show "DELIVERED" when drone reaches gateway
- [ ] "Restore Network" returns everything to green

---

### Module C: Intelligent Message Prioritization Engine

**What:** A backend algorithm that scores every outgoing message and enforces bandwidth-aware throttling.

**Scoring Formula:**
```
Priority Score = (Urgency Level × 0.5) + (Sender Role Weight × 0.3) + (Proximity to Incident × 0.2)
```

**Requirements:**
- Urgency levels: 1 (Routine) to 5 (Life-Threatening)
- Role weights: Health=10, NDRF=9, LocalAdmin=8, Police=6, Public=2
- Proximity: Normalized 0-10 based on distance to nearest active incident
- In "Satellite Mode" (low bandwidth): only messages with score > threshold pass through; others are delayed
- Visual proof: low-priority messages show "DELAYED" while high-priority messages show "DELIVERED"

**Acceptance Criteria:**
- [ ] Every message gets a visible priority score
- [ ] High-priority messages are delivered first in degraded mode
- [ ] Low-priority messages are visibly delayed/queued
- [ ] Score breakdown is transparent in the UI

---

### Module D: Live Command & Control Dashboard

**What:** The single page judges will evaluate. Must be real-time, visually impressive, and tell a story.

**Layout:**
- **Top Bar:** Network mode indicator, "SIMULATE FAILURE" button, "DEPLOY DRONE" button, "RESTORE" button
- **Left Panel (60%):** Live Leaflet map with camp markers, incident zones, animated drone relay path
- **Top-Right (40%):** Network Topology Graph (SVG-based) showing nodes and link states
- **Bottom-Right:** Auto-scrolling prioritized message feed with color-coded entries
- **Quick-Send Panel:** Pre-built demo messages with role selector for live demo

**Requirements:**
- All data updates in real-time (Zustand reactive state)
- Network topology animates link state changes
- Message feed auto-scrolls with framer-motion entry animations
- Drone icon moves smoothly on the map with a dashed trail
- Mobile-responsive layout

**Acceptance Criteria:**
- [ ] Full demo script can be executed without leaving this page
- [ ] Network failure → queuing → drone relay → delivery flow works end-to-end
- [ ] Visual quality matches award-winning dashboard aesthetics

---

## 3. Technical Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Frontend | Next.js 16 + React 19 | Already in use, SSR + client components |
| State Management | Zustand | Already in use, minimal boilerplate |
| Styling | Tailwind CSS v4 | Already in use, rapid UI development |
| Mapping | react-leaflet + Leaflet.js | Already in use, camp/incident visualization |
| Animation | framer-motion | Already in use, micro-interactions |
| Icons | lucide-react | Already in use, consistent icon system |
| Offline Persistence | IndexedDB | Already in use via offlineSync.ts |
| Real-time Chat | Nostr Protocol (nostr-tools) | Already in use for decentralized messaging |
| Database | MongoDB (via Mongoose) | Already in use for camps, donations, reports |
| Network Topology | Custom SVG + framer-motion | No new dependency, maximum control |
| Drone Animation | Leaflet Marker + linear interpolation | No new dependency (no Turf.js needed) |

**Key Constraint:** ZERO new npm packages. Everything builds on existing dependencies.

---

## 4. Non-Functional Requirements

- **Performance:** Dashboard must render at 60fps during drone animation
- **Offline-First:** All critical state persists in IndexedDB; app works without internet
- **Accessibility:** All interactive elements have aria-labels and keyboard navigation
- **Security:** No real emergency service connections; PROTOTYPE/DEMO banners visible at all times
- **Responsive:** Desktop-first but fully functional on tablet/mobile

---

## 5. Out of Scope

- ❌ Physical hardware (ESP32, LoRa modules)
- ❌ Real 5G/satellite network integration
- ❌ Real emergency service APIs
- ❌ CRDT/Yjs integration (existing IndexedDB queue is sufficient)
- ❌ React Flow / XYFlow (custom SVG is faster)
- ❌ Meshtastic firmware (mention in pitch only)
- ❌ AI/ML-based damage assessment
- ❌ Payment processing for donations

# IDCS — System Architecture

## High-Level Architecture Diagram

```
╔══════════════════════════════════════════════════════════════════╗
║                    CLIENT (Browser)                              ║
║                                                                  ║
║  ┌─────────────────────────────────────────────────────────────┐ ║
║  │                   Next.js 16 App Router                     │ ║
║  │                                                             │ ║
║  │  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐ │ ║
║  │  │ /login   │  │ /          │  │ /command  │  │ /chat    │ │ ║
║  │  │ Role     │  │ Public Hub │  │ Command   │  │ Relief   │ │ ║
║  │  │ Select   │  │ + Globe    │  │ Center    │  │ Chat     │ │ ║
║  │  └──────────┘  └────────────┘  └──────────┘  └──────────┘ │ ║
║  │       │              │               │              │       │ ║
║  │       └──────────────┴───────────────┴──────────────┘       │ ║
║  │                          │                                   │ ║
║  │                          ▼                                   │ ║
║  │  ┌─────────────────────────────────────────────────────────┐ │ ║
║  │  │              Zustand Global Store                       │ │ ║
║  │  │                                                         │ │ ║
║  │  │  Core State        Network State      Priority Engine   │ │ ║
║  │  │  ─────────         ─────────────      ───────────────   │ │ ║
║  │  │  camps[]           networkMode        priorityMessages  │ │ ║
║  │  │  volunteers[]      networkNodes[]     scoreCalculation  │ │ ║
║  │  │  resources[]       dronePosition      bandwidthGate     │ │ ║
║  │  │  tasks[]           isDroneDeployed    messageQueue      │ │ ║
║  │  │  donations[]                                            │ │ ║
║  │  │  alerts[]                                               │ │ ║
║  │  └────────┬────────────────┬────────────────┬──────────────┘ │ ║
║  │           │                │                │                 │ ║
║  └───────────┼────────────────┼────────────────┼─────────────────┘ ║
║              │                │                │                   ║
║              ▼                ▼                ▼                   ║
║  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    ║
║  │  IndexedDB   │  │ localStorage │  │  BroadcastChannel    │    ║
║  │  ───────────  │  │ ────────────│  │  ─────────────────    │    ║
║  │  Chat msgs   │  │ User role   │  │  Tab-to-tab sync     │    ║
║  │  Offline     │  │ Theme       │  │  (fully offline)     │    ║
║  │  queue       │  │ Language    │  │                      │    ║
║  └──────────────┘  └──────────────┘  └──────────────────────┘    ║
╚═══════════════════════════╤══════════════════════════════════════╝
                            │
                ┌───────────┴───────────┐
                │     Network Layer     │
                │                       │
         ┌──────┴──────┐    ┌──────────┴──────────┐
         │  HTTP/SSR   │    │   WebSocket (Nostr)  │
         │  Next.js    │    │   Relay Connections   │
         │  Server     │    │   (Decentralized)     │
         │  Actions    │    │                       │
         └──────┬──────┘    └──────────┬───────────┘
                │                      │
                ▼                      ▼
         ┌─────────────┐    ┌──────────────────────┐
         │  MongoDB    │    │   Public Nostr Relays │
         │  Atlas      │    │   - relay.damus.io    │
         │  ─────────  │    │   - nos.lol           │
         │  Camps      │    │   - relay.nostr.band  │
         │  Donations  │    │                       │
         │  Reports    │    │   NIP-28 Channels     │
         └─────────────┘    └──────────────────────┘
```

---

## Offline-First Data Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   ONLINE MODE                            │
│                                                          │
│  User Action ──→ Zustand ──→ Server Action ──→ MongoDB  │
│                      │                                   │
│                      └──→ Nostr Publish ──→ Relays      │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   OFFLINE MODE                           │
│                                                          │
│  User Action ──→ Zustand (optimistic update)            │
│                      │                                   │
│                      ├──→ IndexedDB (persist locally)   │
│                      │                                   │
│                      ├──→ BroadcastChannel (other tabs) │
│                      │                                   │
│                      └──→ offlineSync queue (pending)   │
│                                                          │
│  ── When connectivity restored ──                       │
│                                                          │
│  offlineSync queue ──→ flush ──→ Server / Nostr         │
│  IndexedDB ──→ dedup ──→ merge with server state        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Network Simulation State Machine

```
                    ┌─────────────┐
                    │   NORMAL    │
                    │  All green  │
                    └──────┬──────┘
                           │
                    User clicks
                   "SIMULATE FAILURE"
                           │
                           ▼
                    ┌─────────────┐
                    │  SATELLITE  │
                    │  Links red  │
                    │  Msgs queue │
                    └──────┬──────┘
                           │
                    User clicks
                   "DEPLOY DRONE"
                           │
                           ▼
                    ┌─────────────┐
                    │   MESH      │
                    │ Yellow dash │
                    │ Drone moves │
                    └──────┬──────┘
                           │
                    Drone arrives
                    at gateway
                           │
                           ▼
                    ┌─────────────┐
                    │  DELIVERED  │
                    │ Msgs flush  │
                    │ Brief green │
                    └──────┬──────┘
                           │
                    User clicks
                   "RESTORE NETWORK"
                           │
                           ▼
                    ┌─────────────┐
                    │   NORMAL    │
                    │  All green  │
                    └─────────────┘
```

---

## Security Model

```
┌──────────────────────────────────────────────────────┐
│                 Security Layers                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. Role-Based Access                                │
│     ├── Public: View-only dashboards, report form    │
│     ├── Volunteer: Task management, mesh sync        │
│     └── Government: Full command center access       │
│                                                      │
│  2. Nostr Cryptographic Identity                     │
│     ├── Auto-generated secp256k1 keypair             │
│     ├── Stored in localStorage                       │
│     └── Messages signed with private key             │
│                                                      │
│  3. Prototype Safeguards                             │
│     ├── DEMO banner on every page                    │
│     ├── No real emergency service connections        │
│     └── All data is simulated/seeded                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

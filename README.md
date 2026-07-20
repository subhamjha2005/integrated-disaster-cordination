# 🚨 IDCS: Integrated Disaster Coordination System

[![Next.js](https://img.shields.io/badge/Built_with-Next.js_14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**IDCS** is an autonomous, offline-first disaster response platform designed to instantly restore critical communication when the grid goes down. By leveraging a targeted swarm of ESP32-equipped drones, IDCS physically bridges the gap between stranded first responders and Command HQ using a dynamic, physics-based mesh network.

---

## 🏗 System Architecture & Workflow

When terrestrial communication (cell towers, ISPs) fails, IDCS takes over.

```text
  [ DISASTER STRIKES ]
           |
           v
  +--------------------+
  | Terrestrial Comms  | ---( FAIL )---> ❌ Grid Down
  +--------------------+
           |
           v
  +--------------------+          [ IDCS PHYSICS ENGINE ]
  | Responder Offline  |  <--- Calculates exact physical distance
  |  (Web App Local)   |       Selects closest Emergency Hub
  +--------------------+       Determines minimum drones needed
           |
           v
  +====================+
  | DRONE SWARM LAUNCH |  🚁 🚁 🚁 
  +====================+
           |
   ( 50-70 km/h Flight Time Calculated & Animated )
           |
           v
  +--------------------+      🟢 Nodes arrive at waypoints
  | P2P MESH LOCKS     | <--- 🟢 1.5km Wi-Fi ranges overlap
  | (ESP32 Network)    |      🟢 Live connection established
  +--------------------+
           |
           v
  +--------------------+
  | LOCAL COMMS SLIDE  | ---> (UI box slides up in bottom right)
  | (App Online Mode)  |
  +--------------------+
           |
           +---> 📡 [ Wi-Fi VoIP Calling Mock ]
           |
           +---> 🔵 [ Bluetooth LE Sync Mock ]
           |
           +---> ⚡ [ Dynamic "Add Drones" Reinforcement ]
           |
           v
  +--------------------+
  | SYNC TO CLOUD HQ   | ---> IndexedDB offline queues flushed
  | (Dispatches Sent)  |      Priority alerts delivered to HQ
  +--------------------+
```

---

## ✨ Key Features

- **🚁 Physics-Based Swarm Routing:** The system doesn't just draw lines. It calculates real-world distance coordinates, drone battery capacity, and flight speeds (50-70 km/h) to deploy the exact number of drones needed to bridge a 1.5km Wi-Fi radius gap.
- **📶 Offline-First Architecture:** Built to operate flawlessly without the internet. First responders can log casualties, inventory, and emergency requests locally.
- **⚡ Auto-Sync Mesh Reconciliation:** The exact millisecond the drone mesh network locks in, all offline priority queues are flushed and synchronized to the cloud HQ database via the temporary Wi-Fi corridor.
- **💻 ESP32 Hardware Integration:** Fully built out UI mocking the capabilities of on-board ESP32 nodes, allowing for encrypted VoIP Wi-Fi calling and Bluetooth Low Energy (BLE) local device syncing.
- **🗺️ High-Performance Tactical Map:** Enterprise-grade mapping utilizing Leaflet, loaded with custom markers, real-time drone telemetry tracking, and dynamic visual mesh links.

---

## 🚀 Getting Started

To run the simulation and UI locally on your machine:

### 1. Clone the repository
```bash
git clone https://github.com/anuragkoirala51-crypto/idcs--integrated-disaster-cordination.git
cd idcs--integrated-disaster-cordination
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Server
```bash
npm run dev
```

### 4. Experience the Simulation
Open `http://localhost:3000` in your browser. Navigate to the Tactical Map and click **Deploy Drone Relay Mesh** to watch the autonomous swarm establish the network!

---

## 🛠 Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + UI micro-animations
- **Mapping:** React-Leaflet (OpenStreetMap)
- **State Management:** Zustand
- **Icons:** Lucide React

---
*Built for Hackathon 2026. Empowering First Responders. Saving Lives.*

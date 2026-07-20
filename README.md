<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/radio-tower.svg" alt="IDCS Logo" width="120" height="120" />
  
  # 🚨 IDCS: Integrated Disaster Coordination System
  
  **An autonomous, offline-first mesh network powered by ESP32 drones.**
  <br />
  <br />
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Next.js](https://img.shields.io/badge/Built_with-Next.js_14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

  *Built to restore communication when the grid goes down. Empowering first responders. Saving lives.*

</div>

---

## 📖 The Problem

During catastrophic disasters (earthquakes, floods, hurricanes), terrestrial communication networks (cell towers, ISPs) are the first to fail. First responders are left completely blind, relying on outdated radio systems and manual coordination. Information silos form, rescue operations slow down, and lives are lost simply due to a lack of communication.

## 🚀 The Solution

**IDCS** is an autonomous, offline-first disaster response platform designed to instantly restore critical communication. By leveraging a targeted swarm of ESP32-equipped drones, IDCS physically bridges the gap between stranded first responders and Command HQ using a dynamic, physics-based mesh network.

## 🏗 System Architecture & Workflow

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

| Feature | Description |
| :--- | :--- |
| **🚁 Physics-Based Swarm Routing** | Calculates real-world distance coordinates, drone battery capacity, and flight speeds (50-70 km/h) to deploy the exact number of drones needed to bridge a 1.5km Wi-Fi radius gap. |
| **📶 Offline-First Architecture** | Operates flawlessly without the internet using IndexedDB. First responders can log casualties, inventory, and emergency requests locally. |
| **⚡ Auto-Sync Mesh Reconciliation** | The exact millisecond the drone mesh network locks in, all offline priority queues are flushed and synchronized to the cloud HQ database via the temporary Wi-Fi corridor. |
| **💻 ESP32 Hardware Integration** | Built out UI mocking the capabilities of on-board ESP32 nodes, allowing for encrypted VoIP Wi-Fi calling and Bluetooth Low Energy (BLE) local device syncing. |
| **🗺️ High-Performance Tactical Map** | Enterprise-grade mapping utilizing Leaflet, loaded with custom markers, real-time drone telemetry tracking, and dynamic visual mesh links. |

---

## 🚀 Quickstart

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
Open `http://localhost:3000` in your browser. Navigate to the **Tactical Map** and click **Deploy Drone Relay Mesh** to watch the autonomous swarm establish the network!

---

## 🛠 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Mapping:** [React-Leaflet](https://react-leaflet.js.org/) (OpenStreetMap)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
<div align="center">
  <b>Built for Hackathon 2026. Empowering First Responders. Saving Lives.</b>
</div>

<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/radio-tower.svg" alt="IDCS Logo" width="120" height="120" />
  
  # 🚨 IDCS: Integrated Disaster Coordination System
  
  **An autonomous, offline-first tactical mesh network powered by ESP32 drone relays & airborne RF bridging.**
  <br />
  <br />
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Next.js](https://img.shields.io/badge/Built_with-Next.js_16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Turbopack](https://img.shields.io/badge/Bundler-Turbopack-blueviolet?style=flat-square)](https://turbo.build/pack)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

  *Built to restore communication when the grid goes down. Empowering first responders. Saving lives.*

</div>

---

## 📖 The Problem

During catastrophic disasters (earthquakes, floods, cyclones), commercial telecommunications (cellular base stations, fiber backhauls, ISPs) are the first to collapse. First responders and disaster management authorities are left completely blind:
- **Information Silos:** Police, Health, NDRF, and Local Administration cannot cross-coordinate without working cellular lines.
- **Bandwidth Starvation:** Low-bandwidth backup links become overwhelmed by non-critical traffic, choking emergency SOS signals.
- **Delayed Intervention:** Critical hours are lost waiting for physical telecom repair crews.

## 🚀 The Solution

**IDCS (Integrated Disaster Coordination System)** is a next-generation, offline-first disaster response and tactical communication platform. By combining **airborne drone relays (ESP32 / Sub-GHz RF nodes)**, **smart emergency message prioritization**, and **real-time GIS environmental telemetry**, IDCS creates a self-healing communication corridor bridging isolated field teams with Strategic Command HQ with **zero reliance on paid APIs or commercial internet**.

---

## 🏗 System Architecture & Workflow

```text
       [ CATASTROPHIC DISASTER STRIKES ]
                       |
                       v
         +---------------------------+
         | Commercial 4G/5G Backhaul | ----( COLLAPSE )----> ❌ Grid Down
         +---------------------------+
                       |
                       v
    +-------------------------------------+      [ IDCS SWARM PHYSICS ENGINE ]
    |  Isolated First Responders / Field  | <--- • Computes distance & radio vector
    |      (Offline Web App Local)        |      • Evaluates line-of-sight & battery
    +-------------------------------------+      • Deploys minimum drone relay units
                       |
                       v
          +=========================+
          | 🚁 AIRBORNE DRONE RELAY |
          +=========================+
                       |
     ( Autonomous 50-70 km/h Flight & RF Waypoint Lock )
                       |
                       v
    +-------------------------------------+
    |      TACTICAL P2P MESH LOCK         | <--- 🟢 Multi-Bearer Fallback (LoRa/COFDM/WiFi)
    |   (Sub-GHz 865MHz + Wi-Fi Corridor) |      🟢 15km line-of-sight emergency net
    +-------------------------------------+
                       |
       +---------------+---------------+
       |                               |
       v                               v
+-----------------------------+ +-----------------------------+
|   EMERGENCY PRIORITY ENGINE | | FULLSCREEN GIS COMMAND MAP  |
| • Urgency Scoring (0 - 10)  | | • Live River Discharge      |
| • Medical/SOS Priority Pass | | • Open-Meteo Rainfall Layer |
| • Non-vital traffic deferred| | • Tactical Hospital Routing |
+-----------------------------+ +-----------------------------+
                       |
                       v
       +-------------------------------+
       | MULTI-AGENCY SECURE DISPATCH  | ---> IndexedDB offline queues auto-flushed
       | (Police 100 / Health 102 /    |      Instant telemetry delivered to Command HQ
       |  Fire 101 / NDRF 108)         |
       +-------------------------------+
```

---

## ✨ Key Capabilities

| Feature | Description |
| :--- | :--- |
| **🛰️ Strategic Command Center (`/command`)** | Real-time command dashboard featuring infrastructure failure simulation, drone swarm launch triggers, live RF telemetry, and interactive message queue oversight. |
| **🧠 Smart Emergency Priority Engine** | Algorithmic packet-weight scoring based on urgency, sender agency, and GPS location. Critical SOS messages (e.g., ICU oxygen shortage: 9.8/10) bypass queue congestion immediately, while non-urgent inquiries are gracefully buffered. |
| **🗺️ Fullscreen Tactical GIS Map (`/map-fullscreen`)** | High-performance edge-to-edge mapping with Leaflet, animated radar scanlines, dynamic hotspot circles with interactive incident inspection popups, and live Open-Meteo precipitation overlays. |
| **📻 Multi-Bearer Fallback & Dispatch (`/chat`)** | Decentralized multi-channel communications supporting Police (`100`), Fire (`101`), Health (`102`), and NDRF (`108`) over simulated Sub-GHz LoRa RF, tactical Bluetooth LE, and ESP32 Wi-Fi mesh. |
| **🚁 Autonomous Swarm Flight Simulation** | Physics-based distance calculation, battery consumption modeling, and flight transit animations (50–70 km/h) to bridge physical communication gaps dynamically. |
| **💾 Resilient Offline-First Architecture** | Client-side persistence with IndexedDB and localStorage, protected by global canvas error guards and automatic route role-alignment (Government, Volunteer, Public). |
| **🌐 Zero Paid APIs** | Fully self-contained or grounded in open-access protocols (OpenStreetMap, Open-Meteo, Leaflet, Nostr protocols). |

---

## 🚀 Quickstart

### 1. Clone the Repository
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
> The application uses **Next.js Turbopack** and runs on port **`5000`**.

### 4. Experience the Platform
Open [http://localhost:5000](http://localhost:5000) in your browser:
- **Home (`/`)**: Interactive 3D disaster globe, situational overview, and quick dispatch.
- **Strategic Command (`/command`)**: Simulate network blackouts, deploy airborne drone relays, and test the emergency priority engine.
- **Fullscreen GIS Map (`/map-fullscreen`)**: Full tactical map with live river discharge, rainfall radar, and incident hotspots.
- **Multi-Agency Dispatch (`/chat`)**: Multi-bearer offline chat supporting agency dispatch codes (`100`, `101`, `102`, `108`).
- **Volunteer Portal (`/volunteers`)**: Field volunteer coordination and resource dispatch.
- **Government HQ (`/government`)**: Incident heatmaps and tactical resource allocation.

---

## 🛠 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Tactical Mapping:** [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/) (OpenStreetMap)
- **3D Visualization:** [React-Globe.gl](https://globe.gl/) & [Three.js](https://threejs.org/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) (with robust offline persistence)
- **Icons & Animations:** [Lucide React](https://lucide.dev/) & [Framer Motion](https://www.framer.com/motion/)
- **Data & Weather:** [Open-Meteo](https://open-meteo.com/) (Open, Free, No API Key Required)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
<div align="center">
  <b>Built for Hackathon 2026. Empowering First Responders. Saving Lives.</b>
</div>

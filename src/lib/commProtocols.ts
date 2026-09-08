// Comm Protocols Specification & Emergency Dispatch Codes System
// Provides complete operational guidelines, medium specs, and emergency agency dispatch codes.

import { CommMedium, AgencyRole } from './types';

export interface MediumSpec {
  id: CommMedium;
  name: string;
  badge: string;
  icon: string;
  color: string;
  bgGlow: string;
  frequency: string;
  physicalRange: string;
  typicalLatency: string;
  encryption: string;
  requirement: string;
  howToUse: {
    stepTitle: string;
    description: string;
  }[];
  howRecipientReceives: {
    receiverType: string;
    mechanism: string;
    coverageRadius: string;
  };
}

export const COMM_MEDIUMS: Record<CommMedium, MediumSpec> = {
  internet: {
    id: 'internet',
    name: 'Wide-Area Internet / Satellite Relay',
    badge: 'INTERNET',
    icon: 'Globe',
    color: '#38bdf8', // sky-400
    bgGlow: 'rgba(56, 189, 248, 0.2)',
    frequency: 'Cellular LTE / 5G / Starlink Ku-Band',
    physicalRange: 'Global / Wide Area (> 50 km)',
    typicalLatency: '80 ms - 250 ms',
    encryption: 'NIP-04 / secp256k1 Cryptographic Signatures',
    requirement: 'Active cellular tower, satellite transceiver, or fiber WAN.',
    howToUse: [
      {
        stepTitle: 'Cryptographic Signing',
        description: 'Your message is digitally signed with your private secp256k1 Nostr key directly in your browser.'
      },
      {
        stepTitle: 'Multi-Relay Broadcasting',
        description: 'Packet is dispatched simultaneously across high-availability Nostr WebSocket relays (wss://relay.damus.io, nos.lol).'
      },
      {
        stepTitle: 'Automated Failover Check',
        description: 'If uplink drops mid-transmit, the packet automatically falls back to local Wi-Fi or Bluetooth outbox queues.'
      }
    ],
    howRecipientReceives: {
      receiverType: 'Central Control Command & Remote Field Units',
      mechanism: 'Recipients listen on live WebSocket relay subscriptions. As soon as the event is published, their client validates your cryptographic signature and renders the message instantly on their console.',
      coverageRadius: 'Worldwide wherever internet/satellite link is active.'
    }
  },
  wifi: {
    id: 'wifi',
    name: 'Local Wi-Fi Mesh / LAN Broadcast',
    badge: 'WI-FI MESH',
    icon: 'Radio',
    color: '#34d399', // emerald-400
    bgGlow: 'rgba(52, 211, 153, 0.2)',
    frequency: '2.4 GHz (802.11b/g/n) / 5.8 GHz (802.11ac)',
    physicalRange: '150m - 400m Line-of-Sight (Extended by Drone Relay)',
    typicalLatency: '5 ms - 20 ms',
    encryption: 'WPA3 / Local Subnet BroadcastFrame TLS',
    requirement: 'Local portable Wi-Fi router, emergency field access point, or tethered drone AP without needing any ISP or internet connection.',
    howToUse: [
      {
        stepTitle: 'Local LAN Multicast',
        description: 'Sends message over browser BroadcastChannel API and local subnet UDP/WebSocket sockets across all devices connected to the emergency Wi-Fi hotspot.'
      },
      {
        stepTitle: 'Store-and-Forward Cache',
        description: 'The message is instantly stored into client-side IndexedDB outbox. When your node moves into range of another node or drone, the packet hops automatically.'
      },
      {
        stepTitle: 'Zero Internet Dependency',
        description: 'Functions 100% offline even if public telecom infrastructure, fiber lines, and mobile data are completely severed.'
      }
    ],
    howRecipientReceives: {
      receiverType: 'Nearby Camps, Mobile Clinics & Field Responders',
      mechanism: 'Any responder device connected to the emergency Wi-Fi hotspot receives the packet broadcast directly over the local network via instant browser event listeners without routing through any external cloud server.',
      coverageRadius: 'Within 200m of the Access Point or Drone Relay footprint.'
    }
  },
  bluetooth: {
    id: 'bluetooth',
    name: 'Bluetooth BLE P2P Proximity Mesh',
    badge: 'BLUETOOTH BLE',
    icon: 'Wifi',
    color: '#a78bfa', // violet-400
    bgGlow: 'rgba(167, 139, 250, 0.2)',
    frequency: '2.402 GHz - 2.480 GHz (ISM Band)',
    physicalRange: '15m - 30m Device-to-Device (Hops through human mesh)',
    typicalLatency: '150 ms - 600 ms (Multi-hop dependent)',
    encryption: 'BLE AES-128 CCM Hardware Encryption',
    requirement: 'Active Bluetooth hardware on smartphone, tablet, or laptop. No routers, towers, or cables needed.',
    howToUse: [
      {
        stepTitle: 'BLE Advertising & Discovery',
        description: 'Your device encodes the message into a compact BLE Advertisement Packet or GATT characteristic and broadcasts it over Bluetooth Low Energy.'
      },
      {
        stepTitle: 'Multi-Hop Gossip Mesh',
        description: 'Each nearby phone running the IDCS app receives the packet and silently re-broadcasts it to phones ahead of them, daisy-chaining across the disaster perimeter.'
      },
      {
        stepTitle: 'Survivability In Rubble',
        description: 'Ideal for collapsed buildings, basements, or flood zones where radio waves from towers cannot penetrate.'
      }
    ],
    howRecipientReceives: {
      receiverType: 'Ground Responders & Ad-Hoc Neighbors within Proximity',
      mechanism: 'The receiver’s Bluetooth radio scans for emergency UUID GATT services. When a packet is detected, it is extracted, verified for anti-tamper checksums, and displayed with a Bluetooth Proximity alert badge.',
      coverageRadius: '25 meters direct line-of-sight, expanding with each intermediary device.'
    }
  }
};

export interface EmergencyCode {
  code: string;
  agencyRole: AgencyRole;
  agencyName: string;
  channelId: string;
  title: string;
  icon: string;
  color: string;
  urgencyLevel: number;
  description: string;
  actionTaken: string;
}

export const EMERGENCY_CODES: Record<string, EmergencyCode> = {
  '100': {
    code: '100',
    agencyRole: 'Police',
    agencyName: 'Police Command & Rapid Action',
    channelId: 'agency-police',
    title: 'Police Station & Law Enforcement',
    icon: 'ShieldAlert',
    color: '#818cf8', // indigo-400
    urgencyLevel: 4,
    description: 'Civil protection, riot / looting deterrence, perimeter lockdown, evacuation traffic cordon.',
    actionTaken: 'Directly dispatches emergency alert to City Police HQ & field squads. Police patrol units are notified with GPS coordinates.'
  },
  '102': {
    code: '102',
    agencyRole: 'Health',
    agencyName: 'Nearest Hospital & Trauma Center',
    channelId: 'agency-health',
    title: 'Nearest Hospital / Medical Trauma',
    icon: 'HeartPulse',
    color: '#f43f5e', // rose-500
    urgencyLevel: 5,
    description: 'Life-threatening trauma, cardiac arrest, crush syndrome, ambulance evacuation, mass triage.',
    actionTaken: 'Triggers priority alarm at City Hospital ER terminal. Ambulances in field are routed with highest priority score (10/10).'
  },
  '101': {
    code: '101',
    agencyRole: 'NDRF',
    agencyName: 'Fire Brigade & Hazmat Squad',
    channelId: 'agency-fire',
    title: 'Fire Station & Hazmat Control',
    icon: 'Flame',
    color: '#f97316', // orange-500
    urgencyLevel: 4,
    description: 'Structural fires, chemical spills, gas pipeline leaks, confined space extraction.',
    actionTaken: 'Alerts nearest Fire Brigade station with vehicle dispatch ticket and structural hazard categorization.'
  },
  '108': {
    code: '108',
    agencyRole: 'NDRF',
    agencyName: 'NDRF Disaster & Flood Rescue',
    channelId: 'agency-ndrf',
    title: 'Disaster Search & Rescue (NDRF)',
    icon: 'Activity',
    color: '#fbbf24', // amber-400
    urgencyLevel: 5,
    description: 'Collapsed buildings, flood rescue boats, canine search teams, heavy equipment extraction.',
    actionTaken: 'Broadcasts priority distress beacon to National Disaster Response Force incident commander terminal.'
  },
  '104': {
    code: '104',
    agencyRole: 'Health',
    agencyName: 'Medical Supplies & Blood Bank',
    channelId: 'agency-health',
    title: 'Blood Bank & Medical Rations',
    icon: 'Heart',
    color: '#ec4899', // pink-500
    urgencyLevel: 4,
    description: 'Urgent demand for blood units (O-negative, platelets), oxygen cylinders, and sterile surgical kits.',
    actionTaken: 'Notifies Mobile Clinic & Regional Blood Repositories to mobilize cold-chain transport.'
  }
};

/**
 * Parses user message content to check if it starts with or contains an emergency dispatch code.
 */
export function parseEmergencyCode(text: string): {
  code: string | null;
  emergencyInfo: EmergencyCode | null;
  cleanContent: string;
} {
  const trimmed = text.trim();
  // Check for 3-digit code at beginning (e.g., "100 Looting at market" or "102 Patient unconscious")
  const match = trimmed.match(/^(\b100\b|\b101\b|\b102\b|\b104\b|\b108\b)[:\s-]*(.*)$/i);
  
  if (match) {
    const code = match[1];
    const cleanContent = match[2] || trimmed;
    const emergencyInfo = EMERGENCY_CODES[code] || null;
    return { code, emergencyInfo, cleanContent };
  }

  // Check if code is present as an isolated word anywhere
  for (const [codeKey, info] of Object.entries(EMERGENCY_CODES)) {
    const wordRegex = new RegExp(`\\b${codeKey}\\b`);
    if (wordRegex.test(trimmed)) {
      return { code: codeKey, emergencyInfo: info, cleanContent: trimmed };
    }
  }

  return { code: null, emergencyInfo: null, cleanContent: trimmed };
}

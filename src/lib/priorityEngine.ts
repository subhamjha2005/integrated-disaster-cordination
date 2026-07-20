import { PriorityMessage, ROLE_WEIGHTS, AgencyRole } from './types';

// Constants for tuning the scoring algorithm
const WEIGHT_URGENCY = 0.5;
const WEIGHT_ROLE = 0.3;
const WEIGHT_PROXIMITY = 0.2;

/**
 * Calculates a unified priority score (0-10) for any message in the system.
 * 
 * Formula:
 * (Urgency Level [1-5] * 2 * 0.5) + (Role Weight [1-10] * 0.3) + (Proximity Score [0-10] * 0.2)
 */
export function calculatePriorityScore(
  urgencyLevel: number,
  senderRole: AgencyRole,
  proximityScore: number = 0 // 0-10 scale, 10 being exactly at the disaster epicenter
): number {
  // Normalize urgency (1-5) to (2-10) scale
  const normalizedUrgency = Math.max(1, Math.min(5, urgencyLevel)) * 2;
  
  // Get role weight (default to Public weight if not found)
  const roleWeight = ROLE_WEIGHTS[senderRole] || ROLE_WEIGHTS['Public'];
  
  // Normalize proximity (0-10 scale)
  const normalizedProximity = Math.max(0, Math.min(10, proximityScore));

  const score = (normalizedUrgency * WEIGHT_URGENCY) + 
                (roleWeight * WEIGHT_ROLE) + 
                (normalizedProximity * WEIGHT_PROXIMITY);
                
  return parseFloat(score.toFixed(2));
}

/**
 * Processes a queue of messages, simulating bandwidth throttling in satellite mode.
 * High priority messages pass, low priority messages are delayed.
 */
export function processMessageQueue(
  messages: PriorityMessage[], 
  networkMode: 'normal' | 'satellite' | 'degraded',
  bandwidthThreshold: number = 6.0 // Minimum score to pass during satellite mode
): PriorityMessage[] {
  
  // If network is normal, everything goes through
  if (networkMode === 'normal') {
    return messages.map(msg => ({
      ...msg,
      status: msg.status === 'queued' || msg.status === 'delayed' ? 'delivered' : msg.status
    }));
  }

  // Sort by priority score descending
  const sortedMessages = [...messages].sort((a, b) => b.priorityScore - a.priorityScore);

  // Apply bandwidth throttling
  return sortedMessages.map(msg => {
    // If it's already delivered, leave it alone
    if (msg.status === 'delivered') return msg;

    if (networkMode === 'satellite') {
      if (msg.priorityScore >= bandwidthThreshold) {
        return { ...msg, status: 'delivered' };
      } else {
        return { ...msg, status: 'delayed' };
      }
    }
    
    // Default fallback
    return msg;
  });
}

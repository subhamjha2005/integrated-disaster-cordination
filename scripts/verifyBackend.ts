/**
 * verifyBackend.ts
 * Automated test suite to verify backend server actions, data fallbacks,
 * models, priority engine, and translations without launching any browser.
 */

import { fetchInitialState } from '../src/actions/fetchData';
import { submitIncidentReportAction } from '../src/actions/mutations';
import { EMERGENCY_HUBS } from '../src/lib/emergencyHubs';
import { calculatePriorityScore, processMessageQueue } from '../src/lib/priorityEngine';
import { getTranslation } from '../src/lib/translations';
import { fetchLocationNews } from '../src/lib/disasterApi';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
    passCount++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${testName}`);
    failCount++;
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('   IDCS BACKEND & SYSTEM VERIFICATION');
  console.log('========================================\n');

  // Test 1: Server Action fetchInitialState fallback resilience
  console.log('[1] Testing fetchInitialState Server Action...');
  try {
    const res = await fetchInitialState();
    assert(res.success === true, 'fetchInitialState returns success = true');
    assert(Array.isArray(res.data.camps), 'camps is an array');
    assert(res.data.camps.length >= 3, `camps array has entries (found ${res.data.camps.length})`);
    
    const camp1 = res.data.camps[0];
    assert(typeof camp1.id === 'string' && camp1.id.length > 0, 'camp has valid string id');
    assert(typeof camp1.name === 'string' && camp1.name.length > 0, 'camp has valid name');
    assert(typeof camp1.location?.lat === 'number' && typeof camp1.location?.lng === 'number', 'camp has valid coords');
    assert(typeof camp1.contactPhone === 'string' && camp1.contactPhone.length > 0, 'camp has contactPhone');
  } catch (err: any) {
    assert(false, `fetchInitialState threw error: ${err.message}`);
  }

  // Test 2: Server Action submitIncidentReportAction
  console.log('\n[2] Testing submitIncidentReportAction...');
  try {
    const testReport = {
      reporterName: 'Automated Test Runner',
      type: 'Infrastructure',
      description: 'Bridge structural test telemetry check',
      location: { lat: 26.12, lng: 91.75 },
      intensity: 0.5
    };
    const res = await submitIncidentReportAction(testReport);
    assert(res !== null && typeof res === 'object', 'submitIncidentReportAction returns response object');
    assert('success' in res, 'submitIncidentReportAction response contains success boolean');
  } catch (err: any) {
    assert(false, `submitIncidentReportAction threw error: ${err.message}`);
  }

  // Test 3: Emergency Hubs and Swarm Nodes
  console.log('\n[3] Testing Emergency Hubs & Drone Swarm Coordinates...');
  assert(Array.isArray(EMERGENCY_HUBS) && EMERGENCY_HUBS.length >= 6, `EMERGENCY_HUBS has ${EMERGENCY_HUBS.length} hubs`);
  
  const hq = EMERGENCY_HUBS.find(h => h.id === 'HQ');
  const campAlpha = EMERGENCY_HUBS.find(h => h.id === 'CAMP');
  assert(!!hq && hq.pos[0] > 0 && hq.pos[1] > 0, 'HQ Gateway has valid lat/lng coordinates');
  assert(!!campAlpha && campAlpha.pos[0] > 0 && campAlpha.pos[1] > 0, 'Relief Camp Alpha has valid lat/lng coordinates');

  // Test 4: Priority Engine & DTN Queue
  console.log('\n[4] Testing Priority Engine & Network Degraded Queue...');
  const highPriorityScore = calculatePriorityScore(5, 'Health', 9);
  const lowPriorityScore = calculatePriorityScore(1, 'Public', 2);
  assert(highPriorityScore > lowPriorityScore, `High priority score (${highPriorityScore}) > low (${lowPriorityScore})`);

  const mockMessages: any[] = [
    { id: '1', urgencyLevel: 5, senderRole: 'Health', priorityScore: highPriorityScore, status: 'queued', content: 'Urgent' },
    { id: '2', urgencyLevel: 1, senderRole: 'Public', priorityScore: lowPriorityScore, status: 'queued', content: 'Info' },
  ];
  const processedNormal = processMessageQueue(mockMessages, 'normal');
  assert(processedNormal.every(m => m.status === 'delivered'), 'Normal network delivers all queued packets');

  const processedDegraded = processMessageQueue(mockMessages, 'degraded');
  const highDelivered = processedDegraded.find(m => m.id === '1');
  const lowDelayed = processedDegraded.find(m => m.id === '2');
  assert(highDelivered?.status === 'delivered', 'Degraded network delivers high-priority packets (score >= 6.0)');
  assert(lowDelayed?.status === 'delayed', 'Degraded network delays low-priority packets (score < 6.0)');

  // Test 5: Translations System
  console.log('\n[5] Testing Translations System...');
  const eng = getTranslation('English', 'nav_hub');
  const hi = getTranslation('Hindi', 'nav_hub');
  const as = getTranslation('Assamese', 'nav_hub');
  assert(typeof eng === 'string' && eng.length > 0, `English translation for nav_hub: "${eng}"`);
  assert(typeof hi === 'string' && hi.length > 0, `Hindi translation for nav_hub: "${hi}"`);
  assert(typeof as === 'string' && as.length > 0, `Assamese translation for nav_hub: "${as}"`);

  // Test 6: GDELT 2.0 & UN GDACS Location News Engine
  console.log('\n[6] Testing GDELT 2.0 & UN GDACS Location News Engine...');
  try {
    const news = await fetchLocationNews('disaster', 26.1388, 91.6625);
    assert(Array.isArray(news), 'fetchLocationNews returns an array');
    assert(news.length > 0, `fetchLocationNews returned ${news.length} articles`);
    if (news.length > 0) {
      assert(typeof news[0].title === 'string' && news[0].title.length > 0, 'Article has valid headline title');
      assert(typeof news[0].url === 'string' && news[0].url.length > 0, 'Article has valid URL');
      assert(typeof news[0].source === 'string' && news[0].source.length > 0, 'Article has valid news source');
    }
  } catch (err: any) {
    assert(false, `fetchLocationNews threw error: ${err.message}`);
  }

  // Summary
  console.log('\n========================================');
  console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('========================================\n');

  process.exit(failCount > 0 ? 1 : 0);
}

runTests();

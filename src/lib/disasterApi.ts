export interface LiveDisasterEvent {
  id: string;
  title: string;
  description: string;
  category: 'Earthquake' | 'Flood' | 'Wildfire' | 'Cyclone' | 'Volcano' | 'General';
  lat: number;
  lng: number;
  magnitude?: number;
  timestamp: string;
  source: 'USGS' | 'NASA_EONET' | 'GDACS' | 'LOCAL';
}

export interface LiveTelemetryData {
  temperature: number;
  humidity: number;
  rain: number;
  pressure: number;
  windSpeed: number;
  timestamp: string;
  locationName: string;
}

// 1. Fetch USGS Live Earthquakes
export async function fetchUSGSEarthquakes(): Promise<LiveDisasterEvent[]> {
  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson', {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    if (!res.ok) throw new Error(`USGS HTTP error! status: ${res.status}`);
    const data = await res.json();

    return (data.features || []).map((feat: any) => ({
      id: `usgs-${feat.id}`,
      title: feat.properties.title || `M ${feat.properties.mag} Earthquake`,
      description: `Location: ${feat.properties.place || 'Unknown'} | Mag: ${feat.properties.mag} | Depth: ${feat.geometry.coordinates[2]}km`,
      category: 'Earthquake',
      lat: feat.geometry.coordinates[1],
      lng: feat.geometry.coordinates[0],
      magnitude: feat.properties.mag,
      timestamp: new Date(feat.properties.time).toISOString(),
      source: 'USGS' as const
    }));
  } catch (err) {
    console.error('USGS API Fetch Error:', err);
    return [];
  }
}

// 2. Fetch NASA EONET Active Natural Events
export async function fetchNASAEonetEvents(): Promise<LiveDisasterEvent[]> {
  try {
    const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?limit=50', {
      next: { revalidate: 600 } // Cache for 10 minutes
    });
    if (!res.ok) throw new Error(`NASA EONET HTTP error! status: ${res.status}`);
    const data = await res.json();

    const events: LiveDisasterEvent[] = [];

    (data.events || []).forEach((item: any) => {
      const geometry = item.geometry && item.geometry[0];
      if (!geometry || !geometry.coordinates) return;

      // Coordinates in GeoJSON: [lng, lat]
      const lng = geometry.coordinates[0];
      const lat = geometry.coordinates[1];
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      let category: LiveDisasterEvent['category'] = 'General';
      const catTitle = (item.categories && item.categories[0]?.title || '').toLowerCase();
      if (catTitle.includes('fire')) category = 'Wildfire';
      else if (catTitle.includes('storm') || catTitle.includes('cyclone')) category = 'Cyclone';
      else if (catTitle.includes('flood')) category = 'Flood';
      else if (catTitle.includes('volcano')) category = 'Volcano';

      events.push({
        id: `nasa-${item.id}`,
        title: item.title,
        description: `NASA EONET Category: ${item.categories?.[0]?.title || 'Natural Event'}`,
        category,
        lat,
        lng,
        timestamp: geometry.date || new Date().toISOString(),
        source: 'NASA_EONET'
      });
    });

    return events;
  } catch (err) {
    console.error('NASA EONET API Fetch Error:', err);
    return [];
  }
}

// 3. Fetch GDACS Global Alerts
export async function fetchGDACSEvents(): Promise<LiveDisasterEvent[]> {
  try {
    const res = await fetch('https://www.gdacs.org/dataserver/resources/gdacs.geojson', {
      next: { revalidate: 600 }
    });
    if (!res.ok) {
      // Quietly return empty array if feed is temporarily unavailable or 404
      return [];
    }
    const data = await res.json();

    return (data.features || []).map((feat: any) => ({
      id: `gdacs-${feat.properties?.eventid || Math.random()}`,
      title: `${feat.properties?.eventname || feat.properties?.eventtype || 'Disaster'} Alert`,
      description: `${feat.properties?.name || feat.properties?.htmldescription || 'GDACS Emergency Alert'}`,
      category: (feat.properties?.eventtype === 'EQ' ? 'Earthquake' : feat.properties?.eventtype === 'FL' ? 'Flood' : 'General') as any,
      lat: feat.geometry?.coordinates?.[1] || 0,
      lng: feat.geometry?.coordinates?.[0] || 0,
      timestamp: feat.properties?.fromdate || new Date().toISOString(),
      source: 'GDACS' as const
    })).filter((item: any) => item.lat !== 0 && item.lng !== 0);
  } catch {
    // Fail silently so USGS and NASA EONET continue unaffected
    return [];
  }
}

// Combine all Live APIs with Fallback Strategy
export async function fetchAllLiveDisasters(): Promise<LiveDisasterEvent[]> {
  const [usgs, nasa, gdacs] = await Promise.allSettled([
    fetchUSGSEarthquakes(),
    fetchNASAEonetEvents(),
    fetchGDACSEvents()
  ]);

  const results: LiveDisasterEvent[] = [];

  if (usgs.status === 'fulfilled') results.push(...usgs.value);
  if (nasa.status === 'fulfilled') results.push(...nasa.value);
  if (gdacs.status === 'fulfilled') results.push(...gdacs.value);

  return results;
}

// 4. Fetch Open-Meteo Live Telemetry
export async function fetchLiveTelemetry(lat: number = 26.1388, lng: number = 91.6625): Promise<LiveTelemetryData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,rain,surface_pressure,wind_speed_10m`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Open-Meteo HTTP error! status: ${res.status}`);
    const data = await res.json();

    const current = data.current;
    if (!current) return null;

    return {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      rain: current.rain,
      pressure: current.surface_pressure,
      windSpeed: current.wind_speed_10m,
      timestamp: current.time,
      locationName: `Lat ${lat.toFixed(2)}°, Lng ${lng.toFixed(2)}°`
    };
  } catch (err) {
    console.error('Open-Meteo Telemetry Fetch Error:', err);
    return null;
  }
}

// 5. Fetch Open-Meteo Live Flood / River Discharge API
export interface LiveFloodData {
  riverDischarge: number;
  unit: string;
}

export async function fetchOpenMeteoFlood(lat: number, lng: number): Promise<LiveFloodData | null> {
  try {
    const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lng}&daily=river_discharge`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Open-Meteo Flood HTTP error! status: ${res.status}`);
    const data = await res.json();

    const daily = data.daily;
    if (!daily || !daily.river_discharge || !daily.river_discharge.length) return null;

    return {
      riverDischarge: daily.river_discharge[0] || 0,
      unit: 'm³/s'
    };
  } catch (err) {
    console.error('Open-Meteo Flood API Error:', err);
    return null;
  }
}


// 6. Fetch Real Emergency Facilities (Hospitals, Shelters, Fire/Police Stations) via OpenStreetMap Overpass API
export interface EmergencyFacility {
  id: string;
  name: string;
  type: 'Hospital' | 'Shelter' | 'Fire Station' | 'Police' | 'Water Source';
  lat: number;
  lng: number;
  address?: string;
}

export async function fetchNearbyEmergencyFacilities(lat: number, lng: number, radiusKm: number = 15): Promise<EmergencyFacility[]> {
  try {
    const radiusMeters = radiusKm * 1000;
    const query = `
      [out:json][timeout:15];
      (
        node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
        node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
        node["amenity"="shelter"](around:${radiusMeters},${lat},${lng});
        node["amenity"="fire_station"](around:${radiusMeters},${lat},${lng});
        node["amenity"="police"](around:${radiusMeters},${lat},${lng});
      );
      out body 40;
    `;

    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`Overpass HTTP error ${res.status}`);
    const data = await res.json();

    return (data.elements || []).map((el: any) => {
      const tags = el.tags || {};
      let type: EmergencyFacility['type'] = 'Hospital';
      if (tags.amenity === 'shelter') type = 'Shelter';
      else if (tags.amenity === 'fire_station') type = 'Fire Station';
      else if (tags.amenity === 'police') type = 'Police';
      else if (tags.amenity === 'drinking_water') type = 'Water Source';

      return {
        id: `osm-${el.id}`,
        name: tags.name || tags['name:en'] || `${type} Facility`,
        type,
        lat: el.lat,
        lng: el.lon,
        address: tags['addr:street'] || tags['addr:suburb'] || tags['addr:city']
      };
    });
  } catch (err) {
    console.error('Overpass API Emergency Facilities Error:', err);
    return [];
  }
}



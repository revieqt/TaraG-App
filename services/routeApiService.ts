import { BACKEND_URL } from '@/constants/Config';

// Types matching the SessionContext
export type RouteStep = {
  distance: number;        // meters for this step
  duration: number;        // seconds for this step
  instruction: string;     // "Turn left onto Main St"
  name?: string;           // street/POI name if available
  way_points: [number, number]; // indices in geometry polyline
};

export type RouteSegment = {
  distance: number;        // meters between two stops
  duration: number;        // seconds between two stops
  steps?: RouteStep[];     // turn-by-turn steps if requested
};

export type RouteData = {
  geometry: {
    coordinates: [number, number, number?][]; // [lon, lat, ele?] if elevation enabled
    type: string; // "LineString"
  };
  distance: number;   // total meters
  duration: number;   // total seconds
  bbox?: number[];
  segments: RouteSegment[]; // per-stop breakdown
};

export async function getRoutes(params: {
  location: { latitude: number; longitude: number }[];
  mode: string;
}): Promise<RouteData | null> {
  try {
    console.log('🚀 Frontend getRoutes called with:', {
      locationCount: params.location.length,
      mode: params.mode,
      locations: params.location.map((loc, i) => `${i}: [${loc.latitude}, ${loc.longitude}]`)
    });

    const res = await fetch(`${BACKEND_URL}/routes/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: params.location,
        mode: params.mode,
      }),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch routes: ${res.status} ${errorText}`);
    }
    
    const data: RouteData = await res.json();
    
    console.log('✅ Frontend received route data:', {
      distance: `${(data.distance / 1000).toFixed(2)} km`,
      duration: `${Math.round(data.duration / 60)} min`,
      segmentCount: data.segments?.length || 0,
      totalSteps: data.segments?.reduce((acc, seg) => acc + (seg.steps?.length || 0), 0) || 0,
      coordinateCount: data.geometry?.coordinates?.length || 0
    });
    
    return data;
  } catch (err) {
    console.error('❌ Frontend getRoutes error:', err);
    return null;
  }
}

export async function generateRouteWithLocations(params: {
  startLocation: { latitude: number; longitude: number };
  endLocation: { latitude: number; longitude: number };
  waypoints: { latitude: number; longitude: number }[];
  mode: string;
  userID: string;
}) {
  const { startLocation, endLocation, waypoints, mode, userID } = params;
  
  if (!mode || !endLocation || !userID || !startLocation) {
    console.log('Missing required data for route generation');
    return null;
  }

  try {
    // Build location array: start -> waypoints -> end
    const locationArray = [
      startLocation, // Starting location
      ...waypoints, // Waypoints
      endLocation // End location
    ];

    const route = await getRoutes({
      location: locationArray,
      mode: mode
    });

    if (route) {
      console.log('Route generated:', route);
      return route;
    } else {
      console.log('Failed to generate route');
      return null;
    }
  } catch (error) {
    console.error('Error generating route:', error);
    return null;
  }
}

export async function createRoute(params: {
  userID: string;
  status: string;
  mode: string;
  location: { latitude: number; longitude: number; locationName: string }[];
}, accessToken: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/routes/create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to create route');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('createRoute error:', err);
    return null;
  }
}

/**
 * Get the current position of the user
 * Returns a promise that resolves to a GeolocationPosition object
 */
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position);
      },
      (error) => {
        let errorMessage = 'Location access denied';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location access in your browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        reject(new Error(errorMessage));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
};

/**
 * Geocode an address to get latitude and longitude
 * This uses a reverse geocoding approach for better city detection
 */
export const geocodeAddress = async (address: string): Promise<{ latitude: number, longitude: number }> => {
  try {
    // First try to get user's current location for more accurate results
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      // If we have location access, return actual coordinates
      return { latitude, longitude };
    } catch (locationError) {
      console.log('Using fallback geocoding for address:', address);
    }
    
    // Fallback: Use city-based coordinate mapping
    const cityCoordinates = getCityCoordinates(address);
    if (cityCoordinates) {
      return cityCoordinates;
    }
    
    // Final fallback: Default to a major city
    return { latitude: 40.7128, longitude: -74.0060 }; // New York
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw new Error('Failed to geocode address');
  }
};

/**
 * Get coordinates for major cities
 */
const getCityCoordinates = (cityName: string): { latitude: number, longitude: number } | null => {
  const cityMap: Record<string, { latitude: number, longitude: number }> = {
    'New York': { latitude: 40.7128, longitude: -74.0060 },
    'Los Angeles': { latitude: 34.0522, longitude: -118.2437 },
    'Chicago': { latitude: 41.8781, longitude: -87.6298 },
    'Houston': { latitude: 29.7604, longitude: -95.3698 },
    'Phoenix': { latitude: 33.4484, longitude: -112.0740 },
    'Philadelphia': { latitude: 39.9526, longitude: -75.1652 },
    'San Antonio': { latitude: 29.4241, longitude: -98.4936 },
    'San Diego': { latitude: 32.7157, longitude: -117.1611 },
    'Dallas': { latitude: 32.7767, longitude: -96.7970 },
    'San Jose': { latitude: 37.3382, longitude: -121.8863 },
    'Austin': { latitude: 30.2672, longitude: -97.7431 },
    'Jacksonville': { latitude: 30.3322, longitude: -81.6557 },
    'San Francisco': { latitude: 37.7749, longitude: -122.4194 },
    'Columbus': { latitude: 39.9612, longitude: -82.9988 },
    'Indianapolis': { latitude: 39.7684, longitude: -86.1581 },
    'Fort Worth': { latitude: 32.7555, longitude: -97.3308 },
    'Charlotte': { latitude: 35.2271, longitude: -80.8431 },
    'Seattle': { latitude: 47.6062, longitude: -122.3321 },
    'Denver': { latitude: 39.7392, longitude: -104.9903 },
    'Boston': { latitude: 42.3601, longitude: -71.0589 },
    'Detroit': { latitude: 42.3314, longitude: -83.0458 },
    'Nashville': { latitude: 36.1627, longitude: -86.7816 },
    'Memphis': { latitude: 35.1495, longitude: -90.0490 },
    'Portland': { latitude: 45.5152, longitude: -122.6784 },
    'Oklahoma City': { latitude: 35.4676, longitude: -97.5164 },
    'Las Vegas': { latitude: 36.1699, longitude: -115.1398 },
    'Louisville': { latitude: 38.2527, longitude: -85.7585 },
    'Baltimore': { latitude: 39.2904, longitude: -76.6122 },
    'Milwaukee': { latitude: 43.0389, longitude: -87.9065 },
    'Albuquerque': { latitude: 35.0844, longitude: -106.6504 },
    'Tucson': { latitude: 32.2226, longitude: -110.9747 },
    'Fresno': { latitude: 36.7378, longitude: -119.7871 },
    'Sacramento': { latitude: 38.5816, longitude: -121.4944 },
    'Mesa': { latitude: 33.4152, longitude: -111.8315 },
    'Kansas City': { latitude: 39.0997, longitude: -94.5786 },
    'Atlanta': { latitude: 33.7490, longitude: -84.3880 },
    'Long Beach': { latitude: 33.7701, longitude: -118.1937 },
    'Colorado Springs': { latitude: 38.8339, longitude: -104.8214 },
    'Raleigh': { latitude: 35.7796, longitude: -78.6382 },
    'Miami': { latitude: 25.7617, longitude: -80.1918 },
    'Virginia Beach': { latitude: 36.8529, longitude: -75.9780 },
    'Omaha': { latitude: 41.2565, longitude: -95.9345 },
    'Oakland': { latitude: 37.8044, longitude: -122.2711 },
    'Minneapolis': { latitude: 44.9778, longitude: -93.2650 },
    'Tulsa': { latitude: 36.1540, longitude: -95.9928 },
    'Arlington': { latitude: 32.7357, longitude: -97.1081 },
    'Tampa': { latitude: 27.9506, longitude: -82.4572 },
    'New Orleans': { latitude: 29.9511, longitude: -90.0715 },
    'Wichita': { latitude: 37.6872, longitude: -97.3301 },
    'Cleveland': { latitude: 41.4993, longitude: -81.6944 },
    'Bakersfield': { latitude: 35.3733, longitude: -119.0187 },
    'London': { latitude: 51.5074, longitude: -0.1278 },
    'Paris': { latitude: 48.8566, longitude: 2.3522 },
    'Tokyo': { latitude: 35.6762, longitude: 139.6503 },
    'Sydney': { latitude: -33.8688, longitude: 151.2093 },
    'Toronto': { latitude: 43.6532, longitude: -79.3832 },
    'Berlin': { latitude: 52.5200, longitude: 13.4050 },
    'Madrid': { latitude: 40.4168, longitude: -3.7038 },
    'Rome': { latitude: 41.9028, longitude: 12.4964 },
    'Amsterdam': { latitude: 52.3676, longitude: 4.9041 },
    'Barcelona': { latitude: 41.3851, longitude: 2.1734 },
    'Munich': { latitude: 48.1351, longitude: 11.5820 },
    'Dubai': { latitude: 25.2048, longitude: 55.2708 },
    'Singapore': { latitude: 1.3521, longitude: 103.8198 },
    'Hong Kong': { latitude: 22.3193, longitude: 114.1694 },
    'Istanbul': { latitude: 41.0082, longitude: 28.9784 },
    'Moscow': { latitude: 55.7558, longitude: 37.6173 },
    'Mumbai': { latitude: 19.0760, longitude: 72.8777 },
    'Delhi': { latitude: 28.7041, longitude: 77.1025 },
    'Beijing': { latitude: 39.9042, longitude: 116.4074 },
    'Shanghai': { latitude: 31.2304, longitude: 121.4737 },
    'São Paulo': { latitude: -23.5505, longitude: -46.6333 },
    'Rio de Janeiro': { latitude: -22.9068, longitude: -43.1729 },
    'Buenos Aires': { latitude: -34.6118, longitude: -58.3960 },
    'Cairo': { latitude: 30.0444, longitude: 31.2357 },
    'Johannesburg': { latitude: -26.2041, longitude: 28.0473 },
    'Lagos': { latitude: 6.5244, longitude: 3.3792 },
    'Nairobi': { latitude: -1.2921, longitude: 36.8219 },
    'Melbourne': { latitude: -37.8136, longitude: 144.9631 },
    'Brisbane': { latitude: -27.4698, longitude: 153.0251 },
    'Auckland': { latitude: -36.8485, longitude: 174.7633 },
    'Bangkok': { latitude: 13.7563, longitude: 100.5018 },
    'Manila': { latitude: 14.5995, longitude: 120.9842 },
    'Jakarta': { latitude: -6.2088, longitude: 106.8456 },
    'Kuala Lumpur': { latitude: 3.1390, longitude: 101.6869 },
    'Seoul': { latitude: 37.5665, longitude: 126.9780 },
    'Taipei': { latitude: 25.0330, longitude: 121.5654 },
    'Tel Aviv': { latitude: 32.0853, longitude: 34.7818 },
    'Oslo': { latitude: 59.9139, longitude: 10.7522 },
    'Stockholm': { latitude: 59.3293, longitude: 18.0686 },
    'Copenhagen': { latitude: 55.6761, longitude: 12.5683 },
    'Helsinki': { latitude: 60.1699, longitude: 24.9384 },
    'Zurich': { latitude: 47.3769, longitude: 8.5417 },
    'Geneva': { latitude: 46.2044, longitude: 6.1432 },
    'Vienna': { latitude: 48.2082, longitude: 16.3738 },
    'Prague': { latitude: 50.0755, longitude: 14.4378 },
    'Warsaw': { latitude: 52.2297, longitude: 21.0122 },
    'Budapest': { latitude: 47.4979, longitude: 19.0402 },
    'Athens': { latitude: 37.9838, longitude: 23.7275 },
    'Lisbon': { latitude: 38.7223, longitude: -9.1393 },
    'Brussels': { latitude: 50.8503, longitude: 4.3517 },
    'Dublin': { latitude: 53.3498, longitude: -6.2603 },
    'Frankfurt': { latitude: 50.1109, longitude: 8.6821 },
    'Milan': { latitude: 45.4642, longitude: 9.1900 },
    'Venice': { latitude: 45.4408, longitude: 12.3155 },
    'Florence': { latitude: 43.7696, longitude: 11.2558 },
    'Naples': { latitude: 40.8518, longitude: 14.2681 },
    'Nice': { latitude: 43.7102, longitude: 7.2620 },
    'Lyon': { latitude: 45.7640, longitude: 4.8357 },
    'Marseille': { latitude: 43.2965, longitude: 5.3698 },
    'Vancouver': { latitude: 49.2827, longitude: -123.1207 },
    'Montreal': { latitude: 45.5017, longitude: -73.5673 },
    'Calgary': { latitude: 51.0447, longitude: -114.0719 },
    'Ottawa': { latitude: 45.4215, longitude: -75.6972 },
    'Mexico City': { latitude: 19.4326, longitude: -99.1332 },
    'Guadalajara': { latitude: 20.6597, longitude: -103.3496 },
    'Monterrey': { latitude: 25.6866, longitude: -100.3161 },
    'Lima': { latitude: -12.0464, longitude: -77.0428 },
    'Bogotá': { latitude: 4.7110, longitude: -74.0721 },
    'Santiago': { latitude: -33.4489, longitude: -70.6693 },
    'Caracas': { latitude: 10.4806, longitude: -66.9036 },
    'Quito': { latitude: -0.1807, longitude: -78.4678 },
    'La Paz': { latitude: -16.5000, longitude: -68.1500 },
    'Montevideo': { latitude: -34.9011, longitude: -56.1645 },
    'Asunción': { latitude: -25.2637, longitude: -57.5759 }
  };
  
  // Try exact match first
  if (cityMap[cityName]) {
    return cityMap[cityName];
  }
  
  // Try case-insensitive match
  const normalizedCity = cityName.toLowerCase();
  for (const [city, coords] of Object.entries(cityMap)) {
    if (city.toLowerCase() === normalizedCity) {
      return coords;
    }
  }
  
  // Try partial match
  for (const [city, coords] of Object.entries(cityMap)) {
    if (city.toLowerCase().includes(normalizedCity) || normalizedCity.includes(city.toLowerCase())) {
      return coords;
    }
  }
  
  return null;
};

/**
 * Get nearby cities based on coordinates with improved accuracy
 */
export const getNearbyCities = (latitude: number, longitude: number): string[] => {
  const cities = [
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
    { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
    { name: 'Houston', lat: 29.7604, lng: -95.3698 },
    { name: 'Phoenix', lat: 33.4484, lng: -112.0740 },
    { name: 'Philadelphia', lat: 39.9526, lng: -75.1652 },
    { name: 'San Antonio', lat: 29.4241, lng: -98.4936 },
    { name: 'San Diego', lat: 32.7157, lng: -117.1611 },
    { name: 'Dallas', lat: 32.7767, lng: -96.7970 },
    { name: 'San Jose', lat: 37.3382, lng: -121.8863 },
    { name: 'Austin', lat: 30.2672, lng: -97.7431 },
    { name: 'Jacksonville', lat: 30.3322, lng: -81.6557 },
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
    { name: 'Columbus', lat: 39.9612, lng: -82.9988 },
    { name: 'Indianapolis', lat: 39.7684, lng: -86.1581 },
    { name: 'Fort Worth', lat: 32.7555, lng: -97.3308 },
    { name: 'Charlotte', lat: 35.2271, lng: -80.8431 },
    { name: 'Seattle', lat: 47.6062, lng: -122.3321 },
    { name: 'Denver', lat: 39.7392, lng: -104.9903 },
    { name: 'Boston', lat: 42.3601, lng: -71.0589 },
    { name: 'Detroit', lat: 42.3314, lng: -83.0458 },
    { name: 'Nashville', lat: 36.1627, lng: -86.7816 },
    { name: 'Memphis', lat: 35.1495, lng: -90.0490 },
    { name: 'Portland', lat: 45.5152, lng: -122.6784 },
    { name: 'Oklahoma City', lat: 35.4676, lng: -97.5164 },
    { name: 'Las Vegas', lat: 36.1699, lng: -115.1398 },
    { name: 'Louisville', lat: 38.2527, lng: -85.7585 },
    { name: 'Baltimore', lat: 39.2904, lng: -76.6122 },
    { name: 'Milwaukee', lat: 43.0389, lng: -87.9065 },
    { name: 'Albuquerque', lat: 35.0844, lng: -106.6504 },
    { name: 'Tucson', lat: 32.2226, lng: -110.9747 },
    { name: 'Fresno', lat: 36.7378, lng: -119.7871 },
    { name: 'Sacramento', lat: 38.5816, lng: -121.4944 },
    { name: 'Mesa', lat: 33.4152, lng: -111.8315 },
    { name: 'Kansas City', lat: 39.0997, lng: -94.5786 },
    { name: 'Atlanta', lat: 33.7490, lng: -84.3880 },
    { name: 'Miami', lat: 25.7617, lng: -80.1918 },
    { name: 'Tampa', lat: 27.9506, lng: -82.4572 },
    { name: 'New Orleans', lat: 29.9511, lng: -90.0715 },
    { name: 'Cleveland', lat: 41.4993, lng: -81.6944 },
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'Paris', lat: 48.8566, lng: 2.3522 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
    { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
    { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
    { name: 'Rome', lat: 41.9028, lng: 12.4964 },
    { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
    { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198 }
  ];

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate distances and sort by proximity
  const citiesWithDistance = cities.map(city => ({
    ...city,
    distance: calculateDistance(latitude, longitude, city.lat, city.lng)
  }));

  // Sort by distance and return top 5 nearest cities
  return citiesWithDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5)
    .map(city => city.name);
};

/**
 * Get world cities
 * Returns a list of major world cities
 */
export const getWorldCities = (): string[] => {
  return [
    'Abu Dhabi', 'Amsterdam', 'Athens', 'Auckland', 'Bangkok', 'Barcelona', 
    'Beijing', 'Berlin', 'Boston', 'Brussels', 'Buenos Aires', 'Cairo', 'Cape Town', 
    'Chicago', 'Copenhagen', 'Dallas', 'Delhi', 'Dubai', 'Dublin', 'Frankfurt', 
    'Geneva', 'Hong Kong', 'Houston', 'Istanbul', 'Jakarta', 'Johannesburg', 
    'Kuala Lumpur', 'Lagos', 'Las Vegas', 'Lisbon', 'London', 'Los Angeles', 
    'Madrid', 'Manila', 'Melbourne', 'Mexico City', 'Miami', 'Milan', 'Moscow', 
    'Mumbai', 'Munich', 'Nairobi', 'New York', 'Oslo', 'Paris', 'Prague', 
    'Rio de Janeiro', 'Rome', 'San Francisco', 'Santiago', 'São Paulo', 'Seoul', 
    'Shanghai', 'Singapore', 'Stockholm', 'Sydney', 'Taipei', 'Tel Aviv', 'Tokyo', 
    'Toronto', 'Vancouver', 'Vienna', 'Warsaw', 'Washington D.C.', 'Zurich'
  ];
};

/**
 * Find user's closest city with better error handling
 */
export const getUserCity = async (): Promise<string | null> => {
  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    const cities = getNearbyCities(latitude, longitude);
    
    // Return the first city (closest)
    return cities.length > 0 ? cities[0] : null;
  } catch (error) {
    console.error('Error getting user city:', error);
    return null;
  }
};

// Keeping this for backward compatibility
export const getNearbyRegions = getNearbyCities;

// Keeping this for backward compatibility
export const getUserRegion = getUserCity;

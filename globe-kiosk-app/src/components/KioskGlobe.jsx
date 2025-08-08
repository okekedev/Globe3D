// KioskGlobe.jsx - Your implementation with pin management system added
import React, { useRef, useState, useCallback, useEffect } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { createRoot } from 'react-dom/client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Demo pin data - 100+ pins around the globe with clustering
const generateDemoPins = () => {
  // City definitions with pin counts
  const cityDefinitions = [
    // Top cities (matching FormFlow metrics) - using proper country codes
    { name: "Dallas", country: "US", state: "TX", countryCode: "US", coords: [-96.7970, 32.7767], pinCount: 24 },
    { name: "Tokyo", country: "JP", state: "Tokyo", countryCode: "JP", coords: [139.6917, 35.6895], pinCount: 18 },
    { name: "London", country: "UK", state: "England", countryCode: "GB", coords: [-0.1276, 51.5074], pinCount: 16 },
    
    // Major cities with multiple pins
    { name: "New York", country: "US", state: "NY", countryCode: "US", coords: [-74.0060, 40.7128], pinCount: 12 },
    { name: "Los Angeles", country: "US", state: "CA", countryCode: "US", coords: [-118.2437, 34.0522], pinCount: 10 },
    { name: "Paris", country: "FR", state: "Île-de-France", countryCode: "FR", coords: [2.3522, 48.8566], pinCount: 9 },
    { name: "Berlin", country: "DE", state: "Berlin", countryCode: "DE", coords: [13.4050, 52.5200], pinCount: 8 },
    { name: "São Paulo", country: "BR", state: "São Paulo", countryCode: "BR", coords: [-46.6333, -23.5505], pinCount: 7 },
    { name: "Sydney", country: "AU", state: "NSW", countryCode: "AU", coords: [151.2093, -33.8688], pinCount: 6 },
    { name: "Dubai", country: "AE", state: "Dubai", countryCode: "AE", coords: [55.2708, 25.2048], pinCount: 5 },
    
    // Medium cities
    { name: "Chicago", country: "US", state: "IL", countryCode: "US", coords: [-87.6298, 41.8781], pinCount: 4 },
    { name: "Toronto", country: "CA", state: "ON", countryCode: "CA", coords: [-79.3832, 43.6532], pinCount: 4 },
    { name: "Mumbai", country: "IN", state: "Maharashtra", countryCode: "IN", coords: [72.8777, 19.0760], pinCount: 4 },
    { name: "Shanghai", country: "CN", state: "Shanghai", countryCode: "CN", coords: [121.4737, 31.2304], pinCount: 3 },
    { name: "Amsterdam", country: "NL", state: "North Holland", countryCode: "NL", coords: [4.9041, 52.3676], pinCount: 3 },
    { name: "Stockholm", country: "SE", state: "Stockholm", countryCode: "SE", coords: [18.0686, 59.3293], pinCount: 3 },
    { name: "Singapore", country: "SG", state: "Singapore", countryCode: "SG", coords: [103.8198, 1.3521], pinCount: 3 },
    { name: "Mexico City", country: "MX", state: "CDMX", countryCode: "MX", coords: [-99.1332, 19.4326], pinCount: 3 },
    
    // Cities with 2 pins
    { name: "Vancouver", country: "CA", state: "BC", countryCode: "CA", coords: [-123.1207, 49.2827], pinCount: 2 },
    { name: "Miami", country: "US", state: "FL", countryCode: "US", coords: [-80.1918, 25.7617], pinCount: 2 },
    { name: "Madrid", country: "ES", state: "Madrid", countryCode: "ES", coords: [-3.7038, 40.4168], pinCount: 2 },
    { name: "Rome", country: "IT", state: "Lazio", countryCode: "IT", coords: [12.4964, 41.9028], pinCount: 2 },
    { name: "Bangkok", country: "TH", state: "Bangkok", countryCode: "TH", coords: [100.5018, 13.7563], pinCount: 2 },
    { name: "Seoul", country: "KR", state: "Seoul", countryCode: "KR", coords: [126.9780, 37.5665], pinCount: 2 },
    { name: "Cairo", country: "EG", state: "Cairo", countryCode: "EG", coords: [31.2357, 30.0444], pinCount: 2 },
    { name: "Buenos Aires", country: "AR", state: "Buenos Aires", countryCode: "AR", coords: [-58.3816, -34.6037], pinCount: 2 },
    
    // Single pins scattered globally (30 more cities)
    { name: "Oslo", country: "NO", state: "Oslo", countryCode: "NO", coords: [10.7522, 59.9139], pinCount: 1 },
    { name: "Helsinki", country: "FI", state: "Uusimaa", countryCode: "FI", coords: [24.9384, 60.1699], pinCount: 1 },
    { name: "Copenhagen", country: "DK", state: "Capital", countryCode: "DK", coords: [12.5683, 55.6761], pinCount: 1 },
    { name: "Zurich", country: "CH", state: "Zurich", countryCode: "CH", coords: [8.5417, 47.3769], pinCount: 1 },
    { name: "Vienna", country: "AT", state: "Vienna", countryCode: "AT", coords: [16.3738, 48.2082], pinCount: 1 },
    { name: "Prague", country: "CZ", state: "Prague", countryCode: "CZ", coords: [14.4378, 50.0755], pinCount: 1 },
    { name: "Warsaw", country: "PL", state: "Mazovia", countryCode: "PL", coords: [21.0122, 52.2297], pinCount: 1 },
    { name: "Budapest", country: "HU", state: "Budapest", countryCode: "HU", coords: [19.0402, 47.4979], pinCount: 1 },
    { name: "Lisbon", country: "PT", state: "Lisbon", countryCode: "PT", coords: [-9.1393, 38.7223], pinCount: 1 },
    { name: "Athens", country: "GR", state: "Attica", countryCode: "GR", coords: [23.7275, 37.9838], pinCount: 1 },
    { name: "Istanbul", country: "TR", state: "Istanbul", countryCode: "TR", coords: [28.9784, 41.0082], pinCount: 1 },
    { name: "Tel Aviv", country: "IL", state: "Tel Aviv", countryCode: "IL", coords: [34.7818, 32.0853], pinCount: 1 },
    { name: "Cape Town", country: "ZA", state: "Western Cape", countryCode: "ZA", coords: [18.4241, -33.9249], pinCount: 1 },
    { name: "Lagos", country: "NG", state: "Lagos", countryCode: "NG", coords: [3.3792, 6.5244], pinCount: 1 },
    { name: "Hong Kong", country: "HK", state: "Hong Kong", countryCode: "HK", coords: [114.1694, 22.3193], pinCount: 1 },
    { name: "Manila", country: "PH", state: "Metro Manila", countryCode: "PH", coords: [120.9842, 14.5995], pinCount: 1 },
    { name: "Jakarta", country: "ID", state: "Jakarta", countryCode: "ID", coords: [106.8451, -6.2088], pinCount: 1 },
    { name: "Kuala Lumpur", country: "MY", state: "Kuala Lumpur", countryCode: "MY", coords: [101.6869, 3.1390], pinCount: 1 },
    { name: "Ho Chi Minh City", country: "VN", state: "Ho Chi Minh", countryCode: "VN", coords: [106.6297, 10.8231], pinCount: 1 },
    { name: "Bangalore", country: "IN", state: "Karnataka", countryCode: "IN", coords: [77.5946, 12.9716], pinCount: 1 },
    { name: "Delhi", country: "IN", state: "Delhi", countryCode: "IN", coords: [77.1025, 28.7041], pinCount: 1 },
    { name: "Karachi", country: "PK", state: "Sindh", countryCode: "PK", coords: [67.0011, 24.8607], pinCount: 1 },
    { name: "Riyadh", country: "SA", state: "Riyadh", countryCode: "SA", coords: [46.6753, 24.7136], pinCount: 1 },
    { name: "Kuwait City", country: "KW", state: "Kuwait", countryCode: "KW", coords: [47.9774, 29.3759], pinCount: 1 },
    { name: "Doha", country: "QA", state: "Doha", countryCode: "QA", coords: [51.5310, 25.2854], pinCount: 1 },
    { name: "Nairobi", country: "KE", state: "Nairobi", countryCode: "KE", coords: [36.8219, -1.2921], pinCount: 1 },
    { name: "Addis Ababa", country: "ET", state: "Addis Ababa", countryCode: "ET", coords: [38.7369, 9.1450], pinCount: 1 },
    { name: "Lima", country: "PE", state: "Lima", countryCode: "PE", coords: [-77.0428, -12.0464], pinCount: 1 },
    { name: "Bogotá", country: "CO", state: "Bogotá", countryCode: "CO", coords: [-74.0721, 4.7110], pinCount: 1 },
    { name: "Santiago", country: "CL", state: "Santiago", countryCode: "CL", coords: [-70.6693, -33.4489], pinCount: 1 },
    { name: "Montevideo", country: "UY", state: "Montevideo", countryCode: "UY", coords: [-56.1645, -34.9011], pinCount: 1 },
    { name: "Auckland", country: "NZ", state: "Auckland", countryCode: "NZ", coords: [174.7633, -36.8485], pinCount: 1 },
    { name: "Wellington", country: "NZ", state: "Wellington", countryCode: "NZ", coords: [174.7762, -41.2865], pinCount: 1 },
    { name: "Perth", country: "AU", state: "WA", countryCode: "AU", coords: [115.8605, -31.9505], pinCount: 1 },
    { name: "Brisbane", country: "AU", state: "QLD", countryCode: "AU", coords: [153.0251, -27.4698], pinCount: 1 },
    { name: "Melbourne", country: "AU", state: "VIC", countryCode: "AU", coords: [144.9631, -37.8136], pinCount: 1 },
  ];

  // Generate individual pin objects with names and timestamps
  const allPins = [];
  let pinId = 1;

  cityDefinitions.forEach(city => {
    for (let i = 0; i < city.pinCount; i++) {
      // Add slight coordinate variation for multiple pins in same city
      const coordVariation = city.pinCount > 1 ? (Math.random() - 0.5) * 0.02 : 0;
      
      // Create individual pin object
      const pin = {
        id: pinId++,
        cityName: city.name,
        country: city.country,
        state: city.state,
        countryCode: city.countryCode,
        coordinates: [
          city.coords[0] + coordVariation,
          city.coords[1] + coordVariation
        ],
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random within last week
        userName: generateRandomName(),
        totalCityPins: city.pinCount
      };
      
      allPins.push(pin);
    }
  });

  // Sort by newest first for recent visitors calculation
  return allPins.sort((a, b) => b.timestamp - a.timestamp);
};

// Generate random names for demo
const generateRandomName = () => {
  const firstNames = ['Sarah', 'Alex', 'Maria', 'John', 'Emma', 'David', 'Lisa', 'Mike', 'Anna', 'Chris', 'Sophie', 'Ryan', 'Elena', 'James', 'Nina', 'Tom', 'Julia', 'Sam', 'Zara', 'Ben'];
  const lastInitials = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastInitial = lastInitials[Math.floor(Math.random() * lastInitials.length)];
  
  return `${firstName} ${lastInitial}.`;
};

// Get top cities for metrics sync
const getTopCities = (pins) => {
  const cityStats = {};
  
  pins.forEach(pin => {
    const key = pin.cityName;
    if (!cityStats[key]) {
      cityStats[key] = {
        city: pin.cityName,
        country: pin.country,
        state: pin.state,
        countryCode: pin.countryCode,
        count: 0,
        latestPin: pin.timestamp
      };
    }
    cityStats[key].count++;
    if (pin.timestamp > cityStats[key].latestPin) {
      cityStats[key].latestPin = pin.timestamp;
    }
  });
  
  return Object.values(cityStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((city, index) => ({
      rank: index + 1,
      city: city.city,
      country: city.country,
      countryCode: city.countryCode, // Use proper country code for ReactCountryFlag
      visitors: `${(city.count * 100).toLocaleString()}`, // Multiply for demo metrics
      state: city.state,
      pinCount: city.count,
      latestTime: getTimeAgo(city.latestPin)
    }));
};

// Get recent visitor data
const getRecentVisitors = (pins) => {
  return pins
    .slice(0, 3) // Get 3 most recent
    .map(pin => ({
      name: pin.userName,
      city: pin.cityName,
      countryCode: pin.countryCode, // Use countryCode instead of flag
      time: getTimeAgo(pin.timestamp)
    }));
};

// Helper function to get time ago
const getTimeAgo = (timestamp) => {
  const now = new Date();
  const diffMs = now - new Date(timestamp);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
};

// MEMOIZED COMPONENT TO PREVENT UNNECESSARY RE-RENDERS - FIXED
const KioskGlobe = React.memo(({
  className = '',
  containerStyle = {},
  enableAutoRotation = true,
  selectedLocation = null,
  pins = [],
  children,
  onFormReset, // Callback to reset the form when timeout occurs
  onMetricsUpdate // NEW: Callback to update metrics in FormFlow
}) => {
  console.log('🌍 Kiosk Globe rendering');

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalPins, setGlobalPins] = useState([]); // NEW: Global pins state

  // Refs - USING REFS INSTEAD OF STATE TO AVOID RE-RENDERS
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const animationRef = useRef(null);
  const zoomTimeoutRef = useRef(null);
  const initialized = useRef(false);
  const isZoomedInRef = useRef(false); // CHANGED FROM STATE TO REF
  const markersRef = useRef(new Map()); // NEW: Track markers

  // Get token from environment
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  // Debug token info - ONLY LOG ONCE
  useEffect(() => {
    console.log('🔑 Kiosk Token info:', {
      exists: !!mapboxToken,
      length: mapboxToken?.length,
      valid: mapboxToken?.startsWith('pk.'),
      preview: mapboxToken?.substring(0, 20) + '...'
    });
  }, []); // Empty dependency array - only run once

  // Initialize demo pins on mount - ONLY ONCE
  useEffect(() => {
    if (globalPins.length > 0) return; // Don't regenerate if already has pins
    
    const demoPins = generateDemoPins();
    setGlobalPins(demoPins);
    
    // Update metrics in FormFlow if callback provided
    if (onMetricsUpdate) {
      const topCities = getTopCities(demoPins);
      const recentVisitors = getRecentVisitors(demoPins);
      onMetricsUpdate({ topCities, recentVisitors });
    }
  }, []); // EMPTY dependency array - only run on mount

  // Show visual notification when pin is added
  const showPinAddedNotification = useCallback((pin, isNewCity) => {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      animation: pinNotification 3s ease-out forwards;
      text-align: center;
      min-width: 250px;
    `;
    
    notification.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 8px;">📍</div>
      <div>${isNewCity ? 'New Location!' : 'Pin Added!'}</div>
      <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">
        ${pin.cityName} • ${pin.userName}
      </div>
      ${!isNewCity ? `<div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">Now ${pin.totalCityPins} pins in this city</div>` : ''}
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after animation
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }, []);

  // Helper function to animate marker position - NEW FUNCTION FOR SMOOTH TRANSITIONS
  const animateMarkerPosition = useCallback((marker, fromLngLat, toLngLat, duration = 800) => {
    const startTime = performance.now();
    const deltaLng = toLngLat[0] - fromLngLat.lng;
    const deltaLat = toLngLat[1] - fromLngLat.lat;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easeOutCubic for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentLng = fromLngLat.lng + (deltaLng * easeProgress);
      const currentLat = fromLngLat.lat + (deltaLat * easeProgress);
      
      marker.setLngLat([currentLng, currentLat]);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, []);

  // Helper function to update marker popup content - NEW FUNCTION
  const updateMarkerPopup = useCallback((marker, cityPins, mainPin, latestPin) => {
    // Remove existing popup
    if (marker.getPopup()) {
      marker.getPopup().remove();
    }
    
    // Create new popup content
    const popupContainer = document.createElement('div');
    const root = createRoot(popupContainer);
    
    if (cityPins.length === 1) {
      // Single pin popup
      const pin = cityPins[0];
      root.render(
        React.createElement('div', { style: { fontFamily: "'Inter', sans-serif", padding: '8px' } },
          React.createElement('h3', { 
            style: { margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' } 
          },
            React.createElement(ReactCountryFlag, {
              countryCode: pin.countryCode,
              svg: true,
              style: { width: '16px', height: '12px' }
            }),
            `${pin.cityName}, ${pin.state}`
          ),
          React.createElement('p', { style: { margin: '0', fontSize: '12px', color: '#666' } },
            `📍 ${pin.userName}`,
            React.createElement('br'),
            `🕐 ${getTimeAgo(pin.timestamp)}`
          )
        )
      );
    } else {
      // Multiple pins popup
      root.render(
        React.createElement('div', { style: { fontFamily: "'Inter', sans-serif", padding: '12px', minWidth: '200px' } },
          React.createElement('h3', { 
            style: { margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' } 
          },
            React.createElement(ReactCountryFlag, {
              countryCode: mainPin.countryCode,
              svg: true,
              style: { width: '18px', height: '14px' }
            }),
            `${mainPin.cityName}, ${mainPin.state}`
          ),
          React.createElement('div', { style: { margin: '8px 0', padding: '8px', background: '#f5f5f5', borderRadius: '6px' } },
            React.createElement('strong', { style: { color: '#dc2626', fontSize: '18px' } }, cityPins.length),
            React.createElement('span', { style: { fontSize: '12px', color: '#666', marginLeft: '4px' } }, 'pins')
          ),
          React.createElement('p', { style: { margin: '4px 0 0 0', fontSize: '12px', color: '#666' } },
            `🕐 Latest: ${latestPin.userName} (${getTimeAgo(latestPin.timestamp)})`
          )
        )
      );
    }

    const popup = new mapboxgl.Popup({ offset: 25 })
      .setDOMContent(popupContainer);

    marker.setPopup(popup);
  }, []);

  // Add/update pins on map - ENHANCED WITH SMOOTH TRANSITIONS
  const updatePinsOnMap = useCallback(() => {
    if (!mapInstance.current || globalPins.length === 0) return;

    console.log('📍 Updating pins on map with smooth transitions:', globalPins.length);

    // Group pins by city for clustering
    const cityGroups = {};
    globalPins.forEach(pin => {
      const key = `${pin.cityName}-${pin.country}`;
      if (!cityGroups[key]) {
        cityGroups[key] = [];
      }
      cityGroups[key].push(pin);
    });

    // Track which markers need to be created vs updated
    const newMarkersNeeded = new Set();
    const existingMarkers = new Map(markersRef.current);

    // First pass: identify what markers we need
    Object.values(cityGroups).forEach(cityPins => {
      const mainPin = cityPins[0];
      const markerId = `${mainPin.cityName}-${mainPin.country}`;
      newMarkersNeeded.add(markerId);
    });

    // Second pass: remove markers that are no longer needed
    existingMarkers.forEach((marker, markerId) => {
      if (!newMarkersNeeded.has(markerId)) {
        console.log('🗑️ Removing obsolete marker:', markerId);
        // Smooth fade out animation
        const markerElement = marker.getElement();
        if (markerElement) {
          markerElement.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
          markerElement.style.opacity = '0';
          markerElement.style.transform = 'scale(0.8)';
          
          setTimeout(() => {
            marker.remove();
            markersRef.current.delete(markerId);
          }, 300);
        } else {
          marker.remove();
          markersRef.current.delete(markerId);
        }
      }
    });

    // Third pass: create or update markers
    Object.values(cityGroups).forEach(cityPins => {
      const mainPin = cityPins[0];
      const markerId = `${mainPin.cityName}-${mainPin.country}`;
      const latestPin = cityPins.sort((a, b) => b.timestamp - a.timestamp)[0];
      
      let marker = markersRef.current.get(markerId);
      
      if (!marker) {
        // Create new marker with smooth entrance animation
        console.log('✨ Creating new marker with entrance animation:', markerId);
        
        marker = new mapboxgl.Marker({ 
          color: '#dc2626',
          scale: 0.8 // Start smaller for entrance animation
        })
          .setLngLat(mainPin.coordinates)
          .addTo(mapInstance.current);

        // Add entrance animation
        const markerElement = marker.getElement();
        if (markerElement) {
          markerElement.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease-out';
          markerElement.style.opacity = '0';
          markerElement.style.transform = 'scale(0.3)';
          markerElement.style.pointerEvents = 'none'; // Disable all clicks on pins
          
          // Trigger entrance animation
          setTimeout(() => {
            markerElement.style.opacity = '1';
            markerElement.style.transform = 'scale(1)';
          }, 50);
        }

        markersRef.current.set(markerId, marker);
        
      } else {
        // Update existing marker position with smooth transition
        console.log('📍 Updating existing marker position:', markerId);
        
        const currentLngLat = marker.getLngLat();
        const newLngLat = mainPin.coordinates;
        
        // Only animate if position actually changed
        if (Math.abs(currentLngLat.lng - newLngLat[0]) > 0.001 || 
            Math.abs(currentLngLat.lat - newLngLat[1]) > 0.001) {
          
          console.log('🎯 Animating marker position change');
          
          // Add CSS transition to marker element
          const markerElement = marker.getElement();
          if (markerElement) {
            markerElement.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            markerElement.style.pointerEvents = 'none'; // Disable all clicks on pins
          }
          
          // Animate the position change using custom animation
          animateMarkerPosition(marker, currentLngLat, newLngLat, 800); // 800ms duration
        } else {
          // Even if not animating, disable clicks
          const markerElement = marker.getElement();
          if (markerElement) {
            markerElement.style.pointerEvents = 'none'; // Disable all clicks on pins
          }
        }
      }

      // Update or create popup content (this doesn't need animation)
      // NOTE: Popups are disabled for kiosk mode - no interactions allowed
      // updateMarkerPopup(marker, cityPins, mainPin, latestPin);
    });

  }, [globalPins, animateMarkerPosition, updateMarkerPopup]);

  // Update pins when globalPins changes
  useEffect(() => {
    updatePinsOnMap();
  }, [updatePinsOnMap]);

  // Add a new pin (called from FormFlow) - ENHANCED WITH VISUAL FEEDBACK
  const addNewPin = useCallback((locationData, userData) => {
    console.log('🆕 Adding new pin for:', locationData, userData);
    
    // Check if this city already exists
    const existingCityPins = globalPins.filter(pin => 
      Math.abs(pin.coordinates[0] - locationData.lng) < 0.1 && 
      Math.abs(pin.coordinates[1] - locationData.lat) < 0.1
    );
    
    const isNewCity = existingCityPins.length === 0;
    
    const newPin = {
      id: Date.now(),
      cityName: locationData.shortName || locationData.name,
      country: 'US', // Default - could be enhanced with geocoding
      state: 'Unknown',
      countryCode: 'US', // Default country code
      coordinates: [locationData.lng, locationData.lat],
      timestamp: new Date(),
      userName: userData.name || 'Anonymous',
      totalCityPins: existingCityPins.length + 1,
      isNewPin: true // Mark as newly added for visual feedback
    };

    setGlobalPins(prev => {
      const updated = [newPin, ...prev];
      
      console.log(`📍 Pin added! ${isNewCity ? 'NEW CITY' : 'EXISTING CITY'} - Total pins in city: ${newPin.totalCityPins}`);
      
      // Update metrics - but prevent infinite loops
      setTimeout(() => {
        if (onMetricsUpdate) {
          const topCities = getTopCities(updated);
          const recentVisitors = getRecentVisitors(updated);
          onMetricsUpdate({ topCities, recentVisitors });
        }
      }, 0);
      
      return updated;
    });

    // Show visual notification for pin addition
    showPinAddedNotification(newPin, isNewCity);
  }, [globalPins, onMetricsUpdate, showPinAddedNotification]); // Removed handleResize dependency

  // Smooth rotation animation - PREVENT MULTIPLE STARTS
  const startAnimation = useCallback(() => {
    if (!mapInstance.current || isZoomedInRef.current || animationRef.current) {
      console.log('🚫 Animation already running or zoomed in, skipping start');
      return;
    }
    
    console.log('🌀 Starting kiosk rotation');

    const animate = () => {
      if (!mapInstance.current || isZoomedInRef.current) return;

      const center = mapInstance.current.getCenter();
      const currentZoom = mapInstance.current.getZoom();
      const newLng = center.lng + 2.0; // 3x faster rotation
      
      mapInstance.current.easeTo({
        center: [newLng, center.lat],
        zoom: currentZoom,
        duration: 100,
        easing: t => t
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, []); // REMOVED isZoomedIn DEPENDENCY

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      console.log('⏸️ Kiosk animation stopped');
    }
  }, []);

  // Zoom out animation back to default view - STABILIZED DEPENDENCIES
  const zoomOutToDefault = useCallback(() => {
    if (!mapInstance.current) return;
    
    console.log('🔄 Zooming out to default view');
    isZoomedInRef.current = true; // KEEP ZOOMED STATE TRUE DURING ZOOM-OUT
    
    // STOP ANY ROTATION THAT MIGHT BE RUNNING DURING ZOOM OUT
    stopAnimation();
    
    mapInstance.current.easeTo({
      center: [0, 0], // Return to center
      zoom: 1.8, // Default zoom level
      duration: 5000, // 5-second zoom out (CHANGED FROM 20000)
      easing: t => t
    });

    // Resume rotation ONLY after zoom out completes (UPDATED TIMING)
    setTimeout(() => {
      console.log('🔄 Zoom-out completed, now setting zoomed state to false');
      isZoomedInRef.current = false; // NOW SET TO FALSE AFTER ZOOM COMPLETES
      
      // Trigger resize to adjust zoom level for current container size
      setTimeout(() => {
        if (mapInstance.current && mapContainer.current) {
          console.log('🔄 Triggering resize after zoom-out to adjust zoom level');
          const container = mapContainer.current;
          const rightPanel = container.closest('.right-panel');
          
          const targetWidth = rightPanel ? rightPanel.clientWidth : container.clientWidth;
          const targetHeight = rightPanel ? rightPanel.clientHeight : container.clientHeight;
          
          const baseSize = 1280;
          const baseZoom = 2.9;
          const currentSize = Math.min(targetWidth, targetHeight);
          const pixelRatio = currentSize / baseSize;
          const rawZoom = baseZoom * pixelRatio;
          const newZoom = Math.round(rawZoom * 100) / 100;
          
          const currentZoom = mapInstance.current.getZoom();
          const zoomDifference = Math.abs(currentZoom - newZoom);
          
          if (zoomDifference > 0.05) {
            console.log('✅ Applying zoom adjustment after zoom-out:', { 
              from: currentZoom, 
              to: newZoom, 
              difference: zoomDifference 
            });
            
            mapInstance.current.resize();
            mapInstance.current.easeTo({
              zoom: newZoom,
              duration: 400
            });
            
            // Start rotation after zoom adjustment
            setTimeout(() => {
              if (enableAutoRotation) {
                console.log('🌀 Resuming rotation after zoom adjustment');
                startAnimation();
              }
            }, 500);
          } else {
            // No zoom adjustment needed, start rotation immediately
            if (enableAutoRotation) {
              console.log('🌀 Resuming rotation after 5-second zoom out completes');
              setTimeout(() => {
                startAnimation();
              }, 500); // Small additional buffer
            } else {
              console.log('🚫 Auto rotation disabled');
            }
          }
        }
      }, 100);
    }, 6000); // 6 seconds to ensure zoom completes + buffer (CHANGED FROM 21000)
  }, [enableAutoRotation, startAnimation, stopAnimation]); // REMOVED selectedLocation DEPENDENCY

  // Create map
  const createMap = useCallback(() => {
    if (initialized.current || !mapContainer.current) return;
    
    console.log('🗺️ Creating kiosk map instance');
    initialized.current = true;

    try {
      mapboxgl.accessToken = mapboxToken;

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/okekec21/cmd63rz9p00sd01qn2kcefwj0', // Your custom style
        center: [0, 0],
        zoom: 1.8,
        pitch: 0,
        bearing: 0,
        projection: 'globe',
        antialias: true,
        maxZoom: 8.5,
        minZoom: 0.1,
        maxPitch: 75,
        dragRotate: false,
        dragPan: false,
        scrollZoom: false,
        touchZoomRotate: false,
        doubleClickZoom: false,
        keyboard: false,
        attributionControl: false,
        renderWorldCopies: false,
        trackResize: true,
        preserveDrawingBuffer: true
      });

      mapInstance.current = map;
      console.log('🗺️ Kiosk map instance created');

      map.on('load', () => {
        console.log('🎯 Kiosk map loaded');
        
        setTimeout(() => {
          handleResize();
        }, 500);
        
        try {
          if (map.setConfigProperty && map.isStyleLoaded()) {
            map.setConfigProperty('basemap', 'showAtmosphere', true);
            map.setConfigProperty('basemap', 'atmosphereIntensity', 1.2);
            console.log('✅ Kiosk globe settings applied');
          }
        } catch (err) {
          console.warn('⚠️ Could not apply kiosk settings:', err.message);
        }

        setIsLoading(false);
        
        // Add pins to map after load
        updatePinsOnMap();
        
        console.log('🎯 Map loaded, not starting rotation yet');
      });

      map.on('error', (e) => {
        console.error('❌ Kiosk map error:', e);
        setError('Kiosk map failed to load: ' + (e.error?.message || 'Unknown error'));
        setIsLoading(false);
      });

    } catch (err) {
      console.error('❌ Kiosk map creation failed:', err);
      setError('Failed to create kiosk map: ' + err.message);
      setIsLoading(false);
      initialized.current = false;
    }
  }, [mapboxToken, updatePinsOnMap]);

  // Handle window resize to make globe responsive - STABILIZED DEPENDENCIES
  const handleResize = useCallback(() => {
    console.log('🔄 handleResize called');
    
    if (mapInstance.current && mapContainer.current) {
      const container = mapContainer.current;
      const rightPanel = container.closest('.right-panel');
      
      const targetWidth = rightPanel ? rightPanel.clientWidth : container.clientWidth;
      const targetHeight = rightPanel ? rightPanel.clientHeight : container.clientHeight;
      
      console.log('📐 Current dimensions:', { targetWidth, targetHeight });
      console.log('🎯 Current zoom BEFORE:', mapInstance.current.getZoom());
      
      const baseSize = 1280;
      const baseZoom = 2.9;
      const currentSize = Math.min(targetWidth, targetHeight);
      const pixelRatio = currentSize / baseSize;
      const rawZoom = baseZoom * pixelRatio;
      const newZoom = Math.round(rawZoom * 100) / 100;
      
      console.log('🔢 Direct ratio calculation:', {
        currentSize,
        pixelRatio,
        rawZoom,
        newZoom,
        formula: `${baseZoom} * (${currentSize} / ${baseSize}) = ${rawZoom} → ${newZoom}`
      });
      
      const currentZoom = mapInstance.current.getZoom();
      const zoomDifference = Math.abs(currentZoom - newZoom);
      
      if (zoomDifference > 0.05) {
        console.log('✅ Applying zoom change:', { 
          from: currentZoom, 
          to: newZoom, 
          difference: zoomDifference 
        });
        
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
          console.log('⏸️ Temporarily stopped rotation for zoom change');
        }
        
        mapInstance.current.resize();
        
        mapInstance.current.easeTo({
          zoom: newZoom,
          duration: 400
        });
        
        setTimeout(() => {
          if (mapInstance.current) {
            console.log('🎯 Zoom AFTER transition:', mapInstance.current.getZoom());
            
            // ONLY START ROTATION IF NOT ZOOMED IN AND NO CURRENT LOCATION
            if (enableAutoRotation && !animationRef.current && !isZoomedInRef.current) {
              // Check current selectedLocation at the time of execution
              console.log('🔄 Starting rotation after resize (no location restriction)');
              startAnimation();
            } else {
              console.log('🚫 Skipping rotation start - zoomed in or already animating');
            }
          }
        }, 500);
        
      } else {
        console.log('⚪ Zoom difference too small, skipping:', zoomDifference);
        mapInstance.current.resize();
      }
    }
  }, [enableAutoRotation, startAnimation]); // REMOVED selectedLocation DEPENDENCY

  // Initialize map - STABILIZED TO PREVENT RE-CREATION
  useEffect(() => {
    if (!mapboxToken) {
      setError('Missing Mapbox token');
      setIsLoading(false);
      return;
    }

    // PREVENT RE-CREATION: Only create if not already initialized
    if (initialized.current) {
      console.log('🚫 Map already initialized, skipping creation');
      return;
    }

    const timer = setTimeout(createMap, 100);

    let resizeTimeout;
    const throttledResize = () => {
      console.log('🪟 Window resize event detected');
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        console.log('🕐 Throttled resize executing');
        handleResize();
      }, 100);
    };

    window.addEventListener('resize', throttledResize);
    window.addEventListener('orientationchange', () => {
      console.log('📱 Orientation change detected');
      handleResize();
    });

    console.log('🎧 Window resize listeners attached');

    return () => {
      clearTimeout(timer);
      clearTimeout(resizeTimeout);
      stopAnimation();
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
      window.removeEventListener('resize', throttledResize);
      window.removeEventListener('orientationchange', handleResize);
      console.log('🧹 Window resize listeners removed');
      if (mapInstance.current) {
        console.log('🧹 Cleaning up kiosk map');
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      // Clear all markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
      initialized.current = false;
    };
  }, [mapboxToken, createMap, stopAnimation, handleResize]); // REMOVED CHANGING DEPENDENCIES

  // UPDATED: Handle location changes with 20-second zoom animation
  useEffect(() => {
    if (selectedLocation && mapInstance.current) {
      console.log('🎯 Kiosk syncing to location:', selectedLocation);
      
      // Stop rotation immediately
      stopAnimation();
      isZoomedInRef.current = true; // USING REF INSTEAD OF setState
      
      // Clear any existing zoom timeout
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
      
      // Start 20-second slow zoom animation (CHANGED FROM 30 TO 20 SECONDS)
      mapInstance.current.easeTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: 6, // Higher zoom for closer view
        duration: 20000, // 20 seconds (CHANGED FROM 30000)
        easing: t => t // Linear easing for smooth zoom
      });

      console.log('🔍 Starting 20-second zoom animation'); // UPDATED LOG
      
      // Set timeout to zoom out after 2 minutes (CHANGED FROM 20 SECONDS TO 2 MINUTES)
      zoomTimeoutRef.current = setTimeout(() => {
        console.log('⏰ 2-minute timeout reached, resetting form and zooming out');
        // Reset the form first
        if (onFormReset) {
          onFormReset();
        }
        // Then zoom out
        zoomOutToDefault();
      }, 120000); // 2 minutes (CHANGED FROM 20000)
      
    } else if (selectedLocation === null && isZoomedInRef.current) {
      // User finished form or reset - zoom out immediately
      console.log('👤 User finished or reset, zooming out now');
      
      // Clear the timeout since user finished early
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
        zoomTimeoutRef.current = null;
      }
      
      zoomOutToDefault();
    }
  }, [selectedLocation, stopAnimation, zoomOutToDefault, onFormReset]); // REMOVED isZoomedIn DEPENDENCY

  // NEW: Start initial rotation when map is ready and no location selected - PREVENT DURING ZOOM
  useEffect(() => {
    // More strict conditions to prevent rotation during zoom-out
    if (!isLoading && 
        mapInstance.current && 
        enableAutoRotation && 
        !selectedLocation && 
        !isZoomedInRef.current && 
        !animationRef.current) {
      
      console.log('🎬 Checking if ready for initial rotation...');
      
      setTimeout(() => {
        // Triple-check all conditions before starting rotation
        if (!isZoomedInRef.current && !selectedLocation && !animationRef.current) {
          console.log('✅ All conditions met - starting initial rotation');
          startAnimation();
        } else {
          console.log('🚫 Conditions not met for initial rotation:', {
            isZoomedIn: isZoomedInRef.current,
            hasLocation: !!selectedLocation,
            animationRunning: !!animationRef.current
          });
        }
      }, 1000);
    } else {
      console.log('🚫 Not ready for initial rotation:', {
        loading: isLoading,
        hasMap: !!mapInstance.current,
        autoRotation: enableAutoRotation,
        hasLocation: !!selectedLocation,
        isZoomedIn: isZoomedInRef.current,
        animationRunning: !!animationRef.current
      });
    }
  }, [isLoading, enableAutoRotation, selectedLocation, startAnimation]);

  // Use ResizeObserver for container size detection - STABILIZED
  useEffect(() => {
    if (!mapContainer.current) return;
    console.log('🔍 Setting up ResizeObserver');
    
    const resizeObserver = new ResizeObserver((entries) => {
      console.log('📏 ResizeObserver triggered with', entries.length, 'entries');
      for (let entry of entries) {
        console.log('📦 Container resized to:', {
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
      handleResize();
    });

    resizeObserver.observe(mapContainer.current);
    console.log('👁️ ResizeObserver now watching container');

    return () => {
      console.log('🧹 Cleaning up ResizeObserver');
      resizeObserver.disconnect();
    };
  }, [handleResize]); // ONLY handleResize DEPENDENCY

  // Handle retry
  const handleRetry = useCallback(() => {
    console.log('🔄 Retrying kiosk map creation');
    setError(null);
    setIsLoading(true);
    isZoomedInRef.current = false; // USING REF INSTEAD OF setState
    initialized.current = false;
    stopAnimation();
    
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
      zoomTimeoutRef.current = null;
    }
    
    setTimeout(createMap, 100);
  }, [createMap, stopAnimation]);

  // Expose addNewPin method to parent
  useEffect(() => {
    if (mapInstance.current && addNewPin) {
      mapInstance.current.addNewPin = addNewPin;
    }
  }, [addNewPin]);

  return (
    <div 
      className={`kiosk-globe-container ${className}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#000',
        overflow: 'hidden',
        ...containerStyle
      }}
    >
      {/* Map container */}
      <div
        ref={mapContainer}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          zIndex: 1000
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '15px'
          }}></div>
          <h4 style={{ margin: '0 0 5px 0' }}>Loading Kiosk Globe...</h4>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '14px' }}>Preparing display</p>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '15px' }}>❌</div>
          <h4 style={{ margin: '0 0 10px 0' }}>Kiosk Globe Error</h4>
          <p style={{ 
            margin: '0 0 20px 0', 
            textAlign: 'center', 
            maxWidth: '400px',
            fontSize: '14px'
          }}>
            {error}
          </p>
          <button 
            onClick={handleRetry}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            🔄 Retry
          </button>
        </div>
      )}

      {children}

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .mapboxgl-marker {
          transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
          pointer-events: none !important; /* Disable all clicks on pins */
          cursor: default !important;
        }
        
        .mapboxgl-marker.entering {
          animation: pinEntrance 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .mapboxgl-marker.updating {
          animation: pinUpdate 0.4s ease-out;
        }
        
        @keyframes pinEntrance {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(-20px);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes pinUpdate {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes pinNotification {
          0% { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(0.8); 
          }
          10% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1.05); 
          }
          20% { 
            transform: translate(-50%, -50%) scale(1); 
          }
          80% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1); 
          }
          100% { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(0.9); 
          }
        }
      `}</style>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.className === nextProps.className &&
    prevProps.enableAutoRotation === nextProps.enableAutoRotation &&
    prevProps.selectedLocation?.lng === nextProps.selectedLocation?.lng &&
    prevProps.selectedLocation?.lat === nextProps.selectedLocation?.lat &&
    prevProps.pins?.length === nextProps.pins?.length
  );
});

// Add display name for debugging
KioskGlobe.displayName = 'KioskGlobe';

export default KioskGlobe;
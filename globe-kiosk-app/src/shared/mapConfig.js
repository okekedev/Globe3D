// shared/mapConfig.js - Kiosk Globe Configuration

// ========================================
// KIOSK GLOBE CONFIGURATION - Complete Settings
// ========================================
export const GLOBE_CONFIGURATION = {
  // Map Instance Properties
  mapProperties: {
    // Map projection type
    projection: "globe", // Globe projection for interactive kiosk experience
    
    // Mapbox access token (required)
    mapboxAccessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
    
    // Map style URL - using satellite streets style for reliable globe display
    mapStyle: "mapbox://styles/mapbox/satellite-streets-v12", // Best style for globe with all visual features
    
    // View Limits - Optimized for kiosk interaction
    maxZoom: 10, // Range: 0-24 - Prevent users from zooming too close
    minZoom: 1,  // Range: 0-24 - Allow full globe view
    maxPitch: 60, // Range: 0-85 degrees - Moderate tilt for visual appeal
    
    // Interaction Controls - Kiosk optimized
    dragRotate: true, // true/false - Allow users to rotate globe
    touchZoomRotate: true, // true/false - Essential for touch kiosks
    pitchWithRotate: false, // true/false - Prevent accidental complex gestures
    cooperativeGestures: false, // true/false - Disabled for easier kiosk use
    doubleClickZoom: true, // true/false - Quick zoom for kiosk users
    scrollZoom: true, // true/false - Enable mouse wheel zoom
    
    // Performance Settings - Optimized for kiosk reliability
    antialias: true, // true/false - Smooth edges for better visual quality
    preserveDrawingBuffer: false, // true/false - Better performance
    failIfMajorPerformanceCaveat: false, // true/false - Allow on various hardware
    renderWorldCopies: false, // true/false - Not needed for globe
    trackResize: true, // true/false - Handle screen resolution changes
    
    // UI Elements - Clean kiosk interface
    attributionControl: false, // true/false - Hidden for clean kiosk look
    logoPosition: "bottom-right" // Options: "top-left", "top-right", "bottom-left", "bottom-right"
  },
  
  // Visual Appearance - Only properties that work with globe projection
  visualSettings: {
    // Atmosphere - Works with globe and looks great
    showAtmosphere: true, // true/false - Beautiful glow effect around globe
    atmosphereIntensity: 1.2, // Range: 0.0-2.0 - Enhanced glow for visual appeal
    
    // Basic terrain features - Essential for globe
    showWater: true, // true/false - Ocean rendering
    showLandcover: true, // true/false - Land colors
    
    // Labels - Keep minimal for clean globe
    showPlaceLabels: true, // true/false - Show major cities/countries only
    labelSize: 1.1 // Range: 0.5-2.0 - Slightly larger for visibility
  },
  
  // Default Camera Position - Welcoming view
  defaultView: {
    center: [0, 20], // [longitude, latitude] - Slightly north for better land visibility
    zoom: 2, // Range: 0-24 - Good overview for kiosk
    pitch: 15, // Range: 0-85 degrees - Slight tilt for visual interest
    bearing: 0 // Range: 0-360 degrees - North up
  }
};
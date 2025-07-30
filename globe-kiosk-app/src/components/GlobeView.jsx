import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css'; // Import required CSS
import { WORLD_PINS } from './worldPins.jsx';
import AddPinOverlay from './AddPinOverlay.jsx';
import Top5Overlay from './Top5Overlay.jsx';

// Consolidated Globe Configuration
const GLOBE_CONFIG = {
  // Map Instance Properties
  mapProperties: {
    projection: "globe",
    mapboxAccessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
    mapStyle: "mapbox://styles/mapbox/satellite-streets-v12",
    maxZoom: 10,
    minZoom: 1,
    maxPitch: 60,
    dragRotate: true,
    touchZoomRotate: true,
    pitchWithRotate: false,
    cooperativeGestures: false,
    doubleClickZoom: true,
    scrollZoom: true,
    antialias: true,
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: false,
    renderWorldCopies: false,
    trackResize: true,
    attributionControl: false,
    logoPosition: "bottom-right"
  },
  
  // Visual Settings
  visualSettings: {
    showAtmosphere: true,
    atmosphereIntensity: 1.5,
    showWater: true,
    showLandcover: true,
    showPlaceLabels: true,
    labelSize: 1.2
  },
  
  // Default Camera Position
  defaultView: {
    center: [0, 0],
    zoom: 1.5,
    pitch: 0,
    bearing: 0
  }
};

// Styles
const containerStyle = {
  position: 'relative',
  width: '100%',
  height: '100%',
  background: '#1a1a2e',
  overflow: 'hidden',
  padding: 0,
  margin: 0
};

const overlayStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  textAlign: 'center',
  color: '#fff',
  zIndex: 1000,
  padding: '20px'
};

const spinnerStyle = {
  width: '40px',
  height: '40px',
  border: '3px solid rgba(255, 255, 255, 0.3)',
  borderTop: '3px solid #fff',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  margin: '0 auto 16px'
};

const buttonStyle = {
  background: '#007bff',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '16px',
  marginTop: '16px'
};

const mapContainerStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  margin: 0,
  padding: 0,
  marginBottom: '80px' // Add bottom margin to push globe up
};

// Add CSS animation
if (!document.querySelector('style[data-globe-animation]')) {
  const style = document.createElement('style');
  style.setAttribute('data-globe-animation', 'true');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

const GlobeView = ({ 
  onMapLoad, 
  onMapMove, 
  onMapClick,
  onLocationSelect,
  onPinClick,
  initialCenter = [0, 0],
  initialZoom = 2,
  initialPitch = 0,
  initialBearing = 0,
  className = '',
  children,
  isActive = true,
  enableAutoRotation = true,
  rotationSpeed = 0.08, // Increased rotation speed
  stopRotationZoom = 3,
  showPins = true,
  pinsToShow = WORLD_PINS,
  showAddPinButton = true,
  showBackButton = false,
  onBackToGlobe
}) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const initialized = useRef(false);
  const rotationRef = useRef(null);
  const userInteracting = useRef(false);
  const rotationPaused = useRef(false); // Use ref instead of state
  const allPinsRef = useRef(pinsToShow); // Use ref for pins to prevent re-renders
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPins, setUserPins] = useState([]);
  const [isAddPinOpen, setIsAddPinOpen] = useState(false);
  const [allPins, setAllPins] = useState(pinsToShow);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [showTop5, setShowTop5] = useState(false);
  const [top5Data, setTop5Data] = useState([]);

  // Handle opening add pin overlay
  const handleOpenAddPin = useCallback(() => {
    setIsAddPinOpen(true);
  }, []);

  // Update pins when userPins change - but avoid re-renders
  useEffect(() => {
    const newAllPins = [...pinsToShow, ...userPins];
    allPinsRef.current = newAllPins;
    setAllPins(newAllPins);
  }, [pinsToShow, userPins]);

  // Handle adding a new user pin - replace existing pin at same location
  const handleAddPin = useCallback((pinData) => {
    console.log('🔥 Adding new user pin:', pinData);
    
    // Find if there's already a pin at this location (within reasonable distance)
    const existingPinIndex = allPins.findIndex(pin => {
      const distance = Math.sqrt(
        Math.pow(pin.coordinates[0] - pinData.coordinates[0], 2) + 
        Math.pow(pin.coordinates[1] - pinData.coordinates[1], 2)
      );
      return distance < 0.1; // ~11km radius
    });

    let updatedPins;
    if (existingPinIndex !== -1) {
      // Replace existing pin with new user data
      updatedPins = [...allPins];
      updatedPins[existingPinIndex] = {
        ...pinData,
        id: allPins[existingPinIndex].id, // Keep original ID
        name: pinData.name,
        lastUser: {
          name: pinData.name,
          age: pinData.age,
          gender: pinData.gender,
          timestamp: pinData.timestamp
        },
        type: 'location_pin' // Changed from user_pin
      };
    } else {
      // Add new pin
      updatedPins = [...allPins, {
        ...pinData,
        lastUser: {
          name: pinData.name,
          age: pinData.age,
          gender: pinData.gender,
          timestamp: pinData.timestamp
        },
        type: 'location_pin'
      }];
    }

    setAllPins(updatedPins);
    
    // Update the map source with new pins
    if (mapInstance.current && mapInstance.current.getSource('world-pins')) {
      const geojsonData = {
        type: 'FeatureCollection',
        features: updatedPins.map(pin => ({
          type: 'Feature',
          properties: {
            id: pin.id,
            name: pin.name,
            country: pin.country || pin.location,
            type: pin.type,
            lastUser: pin.lastUser || null,
            description: pin.lastUser ? 
              `${pin.location || pin.name} - Last visitor: ${pin.lastUser.name}` : 
              (pin.type === 'location_pin' ? 
                `${pin.name} from ${pin.location}` : 
                `${pin.name}, ${pin.country}`)
          },
          geometry: {
            type: 'Point',
            coordinates: pin.coordinates
          }
        }))
      };
      
      mapInstance.current.getSource('world-pins').setData(geojsonData);
      
      // Fly to the new/updated pin location (keep current zoom since user is already there)
      mapInstance.current.flyTo({
        center: pinData.coordinates,
        zoom: mapInstance.current.getZoom(), // Maintain current zoom level
        duration: 2000
      });
    }
    
    setIsAddPinOpen(false);
  }, [allPins]);

  // Auto-rotation function - completely stable
  const startRotation = useCallback(() => {
    if (!mapInstance.current || !enableAutoRotation || rotationPaused.current) return;
    
    const rotateCamera = () => {
      if (!mapInstance.current || userInteracting.current || rotationPaused.current) return;
      
      const zoom = mapInstance.current.getZoom();
      if (zoom > stopRotationZoom) return;
      
      const center = mapInstance.current.getCenter();
      const newLng = center.lng + rotationSpeed;
      
      mapInstance.current.easeTo({
        center: [newLng, center.lat],
        duration: 0
      });
      
      rotationRef.current = requestAnimationFrame(rotateCamera);
    };
    
    rotationRef.current = requestAnimationFrame(rotateCamera);
  }, [enableAutoRotation, rotationSpeed, stopRotationZoom]); // Fixed dependencies

  const stopRotation = useCallback(() => {
    if (rotationRef.current) {
      cancelAnimationFrame(rotationRef.current);
      rotationRef.current = null;
    }
  }, []);

  // Add pins to the map
  const addPinsToMap = useCallback((map) => {
    if (!showPins || !allPins || allPins.length === 0) {
      console.warn('⚠️ No pins to show');
      return;
    }

    console.log('🔍 Adding pins to map...', { showPins, pinCount: allPins.length });

    const geojsonData = {
      type: 'FeatureCollection',
      features: allPinsRef.current.map(pin => ({
        type: 'Feature',
        properties: {
          id: pin.id,
          name: pin.name,
          country: pin.country || pin.location,
          type: pin.type,
          description: pin.type === 'user_pin' ? 
            `${pin.name} from ${pin.location}` : 
            `${pin.name}, ${pin.country}`
        },
        geometry: {
          type: 'Point',
          coordinates: pin.coordinates
        }
      }))
    };

    console.log('📊 GeoJSON data:', geojsonData);

    try {
      // Add pins source
      map.addSource('world-pins', {
        type: 'geojson',
        data: geojsonData
      });
      console.log('✅ Added pins source');

      // Add pin-style circles
      map.addLayer({
        id: 'pins-icons',
        type: 'circle',
        source: 'world-pins',
        paint: {
          'circle-radius': 8,
          'circle-color': '#EA4335',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9
        }
      });
      console.log('✅ Added pins icons layer');

      // Add simple labels
      map.addLayer({
        id: 'pins-labels',
        type: 'symbol',
        source: 'world-pins',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 2],
          'text-anchor': 'top',
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        },
        minzoom: 2
      });
      console.log('✅ Added pins labels layer');

      // Add click handlers for pins
      map.on('click', 'pins-icons', (e) => {
        console.log('🖱️ Pin clicked!', e);
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['pins-icons']
        });

        if (!features.length) return;

        const feature = features[0];
        const coordinates = feature.geometry.coordinates.slice();
        const properties = feature.properties;

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div style="padding: 12px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #333;">${properties.name}</h3>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">${properties.country}</p>
              ${properties.visitorCount > 0 ? `
                <div style="border-top: 1px solid #eee; padding-top: 8px; margin-top: 8px;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #EA4335; font-weight: bold;">
                    🏆 ${properties.visitorCount} visitor${properties.visitorCount > 1 ? 's' : ''}
                  </p>
                  ${properties.mostRecentVisitor ? `
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #888; font-weight: bold;">Most recent visitor:</p>
                    <p style="margin: 0 0 2px 0; font-size: 14px; color: #333;">${JSON.parse(properties.mostRecentVisitor).name}</p>
                    <p style="margin: 0 0 2px 0; font-size: 12px; color: #666;">Age: ${JSON.parse(properties.mostRecentVisitor).age}, ${JSON.parse(properties.mostRecentVisitor).gender}</p>
                    <p style="margin: 0; font-size: 11px; color: #aaa;">${new Date(JSON.parse(properties.mostRecentVisitor).timestamp).toLocaleDateString()}</p>
                  ` : ''}
                </div>
              ` : `
                <p style="margin: 8px 0 0 0; font-size: 11px; color: #888; font-style: italic;">No visitors yet - be the first!</p>
              `}
            </div>
          `)
          .addTo(map);

        if (onPinClick) {
          onPinClick({
            id: properties.id,
            name: properties.name,
            country: properties.country,
            type: properties.type,
            coordinates: coordinates
          });
        }
      });

      map.on('mouseenter', 'pins-icons', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'pins-icons', () => {
        map.getCanvas().style.cursor = '';
      });

      console.log('✅ Pin event handlers added');

    } catch (error) {
      console.error('❌ Error in addPinsToMap:', error);
    }

  }, [showPins, allPins, onPinClick]);

  // Validate token on mount
  useEffect(() => {
    const token = GLOBE_CONFIG.mapProperties.mapboxAccessToken;
    
    console.log('🔑 Token validation:', {
      exists: !!token,
      length: token?.length,
      startsWithPk: token?.startsWith('pk.'),
      preview: token ? token.substring(0, 20) + '...' : 'NULL'
    });

    if (!token) {
      setError('No Mapbox token found. Please check your .env file.');
      setIsLoading(false);
      return;
    }

    if (!token.startsWith('pk.')) {
      setError('Invalid Mapbox token format. Token should start with "pk."');
      setIsLoading(false);
      return;
    }
  }, []);

  const createMap = useCallback(() => {
    if (initialized.current || mapInstance.current) {
      console.log('⏭️ Skipping - already initialized');
      return;
    }

    const container = mapContainer.current;
    if (!container) {
      console.error('❌ No container found');
      setError('Map container not found');
      setIsLoading(false);
      return;
    }

    container.innerHTML = '';
    console.log('🌍 Creating map with configuration...');
    initialized.current = true;

    try {
      mapboxgl.accessToken = GLOBE_CONFIG.mapProperties.mapboxAccessToken;

      const map = new mapboxgl.Map({
        container: container,
        center: initialCenter || GLOBE_CONFIG.defaultView.center,
        zoom: initialZoom || GLOBE_CONFIG.defaultView.zoom,
        pitch: initialPitch || GLOBE_CONFIG.defaultView.pitch,
        bearing: initialBearing || GLOBE_CONFIG.defaultView.bearing,
        style: GLOBE_CONFIG.mapProperties.mapStyle,
        projection: GLOBE_CONFIG.mapProperties.projection,
        maxZoom: GLOBE_CONFIG.mapProperties.maxZoom,
        minZoom: GLOBE_CONFIG.mapProperties.minZoom,
        maxPitch: GLOBE_CONFIG.mapProperties.maxPitch,
        dragRotate: GLOBE_CONFIG.mapProperties.dragRotate,
        touchZoomRotate: { zoom: false, rotate: true }, // Allow touch rotation but disable touch zoom
        pitchWithRotate: GLOBE_CONFIG.mapProperties.pitchWithRotate,
        cooperativeGestures: GLOBE_CONFIG.mapProperties.cooperativeGestures,
        doubleClickZoom: GLOBE_CONFIG.mapProperties.doubleClickZoom,
        scrollZoom: GLOBE_CONFIG.mapProperties.scrollZoom,
        antialias: true,
        preserveDrawingBuffer: GLOBE_CONFIG.mapProperties.preserveDrawingBuffer,
        failIfMajorPerformanceCaveat: false,
        renderWorldCopies: GLOBE_CONFIG.mapProperties.renderWorldCopies,
        trackResize: GLOBE_CONFIG.mapProperties.trackResize,
        attributionControl: GLOBE_CONFIG.mapProperties.attributionControl,
        logoPosition: GLOBE_CONFIG.mapProperties.logoPosition
      });

      mapInstance.current = map;
      console.log('🗺️ Map created with configuration');

      map.on('load', () => {
        console.log('🎯 Map loaded successfully');
        
        setTimeout(() => {
          try {
            if (map.setConfigProperty && map.isStyleLoaded()) {
              Object.entries(GLOBE_CONFIG.visualSettings).forEach(([key, value]) => {
                try {
                  map.setConfigProperty('basemap', key, value);
                } catch (error) {
                  console.warn(`Could not set ${key}:`, error.message);
                }
              });
              console.log('✅ Visual settings applied');
            }

            if (showPins) {
              try {
                addPinsToMap(map);
                console.log(`📍 Added ${allPinsRef.current.length} pins to the map`);
              } catch (error) {
                console.error('❌ Error adding pins:', error);
              }
            }

            // Set up event listeners
            if (onMapMove) {
              map.on('move', () => onMapMove(map));
            }

            if (onMapClick) {
              map.on('click', (e) => onMapClick(e, map));
            }

            if (onLocationSelect) {
              map.on('click', (e) => {
                const location = {
                  name: 'Selected Location',
                  coordinates: [e.lngLat.lng, e.lngLat.lat]
                };
                onLocationSelect(location);
              });
            }

            // Set up rotation control event listeners
            const handleUserInteraction = () => {
              userInteracting.current = true;
              stopRotation();
            };

            const handleUserInteractionEnd = () => {
              userInteracting.current = false;
              setTimeout(() => {
                if (!userInteracting.current && map.getZoom() <= stopRotationZoom) {
                  startRotation();
                }
              }, 2000);
            };

            map.on('mousedown', handleUserInteraction);
            map.on('touchstart', handleUserInteraction);
            map.on('wheel', handleUserInteraction);
            
            map.on('mouseup', handleUserInteractionEnd);
            map.on('touchend', handleUserInteractionEnd);
            
            map.on('zoom', () => {
              if (map.getZoom() > stopRotationZoom) {
                stopRotation();
              } else if (!userInteracting.current) {
                startRotation();
              }
            });

            if (enableAutoRotation) {
              setTimeout(startRotation, 1000);
            }

            setIsLoading(false);
            console.log('✅ Globe initialized successfully');

            if (onMapLoad) {
              onMapLoad(map);
            }

          } catch (configError) {
            console.error('❌ Configuration error:', configError);
            setIsLoading(false);
          }
        }, 500);
      });

      map.on('error', (err) => {
        console.error('❌ Map error:', err);
        
        if (err.error?.message?.includes('Failed to fetch') || 
            err.error?.message?.includes('ERR_NAME_NOT_RESOLVED')) {
          console.warn('⚠️ Tile loading error (non-fatal):', err.error.message);
          return;
        }
        
        if (err.error?.message?.includes('access token')) {
          setError('Invalid Mapbox access token. Please check your token.');
        } else {
          setError('Map failed to load: ' + (err.error?.message || 'Unknown error'));
        }
        setIsLoading(false);
      });

    } catch (err) {
      console.error('❌ Map creation failed:', err);
      setError('Failed to create map: ' + err.message);
      setIsLoading(false);
      initialized.current = false;
    }
  }, [initialCenter, initialZoom, initialPitch, initialBearing, onMapLoad, onMapMove, onMapClick, onLocationSelect]);

  useEffect(() => {
    if (error) return;

    const timer = setTimeout(() => {
      if (!initialized.current && !mapInstance.current) {
        createMap();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      stopRotation();
      if (mapInstance.current) {
        console.log('🧹 Cleanup');
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      initialized.current = false;
    };
  }, [createMap, error]);

  const handleRetry = () => {
    console.log('🔄 Retry clicked');
    setError(null);
    setIsLoading(true);
    initialized.current = false;
    stopRotation();
    
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }
    
    setTimeout(createMap, 100);
  };

  const showOverlay = isLoading || error;

  return (
    <div className={`globe-view-container ${className}`} style={containerStyle}>
      {/* Map container with bottom margin */}
      <div 
        ref={mapContainer} 
        id="globe-map-container"
        style={mapContainerStyle}
      />

      {/* Overlay for loading/error */}
      {showOverlay && (
        <div style={overlayStyle}>
          {isLoading && !error && (
            <>
              <div style={spinnerStyle}></div>
              <p>Loading Globe View...</p>
              <p style={{ fontSize: '14px', opacity: 0.7 }}>
                Initializing map...
              </p>
            </>
          )}

          {error && (
            <>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Failed to Load Globe</h3>
              <p style={{ margin: '0 0 20px 0', opacity: 0.8 }}>{error}</p>
            </>
          )}

          <button onClick={handleRetry} style={buttonStyle}>
            {error ? 'Retry' : 'Force Retry'}
          </button>
        </div>
      )}

      {children}

      {/* Back to Globe Button */}
      {showBackButton && (
        <button
          onClick={onBackToGlobe}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50px',
            padding: '12px 20px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
        >
          ← Back to Globe
        </button>
      )}

      {/* Logo Overlay - Top Left */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '12px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}>
        <img 
          src="/assets/logo.png" 
          alt="Logo"
          style={{
            height: '50px',
            width: 'auto',
            display: 'block'
          }}
          onError={(e) => {
            console.warn('Logo not found at /assets/logo.png');
            e.target.parentElement.style.display = 'none';
          }}
        />
      </div>

      {/* Add Pin Button - More transparent with black background and black border */}
      {showAddPinButton && !isLoading && !error && (
        <button
          onClick={handleOpenAddPin}
          style={{
            position: 'absolute',
            bottom: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)', // More transparent black
            color: 'white',
            border: '2px solid rgba(0, 0, 0, 0.4)', // Black border
            borderRadius: '50px',
            padding: '18px 35px',
            fontSize: '18px',
            fontWeight: '400', // Lighter font weight
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: '200px',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Slightly less transparent on hover
            e.target.style.borderColor = 'rgba(0, 0, 0, 0.6)'; // Darker black border on hover
            e.target.style.transform = 'translateX(-50%) translateY(-3px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            e.target.style.borderColor = 'rgba(0, 0, 0, 0.4)';
            e.target.style.transform = 'translateX(-50%) translateY(0)';
          }}
        >
          📍 Add Your Pin
        </button>
      )}

      {/* Add Pin Overlay */}
      {isAddPinOpen && (
        <AddPinOverlay
          isOpen={isAddPinOpen}
          onClose={() => {
            console.log('🔄 Closing Add Pin - resuming rotation');
            setIsAddPinOpen(false);
            rotationPaused.current = false; // Use ref, no re-render
            // Resume rotation after a short delay
            setTimeout(() => {
              if (!userInteracting.current && mapInstance.current && enableAutoRotation && !rotationPaused.current) {
                startRotation();
              }
            }, 1000);
          }}
          onAddPin={handleAddPin}
          onLocationSelect={(location) => {
            console.log('🎯 Location selected, stopping rotation and zooming:', location);
            rotationPaused.current = true; // Use ref, no re-render
            if (rotationRef.current) {
              cancelAnimationFrame(rotationRef.current);
              rotationRef.current = null;
            }
            
            if (onLocationSelect) {
              onLocationSelect(location);
            }
          }}
          mapInstance={mapInstance}
        />
      )}

      {/* Top 5 Locations Overlay */}
      {showTop5 && (
        <Top5Overlay
          isOpen={showTop5}
          onClose={() => setShowTop5(false)}
          top5Data={top5Data}
        />
      )}
    </div>
  );
};

export default GlobeView;
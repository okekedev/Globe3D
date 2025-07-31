// KioskGlobe.jsx - Fixed 30-second zoom animation behavior
import React, { useRef, useState, useCallback, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// MEMOIZED COMPONENT TO PREVENT UNNECESSARY RE-RENDERS
const KioskGlobe = React.memo(({
  className = '',
  containerStyle = {},
  enableAutoRotation = true,
  selectedLocation = null,
  pins = [],
  children,
  onFormReset // NEW: Callback to reset the form when timeout occurs
}) => {
  console.log('🌍 Kiosk Globe rendering');

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs - USING REFS INSTEAD OF STATE TO AVOID RE-RENDERS
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const animationRef = useRef(null);
  const zoomTimeoutRef = useRef(null);
  const initialized = useRef(false);
  const isZoomedInRef = useRef(false); // CHANGED FROM STATE TO REF

  // Get token from environment
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  // Debug token info
  console.log('🔑 Kiosk Token info:', {
    exists: !!mapboxToken,
    length: mapboxToken?.length,
    valid: mapboxToken?.startsWith('pk.'),
    preview: mapboxToken?.substring(0, 20) + '...'
  });

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
      const newLng = center.lng + 0.1;
      
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
      
      if (enableAutoRotation) {
        console.log('🌀 Resuming rotation after 5-second zoom out completes');
        setTimeout(() => {
          startAnimation();
        }, 500); // Small additional buffer
      } else {
        console.log('🚫 Auto rotation disabled');
      }
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
        style: 'mapbox://styles/okekec21/cmd63rz9p00sd01qn2kcefwj0',
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
        
        // REMOVED: Auto-start animation on load - let it start naturally
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
  }, [mapboxToken, startAnimation, enableAutoRotation]);

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
      initialized.current = false;
    };
  }, [mapboxToken, createMap, stopAnimation, handleResize]); // REMOVED CHANGING DEPENDENCIES

  // UPDATED: Handle location changes with 30-second zoom animation
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
      
      // Clear the 30-second timeout since user finished early
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
        zoomTimeoutRef.current = null;
      }
      
      zoomOutToDefault();
    }
  }, [selectedLocation, stopAnimation, zoomOutToDefault]); // REMOVED isZoomedIn DEPENDENCY

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
      `}</style>
    </div>
  );
});

// Add display name for debugging
KioskGlobe.displayName = 'KioskGlobe';

export default KioskGlobe;
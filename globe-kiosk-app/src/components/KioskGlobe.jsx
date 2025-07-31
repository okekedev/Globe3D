// KioskGlobe.jsx - Dedicated kiosk display component
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const KioskGlobe = ({
  className = '',
  containerStyle = {},
  enableAutoRotation = true,
  selectedLocation = null,
  pins = [],
  children
}) => {
  console.log('🌍 Kiosk Globe rendering');

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const animationRef = useRef(null);
  const initialized = useRef(false);

  // Get token from environment
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  // Debug token info
  console.log('🔑 Kiosk Token info:', {
    exists: !!mapboxToken,
    length: mapboxToken?.length,
    valid: mapboxToken?.startsWith('pk.'),
    preview: mapboxToken?.substring(0, 20) + '...'
  });

  // Smooth rotation animation
  const startAnimation = useCallback(() => {
    if (!mapInstance.current) return;
    
    console.log('🌀 Starting kiosk rotation');

    const animate = () => {
      if (!mapInstance.current) return;

      const center = mapInstance.current.getCenter();
      const newLng = center.lng + 0.1; // Slightly faster rotation for kiosk
      
      mapInstance.current.easeTo({
        center: [newLng, center.lat],
        zoom: 2,
        duration: 100,
        easing: t => t
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      console.log('⏸️ Kiosk animation stopped');
    }
  }, []);

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
        center: [0, 20],
        zoom: 2,
        pitch: 15,
        bearing: 0,
        projection: 'globe',
        antialias: true,
        maxZoom: 8.5,
        minZoom: 1.5,
        maxPitch: 75,
        dragRotate: false,
        dragPan: false,
        scrollZoom: false,
        touchZoomRotate: false,
        doubleClickZoom: false,
        keyboard: false,
        attributionControl: false,
        renderWorldCopies: false,
        trackResize: true
      });

      mapInstance.current = map;
      console.log('🗺️ Kiosk map instance created');

      map.on('load', () => {
        console.log('🎯 Kiosk map loaded');
        
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
        
        if (enableAutoRotation) {
          setTimeout(startAnimation, 1000);
        }
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

  // Initialize map
  useEffect(() => {
    if (!mapboxToken) {
      setError('Missing Mapbox token');
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(createMap, 100);

    return () => {
      clearTimeout(timer);
      stopAnimation();
      if (mapInstance.current) {
        console.log('🧹 Cleaning up kiosk map');
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      initialized.current = false;
    };
  }, [createMap, mapboxToken, stopAnimation]);

  // Handle location changes from main globe
  useEffect(() => {
    if (selectedLocation && mapInstance.current) {
      console.log('🎯 Kiosk syncing to location:', selectedLocation);
      
      // Temporarily stop rotation and focus on location
      stopAnimation();
      
      mapInstance.current.easeTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: 4,
        duration: 2000
      });

      // Resume rotation after 5 seconds
      setTimeout(() => {
        if (enableAutoRotation) {
          startAnimation();
        }
      }, 5000);
    }
  }, [selectedLocation, enableAutoRotation, startAnimation, stopAnimation]);

  // Handle retry
  const handleRetry = useCallback(() => {
    console.log('🔄 Retrying kiosk map creation');
    setError(null);
    setIsLoading(true);
    initialized.current = false;
    stopAnimation();
    
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }
    
    setTimeout(createMap, 100);
  }, [createMap, stopAnimation]);

  // Show token error
  if (!mapboxToken) {
    return (
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
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
        <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>Missing Mapbox Token</h3>
        <p style={{ margin: '0', textAlign: 'center', opacity: 0.8, fontSize: '14px' }}>
          Add VITE_MAPBOX_ACCESS_TOKEN to your .env file
        </p>
      </div>
    );
  }

  return (
    <div className={`kiosk-globe-container ${className}`} style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...containerStyle
    }}>

      {/* Map container */}
      <div 
        ref={mapContainer}
        style={{ 
          width: '100%', 
          height: '100%',
          backgroundColor: '#000000'
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
};

export default KioskGlobe;
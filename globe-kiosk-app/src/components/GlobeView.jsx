// Fixed GlobeView.jsx - Direct Mapbox GL, no react-map-gl
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const GlobeView = ({
  className = '',
  containerStyle = {},
  enableAutoRotation = true,
  children
}) => {
  console.log('🌍 Final Globe rendering with direct Mapbox GL');

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI State
  const [showQuestions, setShowQuestions] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});

  // Refs
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const animationRef = useRef(null);
  const initialized = useRef(false);
  const userInteracting = useRef(false);

  // Mock data for top 10 cities
  const top10Cities = [
    { rank: 1, city: "Tokyo", country: "Japan", visitors: 847, flag: "🇯🇵" },
    { rank: 2, city: "New York", country: "United States", visitors: 721, flag: "🇺🇸" },
    { rank: 3, city: "London", country: "United Kingdom", visitors: 693, flag: "🇬🇧" },
    { rank: 4, city: "Paris", country: "France", visitors: 612, flag: "🇫🇷" },
    { rank: 5, city: "Sydney", country: "Australia", visitors: 534, flag: "🇦🇺" },
    { rank: 6, city: "Toronto", country: "Canada", visitors: 487, flag: "🇨🇦" },
    { rank: 7, city: "Berlin", country: "Germany", visitors: 423, flag: "🇩🇪" },
    { rank: 8, city: "Mumbai", country: "India", visitors: 398, flag: "🇮🇳" },
    { rank: 9, city: "São Paulo", country: "Brazil", visitors: 356, flag: "🇧🇷" },
    { rank: 10, city: "Dubai", country: "UAE", visitors: 334, flag: "🇦🇪" }
  ];

  // Question flow
  const questions = [
    {
      id: 'location',
      type: 'search',
      question: 'Where are you from?',
      placeholder: 'Enter your city or country...',
      required: true
    },
    {
      id: 'name',
      type: 'text',
      question: 'What\'s your name?',
      placeholder: 'Enter your name',
      required: true
    },
    {
      id: 'age',
      type: 'number',
      question: 'How old are you?',
      placeholder: 'Enter your age',
      min: 13,
      max: 120,
      required: true
    },
    {
      id: 'purpose',
      type: 'select',
      question: 'What brings you here?',
      options: [
        'Just exploring',
        'Travel planning',
        'Educational research',
        'Business purposes',
        'Other'
      ],
      required: true
    }
  ];

  // Get token from environment
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  // Handle question flow
  const handleStartQuestions = useCallback(() => {
    setShowQuestions(true);
    setCurrentStep(0);
  }, []);

  const handleNextQuestion = useCallback(() => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete the flow
      console.log('Form completed:', formData);
      setShowQuestions(false);
      setCurrentStep(0);
      setFormData({});
    }
  }, [currentStep, questions.length, formData]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleInputChange = useCallback((value) => {
    const currentQuestion = questions[currentStep];
    setFormData(prev => ({ ...prev, [currentQuestion.id]: value }));
  }, [currentStep, questions]);

  const canAdvance = useMemo(() => {
    const currentQuestion = questions[currentStep];
    const currentValue = formData[currentQuestion?.id];
    
    if (!currentQuestion?.required) return true;
    if (!currentValue) return false;
    if (typeof currentValue === 'string' && !currentValue.trim()) return false;
    
    return true;
  }, [currentStep, questions, formData]);

  // Debug token info
  console.log('🔑 Token info:', {
    exists: !!mapboxToken,
    length: mapboxToken?.length,
    valid: mapboxToken?.startsWith('pk.'),
    preview: mapboxToken?.substring(0, 20) + '...'
  });

  console.log('📦 Mapbox GL library:', {
    imported: !!mapboxgl,
    hasMap: !!mapboxgl?.Map,
    version: mapboxgl?.version
  });

  // Smooth rotation only - no zoom breathing
  const startAnimation = useCallback(() => {
    if (!mapInstance.current || userInteracting.current) return;
    
    console.log('🌀 Starting smooth rotation - no zoom changes');

    const animate = () => {
      if (!mapInstance.current || userInteracting.current) return;

      const center = mapInstance.current.getCenter();
      
      // Steady Y-axis rotation (longitude) - smooth and consistent
      const newLng = center.lng + 0.05;
      
      // Fixed zoom - no breathing effect
      const targetZoom = 2;

      // Apply smooth steady rotation only
      mapInstance.current.easeTo({
        center: [newLng, center.lat],
        zoom: targetZoom, // No zoom changes
        duration: 50,
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
      console.log('⏸️ Animation stopped');
    }
  }, []);

  // Remove all interaction handlers since zoom is disabled
  const handleUserInteraction = useCallback(() => {
    // User interaction disabled - globe runs continuously
    console.log('👆 User interaction detected but disabled for kiosk mode');
  }, []);

  const handleUserInteractionEnd = useCallback(() => {
    // No interaction handling needed
  }, []);

  // Create map
  const createMap = useCallback(() => {
    if (initialized.current || !mapContainer.current) return;
    
    console.log('🗺️ Creating map instance');
    initialized.current = true;

    try {
      // Set access token
      mapboxgl.accessToken = mapboxToken;

      // Use YOUR CUSTOM Mapbox style
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/okekec21/cmd63rz9p00sd01qn2kcefwj0', // Your custom style
        center: [0, 20],
        zoom: 2,
        pitch: 15,
        bearing: 0,
        projection: 'globe',
        antialias: true,
        maxZoom: 8.5, // Increased zoom range
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
      console.log('🗺️ Map instance created successfully');

      // Handle map load
      map.on('load', () => {
        console.log('🎯 Map loaded successfully');
        
        // Apply MINIMAL settings - just basic atmosphere, no custom properties
        try {
          if (map.setConfigProperty && map.isStyleLoaded()) {
            // ONLY basic atmosphere - no other custom settings
            map.setConfigProperty('basemap', 'showAtmosphere', true);
            map.setConfigProperty('basemap', 'atmosphereIntensity', 1.0); // Conservative setting
            
            console.log('✅ Basic globe settings applied - should be visible now');
          }
        } catch (err) {
          console.warn('⚠️ Could not apply settings:', err.message);
        }

        setIsLoading(false);
        
        // Start animation after map loads
        if (enableAutoRotation) {
          setTimeout(startAnimation, 1000);
        }
      });

      // Handle map errors
      map.on('error', (e) => {
        console.error('❌ Map error:', e);
        let errorMessage = 'Map failed to load';
        
        if (e.error?.message?.includes('token')) {
          errorMessage = 'Invalid Mapbox token. Please check your token.';
        } else if (e.error?.message) {
          errorMessage = 'Map error: ' + e.error.message;
        }
        
        setError(errorMessage);
        setIsLoading(false);
      });

      // Remove interaction handlers since all interactions are disabled
      // map.on('mousedown', handleUserInteraction);
      // map.on('touchstart', handleUserInteraction);
      // map.on('wheel', handleUserInteraction);
      // map.on('mouseup', handleUserInteractionEnd);
      // map.on('touchend', handleUserInteractionEnd);

    } catch (err) {
      console.error('❌ Map creation failed:', err);
      setError('Failed to create map: ' + err.message);
      setIsLoading(false);
      initialized.current = false;
    }
  }, [mapboxToken, startAnimation, enableAutoRotation, handleUserInteraction, handleUserInteractionEnd]);

  // Initialize map
  useEffect(() => {
    if (!mapboxToken) {
      setError('Missing Mapbox token');
      setIsLoading(false);
      return;
    }

    if (!mapboxgl || !mapboxgl.Map) {
      setError('Mapbox GL library not loaded');
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(createMap, 100);

    return () => {
      clearTimeout(timer);
      stopAnimation();
      if (mapInstance.current) {
        console.log('🧹 Cleaning up map');
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      initialized.current = false;
    };
  }, [createMap, mapboxToken, stopAnimation]);

  // Handle retry
  const handleRetry = useCallback(() => {
    console.log('🔄 Retrying map creation');
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
        <h2 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>Missing Mapbox Token</h2>
        <p style={{ margin: '0 0 20px 0', textAlign: 'center', opacity: 0.8 }}>
          Add your Mapbox access token to get started
        </p>
        <pre style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '20px', 
          borderRadius: '8px',
          fontSize: '14px',
          fontFamily: 'monospace',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          VITE_MAPBOX_ACCESS_TOKEN=pk.your_token_here
        </pre>
        <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '15px', textAlign: 'center' }}>
          Get your free token at: <strong>mapbox.com → Account → Access tokens</strong>
        </p>
      </div>
    );
  }

  // Show invalid token error
  if (!mapboxToken.startsWith('pk.')) {
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
        <h2 style={{ margin: '0 0 15px 0' }}>Invalid Mapbox Token</h2>
        <p style={{ margin: '0 0 10px 0', textAlign: 'center' }}>
          Token should start with "pk." but starts with "{mapboxToken.substring(0, 3)}"
        </p>
        <p style={{ fontSize: '12px', opacity: 0.6, textAlign: 'center' }}>
          Make sure you're using the <strong>public token</strong> (pk.) not the secret token (sk.)
        </p>
      </div>
    );
  }

  return (
    <div className={`globe-view-container ${className}`} style={{
      position: 'fixed', // Use fixed positioning to ignore any parent containers
      top: 0,
      left: 0,
      width: '100vw', // Full viewport width
      height: '100vh', // Full viewport height
      backgroundColor: '#000000', // Pure black background
      display: 'flex',
      alignItems: 'center', // Center vertically
      justifyContent: 'center', // Center horizontally
      margin: 0,
      padding: 0,
      ...containerStyle
    }}>

      {/* Beautiful Title Overlay */}
      <div style={{
        position: 'absolute',
        top: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2000,
        textAlign: 'center',
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "SF Pro Display", Roboto, sans-serif',
        pointerEvents: 'none', // Don't interfere with map interactions
        textShadow: '0 4px 20px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.5)'
      }}>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: '100',
          margin: '0 0 8px 0',
          letterSpacing: '2px',
          background: 'linear-gradient(135deg, #ffffff 0%, #e1f5fe 50%, #81d4fa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
        }}>
          TERRA
        </h1>
        <p style={{
          fontSize: '1.1rem',
          fontWeight: '300',
          margin: 0,
          opacity: 0.85,
          letterSpacing: '1px',
          color: 'rgba(255, 255, 255, 0.9)'
        }}>
          Interactive Globe Explorer
        </p>
      </div>
      {/* Map container with enhanced antialiasing */}
      <div 
        ref={mapContainer}
        style={{ 
          width: '100%', 
          height: '100%',
          backgroundColor: '#000000', // Ensure map container is also black
          // CSS-based antialiasing and smoothing
          filter: 'blur(0.3px) contrast(1.1) saturate(1.15)', // Subtle blur + enhanced colors
          imageRendering: 'auto',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          // Perfect centering with hardware acceleration
          position: 'relative',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%) translateZ(0)', // Combined transform for centering + hardware acceleration
          WebkitTransform: 'translate(-50%, -50%) translateZ(0)', // Webkit fallback
          willChange: 'transform, filter'
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
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '25px'
          }}></div>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>Loading Globe...</h3>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '16px' }}>Preparing breathing animation</p>
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
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '24px' }}>Globe Failed to Load</h3>
          <p style={{ 
            margin: '0 0 25px 0', 
            textAlign: 'center', 
            maxWidth: '500px',
            fontSize: '16px',
            lineHeight: '1.4'
          }}>
            {error}
          </p>
          <button 
            onClick={handleRetry}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '25px',
              padding: '12px 24px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
          >
            🔄 Retry
          </button>
        </div>
      )}

      {/* Debug info */}
      <div style={{
        position: 'absolute',
        top: '15px',
        right: '15px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 1000,
        minWidth: '220px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🌍 Globe Status:</div>
        <div>Loading: {isLoading ? '⏳ Yes' : '✅ No'}</div>
        <div>Error: {error ? '❌ Yes' : '✅ No'}</div>
        <div>Token: {mapboxToken ? '✅ Found' : '❌ Missing'}</div>
        <div>Mapbox GL: {mapboxgl ? '✅ Loaded' : '❌ Missing'}</div>
        <div>Map: {mapInstance.current ? '✅ Created' : '⏳ Waiting'}</div>
        <div>Animation: {animationRef.current ? '🌀 Running' : '⏸️ Stopped'}</div>
        <div>Interaction: {userInteracting.current ? '👆 Active' : '💤 Idle'}</div>
      </div>

      {children}

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes gentle-bounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

export default GlobeView;
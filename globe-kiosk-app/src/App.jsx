// App.jsx - Updated with Pin Management Integration
import React, { useState, useRef, useCallback } from 'react';
import './App.css';
import KioskGlobe from './components/KioskGlobe';
import FormFlow from './components/FormFlow';

function App() {
  // Shared state between components
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({});
  const [resetTrigger, setResetTrigger] = useState(0); // Counter to trigger form resets
  const [metricsData, setMetricsData] = useState(null); // NEW: Store metrics from pin data

  const globeRef = useRef(null); // NEW: Reference to globe for adding pins

  const handleLocationSelect = (location) => {
    console.log('📍 Location selected:', location);
    setSelectedLocation(location);
  };

  const handleFormSubmit = (data) => {
    console.log('📝 Form submitted:', data);
    setFormData(data);
    
    // NEW: Add pin to globe when form is submitted
    if (globeRef.current?.addNewPin && selectedLocation) {
      globeRef.current.addNewPin(selectedLocation, data);
    }
  };

  // Function for Globe to call when 2-minute timeout occurs
  const handleFormReset = () => {
    console.log('🔄 App triggering form reset due to timeout');
    setSelectedLocation(null);
    setFormData({});
    setResetTrigger(prev => prev + 1); // Increment to trigger reset in FormFlow
  };

  // NEW: Handle metrics updates from KioskGlobe - STABILIZED
  const handleMetricsUpdate = useCallback((metrics) => {
    console.log('📊 Metrics updated:', metrics);
    setMetricsData(metrics);
  }, []);

  return (
    <div className="app-container">
      {/* Left Side - Form Flow & Top Cities (33%) */}
      <div className="left-panel">
        <FormFlow
          onFormSubmit={handleFormSubmit}
          onLocationSelect={handleLocationSelect}
          selectedLocation={selectedLocation}
          resetTrigger={resetTrigger} // Pass reset trigger to FormFlow
          metricsData={metricsData} // NEW: Pass dynamic metrics data
        />
      </div>

      {/* Right Side - Full Globe Display (67%) */}
      <div className="right-panel">
        <KioskGlobe
          ref={globeRef} // NEW: Reference for accessing globe methods
          enableAutoRotation={true}
          selectedLocation={selectedLocation}
          formData={formData}
          interactiveMode={false}
          onFormReset={handleFormReset} // Pass reset callback to Globe
          onMetricsUpdate={handleMetricsUpdate} // NEW: Pass metrics callback
        />
      </div>
    </div>
  );
}

export default App;
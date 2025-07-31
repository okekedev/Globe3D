// App.jsx - Form + Globe layout (33% / 67%) with coordinated timeout handling
import React, { useState, useRef } from 'react';
import './App.css';
import KioskGlobe from './components/KioskGlobe';
import FormFlow from './components/FormFlow';

function App() {
  // Shared state between components
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({});
  const [resetTrigger, setResetTrigger] = useState(0); // Counter to trigger form resets

  const handleLocationSelect = (location) => {
    console.log('Location selected:', location);
    setSelectedLocation(location);
  };

  const handleFormSubmit = (data) => {
    console.log('Form submitted:', data);
    setFormData(data);
  };

  // Function for Globe to call when 2-minute timeout occurs
  const handleFormReset = () => {
    console.log('🔄 App triggering form reset due to timeout');
    setSelectedLocation(null);
    setFormData({});
    setResetTrigger(prev => prev + 1); // Increment to trigger reset in FormFlow
  };

  return (
    <div className="app-container">
      {/* Left Side - Form Flow & Top Cities (33%) */}
      <div className="left-panel">
        <FormFlow
          onFormSubmit={handleFormSubmit}
          onLocationSelect={handleLocationSelect}
          selectedLocation={selectedLocation}
          resetTrigger={resetTrigger} // Pass reset trigger to FormFlow
        />
      </div>

      {/* Right Side - Full Globe Display (67%) */}
      <div className="right-panel">
        <KioskGlobe
          enableAutoRotation={true}
          selectedLocation={selectedLocation}
          formData={formData}
          interactiveMode={false}
          onFormReset={handleFormReset} // Pass reset callback to Globe
        />
      </div>
    </div>
  );
}

export default App;
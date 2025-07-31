// App.jsx - Form + Globe layout (33% / 67%)
import React, { useState } from 'react';
import './App.css';
import KioskGlobe from './components/KioskGlobe';
import FormFlow from './components/FormFlow';

function App() {
  // Shared state between components
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({});

  const handleLocationSelect = (location) => {
    console.log('Location selected:', location);
    setSelectedLocation(location);
  };

  const handleFormSubmit = (data) => {
    console.log('Form submitted:', data);
    setFormData(data);
  };

  return (
    <div className="app-container">
      {/* Left Side - Form Flow & Top Cities (33%) */}
      <div className="left-panel">
        <FormFlow
          onFormSubmit={handleFormSubmit}
          onLocationSelect={handleLocationSelect}
          selectedLocation={selectedLocation}
        />
      </div>

      {/* Right Side - Full Globe Display (67%) */}
      <div className="right-panel">
        <KioskGlobe
          enableAutoRotation={true}
          selectedLocation={selectedLocation}
          formData={formData}
          interactiveMode={false}
        />
      </div>
    </div>
  );
}

export default App;
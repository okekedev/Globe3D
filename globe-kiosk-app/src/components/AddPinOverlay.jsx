import React, { useState, useEffect, useRef } from 'react';

const AddPinOverlay = ({ 
  isOpen, 
  onClose, 
  onAddPin, 
  onLocationSelect,
  mapInstance 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    location: '',
    coordinates: null,
    name: '',
    age: '',
    gender: '',
    email: '',
    phone: ''
  });
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Interview questions in order
  const questions = [
    {
      id: 'location',
      question: "Where are you from?",
      placeholder: "Start typing your city or location...",
      type: 'location',
      required: true
    },
    {
      id: 'name',
      question: "What's your name?",
      placeholder: "Enter your full name",
      type: 'text',
      required: true
    },
    {
      id: 'age',
      question: "How old are you?",
      placeholder: "Enter your age",
      type: 'number',
      required: true,
      min: 1,
      max: 120
    },
    {
      id: 'gender',
      question: "What's your gender?",
      type: 'select',
      required: true,
      options: [
        { value: '', label: 'Select your gender' },
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'non-binary', label: 'Non-binary' },
        { value: 'prefer-not-to-say', label: 'Prefer not to say' }
      ]
    },
    {
      id: 'email',
      question: "What's your email? (Optional)",
      placeholder: "Enter your email address",
      type: 'email',
      required: false
    },
    {
      id: 'phone',
      question: "What's your phone number? (Optional)",
      placeholder: "Enter your phone number",
      type: 'tel',
      required: false
    }
  ];

  // Search for locations using Mapbox Geocoding API
  const searchLocations = async (query) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&types=place,locality,neighborhood,address&limit=5`
      );
      const data = await response.json();
      
      const suggestions = data.features?.map(feature => ({
        id: feature.id,
        name: feature.place_name,
        coordinates: feature.center,
        bbox: feature.bbox
      })) || [];
      
      setLocationSuggestions(suggestions);
    } catch (error) {
      console.error('Geocoding error:', error);
      setLocationSuggestions([]);
    }
    setIsSearching(false);
  };

  // Handle location input change with debouncing
  const handleLocationChange = (value) => {
    setFormData(prev => ({ ...prev, location: value }));
    setIsTyping(true);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
      setIsTyping(false);
    }, 300);
  };

  // Handle location selection
  const handleLocationSelect = (suggestion) => {
    setFormData(prev => ({ 
      ...prev, 
      location: suggestion.name,
      coordinates: suggestion.coordinates 
    }));
    setLocationSuggestions([]);
    
    console.log('🎯 Location selected in overlay:', suggestion.name);
    
    // Notify parent component about location selection (stops rotation)
    if (onLocationSelect) {
      onLocationSelect(suggestion);
    }
    
    // Very slow zoom to location coordinates
    if (mapInstance?.current && suggestion.coordinates) {
      console.log('🎯 Starting slow zoom to:', suggestion.coordinates);
      
      // Slow zoom to the location
      mapInstance.current.flyTo({
        center: suggestion.coordinates,
        zoom: 8, // Moderate zoom level for location area
        duration: 10000, // 10-second transition
        essential: true, // Ensures zoom happens even if user disabled motion
        curve: 1.8, // Much smoother, more dramatic curve
        speed: 0.3 // Much slower speed
      });
    }

    // Auto-advance to next question after zoom starts
    setTimeout(() => {
      setCurrentStep(1);
    }, 3000); // Give more time for the 10-second zoom to be visible
  };

  // Handle input change for current question
  const handleInputChange = (value) => {
    const currentQuestion = questions[currentStep];
    setFormData(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  // Handle next question
  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    const currentValue = formData[currentQuestion.id];

    // Validate required fields
    if (currentQuestion.required && !currentValue?.toString().trim()) {
      return; // Don't advance if required field is empty
    }

    // Special validation for location
    if (currentQuestion.id === 'location' && !formData.coordinates) {
      return; // Don't advance if no location selected
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit the form
      handleSubmit();
    }
  };

  // Handle previous question
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle submit
  const handleSubmit = () => {
    const pinData = {
      id: Date.now(),
      name: formData.name,
      location: formData.location,
      coordinates: formData.coordinates,
      age: parseInt(formData.age),
      gender: formData.gender,
      email: formData.email || null,
      phone: formData.phone || null,
      type: 'location_pin', // Changed from user_pin
      timestamp: new Date().toISOString()
    };
    
    if (onAddPin) {
      onAddPin(pinData);
    }
    
    handleClose();
  };

  // Handle close
  const handleClose = () => {
    setCurrentStep(0);
    setFormData({
      location: '',
      coordinates: null,
      name: '',
      age: '',
      gender: '',
      email: '',
      phone: ''
    });
    setLocationSuggestions([]);
    onClose();
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  // Focus input when step changes
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentStep, isOpen]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const currentQuestion = questions[currentStep];
  const currentValue = formData[currentQuestion.id];
  const canAdvance = currentQuestion.required ? 
    (currentQuestion.id === 'location' ? formData.coordinates : currentValue?.toString().trim()) : 
    true;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)', // More transparent
      backdropFilter: 'blur(4px)', // Less blur
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      
      {/* Main Interview Card */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // More transparent
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '20px',
        padding: '60px 50px',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
        color: 'white',
        backdropFilter: 'blur(10px)', // Less blur
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)' // Lighter shadow
      }}>
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '24px',
            cursor: 'pointer',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = 'rgba(255, 255, 255, 0.7)';
          }}
        >
          ✕
        </button>

        {/* Progress Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '40px',
          gap: '8px'
        }}>
          {questions.map((_, index) => (
            <div
              key={index}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: index <= currentStep ? '#EA4335' : 'rgba(255, 255, 255, 0.3)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Question */}
        <h2 style={{
          fontSize: '32px',
          fontWeight: '300',
          margin: '0 0 40px 0',
          lineHeight: '1.3',
          color: 'white'
        }}>
          {currentQuestion.question}
        </h2>

        {/* Input Area */}
        <div style={{ position: 'relative', marginBottom: '40px' }}>
          
          {currentQuestion.type === 'location' ? (
            // Location Input with Suggestions
            <div>
              <input
                ref={inputRef}
                type="text"
                value={currentValue || ''}
                onChange={(e) => handleLocationChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={currentQuestion.placeholder}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  fontSize: '18px',
                  fontWeight: '300',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: 'white',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(234, 67, 53, 0.8)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              />
              
              {(isSearching || isTyping) && (
                <div style={{
                  position: 'absolute',
                  right: '24px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '14px'
                }}>
                  Searching...
                </div>
              )}
              
              {locationSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.95)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000
                }}>
                  {locationSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      onClick={() => handleLocationSelect(suggestion)}
                      style={{
                        padding: '16px 24px',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ fontWeight: '500', color: 'white' }}>
                        {suggestion.name.split(',')[0]}
                      </div>
                      <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>
                        {suggestion.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : currentQuestion.type === 'select' ? (
            // Select Input
            <select
              ref={inputRef}
              value={currentValue || ''}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{
                width: '100%',
                padding: '20px 24px',
                fontSize: '18px',
                fontWeight: '300',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: 'white',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(234, 67, 53, 0.8)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
            >
              {currentQuestion.options.map(option => (
                <option key={option.value} value={option.value} style={{ backgroundColor: '#000', color: '#fff' }}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            // Regular Input
            <input
              ref={inputRef}
              type={currentQuestion.type}
              value={currentValue || ''}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentQuestion.placeholder}
              min={currentQuestion.min}
              max={currentQuestion.max}
              style={{
                width: '100%',
                padding: '20px 24px',
                fontSize: '18px',
                fontWeight: '300',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: 'white',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(234, 67, 53, 0.8)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              style={{
                padding: '16px 32px',
                backgroundColor: 'transparent',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.color = 'rgba(255, 255, 255, 0.8)';
              }}
            >
              ← Back
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={!canAdvance}
            style={{
              padding: '16px 32px',
              backgroundColor: canAdvance ? '#EA4335' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '500',
              cursor: canAdvance ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              opacity: canAdvance ? 1 : 0.5,
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => {
              if (canAdvance) {
                e.target.style.backgroundColor = '#d33825';
              }
            }}
            onMouseLeave={(e) => {
              if (canAdvance) {
                e.target.style.backgroundColor = '#EA4335';
              }
            }}
          >
            {currentStep === questions.length - 1 ? '📍 Add My Pin!' : 'Continue →'}
          </button>
        </div>

        {/* Hint Text */}
        <p style={{
          marginTop: '30px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontWeight: '300'
        }}>
          Press Enter to continue
        </p>
      </div>
    </div>
  );
};

export default AddPinOverlay;
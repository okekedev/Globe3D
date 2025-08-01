// FormFlow.jsx - Enhanced with Stock Ticker Style Stats and Inline Keyboard
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactCountryFlag from 'react-country-flag';

const FormFlow = ({ onFormSubmit, onLocationSelect, selectedLocation, resetTrigger }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Get Mapbox token from environment
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  // Fetch location suggestions from Mapbox Geocoding API
  const fetchLocationSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2 || !mapboxToken) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&types=place,locality,neighborhood&limit=3&autocomplete=true`
      );
      
      if (response.ok) {
        const data = await response.json();
        const suggestions = data.features.map(feature => ({
          id: feature.id,
          name: feature.place_name,
          shortName: feature.text,
          coordinates: feature.center,
          context: feature.context || [],
          bbox: feature.bbox
        }));
        
        setLocationSuggestions(suggestions.slice(0, 3)); // Only show 3 suggestions
        setShowSuggestions(suggestions.length > 0);
        setSelectedSuggestionIndex(-1);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [mapboxToken]);

  // Debounced search for autocomplete
  const debouncedSearch = useCallback((query) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      fetchLocationSuggestions(query);
    }, 300);
  }, [fetchLocationSuggestions]);

  // Handle location input change
  const handleLocationInputChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, location: value }));
    setShowValidationError(false);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion) => {
    setFormData(prev => ({ ...prev, location: suggestion.name }));
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setShowKeyboard(false);
    
    const locationData = {
      name: suggestion.name,
      shortName: suggestion.shortName,
      lat: suggestion.coordinates[1],
      lng: suggestion.coordinates[0],
      bbox: suggestion.bbox
    };
    onLocationSelect(locationData);
    
    setCurrentStep(prev => prev + 1);
  }, [onLocationSelect]);

  // Handle reset requests from App when Globe timeout occurs
  useEffect(() => {
    if (resetTrigger > 0) {
      setCurrentStep(0);
      setFormData({});
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      setShowKeyboard(false);
      setShowValidationError(false);
    }
  }, [resetTrigger]);

  // Detect container size for responsive styling
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Age options for dropdown
  const ageOptions = [
    { value: '', label: 'Select Age Range' },
    { value: '18-24', label: '18-24' },
    { value: '25-34', label: '25-34' },
    { value: '35-44', label: '35-44' },
    { value: '45-54', label: '45-54' },
    { value: '55-64', label: '55-64' },
    { value: '65+', label: '65+' }
  ];

  // Gender options for dropdown
  const genderOptions = [
    { value: '', label: 'Select Gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non-binary', label: 'Non-binary' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' }
  ];

  const questions = [
    {
      id: 'location',
      type: 'location',
      question: 'Where are you from?',
      placeholder: 'Enter your city or country',
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
      id: 'gender',
      type: 'select',
      question: 'What\'s your gender?',
      options: genderOptions,
      required: true
    },
    {
      id: 'age',
      type: 'select',
      question: 'What\'s your age?',
      options: ageOptions,
      required: true
    },
    {
      id: 'contact',
      type: 'text',
      question: 'Email or phone for deals? (Optional)',
      placeholder: 'your@email.com or 1234567890',
      required: false
    }
  ];

  // Extended top cities for ticker effect
  const topCities = [
    { rank: 1, city: "Dallas", country: "US", countryCode: "US", visitors: "2.4K" },
    { rank: 2, city: "Tokyo", country: "JP", countryCode: "JP", visitors: "1.8K" },
    { rank: 3, city: "London", country: "UK", countryCode: "GB", visitors: "1.6K" },
    { rank: 4, city: "Paris", country: "FR", countryCode: "FR", visitors: "1.4K" },
    { rank: 5, city: "Sydney", country: "AU", countryCode: "AU", visitors: "1.2K" }
  ];

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const isPinAddedStep = currentStep === questions.length;
  
  // Validation logic
  const validateCurrentField = useCallback(() => {
    const value = formData[currentQuestion?.id];
    if (!value || !String(value).trim()) {
      return currentQuestion?.required ? false : true;
    }
    
    if (currentQuestion?.id === 'contact') {
      const trimmedValue = String(value).trim();
      if (trimmedValue === '') return true;
      
      if (trimmedValue.includes('@')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(trimmedValue);
      }
      
      const phoneRegex = /^\d{10}$/;
      return phoneRegex.test(trimmedValue.replace(/\D/g, ''));
    }
    
    if (currentQuestion?.id === 'age') {
      return !['', 'Select Age Range'].includes(value);
    }
    
    if (currentQuestion?.id === 'gender') {
      return !['', 'Select Gender'].includes(value);
    }
    
    return true;
  }, [currentQuestion, formData]);

  const canAdvance = validateCurrentField();

  const handleNext = useCallback(() => {
    if (!canAdvance) {
      setShowValidationError(true);
      return;
    }

    if (isLastStep) {
      onFormSubmit(formData);
      setCurrentStep(prev => prev + 1);
      
      setTimeout(() => {
        setCurrentStep(0);
        setFormData({});
        setShowKeyboard(false);
        setShowValidationError(false);
        if (selectedLocation) {
          onLocationSelect(null);
        }
      }, 3000);
    } else {
      setCurrentStep(prev => prev + 1);
      setShowValidationError(false);
      setShowKeyboard(false);
    }
  }, [currentStep, isLastStep, formData, onFormSubmit, onLocationSelect, canAdvance, selectedLocation]);

  // Calculate responsive styles
  const getResponsiveStyles = useCallback(() => {
    const { width, height } = containerSize;
    
    const baseWidth = 400;
    const baseHeight = 800;
    
    const widthScale = width / baseWidth;
    const heightScale = height / baseHeight;
    const averageScale = Math.min(widthScale, heightScale, 1.8); // Increased max scale from 1.4 to 1.8
    
    const fontScale = Math.max(1.0, Math.min(1.6, averageScale)); // Increased from 0.7-1.1 to 1.0-1.6
    const spacingScale = Math.max(0.8, Math.min(1.4, averageScale)); // Increased from 0.6-1.0 to 0.8-1.4
    
    return {
      titleFontSize: Math.round(36 * fontScale), // Increased from 28
      subtitleFontSize: Math.round(20 * fontScale), // Increased from 16
      questionFontSize: Math.round(24 * fontScale), // Increased from 18
      inputFontSize: Math.round(18 * fontScale), // Increased from 14
      buttonFontSize: Math.round(20 * fontScale), // Increased from 15
      selectFontSize: Math.round(20 * fontScale), // Increased from 16
      cityNameFontSize: Math.round(15 * fontScale), // Increased from 11
      visitorNameFontSize: Math.round(14 * fontScale), // Increased from 10
      
      containerPadding: Math.round(32 * spacingScale), // Increased from 24
      sectionMargin: Math.round(40 * spacingScale), // Increased from 24
      inputPadding: Math.round(18 * spacingScale), // Increased from 12
      buttonPadding: Math.round(18 * spacingScale), // Increased from 12
      
      dotSize: Math.round(12 * fontScale), // Increased from 8
      keyboardHeight: Math.round(220 * spacingScale), // Increased from 180
      
      maxContentWidth: Math.min(width - 16, 500), // Increased from 420
      isCompact: height < 700 || width < 350,
    };
  }, [containerSize]);

  const responsiveStyles = getResponsiveStyles();

  // Handle virtual keyboard input
  const handleKeyPress = useCallback((key) => {
    const currentValue = formData[currentQuestion?.id] || '';
    
    if (key === 'backspace') {
      const newValue = currentValue.slice(0, -1);
      if (currentQuestion?.id === 'location') {
        handleLocationInputChange(newValue);
      } else {
        setFormData(prev => ({ ...prev, [currentQuestion.id]: newValue }));
      }
    } else if (key === 'space') {
      const newValue = currentValue + ' ';
      if (currentQuestion?.id === 'location') {
        handleLocationInputChange(newValue);
      } else {
        setFormData(prev => ({ ...prev, [currentQuestion.id]: newValue }));
      }
    } else if (key === 'enter') {
      if (showSuggestions && selectedSuggestionIndex >= 0) {
        handleSuggestionSelect(locationSuggestions[selectedSuggestionIndex]);
      } else if (canAdvance) {
        handleNext();
      }
    } else if (key !== 'shift') {
      const char = isShiftPressed ? key.toUpperCase() : key.toLowerCase();
      const newValue = currentValue + char;
      if (currentQuestion?.id === 'location') {
        handleLocationInputChange(newValue);
      } else {
        setFormData(prev => ({ ...prev, [currentQuestion.id]: newValue }));
      }
    }
    
    if (key === 'shift') {
      setIsShiftPressed(prev => !prev);
    } else {
      setIsShiftPressed(false);
    }
  }, [currentQuestion, formData, isShiftPressed, handleLocationInputChange, handleNext, canAdvance, showSuggestions, selectedSuggestionIndex, handleSuggestionSelect, locationSuggestions]);

  // Handle input field changes
  const handleInputChange = useCallback((e) => {
    const { value } = e.target;
    setShowValidationError(false);
    
    if (currentQuestion?.id === 'location') {
      handleLocationInputChange(value);
    } else {
      setFormData(prev => ({ ...prev, [currentQuestion.id]: value }));
    }
  }, [currentQuestion, handleLocationInputChange]);

  // Handle input focus - show keyboard for text inputs
  const handleInputFocus = useCallback(() => {
    if (currentQuestion?.type === 'text' || currentQuestion?.type === 'location') {
      setShowKeyboard(true);
    }
  }, [currentQuestion]);

  // Handle select field changes
  const handleSelectChange = useCallback((e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, [currentQuestion.id]: value }));
    setShowValidationError(false);
    setShowKeyboard(false); // Hide keyboard for selects
    
    // Auto-advance after selection
    setTimeout(() => {
      if (value && !['', 'Select Age Range', 'Select Gender'].includes(value)) {
        handleNext();
      }
    }, 500);
  }, [currentQuestion, handleNext]);

  // Virtual keyboard component
  const renderKeyboard = () => {
    // Only show keyboard for text and location inputs
    if (!showKeyboard || currentQuestion?.type === 'select') return null;
    
    const keyboardRows = [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
      ['space', 'enter']
    ];

    return (
      <div style={getInlineKeyboardStyle(responsiveStyles)}>
        {keyboardRows.map((row, rowIndex) => (
          <div key={rowIndex} style={getKeyboardRowStyle()}>
            {row.map((key) => (
              <button
                key={key}
                style={getKeyboardKeyStyle(responsiveStyles, key)}
                onClick={() => handleKeyPress(key)}
              >
                {key === 'backspace' ? '⌫' : 
                 key === 'shift' ? '⇧' : 
                 key === 'space' ? '___' : 
                 key === 'enter' ? '↵' : 
                 isShiftPressed && key !== 'shift' ? key.toUpperCase() : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderCurrentStep = () => {
    if (isPinAddedStep) {
      return (
        <div style={getPinAddedStyle(responsiveStyles)}>
          <div style={getPinAddedIconStyle(responsiveStyles)}>📍</div>
          <div style={getPinAddedTitleStyle(responsiveStyles)}>Pin Added!</div>
          <div style={getPinAddedSubtitleStyle(responsiveStyles)}>Thank you for joining our community</div>
        </div>
      );
    }

    if (!currentQuestion) return null;

    return (
      <div style={getFormSectionStyle(responsiveStyles, currentQuestion.type, showKeyboard)}>
        <div style={getFormGroupStyle(responsiveStyles)}>
          <div style={getQuestionStyle(responsiveStyles)}>{currentQuestion.question}</div>
          
          {currentQuestion.type === 'location' && (
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                ref={inputRef}
                type="text"
                value={formData[currentQuestion.id] || ''}
                onChange={handleInputChange}
                placeholder={currentQuestion.placeholder}
                style={getLocationInputStyle(responsiveStyles)}
                onFocus={() => setShowKeyboard(true)}
              />
              
              {showSuggestions && locationSuggestions.length > 0 && (
                <div style={getSuggestionsStyle(responsiveStyles)}>
                  {locationSuggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.id}
                      style={{
                        ...getSuggestionItemStyle(responsiveStyles),
                        ...(index === selectedSuggestionIndex ? getSelectedSuggestionStyle() : {})
                      }}
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      {suggestion.name}
                    </div>
                  ))}
                </div>
              )}
              
              {renderKeyboard()}
            </div>
          )}
          
          {currentQuestion.type === 'text' && currentQuestion.id !== 'location' && (
            <div style={{ width: '100%' }}>
              <input
                type="text"
                value={formData[currentQuestion.id] || ''}
                onChange={handleInputChange}
                placeholder={currentQuestion.placeholder}
                style={getInputStyle(responsiveStyles)}
                onFocus={() => setShowKeyboard(true)}
              />
              {renderKeyboard()}
            </div>
          )}
          
          {currentQuestion.type === 'select' && (
            <select
              value={formData[currentQuestion.id] || ''}
              onChange={handleSelectChange}
              style={getSelectStyle(responsiveStyles)}
              size={currentQuestion.options.length}
            >
              {currentQuestion.options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          
          {showValidationError && !canAdvance && (
            <div style={getValidationErrorStyle(responsiveStyles)}>
              {currentQuestion.id === 'contact' 
                ? 'Please enter a valid email or 10-digit phone number'
                : currentQuestion.id === 'age'
                ? 'Please select your age range'
                : currentQuestion.id === 'gender'
                ? 'Please select your gender'
                : 'This field is required'}
            </div>
          )}
        </div>

        {currentQuestion.type !== 'select' && (
          <button
            onClick={handleNext}
            style={{
              ...getNextButtonStyle(responsiveStyles),
              ...(canAdvance ? {} : getDisabledButtonStyle())
            }}
            disabled={!canAdvance}
          >
            {isLastStep ? 'Add Pin' : 'Next'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} style={getContainerStyle(responsiveStyles)}>
      <div style={getScrollableContentStyle(responsiveStyles)}>
        <div style={getCenteredContentStyle(responsiveStyles, currentQuestion?.type, showKeyboard)}>
          
          {/* Header Section */}
          <div style={getHeaderStyle(responsiveStyles, showKeyboard && (currentQuestion?.type === 'text' || currentQuestion?.type === 'location'))}>
            <img 
              src="/src/assets/logo.png" 
              alt="Logo" 
              style={getLogoStyle(responsiveStyles)}
            />
            <p style={getSubtitleStyle(responsiveStyles)}>Pin your location and join our world</p>
          </div>

          {/* Progress Dots */}
          <div style={getProgressDotsStyle(responsiveStyles, currentQuestion?.type)}>
            {questions.map((_, index) => (
              <div
                key={index}
                style={{
                  ...getProgressDotStyle(responsiveStyles),
                  ...(index === currentStep ? getActiveDotStyle() : {}),
                  ...(index < currentStep ? getCompletedDotStyle() : {})
                }}
              />
            ))}
          </div>

          {/* Current Step */}
          {renderCurrentStep()}

        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes bounce {
          0%, 20%, 60%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          80% { transform: translateY(-5px); }
        }
        
        select option {
          background-color: #1a1a1a !important;
          color: white !important;
          padding: 12px !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
};

// STYLE FUNCTIONS

const getContainerStyle = (styles) => ({
  color: 'white',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
  borderRight: '1px solid rgba(255, 255, 255, 0.08)',
  overflow: 'hidden'
});

const getScrollableContentStyle = (styles) => ({
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  display: 'flex',
  justifyContent: 'center', // Center the content horizontally
  alignItems: 'stretch',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  paddingBottom: '50px' // Reduced padding since no ticker
});

const getCenteredContentStyle = (styles, currentQuestionType, showKeyboard) => {
  return {
    width: '100%',
    maxWidth: `${styles.maxContentWidth}px`,
    margin: '0 auto', // Center horizontally
    padding: `${Math.round(styles.containerPadding * 0.5)}px ${Math.round(styles.containerPadding * 0.3)}px`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center', // Center vertically
    minHeight: '100%'
  };
};

const getHeaderStyle = (styles, isCompactLayout) => ({
  textAlign: 'center',
  marginBottom: `${styles.sectionMargin}px`,
  width: '100%'
});

const getFormSectionStyle = (styles, questionType, showKeyboard) => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: `${styles.sectionMargin}px`, // Consistent margin
    flex: 'none' // Don't grow or shrink
  };
};

const getLogoStyle = (styles) => ({
  maxWidth: '160px', // Increased from 120px
  width: 'auto',
  height: 'auto',
  marginBottom: '12px', // Increased from 8px
  display: 'block',
  objectFit: 'contain',
  margin: '0 auto 12px auto' // Increased margin
});

const getTitleStyle = (styles) => ({
  fontSize: `${styles.titleFontSize}px`,
  fontWeight: '300',
  color: 'white',
  marginBottom: '8px',
  letterSpacing: '0.02em',
  textAlign: 'center'
});

const getSubtitleStyle = (styles) => ({
  fontSize: `${styles.subtitleFontSize}px`,
  color: 'rgba(255, 255, 255, 0.6)',
  marginBottom: 0,
  fontWeight: '200',
  textAlign: 'center'
});

const getProgressDotsStyle = (styles, questionType) => ({
  display: 'flex',
  gap: `${Math.round(8 * (styles.dotSize / 8))}px`,
  marginBottom: `${styles.sectionMargin}px`, // Consistent margin
  justifyContent: 'center',
  width: '100%'
});

const getProgressDotStyle = (styles) => ({
  width: `${styles.dotSize}px`,
  height: `${styles.dotSize}px`,
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.2)'
});

const getActiveDotStyle = () => ({
  background: '#f44336', // Changed to red
  transform: 'scale(1.2)'
});

const getCompletedDotStyle = () => ({
  background: '#ff7961' // Changed to light red
});

const getFormGroupStyle = (styles) => ({
  marginBottom: `${styles.inputPadding + 8}px`,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
});

const getQuestionStyle = (styles) => ({
  fontSize: `${styles.questionFontSize}px`,
  fontWeight: '400',
  color: 'white',
  marginBottom: `${styles.inputPadding}px`,
  letterSpacing: '-0.01em',
  textAlign: 'center',
  width: '100%'
});

const getInputStyle = (styles) => ({
  width: '100%',
  padding: `${styles.inputPadding}px ${styles.inputPadding + 2}px`,
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: `${Math.round(10 * (styles.inputPadding / 12))}px`,
  color: 'white',
  fontSize: `${styles.inputFontSize}px`,
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  textAlign: 'center',
  marginBottom: `${styles.inputPadding}px`
});

const getLocationInputStyle = (styles) => ({
  width: '100%',
  padding: `${styles.inputPadding}px ${styles.inputPadding + 2}px`,
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: `${Math.round(10 * (styles.inputPadding / 12))}px`,
  color: 'white',
  fontSize: `${styles.inputFontSize}px`,
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  textAlign: 'center',
  marginBottom: `${styles.inputPadding}px`
});

const getNextButtonStyle = (styles) => ({
  width: '100%',
  padding: `${styles.buttonPadding}px ${styles.buttonPadding + 4}px`,
  background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
  border: 'none',
  borderRadius: `${Math.round(10 * (styles.buttonPadding / 12))}px`,
  color: 'white',
  fontSize: `${styles.buttonFontSize}px`,
  fontWeight: '500',
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif"
});

const getDisabledButtonStyle = () => ({
  opacity: '0.4',
  cursor: 'not-allowed'
});

const getSelectStyle = (styles) => ({
  width: '100%',
  maxWidth: '350px', // Limit width for better centering
  padding: `${styles.inputPadding}px`,
  background: 'rgba(30, 30, 30, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: `${Math.round(10 * (styles.inputPadding / 12))}px`,
  color: 'white',
  fontSize: `${styles.selectFontSize}px`,
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: 'none',
  maxHeight: '250px', // Reasonable max height
  overflowY: 'auto',
  textAlign: 'center' // Center the text in options
});

const getSuggestionsStyle = (styles) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  background: 'rgba(20, 20, 20, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: `${Math.round(8 * (styles.inputPadding / 12))}px`,
  marginTop: '4px',
  zIndex: 1000,
  backdropFilter: 'blur(10px)',
  marginBottom: `${styles.inputPadding}px`
});

const getSuggestionItemStyle = (styles) => ({
  padding: `${styles.inputPadding - 2}px ${styles.inputPadding}px`,
  cursor: 'pointer',
  fontSize: `${styles.inputFontSize}px`,
  backgroundColor: 'transparent',
  color: 'white',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
});

const getSelectedSuggestionStyle = () => ({
  background: 'rgba(244, 67, 54, 0.2)', // Changed to red
  backgroundColor: 'rgba(244, 67, 54, 0.15)' // Changed to red
});

// Inline keyboard that appears below input - WIDER AND BIGGER
const getInlineKeyboardStyle = (styles) => ({
  width: '110%', // Wider than container
  maxWidth: '520px', // Increased from 480px
  background: 'rgba(15, 15, 15, 0.95)',
  borderRadius: `${Math.round(10 * (styles.inputPadding / 12))}px`, // Increased from 8
  padding: `8px`, // Increased from 4px
  marginTop: `${styles.inputPadding}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px', // Increased from 4px
  border: '1px solid rgba(255, 255, 255, 0.08)',
  marginLeft: '-5%', // Center the wider keyboard
  marginRight: '-5%'
});

const getKeyboardRowStyle = () => ({
  display: 'flex',
  gap: '6px', // Increased from 4px
  justifyContent: 'center',
  width: '100%'
});

const getKeyboardKeyStyle = (styles, key) => {
  const isSpecial = ['shift', 'backspace', 'space', 'enter'].includes(key);
  return {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '6px', // Increased from 4px
    color: 'white',
    cursor: 'pointer',
    fontSize: `${Math.round(styles.inputFontSize * 0.9)}px`, // Increased from 0.85
    padding: '8px', // Increased from 6px
    minWidth: isSpecial ? '60px' : '40px', // Increased from 50px/32px
    flex: key === 'space' ? 3 : isSpecial ? 1.5 : 1,
    fontWeight: isSpecial ? '500' : '400',
    outline: 'none',
    userSelect: 'none',
    touchAction: 'manipulation'
  };
};

// Stock ticker styles - Only for Top Cities
const getTickerContainerStyle = () => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: '58%',
  height: '40px', // Half height since only one ticker
  background: 'rgba(0, 0, 0, 0.95)',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  display: 'flex',
  flexDirection: 'column',
  animation: 'redGlow 2s ease-in-out infinite',
  zIndex: 999
});

const getTickerSectionStyle = () => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  overflow: 'hidden'
});

const getTickerLabelStyle = () => ({
  minWidth: '100px',
  padding: '0 12px',
  fontSize: '10px',
  fontWeight: '600',
  color: '#ff4444',
  textShadow: '0 0 8px rgba(244, 67, 54, 0.5)',
  borderRight: '1px solid rgba(255, 255, 255, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

const getTickerScrollStyle = () => ({
  flex: 1,
  overflow: 'hidden',
  position: 'relative'
});

const getTickerContentStyle = () => ({
  display: 'flex',
  animation: 'tickerScroll 20s linear infinite',
  whiteSpace: 'nowrap'
});

const getTickerItemStyle = () => ({
  display: 'flex',
  alignItems: 'center',
  padding: '0 20px',
  fontSize: '11px',
  color: 'white',
  minWidth: 'max-content'
});

const getTickerRankStyle = () => ({
  color: '#81d4fa',
  fontWeight: '600',
  marginRight: '6px'
});

const getTickerVisitorsStyle = () => ({
  color: '#81d4fa',
  marginLeft: '8px',
  fontWeight: '500'
});

const getTickerLocationStyle = () => ({
  color: '#81d4fa',
  marginLeft: '8px'
});

const getTickerTimeStyle = () => ({
  color: 'rgba(255, 255, 255, 0.6)',
  marginLeft: '8px',
  fontSize: '10px'
});

// Pin Added confirmation styles
const getPinAddedStyle = (styles) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: `${styles.sectionMargin}px 0`
});

const getPinAddedIconStyle = (styles) => ({
  fontSize: `${Math.round(styles.titleFontSize * 2)}px`,
  marginBottom: `${styles.inputPadding}px`,
  animation: 'bounce 1s ease-in-out'
});

const getPinAddedTitleStyle = (styles) => ({
  fontSize: `${Math.round(styles.titleFontSize * 1.2)}px`,
  fontWeight: '500',
  color: '#81d4fa',
  marginBottom: `${styles.inputPadding / 2}px`,
  letterSpacing: '0.02em'
});

const getPinAddedSubtitleStyle = (styles) => ({
  fontSize: `${styles.subtitleFontSize}px`,
  color: 'rgba(255, 255, 255, 0.7)',
  fontWeight: '300'
});

const getValidationErrorStyle = (styles) => ({
  fontSize: `${Math.round(styles.inputFontSize * 0.85)}px`,
  color: 'rgba(244, 67, 54, 0.8)',
  marginTop: `${Math.round(styles.inputPadding * 0.5)}px`,
  textAlign: 'center',
  fontWeight: '400'
});

export default FormFlow;
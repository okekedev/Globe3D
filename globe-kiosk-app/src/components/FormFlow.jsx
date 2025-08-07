// FormFlow.jsx - Enhanced with optimized styling for vertical layout (bottom panel)
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
  const [keyboardMode, setKeyboardMode] = useState('letters'); // 'letters' or 'numbers'
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Get Mapbox token from environment
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

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

  // Gender options for side-by-side buttons
  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' }
  ];

  // Questions array - STATIC DEFINITION
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
      type: 'gender-buttons',
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
      type: 'contact',
      question: 'Contact for deals? (Optional)',
      placeholder: 'your@email.com or phone',
      required: false
    }
  ];

  // Email domain suggestions
  const emailDomains = ['@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com', '@icloud.com'];

  // Current question - SAFE TO ACCESS NOW
  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const isPinAddedStep = currentStep === questions.length;

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
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&types=place,locality,neighborhood&limit=2&autocomplete=true`
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
        
        setLocationSuggestions(suggestions.slice(0, 2)); // Only show 2 suggestions
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

  // Handle email domain suggestion
  const handleEmailDomainSelect = useCallback((domain) => {
    if (!currentQuestion) return;
    const currentValue = formData[currentQuestion.id] || '';
    const atIndex = currentValue.indexOf('@');
    const baseEmail = atIndex > -1 ? currentValue.substring(0, atIndex) : currentValue;
    const newValue = baseEmail + domain;
    setFormData(prev => ({ ...prev, [currentQuestion.id]: newValue }));
  }, [formData, currentQuestion]);

  // Handle reset requests from App when Globe timeout occurs
  useEffect(() => {
    if (resetTrigger > 0) {
      setCurrentStep(0);
      setFormData({});
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      setShowKeyboard(false);
      setShowValidationError(false);
      setKeyboardMode('letters');
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

  // Validation logic
  const validateCurrentField = useCallback(() => {
    const value = formData[currentQuestion?.id];
    if (!value || !String(value).trim()) {
      return currentQuestion?.required ? false : true;
    }
    
    if (currentQuestion?.id === 'contact') {
      const trimmedValue = String(value).trim();
      if (trimmedValue === '') return true; // Optional field
      
      // Check if it's an email (contains @) or phone (all digits)
      if (trimmedValue.includes('@')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(trimmedValue);
      } else {
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(trimmedValue.replace(/\D/g, ''));
      }
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
        setKeyboardMode('letters');
        if (selectedLocation) {
          onLocationSelect(null);
        }
      }, 3000);
    } else {
      setCurrentStep(prev => prev + 1);
      setShowValidationError(false);
      setShowKeyboard(false);
      setKeyboardMode('letters');
    }
  }, [currentStep, isLastStep, formData, onFormSubmit, onLocationSelect, canAdvance, selectedLocation]);

  // Calculate responsive styles - OPTIMIZED FOR VERTICAL BOTTOM LAYOUT
  const getResponsiveStyles = useCallback(() => {
    const { width, height } = containerSize;
    
    // Adjusted for bottom panel layout
    const baseWidth = 400;
    const baseHeight = 400; // Reduced from 800 since we're in bottom panel now
    
    const widthScale = width / baseWidth;
    const heightScale = height / baseHeight;
    const averageScale = Math.min(widthScale, heightScale, 1.4); // Reduced max scale for compact layout
    
    const fontScale = Math.max(0.8, Math.min(1.3, averageScale)); // Adjusted range for bottom panel
    const spacingScale = Math.max(0.6, Math.min(1.1, averageScale)); // Tighter spacing for vertical layout
    
    return {
      titleFontSize: Math.round(28 * fontScale), // Reduced from 36 for compact layout
      subtitleFontSize: Math.round(16 * fontScale), // Reduced from 20
      questionFontSize: Math.round(20 * fontScale), // Reduced from 24
      inputFontSize: Math.round(16 * fontScale), // Reduced from 18
      buttonFontSize: Math.round(18 * fontScale), // Reduced from 20
      selectFontSize: Math.round(18 * fontScale), // Reduced from 20
      cityNameFontSize: Math.round(13 * fontScale), // Reduced from 15
      visitorNameFontSize: Math.round(12 * fontScale), // Reduced from 14
      
      containerPadding: Math.round(20 * spacingScale), // Reduced from 32 for tighter layout
      sectionMargin: Math.round(20 * spacingScale), // Reduced from 40
      inputPadding: Math.round(12 * spacingScale), // Reduced from 18
      buttonPadding: Math.round(12 * spacingScale), // Reduced from 18
      
      dotSize: Math.round(8 * fontScale), // Reduced from 12 for compact layout
      keyboardHeight: Math.round(160 * spacingScale), // Reduced from 220 for less space
      
      maxContentWidth: Math.min(width - 16, 420), // Reasonable max width
      isCompact: height < 500 || width < 350, // Adjusted threshold for bottom panel
    };
  }, [containerSize]);

  const responsiveStyles = getResponsiveStyles();

  // Handle virtual keyboard input
  const handleKeyPress = useCallback((key) => {
    if (!currentQuestion) return;
    
    const currentValue = formData[currentQuestion.id] || '';
    
    if (key === 'backspace') {
      const newValue = currentValue.slice(0, -1);
      if (currentQuestion.id === 'location') {
        handleLocationInputChange(newValue);
      } else {
        setFormData(prev => ({ ...prev, [currentQuestion.id]: newValue }));
      }
    } else if (key === 'space') {
      const newValue = currentValue + ' ';
      if (currentQuestion.id === 'location') {
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
    } else if (key === '123') {
      setKeyboardMode('numbers');
      setIsShiftPressed(false);
    } else if (key === 'ABC') {
      setKeyboardMode('letters');
      setIsShiftPressed(false);
    } else if (key.startsWith('@')) {
      // Handle email domain suggestions
      handleEmailDomainSelect(key);
    } else if (key !== 'shift') {
      const char = (isShiftPressed && keyboardMode === 'letters') ? key.toUpperCase() : key;
      const newValue = currentValue + char;
      if (currentQuestion.id === 'location') {
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
  }, [currentQuestion, formData, isShiftPressed, keyboardMode, handleLocationInputChange, handleNext, canAdvance, showSuggestions, selectedSuggestionIndex, handleSuggestionSelect, locationSuggestions, handleEmailDomainSelect]);

  // Handle input field changes
  const handleInputChange = useCallback((e) => {
    if (!currentQuestion) return;
    
    const { value } = e.target;
    setShowValidationError(false);
    
    if (currentQuestion.id === 'location') {
      handleLocationInputChange(value);
    } else {
      setFormData(prev => ({ ...prev, [currentQuestion.id]: value }));
    }
  }, [currentQuestion, handleLocationInputChange]);

  // Handle input focus - show keyboard for text inputs
  const handleInputFocus = useCallback(() => {
    if (!currentQuestion) return;
    
    if (currentQuestion.type === 'text' || currentQuestion.type === 'location' || currentQuestion.type === 'contact') {
      setShowKeyboard(true);
    }
  }, [currentQuestion]);

  // Handle select field changes (for age dropdown)
  const handleSelectChange = useCallback((e) => {
    if (!currentQuestion) return;
    
    const { value } = e.target;
    setFormData(prev => ({ ...prev, [currentQuestion.id]: value }));
    setShowValidationError(false);
    setShowKeyboard(false); // Hide keyboard for selects
    
    // Auto-advance immediately for any valid selection
    if (value && value !== '' && value !== 'Select Age Range') {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setShowValidationError(false);
        setShowKeyboard(false);
      }, 200);
    }
  }, [currentQuestion]);

  // Virtual keyboard component with toggle
  const renderKeyboard = () => {
    // Only show keyboard for text and location inputs
    if (!showKeyboard || !currentQuestion || currentQuestion.type === 'select' || currentQuestion.type === 'gender-buttons') return null;
    
    const letterRows = [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
      ['123', 'space', 'enter']
    ];

    const numberRows = [
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
      ['@', '#', '$', '_', '&', '-', '+', '(', ')', '/'],
      ['@gmail.com', '@yahoo.com', '.com'],
      ['ABC', 'space', 'backspace', 'enter']
    ];

    const currentRows = keyboardMode === 'letters' ? letterRows : numberRows;

    return (
      <div style={getInlineKeyboardStyle(responsiveStyles)}>
        {currentRows.map((row, rowIndex) => (
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
                 key === '123' ? '123' :
                 key === 'ABC' ? 'ABC' :
                 key.startsWith('@') ? key : // Email domains show as-is
                 (isShiftPressed && key !== 'shift' && keyboardMode === 'letters') ? key.toUpperCase() : key}
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
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', width: '100%' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={formData[currentQuestion.id] || ''}
                  onChange={handleInputChange}
                  placeholder={currentQuestion.placeholder}
                  style={{ ...getLocationInputStyle(responsiveStyles), flex: 1, marginBottom: 0 }}
                  onFocus={() => setShowKeyboard(true)}
                />
                
                <button
                  onClick={handleNext}
                  style={{
                    ...getNextButtonStyle(responsiveStyles),
                    ...(canAdvance ? {} : getDisabledButtonStyle()),
                    width: 'auto',
                    minWidth: '80px',
                    flex: 'none'
                  }}
                  disabled={!canAdvance}
                >
                  {isLastStep ? 'Add Pin' : 'Next'}
                </button>
              </div>
              
              {renderKeyboard()}
            </div>
          )}

          {currentQuestion.type === 'text' && (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', width: '100%' }}>
                <input
                  type="text"
                  value={formData[currentQuestion.id] || ''}
                  onChange={handleInputChange}
                  placeholder={currentQuestion.placeholder}
                  style={{ ...getInputStyle(responsiveStyles), flex: 1, marginBottom: 0 }}
                  onFocus={() => setShowKeyboard(true)}
                />
                
                <button
                  onClick={handleNext}
                  style={{
                    ...getNextButtonStyle(responsiveStyles),
                    ...(canAdvance ? {} : getDisabledButtonStyle()),
                    width: 'auto',
                    minWidth: '80px',
                    flex: 'none'
                  }}
                  disabled={!canAdvance}
                >
                  {isLastStep ? 'Add Pin' : 'Next'}
                </button>
              </div>
              {renderKeyboard()}
            </div>
          )}

          {currentQuestion.type === 'contact' && (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', width: '100%' }}>
                <input
                  type="text"
                  value={formData[currentQuestion.id] || ''}
                  onChange={handleInputChange}
                  placeholder={currentQuestion.placeholder}
                  style={{ ...getInputStyle(responsiveStyles), flex: 1, marginBottom: 0 }}
                  onFocus={() => setShowKeyboard(true)}
                />
                
                <button
                  onClick={handleNext}
                  style={{
                    ...getNextButtonStyle(responsiveStyles),
                    ...(canAdvance ? {} : getDisabledButtonStyle()),
                    width: 'auto',
                    minWidth: '80px',
                    flex: 'none'
                  }}
                  disabled={!canAdvance}
                >
                  {isLastStep ? 'Add Pin' : 'Next'}
                </button>
              </div>
              {renderKeyboard()}
            </div>
          )}
          
          {currentQuestion.type === 'gender-buttons' && (
            <div style={getGenderButtonsContainerStyle(responsiveStyles)}>
              {currentQuestion.options.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, [currentQuestion.id]: option.value }));
                    setShowValidationError(false);
                    // Auto-advance immediately after selection
                    setTimeout(() => {
                      setCurrentStep(prev => prev + 1);
                      setShowValidationError(false);
                      setShowKeyboard(false);
                    }, 200);
                  }}
                  style={{
                    ...getGenderButtonStyle(responsiveStyles),
                    ...(formData[currentQuestion.id] === option.value ? getSelectedGenderButtonStyle() : {})
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          
          {currentQuestion.type === 'select' && (
            <select
              value={formData[currentQuestion.id] || ''}
              onChange={handleSelectChange}
              style={getSelectStyle(responsiveStyles)}
            >
              {currentQuestion.options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {currentQuestion.type !== 'select' && currentQuestion.type !== 'gender-buttons' && showValidationError && !canAdvance && (
          <div style={getValidationErrorStyle(responsiveStyles)}>
            {currentQuestion.id === 'contact' 
              ? 'Please enter a valid email or 10-digit phone number'
              : 'This field is required'}
          </div>
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

// STYLE FUNCTIONS - OPTIMIZED FOR VERTICAL BOTTOM PANEL LAYOUT

const getContainerStyle = (styles) => ({
  color: 'white',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)', // Changed from borderRight to borderTop
  overflow: 'hidden'
});

const getScrollableContentStyle = (styles) => ({
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'stretch',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  paddingBottom: '8px' // Further reduced to ensure keyboard fits
});

const getCenteredContentStyle = (styles, currentQuestionType, showKeyboard) => {
  return {
    width: '100%',
    maxWidth: `${styles.maxContentWidth}px`,
    margin: '0 auto',
    padding: `${Math.round(styles.containerPadding * 0.4)}px ${Math.round(styles.containerPadding * 0.4)}px`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: showKeyboard ? 'flex-start' : 'center', // When keyboard shows, align to top so logo slides up
    minHeight: '100%',
    paddingTop: showKeyboard ? '8px' : `${Math.round(styles.containerPadding * 0.4)}px` // Less top padding when keyboard is visible
  };
};

const getHeaderStyle = (styles, isCompactLayout) => ({
  textAlign: 'center',
  marginBottom: `${Math.round(styles.sectionMargin * (isCompactLayout ? 0.3 : 0.6))}px`, // Much smaller margin when keyboard is visible
  width: '100%',
  transition: 'all 0.3s ease' // Smooth transition when keyboard appears/disappears
});

const getFormSectionStyle = (styles, questionType, showKeyboard) => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: `${Math.round(styles.sectionMargin * 0.8)}px`, // Reduced margin
    flex: 'none' // Don't grow or shrink
  };
};

const getLogoStyle = (styles) => ({
  maxWidth: '60px', // Much smaller logo
  width: 'auto',
  height: 'auto',
  marginBottom: '4px', // Minimal margin
  display: 'block',
  objectFit: 'contain',
  margin: '0 auto 4px auto'
});

const getSubtitleStyle = (styles) => ({
  fontSize: `${Math.round(styles.subtitleFontSize * 0.9)}px`, // Slightly smaller
  color: 'rgba(255, 255, 255, 0.6)',
  marginBottom: 0,
  fontWeight: '200',
  textAlign: 'center'
});

const getProgressDotsStyle = (styles, questionType) => ({
  display: 'flex',
  gap: `${Math.round(6 * (styles.dotSize / 8))}px`, // Tighter spacing
  marginBottom: `${Math.round(styles.sectionMargin * 0.6)}px`, // Reduced margin
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
  marginBottom: `${Math.round(styles.inputPadding * 0.6)}px`, // Reduced spacing
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
});

const getQuestionStyle = (styles) => ({
  fontSize: `${Math.round(styles.questionFontSize * 0.85)}px`, // Made smaller (15% reduction)
  fontWeight: '400',
  color: 'white',
  marginBottom: `${Math.round(styles.inputPadding * 0.8)}px`, // Reduced margin
  letterSpacing: '-0.01em',
  textAlign: 'center',
  width: '100%'
});

const getInputStyle = (styles) => ({
  width: '100%',
  padding: `${Math.round(styles.inputPadding * 0.8)}px ${styles.inputPadding + 2}px`, // Reduced vertical padding
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: `${Math.round(8 * (styles.inputPadding / 12))}px`, // Slightly smaller radius
  color: 'white',
  fontSize: `${styles.inputFontSize}px`,
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  textAlign: 'center',
  marginBottom: `${Math.round(styles.inputPadding * 0.6)}px` // Reduced margin
});

const getLocationInputStyle = (styles) => ({
  width: '100%',
  padding: `${Math.round(styles.inputPadding * 0.8)}px ${styles.inputPadding + 2}px`, // Reduced vertical padding
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: `${Math.round(8 * (styles.inputPadding / 12))}px`, // Slightly smaller radius
  color: 'white',
  fontSize: `${styles.inputFontSize}px`,
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  textAlign: 'center',
  marginBottom: `${Math.round(styles.inputPadding * 0.6)}px` // Reduced margin
});

const getNextButtonStyle = (styles) => ({
  width: '100%',
  padding: `${Math.round(styles.buttonPadding * 0.8)}px ${styles.buttonPadding + 4}px`, // Reduced vertical padding
  background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
  border: 'none',
  borderRadius: `${Math.round(8 * (styles.buttonPadding / 12))}px`, // Slightly smaller radius
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
  maxWidth: '300px', // Reduced from 350px for compact layout
  padding: `${Math.round(styles.inputPadding * 0.8)}px`, // Reduced padding
  background: 'rgba(30, 30, 30, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: `${Math.round(8 * (styles.inputPadding / 12))}px`, // Smaller radius
  color: 'white',
  fontSize: `${styles.selectFontSize}px`,
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: 'none',
  maxHeight: 'none', // Removed height restriction
  overflowY: 'visible', // No scrollbar needed
  textAlign: 'center'
});

const getSuggestionsStyle = (styles) => ({
  position: 'absolute',
  bottom: '100%', // Appears above input
  left: 0,
  right: 0,
  background: 'rgba(20, 20, 20, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: `${Math.round(6 * (styles.inputPadding / 12))}px`,
  marginBottom: '4px',
  zIndex: 1000,
  backdropFilter: 'blur(10px)'
});

const getSuggestionItemStyle = (styles) => ({
  padding: `${Math.round(styles.inputPadding * 0.6)}px ${styles.inputPadding}px`,
  cursor: 'pointer',
  fontSize: `${Math.round(styles.inputFontSize * 0.9)}px`,
  backgroundColor: 'transparent',
  color: 'white',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
});

const getSelectedSuggestionStyle = () => ({
  background: 'rgba(244, 67, 54, 0.2)',
  backgroundColor: 'rgba(244, 67, 54, 0.15)'
});

// Inline keyboard - ULTRA COMPACT VERTICALLY TO FIT IN BOTTOM PANEL
const getInlineKeyboardStyle = (styles) => ({
  width: '100%',
  maxWidth: '420px',
  background: 'rgba(15, 15, 15, 0.95)',
  borderRadius: `4px`,
  padding: `1px`,
  marginTop: `4px`,
  display: 'flex',
  flexDirection: 'column',
  gap: '1px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  marginLeft: '0',
  marginRight: '0',
  marginBottom: '4px'
});

const getKeyboardRowStyle = () => ({
  display: 'flex',
  gap: '2px',
  justifyContent: 'center',
  width: '100%'
});

const getKeyboardKeyStyle = (styles, key) => {
  const isSpecial = ['shift', 'backspace', 'space', 'enter', '123', 'ABC'].includes(key);
  const isEmailDomain = key.startsWith('@');
  
  return {
    background: isEmailDomain ? 'rgba(129, 212, 250, 0.1)' : 'rgba(255, 255, 255, 0.08)',
    border: isEmailDomain ? '1px solid rgba(129, 212, 250, 0.3)' : '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '2px',
    color: isEmailDomain ? '#81d4fa' : 'white',
    cursor: 'pointer',
    fontSize: `${Math.round(styles.inputFontSize * (isEmailDomain ? 0.55 : 0.65))}px`,
    padding: '2px',
    minWidth: isSpecial ? '55px' : isEmailDomain ? '70px' : '32px',
    height: '20px',
    flex: key === 'space' ? 3 : isSpecial ? 1.5 : isEmailDomain ? 1.2 : 1,
    fontWeight: isSpecial ? '500' : '400',
    outline: 'none',
    userSelect: 'none',
    touchAction: 'manipulation',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };
};

// Gender button styles
const getGenderButtonsContainerStyle = (styles) => ({
  display: 'flex',
  gap: '12px',
  width: '100%',
  maxWidth: '300px',
  justifyContent: 'center'
});

const getGenderButtonStyle = (styles) => ({
  flex: 1,
  padding: `${Math.round(styles.buttonPadding * 0.8)}px ${styles.buttonPadding}px`,
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: `${Math.round(8 * (styles.buttonPadding / 12))}px`,
  color: 'white',
  fontSize: `${styles.buttonFontSize}px`,
  fontWeight: '400',
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
  transition: 'all 0.2s ease',
  textAlign: 'center'
});

const getSelectedGenderButtonStyle = () => ({
  background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
  borderColor: '#f44336',
  fontWeight: '500',
  transform: 'scale(1.02)'
});

// Pin Added confirmation styles
const getPinAddedStyle = (styles) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: `${Math.round(styles.sectionMargin * 0.8)}px 0`
});

const getPinAddedIconStyle = (styles) => ({
  fontSize: `${Math.round(styles.titleFontSize * 1.5)}px`,
  marginBottom: `${Math.round(styles.inputPadding * 0.8)}px`,
  animation: 'bounce 1s ease-in-out'
});

const getPinAddedTitleStyle = (styles) => ({
  fontSize: `${Math.round(styles.titleFontSize * 1.1)}px`,
  fontWeight: '500',
  color: '#81d4fa',
  marginBottom: `${Math.round(styles.inputPadding * 0.4)}px`,
  letterSpacing: '0.02em'
});

const getPinAddedSubtitleStyle = (styles) => ({
  fontSize: `${Math.round(styles.subtitleFontSize * 0.9)}px`,
  color: 'rgba(255, 255, 255, 0.7)',
  fontWeight: '300'
});

const getValidationErrorStyle = (styles) => ({
  fontSize: `${Math.round(styles.inputFontSize * 0.8)}px`,
  color: 'rgba(244, 67, 54, 0.8)',
  marginTop: `${Math.round(styles.inputPadding * 0.4)}px`,
  textAlign: 'center',
  fontWeight: '400'
});

export default FormFlow;
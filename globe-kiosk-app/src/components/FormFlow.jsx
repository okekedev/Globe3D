// FormFlow.jsx - Updated to use dynamic metrics from pin data
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactCountryFlag from 'react-country-flag';

const FormFlow = ({ onFormSubmit, onLocationSelect, selectedLocation, resetTrigger, metricsData }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(true); // Always show keyboard
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [inactivityTimer, setInactivityTimer] = useState(null);
  const [showValidationError, setShowValidationError] = useState(false);
  const [shouldAutoAdvance, setShouldAutoAdvance] = useState(false); // Fix for circular dependency
  
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
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&types=place,locality,neighborhood&limit=5&autocomplete=true`
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
        
        setLocationSuggestions(suggestions);
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
    setShowValidationError(false); // Reset validation error when user types
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Handle suggestion selection - immediate navigation, slow background zoom
  const handleSuggestionSelect = useCallback((suggestion) => {
    setFormData(prev => ({ ...prev, location: suggestion.name }));
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    
    // Send location data to parent for slow 30-second zoom animation
    const locationData = {
      name: suggestion.name,
      shortName: suggestion.shortName,
      lat: suggestion.coordinates[1],
      lng: suggestion.coordinates[0],
      bbox: suggestion.bbox
    };
    onLocationSelect(locationData);
    
    // Immediately advance to next step - user continues form while zoom happens
    setCurrentStep(prev => prev + 1);
  }, [onLocationSelect]);

  // Handle keyboard navigation in suggestions
  const handleKeyDown = useCallback((e) => {
    if (!showSuggestions || locationSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < locationSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : locationSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionSelect(locationSuggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        setShowKeyboard(false);
        break;
    }
  }, [showSuggestions, locationSuggestions, selectedSuggestionIndex, handleSuggestionSelect]);

  // Inactivity timer - 40 seconds
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    
    const timer = setTimeout(() => {
      console.log('⏰ FormFlow 40-second inactivity timeout reached');
      // Reset form state
      setCurrentStep(0);
      setFormData({});
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      setIsShiftPressed(false);
      setShowValidationError(false);
      setShowKeyboard(true);
      setShouldAutoAdvance(false);
      // Reset location view
      if (selectedLocation) {
        onLocationSelect(null);
      }
    }, 40000); // 40 seconds
    
    setInactivityTimer(timer);
  }, [inactivityTimer, selectedLocation, onLocationSelect]);

  // Handle reset requests from App when Globe timeout occurs
  useEffect(() => {
    if (resetTrigger > 0) {
      console.log('🔄 FormFlow received reset trigger from App');
      // Reset all form state
      setCurrentStep(0);
      setFormData({});
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      setIsShiftPressed(false);
      setShowValidationError(false);
      setShowKeyboard(true);
      setShouldAutoAdvance(false);
    }
  }, [resetTrigger]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [inactivityTimer]);

  // Add event listeners for user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      resetInactivityTimer();
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keypress', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keypress', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [resetInactivityTimer]);
  
  // Track container size for responsiveness
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Generate age options 1-99
  const ageOptions = Array.from({ length: 99 }, (_, i) => i + 1);

  // Gender options
  const genderOptions = ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'];

  // Simplified form questions with gender after name
  const questions = [
    {
      id: 'location',
      type: 'autocomplete',
      question: 'Pick a place',
      placeholder: 'Type your city...',
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

  // NEW: Use dynamic metrics data from KioskGlobe, with fallback to static data
  const topCities = metricsData?.topCities || [
    { rank: 1, city: "Dallas", country: "US", countryCode: "US", visitors: "2.4K" },
    { rank: 2, city: "Tokyo", country: "JP", countryCode: "JP", visitors: "1.8K" },
    { rank: 3, city: "London", country: "UK", countryCode: "GB", visitors: "1.6K" }
  ];

  // NEW: Use dynamic recent visitors data  
  const recentVisitors = metricsData?.recentVisitors || [
    { name: "Sarah M.", city: "Paris", countryCode: "FR", time: "2m" },
    { name: "Alex K.", city: "Berlin", countryCode: "DE", time: "5m" },
    { name: "Maria L.", city: "São Paulo", countryCode: "BR", time: "8m" }
  ];

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const isPinAddedStep = currentStep === questions.length; // Step after last question
  
  // Validation logic
  const validateCurrentField = useCallback(() => {
    const value = formData[currentQuestion?.id];
    if (!value || !String(value).trim()) {
      return currentQuestion?.required ? false : true; // Optional fields can be empty
    }
    
    // Special validation for contact field (email/phone)
    if (currentQuestion?.id === 'contact') {
      const trimmedValue = String(value).trim();
      if (trimmedValue === '') return true; // Optional field can be empty
      
      // Check if it's an email (contains @)
      if (trimmedValue.includes('@')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(trimmedValue);
      }
      
      // Check if it's a phone number (10 digits)
      const phoneRegex = /^\d{10}$/;
      return phoneRegex.test(trimmedValue.replace(/\D/g, ''));
    }
    
    // Age validation - now just check if value exists since it's a dropdown
    if (currentQuestion?.id === 'age') {
      return !!value; // Just need a selection
    }
    
    return true;
  }, [formData, currentQuestion]);
  
  const canAdvance = validateCurrentField();

  // FIXED: handleInputChange without circular dependency
  const handleInputChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, [currentQuestion.id]: value }));
    setShowValidationError(false); // Reset validation error when user types
    
    // AUTO-ADVANCE: For dropdown selections (gender, age), automatically advance
    if (currentQuestion.type === 'select' && value) {
      console.log('🚀 Triggering auto-advance for dropdown selection:', currentQuestion.id, '=', value);
      setTimeout(() => {
        setShouldAutoAdvance(true);
      }, 500); // Small delay for better UX
    }
  }, [currentQuestion]);

  const handleInputFocus = useCallback(() => {
    // No-op for touch screens - no focus highlighting needed
  }, []);

  const handleNext = useCallback(() => {
    resetInactivityTimer();
    
    // Check validation before proceeding
    if (!canAdvance) {
      setShowValidationError(true); // Show error only when user tries to submit
      return;
    }
    
    if (isLastStep) {
      const completeData = { ...formData, timestamp: new Date().toISOString() };
      onFormSubmit(completeData);
      
      // Show "Pin Added" step
      setCurrentStep(questions.length); // Go beyond last question to show confirmation
      
      // Reset after showing pin added message
      setTimeout(() => {
        setCurrentStep(0);
        setFormData({});
        setShowKeyboard(true); // Ensure keyboard reappears
        setShowValidationError(false);
        // Only reset location if there was one selected
        if (selectedLocation) {
          onLocationSelect(null); // Reset view
        }
      }, 3000); // 3 seconds to show "Pin Added"
    } else {
      setCurrentStep(prev => prev + 1);
      setShowValidationError(false); // Reset validation error on successful advance
    }
  }, [currentStep, isLastStep, formData, onFormSubmit, onLocationSelect, resetInactivityTimer, questions.length, canAdvance, selectedLocation]);

  // NEW: Auto-advance effect to handle dropdown selections
  useEffect(() => {
    if (shouldAutoAdvance) {
      setShouldAutoAdvance(false);
      handleNext();
    }
  }, [shouldAutoAdvance, handleNext]);

  const handleCityClick = useCallback((city) => {
    const location = {
      name: `${city.city}, ${city.country}`,
      lat: 0,
      lng: 0,
      visitors: city.visitors,
      flag: city.flag
    };
    onLocationSelect(location);
  }, [onLocationSelect]);

  // Calculate responsive styles - UPDATED FOR BETTER CENTRALIZATION
  const getResponsiveStyles = useCallback(() => {
    const { width, height } = containerSize;
    
    const baseWidth = 400;
    const baseHeight = 800;
    
    const widthScale = width / baseWidth;
    const heightScale = height / baseHeight;
    const averageScale = Math.min(widthScale, heightScale, 1.4);
    
    const fontScale = Math.max(0.7, Math.min(1.1, averageScale));
    const spacingScale = Math.max(0.6, Math.min(1.0, averageScale));
    
    return {
      titleFontSize: Math.round(28 * fontScale),
      subtitleFontSize: Math.round(16 * fontScale),
      questionFontSize: Math.round(18 * fontScale),
      inputFontSize: Math.round(14 * fontScale),
      buttonFontSize: Math.round(15 * fontScale),
      selectFontSize: Math.round(16 * fontScale), // INCREASED: Larger font for age dropdown
      cityNameFontSize: Math.round(12 * fontScale),
      visitorNameFontSize: Math.round(11 * fontScale),
      
      containerPadding: Math.round(32 * spacingScale),
      sectionMargin: Math.round(32 * spacingScale),
      inputPadding: Math.round(14 * spacingScale),
      buttonPadding: Math.round(14 * spacingScale),
      
      dotSize: Math.round(8 * fontScale),
      keyboardHeight: Math.round(240 * spacingScale),
      
      // Centralization settings
      maxContentWidth: Math.min(width - 24, 420), // Even wider content, minimal outer margin
      isCompact: height < 700 || width < 350,
    };
  }, [containerSize]);

  const responsiveStyles = getResponsiveStyles();

  // Handle virtual keyboard input - auto-type in location field
  const handleKeyPress = useCallback((key) => {
    resetInactivityTimer();
    
    // If not on location step, auto-switch to location and type there
    if (currentQuestion?.id !== 'location') {
      if (key !== 'backspace' && key !== 'space' && key !== 'shift' && key !== 'enter') {
        setCurrentStep(0); // Go to location step
        setTimeout(() => {
          const char = isShiftPressed ? key.toUpperCase() : key.toLowerCase();
          setFormData(prev => ({ ...prev, location: char }));
          handleLocationInputChange(char);
        }, 100);
        return;
      }
    }
    
    const targetField = currentQuestion?.id === 'location' ? 'location' : currentQuestion?.id;
    const currentValue = formData[targetField] || '';
    let newValue = currentValue;

    switch (key) {
      case 'backspace':
        newValue = currentValue.slice(0, -1);
        break;
      case 'space':
        newValue = currentValue + ' ';
        break;
      case 'shift':
        setIsShiftPressed(prev => !prev);
        return;
      case 'enter':
        if (currentQuestion?.type === 'autocomplete' && selectedSuggestionIndex >= 0) {
          handleSuggestionSelect(locationSuggestions[selectedSuggestionIndex]);
        }
        return;
      default:
        const char = isShiftPressed ? key.toUpperCase() : key.toLowerCase();
        newValue = currentValue + char;
        setIsShiftPressed(false);
        break;
    }

    if (targetField === 'location') {
      handleLocationInputChange(newValue);
    } else {
      setFormData(prev => ({ ...prev, [targetField]: newValue }));
    }
  }, [formData, currentQuestion, selectedSuggestionIndex, locationSuggestions, handleSuggestionSelect, handleLocationInputChange, isShiftPressed, resetInactivityTimer]);

  // Virtual keyboard layout
  const keyboardRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
    ['space', 'enter']
  ];

  const getKeyLabel = (key, shift) => {
    switch (key) {
      case 'backspace': return '⌫';
      case 'shift': return '⇧';
      case 'space': return '______';
      case 'enter': return '↵';
      default: return shift ? key.toUpperCase() : key;
    }
  };

  const renderKeyboard = () => {
    if (!showKeyboard) return null;

    return (
      <div style={getKeyboardStyle(responsiveStyles)}>
        {keyboardRows.map((row, rowIndex) => (
          <div key={rowIndex} style={getKeyboardRowStyle(responsiveStyles)}>
            {row.map((key) => (
              <button
                key={key}
                style={{
                  ...getKeyboardKeyStyle(responsiveStyles, key),
                  ...(key === 'shift' && isShiftPressed ? getKeyboardKeyActiveStyle() : {})
                }}
                onClick={() => handleKeyPress(key)}
              >
                {getKeyLabel(key, isShiftPressed)}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderInput = () => {
    switch (currentQuestion.type) {
      case 'autocomplete':
        return (
          <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <input
              ref={inputRef}
              type="text"
              placeholder={currentQuestion.placeholder}
              value={formData[currentQuestion.id] || ''}
              onChange={(e) => handleLocationInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              autoFocus
              style={{
                ...getLocationInputStyle(responsiveStyles),
                paddingTop: `${responsiveStyles.inputPadding}px`,
                paddingBottom: `${responsiveStyles.inputPadding}px`,
                paddingLeft: `${responsiveStyles.inputPadding + 2}px`,
                paddingRight: isLoadingSuggestions ? 
                  `${responsiveStyles.inputPadding + 30}px` : `${responsiveStyles.inputPadding + 2}px`
              }}
            />
            
            {isLoadingSuggestions && (
              <div style={{
                position: 'absolute',
                right: `${responsiveStyles.inputPadding}px`,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            
            {showSuggestions && locationSuggestions.length > 0 && (
              <div style={getSuggestionsStyle(responsiveStyles, showKeyboard, responsiveStyles.keyboardHeight)}>
                {locationSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    style={{
                      ...getSuggestionItemStyle(responsiveStyles),
                      ...(index === selectedSuggestionIndex ? getSelectedSuggestionStyle() : {})
                    }}
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                      {suggestion.shortName}
                    </div>
                    <div style={{ 
                      fontSize: `${responsiveStyles.inputFontSize - 2}px`, 
                      opacity: 0.7,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {suggestion.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'text':
        return (
          <div style={{ width: '100%' }}>
            <input
              type="text"
              placeholder={currentQuestion.placeholder}
              value={formData[currentQuestion.id] || ''}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={handleInputFocus}
              autoFocus
              style={getInputStyle(responsiveStyles)}
            />
            {currentQuestion.id === 'contact' && showValidationError && formData[currentQuestion.id] && !validateCurrentField() && (
              <div style={getValidationErrorStyle(responsiveStyles)}>
                Please enter a valid email (with @) or 10-digit phone number
              </div>
            )}
          </div>
        );
      
      case 'select':
        return (
          <select
            value={formData[currentQuestion.id] || ''}
            onChange={(e) => {
              handleInputChange(e.target.value);
            }}
            autoFocus
            style={getSelectStyle(responsiveStyles)}
          >
            <option value="" disabled style={getSelectPlaceholderStyle()}>
              {currentQuestion.id === 'age' ? 'Select your age' : 'Select your gender'}
            </option>
            {currentQuestion.options.map((option, index) => (
              <option key={index} value={option} style={getSelectOptionStyle()}>
                {option}
              </option>
            ))}
          </select>
        );
      
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} style={getContainerStyle(responsiveStyles)}>
      {/* Scrollable Content Area */}
      <div style={getScrollableContentStyle(responsiveStyles, showKeyboard)}>
        
        {/* Centered Content Container */}
        <div style={getCenteredContentStyle(responsiveStyles)}>
          
          {/* Form Section */}
          <div style={getFormSectionStyle(responsiveStyles)}>
            <div style={getHeaderStyle(responsiveStyles)}>
              <img 
                src="/src/assets/logo.png" 
                alt="Peg-Plug Logo" 
                style={getLogoStyle(responsiveStyles)}
              />
              <p style={getSubtitleStyle(responsiveStyles)}>
                Put Your City on the Map
              </p>
            </div>

            {/* Form Content */}
            {!isPinAddedStep && (
              <>
                {/* Progress Dots */}
                <div style={getProgressDotsStyle(responsiveStyles)}>
                  {questions.map((_, index) => (
                    <div
                      key={index}
                      style={{
                        ...getProgressDotStyle(responsiveStyles),
                        ...(index < currentStep ? getCompletedDotStyle() : 
                           index === currentStep ? getActiveDotStyle() : {})
                      }}
                    />
                  ))}
                </div>

                {/* Current Question */}
                <div style={getFormGroupStyle(responsiveStyles)}>
                  <h3 style={getQuestionStyle(responsiveStyles)}>
                    {currentQuestion.question}
                  </h3>
                  {renderInput()}
                </div>

                {/* Next Button - Only shows for text input fields (not dropdowns or location) */}
                {currentQuestion.id !== 'location' && currentQuestion.type !== 'select' && (
                  <button
                    type="button"
                    style={{
                      ...getNextButtonStyle(responsiveStyles),
                      ...(canAdvance ? {} : getDisabledButtonStyle())
                    }}
                    onClick={handleNext}
                    disabled={!canAdvance}
                  >
                    {isLastStep ? 'Add Pin' : 'Continue'}
                  </button>
                )}
              </>
            )}

            {/* Pin Added Confirmation */}
            {isPinAddedStep && (
              <div style={getPinAddedStyle(responsiveStyles)}>
                <div style={getPinAddedIconStyle(responsiveStyles)}>📍</div>
                <h2 style={getPinAddedTitleStyle(responsiveStyles)}>Pin Added!</h2>
                <p style={getPinAddedSubtitleStyle(responsiveStyles)}>
                  Thanks for putting your city on the map
                </p>
              </div>
            )}
          </div>

          {/* Stats Section with overlay when past first step - NOW USING DYNAMIC DATA */}
          <div style={{
            ...getStatsSectionStyle(responsiveStyles),
            ...(currentStep > 0 ? getStatsOverlayStyle() : {})
          }}>
            {/* Top Cities */}
            <div style={getStatsBlockStyle(responsiveStyles)}>
              <h2 style={getStatsTitleStyle(responsiveStyles)}>📍 Top Cities</h2>
              <div style={getTopCitiesStyle(responsiveStyles)}>
                {topCities.map((city) => (
                  <div
                    key={city.rank}
                    style={getCityCardStyle(responsiveStyles)}
                    onClick={() => handleCityClick(city)}
                  >
                    <div style={getCityRankStyle(responsiveStyles)}>#{city.rank}</div>
                    <div style={getCityMainStyle()}>
                      <div style={getCityDetailsStyle()}>
                        <div style={getCityNameStyle(responsiveStyles)}>{city.city}</div>
                        <div style={getCityCountStyle(responsiveStyles)}>{city.visitors}</div>
                      </div>
                      <ReactCountryFlag 
                        countryCode={city.countryCode}
                        svg
                        style={{
                          width: '18px',
                          height: '14px',
                          marginLeft: '12px',
                          flexShrink: 0
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Visitors */}
            <div style={getStatsBlockStyle(responsiveStyles)}>
              <h2 style={getStatsTitleStyle(responsiveStyles)}>🌍 Recent</h2>
              <div style={getRecentVisitorsStyle()}>
                {recentVisitors.map((visitor, index) => (
                  <div key={index} style={getVisitorCardStyle(responsiveStyles)}>
                    <div style={getVisitorInfoStyle()}>
                      <div style={getVisitorNameStyle(responsiveStyles)}>{visitor.name}</div>
                      <div style={getVisitorLocationStyle(responsiveStyles)}>{visitor.city}</div>
                    </div>
                    <div style={getVisitorTimeStyle(responsiveStyles)}>{visitor.time}</div>
                    <ReactCountryFlag 
                      countryCode={visitor.countryCode}
                      svg
                      style={{
                        width: '16px',
                        height: '12px',
                        marginLeft: '10px',
                        flexShrink: 0
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Keyboard - Always Visible */}
      {renderKeyboard()}

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes bounce {
          0%, 20%, 60%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          80% { transform: translateY(-5px); }
        }
        
        select option {
          background-color: #1a1a1a !important;
          color: white !important;
          border: none !important;
          padding: 8px 12px !important;
          font-size: inherit !important;
        }
        
        select option:disabled {
          color: rgba(255, 255, 255, 0.5) !important;
          font-style: italic !important;
        }
        
        select option:checked {
          background-color: #dc2626 !important;
        }
        
        select::-webkit-scrollbar {
          width: 8px;
        }
        
        select::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        
        select::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        
        select::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

// STYLE FUNCTIONS - All remain the same but here's the complete set:

const getContainerStyle = (styles) => ({
  color: 'white',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
  borderRight: '1px solid rgba(255, 255, 255, 0.08)',
  overflow: 'hidden',
  paddingBottom: '16px'
});

const getScrollableContentStyle = (styles, showKeyboard) => ({
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none'
});

const getCenteredContentStyle = (styles) => ({
  width: '100%',
  maxWidth: `${styles.maxContentWidth}px`,
  padding: `${styles.containerPadding}px ${Math.round(styles.containerPadding * 0.5)}px`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
});

const getHeaderStyle = (styles) => ({
  textAlign: 'center',
  marginBottom: `${styles.sectionMargin}px`,
  width: '100%'
});

const getFormSectionStyle = (styles) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: `${styles.sectionMargin}px`
});

const getTitleStyle = (styles) => ({
  fontSize: `${styles.titleFontSize}px`,
  fontWeight: '300',
  color: 'white',
  marginBottom: '8px',
  letterSpacing: '0.02em',
  textAlign: 'center'
});

const getLogoStyle = (styles) => ({
  maxWidth: '100%',
  height: 'auto',
  maxHeight: `${Math.round(styles.titleFontSize * 2.5)}px`,
  marginBottom: '16px',
  display: 'block',
  margin: '0 auto 16px auto'
});

const getSubtitleStyle = (styles) => ({
  fontSize: `${styles.subtitleFontSize}px`,
  color: 'rgba(255, 255, 255, 0.6)',
  marginBottom: 0,
  fontWeight: '200',
  textAlign: 'center'
});

const getProgressDotsStyle = (styles) => ({
  display: 'flex',
  gap: `${Math.round(8 * (styles.dotSize / 8))}px`,
  marginBottom: `${styles.sectionMargin}px`,
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
  background: '#dc2626',
  transform: 'scale(1.2)'
});

const getCompletedDotStyle = () => ({
  background: '#f87171'
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
  border: 'none',
  borderRadius: `${Math.round(10 * (styles.inputPadding / 12))}px`,
  color: 'white',
  fontSize: `${styles.inputFontSize}px`,
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  textAlign: 'center'
});

const getLocationInputStyle = (styles) => ({
  width: '120%',
  maxWidth: '450px',
  margin: '0 auto',
  paddingTop: `${styles.inputPadding}px`,
  paddingBottom: `${styles.inputPadding}px`,
  paddingLeft: `${styles.inputPadding + 2}px`,
  paddingRight: `${styles.inputPadding + 2}px`,
  background: 'rgba(255, 255, 255, 0.04)',
  border: 'none',
  borderRadius: `${Math.round(10 * (styles.inputPadding / 12))}px`,
  color: 'white',
  fontSize: `${styles.inputFontSize}px`,
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  textAlign: 'center'
});

const getNextButtonStyle = (styles) => ({
  width: '100%',
  paddingTop: `${styles.buttonPadding}px`,
  paddingBottom: `${styles.buttonPadding}px`,
  paddingLeft: `${styles.buttonPadding + 4}px`,
  paddingRight: `${styles.buttonPadding + 4}px`,
  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
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

const getStatsSectionStyle = (styles) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
});

const getStatsBlockStyle = (styles) => ({
  width: '100%',
  marginBottom: `${styles.sectionMargin * 0.8}px`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
});

const getStatsTitleStyle = (styles) => ({
  fontSize: `${Math.round(16 * (styles.titleFontSize / 28))}px`,
  fontWeight: '500',
  color: 'white',
  marginBottom: `${styles.inputPadding}px`,
  letterSpacing: '-0.01em',
  textAlign: 'center',
  width: '100%'
});

const getTopCitiesStyle = (styles) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: `${Math.round(8 * (styles.inputPadding / 12))}px`,
  width: '100%'
});

const getCityCardStyle = (styles) => ({
  display: 'flex',
  alignItems: 'center',
  padding: `${Math.round(12 * (styles.inputPadding / 12))}px`,
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: `${Math.round(8 * (styles.inputPadding / 12))}px`,
  cursor: 'pointer',
  width: '100%'
});

const getCityRankStyle = (styles) => ({
  fontSize: `${Math.round(11 * (styles.cityNameFontSize / 12))}px`,
  fontWeight: '600',
  color: '#f87171',
  minWidth: `${Math.round(20 * (styles.inputPadding / 12))}px`,
  marginRight: `${Math.round(12 * (styles.inputPadding / 12))}px`,
  textAlign: 'center'
});

const getCityMainStyle = () => ({
  display: 'flex',
  alignItems: 'center',
  flex: '1',
  justifyContent: 'space-between'
});

const getCityDetailsStyle = () => ({
  flex: '1'
});

const getCityNameStyle = (styles) => ({
  fontSize: `${styles.cityNameFontSize}px`,
  fontWeight: '500',
  color: 'white',
  marginBottom: '2px'
});

const getCityCountStyle = (styles) => ({
  fontSize: `${Math.round(10 * (styles.cityNameFontSize / 12))}px`,
  color: '#f87171',
  fontWeight: '500'
});

const getRecentVisitorsStyle = () => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  width: '100%'
});

const getVisitorCardStyle = (styles) => ({
  display: 'flex',
  alignItems: 'center',
  padding: `${Math.round(10 * (styles.inputPadding / 12))}px`,
  background: 'rgba(255, 255, 255, 0.015)',
  borderRadius: `${Math.round(6 * (styles.inputPadding / 12))}px`,
  width: '100%'
});

const getVisitorInfoStyle = () => ({
  flex: '1'
});

const getVisitorNameStyle = (styles) => ({
  fontSize: `${styles.visitorNameFontSize}px`,
  fontWeight: '500',
  color: 'white',
  marginBottom: '2px'
});

const getVisitorLocationStyle = (styles) => ({
  fontSize: `${Math.round(9 * (styles.visitorNameFontSize / 11))}px`,
  color: 'rgba(255, 255, 255, 0.6)'
});

const getVisitorTimeStyle = (styles) => ({
  fontSize: `${Math.round(9 * (styles.visitorNameFontSize / 11))}px`,
  color: 'rgba(248, 113, 113, 0.8)',
  fontWeight: '500',
  marginRight: '10px'
});

const getKeyboardStyle = (styles) => ({
  backgroundColor: 'rgba(15, 15, 15, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '12px 12px 8px 8px',
  padding: `${Math.round(styles.containerPadding * 0.4)}px`,
  margin: `0 8px 8px 8px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${Math.round(styles.containerPadding * 0.15)}px`,
  height: `${styles.keyboardHeight}px`,
  backdropFilter: 'blur(10px)',
  flexShrink: 0,
  boxSizing: 'border-box',
  overflow: 'hidden'
});

const getKeyboardRowStyle = (styles) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: `${styles.containerPadding / 4}px`,
  flex: 1
});

const getKeyboardKeyStyle = (styles, key) => {
  const isSpecial = ['shift', 'backspace', 'space', 'enter'].includes(key);
  const isSpace = key === 'space';
  
  return {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: `${Math.round(6 * (styles.inputPadding / 12))}px`,
    color: 'white',
    fontSize: `${Math.round(styles.inputFontSize * 0.9)}px`,
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: `${Math.round(36 * (styles.inputPadding / 12))}px`,
    flex: isSpace ? 3 : isSpecial ? 1.5 : 1,
    fontWeight: isSpecial ? '500' : '400',
    outline: 'none',
    userSelect: 'none',
    touchAction: 'manipulation'
  };
};

const getKeyboardKeyActiveStyle = () => ({
  backgroundColor: 'rgba(220, 38, 38, 0.3)',
  borderColor: 'rgba(220, 38, 38, 0.5)'
});

const getSuggestionsStyle = (styles, showKeyboard, keyboardHeight) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  background: 'rgba(20, 20, 20, 0.95)',
  border: 'none',
  borderRadius: `${Math.round(8 * (styles.inputPadding / 12))}px`,
  marginTop: '4px',
  height: 'auto',
  maxHeight: 'none',
  overflow: 'hidden',
  zIndex: 1000,
  backdropFilter: 'blur(10px)'
});

const getSelectStyle = (styles) => ({
  ...getInputStyle(styles),
  fontSize: `${styles.selectFontSize}px`,
  cursor: 'pointer',
  background: 'rgba(255, 255, 255, 0.08)',
  border: 'none',
  color: 'white',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: `right ${styles.inputPadding}px center`,
  backgroundSize: '16px',
  paddingRight: `${styles.inputPadding + 24}px`,
  minHeight: `${Math.round(48 * (styles.inputPadding / 12))}px`,
  display: 'flex',
  alignItems: 'center'
});

const getStatsOverlayStyle = () => ({
  position: 'relative',
  opacity: 0.15,
  pointerEvents: 'none'
});

const getSuggestionItemStyle = (styles) => ({
  padding: `${styles.inputPadding - 2}px ${styles.inputPadding}px`,
  cursor: 'pointer',
  fontSize: `${styles.inputFontSize}px`,
  backgroundColor: 'transparent',
  color: 'white'
});

const getSelectedSuggestionStyle = () => ({
  background: 'rgba(220, 38, 38, 0.2)',
  borderColor: 'rgba(220, 38, 38, 0.3)',
  backgroundColor: 'rgba(220, 38, 38, 0.15)'
});

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
  color: '#f87171',
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

const getSelectPlaceholderStyle = () => ({
  color: 'rgba(255, 255, 255, 0.5)',
  fontStyle: 'italic'
});

const getSelectOptionStyle = () => ({
  color: 'white',
  backgroundColor: '#1a1a1a'
});

export default FormFlow;
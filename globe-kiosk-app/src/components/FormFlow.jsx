// FormFlow.jsx - Responsive component with Mapbox Geocoding API and Touchscreen Keyboard
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactCountryFlag from 'react-country-flag';

const FormFlow = ({ onFormSubmit, onLocationSelect, selectedLocation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  
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
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion) => {
    setFormData(prev => ({ ...prev, location: suggestion.name }));
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setShowKeyboard(false);
    
    // Send location data to parent
    const locationData = {
      name: suggestion.name,
      shortName: suggestion.shortName,
      lat: suggestion.coordinates[1],
      lng: suggestion.coordinates[0],
      bbox: suggestion.bbox
    };
    onLocationSelect(locationData);
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

  // Simplified form questions
  const questions = [
    {
      id: 'location',
      type: 'autocomplete',
      question: 'Where are you from?',
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
      id: 'purpose',
      type: 'select',
      question: 'What brings you here?',
      options: [
        'Just exploring',
        'Travel planning', 
        'Educational research',
        'Business purposes'
      ],
      required: true
    }
  ];

  // Top 3 highest pinned cities - USING REACT-COUNTRY-FLAG
  const topCities = [
    { rank: 1, city: "Dallas", country: "US", countryCode: "US", visitors: "2.4K" },
    { rank: 2, city: "Tokyo", country: "JP", countryCode: "JP", visitors: "1.8K" },
    { rank: 3, city: "London", country: "UK", countryCode: "GB", visitors: "1.6K" }
  ];

  // Latest 3 pins/nations - USING REACT-COUNTRY-FLAG
  const recentVisitors = [
    { name: "Sarah M.", city: "Paris", countryCode: "FR", time: "2m" },
    { name: "Alex K.", city: "Berlin", countryCode: "DE", time: "5m" },
    { name: "Maria L.", city: "São Paulo", countryCode: "BR", time: "8m" }
  ];

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const canAdvance = formData[currentQuestion?.id] && String(formData[currentQuestion?.id]).trim();

  const handleInputChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, [currentQuestion.id]: value }));
  }, [currentQuestion]);

  const handleInputFocus = useCallback(() => {
    if (currentQuestion?.type === 'text' || currentQuestion?.type === 'autocomplete') {
      setShowKeyboard(true);
    }
  }, [currentQuestion]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      const completeData = { ...formData, timestamp: new Date().toISOString() };
      onFormSubmit(completeData);
      setCurrentStep(0);
      setFormData({});
      setShowKeyboard(false);
    } else {
      setCurrentStep(prev => prev + 1);
      setShowKeyboard(false);
    }
  }, [currentStep, isLastStep, formData, onFormSubmit]);

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

  // Calculate responsive styles based on container size
  const getResponsiveStyles = useCallback(() => {
    const { width, height } = containerSize;
    
    // Base dimensions for scaling (similar to globe approach)
    const baseWidth = 400;
    const baseHeight = 800;
    
    // Calculate scale factors
    const widthScale = width / baseWidth;
    const heightScale = height / baseHeight;
    const averageScale = Math.min(widthScale, heightScale, 1.4); // Cap at 1.4x
    
    // Scale fonts and spacing - MORE COMPACT for keyboard
    const fontScale = Math.max(0.7, Math.min(1.1, averageScale));
    const spacingScale = Math.max(0.6, Math.min(1.0, averageScale));
    
    return {
      titleFontSize: Math.round(24 * fontScale), // Reduced from 28
      subtitleFontSize: Math.round(13 * fontScale), // Reduced from 15
      questionFontSize: Math.round(18 * fontScale), // Reduced from 20
      inputFontSize: Math.round(15 * fontScale), // Reduced from 16
      buttonFontSize: Math.round(15 * fontScale), // Reduced from 16
      cityNameFontSize: Math.round(12 * fontScale), // Reduced from 14
      visitorNameFontSize: Math.round(11 * fontScale), // Reduced from 13
      
      containerPadding: Math.round(24 * spacingScale), // Reduced from 32
      sectionMargin: Math.round(24 * spacingScale), // Reduced from 40
      inputPadding: Math.round(12 * spacingScale), // Reduced from 16
      buttonPadding: Math.round(12 * spacingScale), // Reduced from 16
      
      dotSize: Math.round(7 * fontScale), // Reduced from 8
      
      isCompact: height < 700 || width < 350,
      keyboardHeight: Math.round(240 * spacingScale), // Keyboard space
      
      // SMALLER stats sections
      statsCompact: true
    };
  }, [containerSize]);

  const responsiveStyles = getResponsiveStyles();

  // Handle virtual keyboard input
  const handleKeyPress = useCallback((key) => {
    const currentValue = formData[currentQuestion?.id] || '';
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
        setIsShiftPressed(false); // Reset shift after character input
        break;
    }

    if (currentQuestion?.type === 'autocomplete') {
      handleLocationInputChange(newValue);
    } else {
      setFormData(prev => ({ ...prev, [currentQuestion.id]: newValue }));
    }
  }, [formData, currentQuestion, selectedSuggestionIndex, locationSuggestions, handleSuggestionSelect, handleLocationInputChange, isShiftPressed]);

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
          <div style={{ position: 'relative' }}>
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
                ...getInputStyle(responsiveStyles),
                paddingRight: isLoadingSuggestions ? `${responsiveStyles.inputPadding + 30}px` : `${responsiveStyles.inputPadding}px`
              }}
            />
            
            {/* Loading spinner */}
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
            
            {/* Suggestions dropdown - POSITIONED TO AVOID KEYBOARD */}
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
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
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
          <input
            type="text"
            placeholder={currentQuestion.placeholder}
            value={formData[currentQuestion.id] || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            autoFocus
            style={getInputStyle(responsiveStyles)}
          />
        );
      
      case 'select':
        return (
          <select
            value={formData[currentQuestion.id] || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            autoFocus
            style={getSelectStyle(responsiveStyles)}
          >
            <option value="">Choose one...</option>
            {currentQuestion.options.map((option, index) => (
              <option key={index} value={option}>
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
        {/* Form Section */}
        <div style={getFormSectionStyle(responsiveStyles)}>
          <h1 style={getTitleStyle(responsiveStyles)}>Welcome to Terra</h1>
          <p style={getSubtitleStyle(responsiveStyles)}>
            Highlight your hometown
          </p>

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

          {/* Next Button */}
          <button
            type="button"
            style={{
              ...getNextButtonStyle(responsiveStyles),
              ...(canAdvance ? {} : getDisabledButtonStyle())
            }}
            onClick={handleNext}
            disabled={!canAdvance}
          >
            {isLastStep ? 'Join Terra' : 'Continue'}
          </button>
        </div>

        {/* COMPACT Stats Section */}
        <div style={getStatsSectionStyle(responsiveStyles)}>
          {/* Highest Pinned Cities - COMPACT */}
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
                      width: `${Math.round(18 * (responsiveStyles.cityNameFontSize / 12))}px`,
                      height: `${Math.round(14 * (responsiveStyles.cityNameFontSize / 12))}px`,
                      marginLeft: `${Math.round(12 * (responsiveStyles.inputPadding / 12))}px`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Latest Pins - COMPACT */}
          <h2 style={{ ...getStatsTitleStyle(responsiveStyles), marginTop: `${responsiveStyles.sectionMargin * 0.7}px` }}>
            🌍 Recent
          </h2>
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
                    width: `${Math.round(16 * (responsiveStyles.visitorNameFontSize / 11))}px`,
                    height: `${Math.round(12 * (responsiveStyles.visitorNameFontSize / 11))}px`,
                    marginLeft: `${Math.round(10 * (responsiveStyles.inputPadding / 12))}px`
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Virtual Keyboard */}
      {renderKeyboard()}

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

// Style functions
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

const getScrollableContentStyle = (styles, showKeyboard) => ({
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: `${styles.containerPadding}px`,
  paddingBottom: showKeyboard ? `${styles.containerPadding / 2}px` : `${styles.containerPadding}px`,
  scrollbarWidth: 'none',
  msOverflowStyle: 'none'
});

const getKeyboardStyle = (styles) => ({
  backgroundColor: 'rgba(15, 15, 15, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.15)', // Added subtle border
  borderTop: '1px solid rgba(255, 255, 255, 0.2)', // Slightly stronger top border
  borderRadius: '12px 12px 0 0', // Rounded top corners
  padding: `${styles.containerPadding / 2}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${styles.containerPadding / 4}px`,
  height: `${styles.keyboardHeight}px`,
  backdropFilter: 'blur(10px)'
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
    borderRadius: `${Math.round(8 * (styles.inputPadding / 12))}px`,
    color: 'white',
    fontSize: `${styles.inputFontSize}px`,
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: `${Math.round(44 * (styles.inputPadding / 12))}px`,
    flex: isSpace ? 3 : isSpecial ? 1.5 : 1,
    fontWeight: isSpecial ? '500' : '400',
    outline: 'none',
    userSelect: 'none',
    touchAction: 'manipulation'
  };
};

const getKeyboardKeyActiveStyle = () => ({
  backgroundColor: 'rgba(25, 118, 210, 0.3)',
  borderColor: 'rgba(25, 118, 210, 0.5)'
});

const getSuggestionsStyle = (styles, showKeyboard, keyboardHeight) => ({
  position: 'absolute',
  bottom: showKeyboard ? `${keyboardHeight + 10}px` : 'auto',
  top: showKeyboard ? 'auto' : '100%',
  left: 0,
  right: 0,
  background: 'rgba(20, 20, 20, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: `${Math.round(8 * (styles.inputPadding / 12))}px`,
  marginTop: showKeyboard ? 0 : '4px',
  maxHeight: '180px',
  overflowY: 'auto',
  zIndex: 1000,
  backdropFilter: 'blur(10px)'
});

const getFormSectionStyle = (styles) => ({
  marginBottom: styles.isCompact ? `${styles.sectionMargin * 0.5}px` : `${styles.sectionMargin * 0.7}px`
});

const getTitleStyle = (styles) => ({
  fontSize: `${styles.titleFontSize}px`,
  fontWeight: '300',
  color: 'white',
  marginBottom: '4px',
  letterSpacing: '-0.02em'
});

const getSubtitleStyle = (styles) => ({
  fontSize: `${styles.subtitleFontSize}px`,
  color: 'rgba(255, 255, 255, 0.6)',
  marginBottom: `${styles.sectionMargin * 0.8}px`,
  fontWeight: '400'
});

const getProgressDotsStyle = (styles) => ({
  display: 'flex',
  gap: `${Math.round(6 * (styles.dotSize / 7))}px`,
  marginBottom: `${styles.sectionMargin * 0.8}px`,
  justifyContent: 'center'
});

const getProgressDotStyle = (styles) => ({
  width: `${styles.dotSize}px`,
  height: `${styles.dotSize}px`,
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.2)',
  transition: 'all 0.3s ease'
});

const getActiveDotStyle = () => ({
  background: '#1976d2',
  transform: 'scale(1.2)'
});

const getCompletedDotStyle = () => ({
  background: '#81d4fa'
});

const getFormGroupStyle = (styles) => ({
  marginBottom: `${styles.inputPadding + 4}px`
});

const getQuestionStyle = (styles) => ({
  fontSize: `${styles.questionFontSize}px`,
  fontWeight: '400',
  color: 'white',
  marginBottom: `${styles.inputPadding - 2}px`,
  letterSpacing: '-0.01em'
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
  transition: 'all 0.2s ease',
  outline: 'none'
});

const getSelectStyle = (styles) => ({
  ...getInputStyle(styles),
  cursor: 'pointer'
});

const getSuggestionItemStyle = (styles) => ({
  padding: `${styles.inputPadding - 2}px ${styles.inputPadding}px`,
  cursor: 'pointer',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  transition: 'all 0.2s ease',
  fontSize: `${styles.inputFontSize}px`
});

const getSelectedSuggestionStyle = () => ({
  background: 'rgba(25, 118, 210, 0.2)',
  borderColor: 'rgba(25, 118, 210, 0.3)'
});

const getNextButtonStyle = (styles) => ({
  width: '100%',
  padding: `${styles.buttonPadding}px ${styles.buttonPadding + 4}px`,
  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
  border: 'none',
  borderRadius: `${Math.round(10 * (styles.buttonPadding / 12))}px`,
  color: 'white',
  fontSize: `${styles.buttonFontSize}px`,
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontFamily: "'Inter', sans-serif"
});

const getDisabledButtonStyle = () => ({
  opacity: '0.4',
  cursor: 'not-allowed'
});

const getStatsSectionStyle = (styles) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0
});

const getStatsTitleStyle = (styles) => ({
  fontSize: `${Math.round(16 * (styles.titleFontSize / 24))}px`, // BIGGER - increased from 14
  fontWeight: '500',
  color: 'white',
  marginBottom: `${Math.round(12 * (styles.inputPadding / 12))}px`,
  letterSpacing: '-0.01em'
});

const getTopCitiesStyle = (styles) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: `${Math.round(6 * (styles.inputPadding / 12))}px`,
  marginBottom: `${Math.round(12 * (styles.inputPadding / 12))}px`
});

const getCityCardStyle = (styles) => ({
  display: 'flex',
  alignItems: 'center',
  padding: `${Math.round(10 * (styles.inputPadding / 12))}px ${Math.round(12 * (styles.inputPadding / 12))}px`,
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: `${Math.round(8 * (styles.inputPadding / 12))}px`,
  transition: 'all 0.2s ease',
  cursor: 'pointer'
});

const getCityRankStyle = (styles) => ({
  fontSize: `${Math.round(10 * (styles.cityNameFontSize / 12))}px`,
  fontWeight: '600',
  color: '#81d4fa',
  minWidth: `${Math.round(16 * (styles.inputPadding / 12))}px`,
  marginRight: `${Math.round(8 * (styles.inputPadding / 12))}px`
});

const getCityMainStyle = () => ({
  display: 'flex',
  alignItems: 'center',
  flex: '1',
  justifyContent: 'space-between' // Ensure proper spacing between content and flag
});

const getCityFlagStyle = (styles) => ({
  fontSize: `${Math.round(18 * (styles.cityNameFontSize / 12))}px`, // Made bigger for visibility
  marginLeft: `${Math.round(12 * (styles.inputPadding / 12))}px`, // More margin for spacing
  flexShrink: 0 // Prevent flag from shrinking
});

const getCityDetailsStyle = () => ({
  flex: '1'
});

const getCityNameStyle = (styles) => ({
  fontSize: `${styles.cityNameFontSize}px`,
  fontWeight: '500',
  color: 'white',
  marginBottom: '1px'
});

const getCityCountStyle = (styles) => ({
  fontSize: `${Math.round(10 * (styles.cityNameFontSize / 12))}px`,
  color: '#81d4fa',
  fontWeight: '500'
});

const getRecentVisitorsStyle = () => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
});

const getVisitorCardStyle = (styles) => ({
  display: 'flex',
  alignItems: 'center',
  padding: `${Math.round(8 * (styles.inputPadding / 12))}px ${Math.round(10 * (styles.inputPadding / 12))}px`,
  background: 'rgba(255, 255, 255, 0.015)',
  borderRadius: `${Math.round(6 * (styles.inputPadding / 12))}px`,
  transition: 'all 0.2s ease'
});

const getVisitorFlagStyle = (styles) => ({
  fontSize: `${Math.round(16 * (styles.visitorNameFontSize / 11))}px`, // Made bigger for visibility
  marginLeft: `${Math.round(10 * (styles.inputPadding / 12))}px`, // More margin for spacing
  flexShrink: 0 // Prevent flag from shrinking
});

const getVisitorInfoStyle = () => ({
  flex: '1'
});

const getVisitorNameStyle = (styles) => ({
  fontSize: `${styles.visitorNameFontSize}px`,
  fontWeight: '500',
  color: 'white',
  marginBottom: '1px'
});

const getVisitorLocationStyle = (styles) => ({
  fontSize: `${Math.round(9 * (styles.visitorNameFontSize / 11))}px`,
  color: 'rgba(255, 255, 255, 0.6)'
});

const getVisitorTimeStyle = (styles) => ({
  fontSize: `${Math.round(9 * (styles.visitorNameFontSize / 11))}px`,
  color: 'rgba(129, 212, 250, 0.8)',
  fontWeight: '500'
});

export default FormFlow;
// FormFlow.jsx - Self-contained component with all styling
import React, { useState, useCallback } from 'react';

const FormFlow = ({ onFormSubmit, onLocationSelect, selectedLocation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});

  // Simplified form questions
  const questions = [
    {
      id: 'location',
      type: 'text',
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

  // Top 3 highest pinned cities - with country emojis
  const topCities = [
    { rank: 1, city: "Dallas", country: "United States", flag: "🇺🇸", visitors: "2.4K", growth: "+12%" },
    { rank: 2, city: "Tokyo", country: "Japan", flag: "🇯🇵", visitors: "1.8K", growth: "+8%" },
    { rank: 3, city: "London", country: "United Kingdom", flag: "🇬🇧", visitors: "1.6K", growth: "+15%" }
  ];

  // Latest 3 pins/nations - with country emojis
  const recentVisitors = [
    { name: "Sarah M.", city: "Paris", country: "France", flag: "🇫🇷", time: "2 min ago" },
    { name: "Alex K.", city: "Berlin", country: "Germany", flag: "🇩🇪", time: "5 min ago" },
    { name: "Maria L.", city: "São Paulo", country: "Brazil", flag: "🇧🇷", time: "8 min ago" }
  ];

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const canAdvance = formData[currentQuestion?.id] && String(formData[currentQuestion?.id]).trim();

  const handleInputChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, [currentQuestion.id]: value }));
  }, [currentQuestion]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      const completeData = { ...formData, timestamp: new Date().toISOString() };
      onFormSubmit(completeData);
      setCurrentStep(0);
      setFormData({});
    } else {
      setCurrentStep(prev => prev + 1);
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

  const renderInput = () => {
    switch (currentQuestion.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={currentQuestion.placeholder}
            value={formData[currentQuestion.id] || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            autoFocus
            style={inputStyle}
          />
        );
      
      case 'select':
        return (
          <select
            value={formData[currentQuestion.id] || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            autoFocus
            style={selectStyle}
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
    <div style={containerStyle}>
      {/* Form Section */}
      <div style={formSectionStyle}>
        <h1 style={titleStyle}>Welcome to Terra</h1>
        <p style={subtitleStyle}>
          Highlight your hometown
        </p>

        {/* Progress Dots */}
        <div style={progressDotsStyle}>
          {questions.map((_, index) => (
            <div
              key={index}
              style={{
                ...progressDotStyle,
                ...(index < currentStep ? completedDotStyle : 
                   index === currentStep ? activeDotStyle : {})
              }}
            />
          ))}
        </div>

        {/* Current Question */}
        <div style={formGroupStyle}>
          <h3 style={questionStyle}>
            {currentQuestion.question}
          </h3>
          {renderInput()}
        </div>

        {/* Next Button */}
        <button
          type="button"
          style={{
            ...nextButtonStyle,
            ...(canAdvance ? {} : disabledButtonStyle)
          }}
          onClick={handleNext}
          disabled={!canAdvance}
        >
          {isLastStep ? 'Join Terra' : 'Continue'}
        </button>
      </div>

      {/* Stats Section */}
      <div style={statsSectionStyle}>
        {/* Highest Pinned Cities */}
        <h2 style={statsTitleStyle}>📍 Highest Pinned</h2>
        <div style={topCitiesStyle}>
          {topCities.map((city) => (
            <div
              key={city.rank}
              style={cityCardStyle}
              onClick={() => handleCityClick(city)}
            >
              <div style={cityRankStyle}>#{city.rank}</div>
              <div style={cityMainStyle}>
                <span style={cityFlagStyle}>{city.flag}</span>
                <div style={cityDetailsStyle}>
                  <div style={cityNameStyle}>{city.city}</div>
                  <div style={cityCountStyle}>{city.visitors}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Latest Pins */}
        <h2 style={{ ...statsTitleStyle, marginTop: '32px' }}>🌍 Latest Pins</h2>
        <div style={recentVisitorsStyle}>
          {recentVisitors.map((visitor, index) => (
            <div key={index} style={visitorCardStyle}>
              <span style={visitorFlagStyle}>{visitor.flag}</span>
              <div style={visitorInfoStyle}>
                <div style={visitorNameStyle}>{visitor.name}</div>
                <div style={visitorLocationStyle}>{visitor.city}</div>
              </div>
              <div style={visitorTimeStyle}>{visitor.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// All styles defined in the component
const containerStyle = {
  padding: '40px 32px',
  color: 'white',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
  borderRight: '1px solid rgba(255, 255, 255, 0.08)'
};

const formSectionStyle = {
  marginBottom: '40px'
};

const titleStyle = {
  fontSize: '28px',
  fontWeight: '300',
  color: 'white',
  marginBottom: '6px',
  letterSpacing: '-0.02em'
};

const subtitleStyle = {
  fontSize: '15px',
  color: 'rgba(255, 255, 255, 0.6)',
  marginBottom: '32px',
  fontWeight: '400'
};

const progressDotsStyle = {
  display: 'flex',
  gap: '8px',
  marginBottom: '32px',
  justifyContent: 'center'
};

const progressDotStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.2)',
  transition: 'all 0.3s ease'
};

const activeDotStyle = {
  background: '#1976d2',
  transform: 'scale(1.2)'
};

const completedDotStyle = {
  background: '#81d4fa'
};

const formGroupStyle = {
  marginBottom: '24px'
};

const questionStyle = {
  fontSize: '20px',
  fontWeight: '400',
  color: 'white',
  marginBottom: '16px',
  letterSpacing: '-0.01em'
};

const inputStyle = {
  width: '100%',
  padding: '16px 20px',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '12px',
  color: 'white',
  fontSize: '16px',
  fontFamily: "'Inter', sans-serif",
  transition: 'all 0.2s ease',
  outline: 'none'
};

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer'
};

const nextButtonStyle = {
  width: '100%',
  padding: '16px 24px',
  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
  border: 'none',
  borderRadius: '12px',
  color: 'white',
  fontSize: '16px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontFamily: "'Inter', sans-serif"
};

const disabledButtonStyle = {
  opacity: '0.4',
  cursor: 'not-allowed'
};

const statsSectionStyle = {
  flex: '1',
  display: 'flex',
  flexDirection: 'column'
};

const statsTitleStyle = {
  fontSize: '16px',
  fontWeight: '500',
  color: 'white',
  marginBottom: '16px',
  letterSpacing: '-0.01em'
};

const topCitiesStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginBottom: '16px'
};

const cityCardStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '14px 16px',
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: '10px',
  transition: 'all 0.2s ease',
  cursor: 'pointer'
};

const cityRankStyle = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#81d4fa',
  minWidth: '20px',
  marginRight: '12px'
};

const cityMainStyle = {
  display: 'flex',
  alignItems: 'center',
  flex: '1'
};

const cityFlagStyle = {
  fontSize: '18px',
  marginRight: '10px'
};

const cityDetailsStyle = {
  flex: '1'
};

const cityNameStyle = {
  fontSize: '14px',
  fontWeight: '500',
  color: 'white',
  marginBottom: '2px'
};

const cityCountStyle = {
  fontSize: '12px',
  color: '#81d4fa',
  fontWeight: '500'
};

const recentVisitorsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const visitorCardStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 12px',
  background: 'rgba(255, 255, 255, 0.015)',
  borderRadius: '8px',
  transition: 'all 0.2s ease'
};

const visitorFlagStyle = {
  fontSize: '14px',
  marginRight: '8px'
};

const visitorInfoStyle = {
  flex: '1'
};

const visitorNameStyle = {
  fontSize: '13px',
  fontWeight: '500',
  color: 'white',
  marginBottom: '1px'
};

const visitorLocationStyle = {
  fontSize: '11px',
  color: 'rgba(255, 255, 255, 0.6)'
};

const visitorTimeStyle = {
  fontSize: '11px',
  color: 'rgba(129, 212, 250, 0.8)',
  fontWeight: '500'
};

export default FormFlow;
import React from 'react';

const Top5Overlay = ({ isOpen, onClose, top5Data }) => {
  if (!isOpen) return null;

  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      
      {/* Top 5 Card */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        color: 'white',
        backdropFilter: 'blur(15px)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        animation: 'slideUp 0.5s ease-out'
      }}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
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

        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '300',
            margin: '0 0 10px 0',
            color: 'white'
          }}>
            🏆 Top Destinations
          </h2>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.8)',
            margin: 0,
            fontWeight: '300'
          }}>
            Most visited locations on the globe
          </p>
        </div>

        {/* Top 5 List */}
        <div style={{ marginBottom: '30px' }}>
          {top5Data.length > 0 ? (
            top5Data.map((location, index) => (
              <div
                key={location.rank}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  margin: '12px 0',
                  backgroundColor: location.rank <= 3 ? 
                    'rgba(234, 67, 53, 0.1)' : 
                    'rgba(255, 255, 255, 0.05)',
                  border: location.rank <= 3 ? 
                    '2px solid rgba(234, 67, 53, 0.3)' : 
                    '2px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '24px' }}>
                    {getRankEmoji(location.rank)}
                  </span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '500',
                      color: 'white',
                      margin: '0 0 4px 0'
                    }}>
                      {location.name}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      margin: 0
                    }}>
                      {location.country}
                    </div>
                    {location.mostRecentVisitor && (
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        margin: '2px 0 0 0'
                      }}>
                        Latest: {location.mostRecentVisitor.name}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#EA4335'
                }}>
                  {location.visitorCount}
                  <div style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: 'normal'
                  }}>
                    visitor{location.visitorCount > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              padding: '40px 20px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '16px'
            }}>
              No visited locations yet!<br />
              Be the first to add your pin! 📍
            </div>
          )}
        </div>

        {/* Continue Button */}
        <button
          onClick={onClose}
          style={{
            padding: '16px 32px',
            backgroundColor: '#EA4335',
            border: 'none',
            borderRadius: '50px',
            color: 'white',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#d33825';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#EA4335';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          Continue Exploring
        </button>
      </div>

      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(50px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Top5Overlay;
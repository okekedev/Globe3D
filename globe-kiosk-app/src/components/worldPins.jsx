// worldPins.js - 100 Default Pins Around the World

export const WORLD_PINS = [
  // Major Cities - North America
  { id: 1, name: "New York City", country: "United States", coordinates: [-74.0060, 40.7128], type: "major_city" },
  { id: 2, name: "Los Angeles", country: "United States", coordinates: [-118.2437, 34.0522], type: "major_city" },

  { id: 7, name: "Miami", country: "United States", coordinates: [-80.1918, 25.7617], type: "major_city" },
  { id: 8, name: "San Francisco", country: "United States", coordinates: [-122.4194, 37.7749], type: "major_city" },

 
  { id: 14, name: "Santiago", country: "Chile", coordinates: [-70.6693, -33.4489], type: "major_city" },
  { id: 15, name: "Caracas", country: "Venezuela", coordinates: [-66.9036, 10.4806], type: "major_city" },


  { id: 22, name: "Vienna", country: "Austria", coordinates: [16.3738, 48.2082], type: "major_city" },
  { id: 23, name: "Prague", country: "Czech Republic", coordinates: [14.4378, 50.0755], type: "major_city" },
  { id: 24, name: "Stockholm", country: "Sweden", coordinates: [18.0686, 59.3293], type: "major_city" },
  { id: 25, name: "Copenhagen", country: "Denmark", coordinates: [12.5683, 55.6761], type: "major_city" },

  // Africa
  { id: 26, name: "Cairo", country: "Egypt", coordinates: [31.2357, 30.0444], type: "major_city" },
  { id: 27, name: "Lagos", country: "Nigeria", coordinates: [3.3792, 6.5244], type: "major_city" },
  { id: 28, name: "Johannesburg", country: "South Africa", coordinates: [28.0473, -26.2041], type: "major_city" },


  { id: 39, name: "Bangkok", country: "Thailand", coordinates: [100.5018, 13.7563], type: "major_city" },
  { id: 40, name: "Singapore", country: "Singapore", coordinates: [103.8198, 1.3521], type: "major_city" },

  // Oceania
  { id: 43, name: "Sydney", country: "Australia", coordinates: [151.2093, -33.8688], type: "major_city" },
  { id: 44, name: "Melbourne", country: "Australia", coordinates: [144.9631, -37.8136], type: "major_city" },
  { id: 45, name: "Auckland", country: "New Zealand", coordinates: [174.7633, -36.8485], type: "major_city" },

  { id: 50, name: "Colosseum", country: "Italy", coordinates: [12.4924, 41.8902], type: "landmark" },
  { id: 51, name: "Christ the Redeemer", country: "Brazil", coordinates: [-43.2105, -22.9519], type: "landmark" },
  { id: 52, name: "Petra", country: "Jordan", coordinates: [35.4444, 30.3285], type: "landmark" },
  { id: 53, name: "Chichen Itza", country: "Mexico", coordinates: [-88.5678, 20.6843], type: "landmark" },


  { id: 58, name: "Amazon Rainforest", country: "Brazil", coordinates: [-60.0261, -3.4653], type: "natural" },
  { id: 59, name: "Sahara Desert", country: "Algeria", coordinates: [1.6596, 23.8859], type: "natural" },
  { id: 60, name: "Great Barrier Reef", country: "Australia", coordinates: [145.7781, -16.2839], type: "natural" },


  { id: 66, name: "Manila", country: "Philippines", coordinates: [120.9842, 14.5995], type: "major_city" },
  { id: 67, name: "Ho Chi Minh City", country: "Vietnam", coordinates: [106.6297, 10.8231], type: "major_city" },
  { id: 68, name: "Yangon", country: "Myanmar", coordinates: [96.1951, 16.8661], type: "major_city" },

  
  { id: 74, name: "Fiji", country: "Fiji", coordinates: [179.4144, -16.7784], type: "island" },

  // Northern Cities
  { id: 75, name: "Helsinki", country: "Finland", coordinates: [24.9384, 60.1699], type: "major_city" },
  { id: 76, name: "Oslo", country: "Norway", coordinates: [10.7522, 59.9139], type: "major_city" },
  { id: 77, name: "Anchorage", country: "United States", coordinates: [-149.9003, 61.2181], type: "major_city" },


  { id: 81, name: "Riyadh", country: "Saudi Arabia", coordinates: [46.6753, 24.7136], type: "major_city" },

  // Southeast Asia
  { id: 82, name: "Phnom Penh", country: "Cambodia", coordinates: [104.9160, 11.5564], type: "major_city" },
  { id: 83, name: "Vientiane", country: "Laos", coordinates: [102.6000, 17.9667], type: "major_city" },
  { id: 84, name: "Bandar Seri Begawan", country: "Brunei", coordinates: [114.9398, 4.9031], type: "major_city" },


  // Remote/Unique Locations
  { id: 96, name: "McMurdo Station", country: "Antarctica", coordinates: [166.6681, -77.8419], type: "research_station" },
  { id: 97, name: "Longyearbyen", country: "Norway (Svalbard)", coordinates: [15.6267, 78.2232], type: "remote" },
  { id: 98, name: "Ushuaia", country: "Argentina", coordinates: [-68.3029, -54.8019], type: "remote" },
  { id: 99, name: "Alert", country: "Canada", coordinates: [-62.3481, 82.5018], type: "remote" },
  { id: 100, name: "Tristan da Cunha", country: "UK Territory", coordinates: [-12.2777, -37.1052], type: "remote" }
];

// Utility functions for working with pins
export const getPinsByType = (type) => {
  return WORLD_PINS.filter(pin => pin.type === type);
};

export const getPinsByCountry = (country) => {
  return WORLD_PINS.filter(pin => pin.country === country);
};

export const getRandomPins = (count) => {
  const shuffled = [...WORLD_PINS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const searchPins = (query) => {
  const lowercaseQuery = query.toLowerCase();
  return WORLD_PINS.filter(pin => 
    pin.name.toLowerCase().includes(lowercaseQuery) ||
    pin.country.toLowerCase().includes(lowercaseQuery)
  );
};

// Default pin styling (Google Maps style)
export const DEFAULT_PIN_STYLE = {
  color: '#EA4335', // Google Maps red
  size: 8,
  icon: '📍'
};
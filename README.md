
# 🌍 Globe Kiosk App

An interactive 3D globe kiosk application that allows visitors to add their location pins with smooth animations and real-time tracking.

## 🎥 Demo

<video width="600" controls>
  <source src="https://github.com/user-attachments/public/demo.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## ✨ Features

- 🌍 **Interactive 3D Globe** - Smooth rotating globe with custom Mapbox styling
- 📍 **Real-time Pin Placement** - Visitors can add pins with smooth entrance animations
- 🎯 **Smart Location Zoom** - 20-second zoom animation to user's location
- 📱 **Touch-Optimized Interface** - Mobile-friendly with custom on-screen keyboard
- ⌨️ **Custom Keyboard** - Built-in keyboard with email domain suggestions
- 📊 **Live Metrics** - Real-time visitor statistics and top cities
- ⏰ **Auto-Reset** - 2-minute timeout returns to default view
- 🎨 **Smooth Animations** - Graceful pin transitions and visual feedback
- 🚫 **Kiosk Mode** - Non-interactive pins for privacy and simplicity

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Mapbox account and API token

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/globe-kiosk-app.git
cd globe-kiosk-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Setup

Add your Mapbox token to `.env`:
```env
VITE_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token_here
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
globe-kiosk-app/
├── src/
│   ├── components/
│   │   ├── KioskGlobe.jsx      # 3D globe with pin management
│   │   └── FormFlow.jsx        # Multi-step form with keyboard
│   ├── App.jsx                 # Main application layout
│   ├── App.css                 # Responsive layout styles
│   └── main.jsx               # Application entry point
├── public/                     # Static assets
├── .env                       # Environment variables (not tracked)
└── demo.mp4                   # Demo video
```

## 🎯 Perfect For

- **Trade Shows & Exhibitions** - Visitor registration and engagement
- **Corporate Lobbies** - Employee/visitor origin tracking  
- **Museums & Visitor Centers** - Interactive guest experiences
- **Event Registration** - Conference and meetup check-ins
- **Retail Locations** - Customer demographics and engagement

## 🛠️ Tech Stack

- **React 18** - Modern component framework
- **Vite** - Lightning-fast build tool
- **Mapbox GL JS** - Interactive maps and 3D globe
- **React Country Flag** - Country flag components
- **Custom CSS** - Responsive kiosk-optimized styling

## 📱 Kiosk Mode Features

### User Experience
- **4-step form flow** - Location, Name, Gender, Age, Contact
- **Autocomplete location search** - Powered by Mapbox Geocoding
- **Touch-friendly interface** - Large buttons and clear typography
- **Visual feedback** - Smooth animations and notifications

### Admin Features  
- **Auto-rotation** - Globe continuously rotates when idle
- **Smart zoom management** - Adjusts to container size automatically
- **Timeout protection** - Returns to default view after 2 minutes
- **Pin clustering** - Groups multiple pins in same city
- **Live statistics** - Top cities and recent visitors

## 🎨 Customization

### Styling
- Modify `App.css` for layout adjustments
- Update colors in component style functions
- Customize animations in CSS keyframes

### Mapbox Styling
- Update the map style URL in `KioskGlobe.jsx`
- Modify globe projection and visual settings
- Adjust pin colors and clustering behavior

### Form Questions
- Edit the `questions` array in `FormFlow.jsx`
- Add/remove form steps as needed
- Customize validation rules

## 🔧 Configuration

### Environment Variables
```env
VITE_MAPBOX_ACCESS_TOKEN=pk.your_token_here
```

### Key Settings
- **Zoom duration**: 20 seconds to user location
- **Timeout**: 2 minutes before auto-reset
- **Pin limit**: No limit, clustering handles density
- **Rotation speed**: Configurable in animation function

## 📊 Analytics & Metrics

The app tracks:
- **Top visitor cities** with live counts
- **Recent visitors** with timestamps  
- **Pin density** by geographic region
- **Form completion rates** (can be enhanced)

## 🚀 Deployment

### GitHub Pages
```bash
npm run build
# Deploy dist/ folder to GitHub Pages
```

### Vercel/Netlify
- Connect your GitHub repository
- Set environment variable: `VITE_MAPBOX_ACCESS_TOKEN`
- Auto-deploy on push to main branch

### Self-Hosted
```bash
npm run build
# Serve dist/ folder with any static file server
```

## 🔒 Security

- **API keys** stored in environment variables
- **No user data persistence** - privacy-focused design
- **Rate limiting** through Mapbox API quotas
- **Input validation** on all form fields

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/awesome-feature`)
3. Commit changes (`git commit -m 'Add awesome feature'`)
4. Push to branch (`git push origin feature/awesome-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Mapbox** for mapping and geocoding services
- **React Country Flag** for flag components
- **Inter Font** for clean typography

---

**Made with ❤️ for interactive kiosk experiences**

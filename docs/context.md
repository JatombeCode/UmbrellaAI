# UmbrellaAI - Context & Documentation

## Project Overview
UmbrellaAI is a smart weather application that provides users with a simple, binary answer to the question: "Do I need an umbrella today?" The app emphasizes simplicity, beautiful design, and accurate weather predictions through an intuitive user interface.

## Core Value Proposition
- **Instant Decision Making**: Users receive clear yes/no umbrella recommendations
- **Location-Aware**: Automatic weather updates based on user location
- **Beautiful UI/UX**: Clean, modern interface with smooth animations
- **Smart Notifications**: Timely reminders when umbrellas are needed

## Technical Architecture
> For detailed technical stack information and configuration, see @my-stack.mdc

### Frontend Stack
- **Framework**: React Native with TypeScript
- **Navigation**: Expo Router
- **UI Framework**: React Native Paper
- **Build System**: Expo
- **Styling**: React Native Paper theming

### Backend Services
- **Database & Auth**: Supabase
  - PostgreSQL Database
  - Built-in Authentication
  - Real-time Subscriptions
  - Edge Functions
  - Storage

### AI Processing
- **Engine**: DeepSeek
  - Weather pattern analysis
  - Prediction modeling
  - Decision making logic

### Key Features

#### 1. Authentication Flow
- Email/password authentication via Supabase Auth
- OAuth providers (Google, GitHub) support
- Row Level Security (RLS) policies
- Secure session management
- Password reset functionality

#### 2. Location Services
- GPS-based automatic location detection
- Manual location entry fallback
- Location permission handling
- Location caching for offline use

#### 3. Weather Processing
- Real-time weather data fetching
- Precipitation probability analysis
- Temperature and wind data processing
- Cached weather data for offline access

#### 4. User Preferences
- Temperature unit selection (°C/°F)
- Notification preferences
- Location settings management
- Theme preferences (light/dark)

#### 5. Notification System
- Daily morning weather alerts
- Severe weather warnings
- Custom notification timing
- Silent hours respect

## Application Flow

### 1. Launch Experience
```
Splash Screen → Auth Check → Location Permission → Main Screen
```

### 2. Authentication Flow
```
Sign Up/Sign In → Email Verification → Profile Setup → Main Screen
```

### 3. Weather Update Cycle
```
Location Check → API Call → Data Processing → UI Update
```

## Data Models

### User Profile
```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  preferences: {
    temperatureUnit: 'C' | 'F';
    notificationsEnabled: boolean;
    locationMethod: 'auto' | 'manual';
  };
  lastKnownLocation?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
}
```

### Weather Data
```typescript
interface WeatherData {
  location: {
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lon: number;
    };
  };
  current: {
    temperature: number;
    precipitation: number;
    humidity: number;
    windSpeed: number;
    condition: string;
  };
  forecast: {
    hourly: HourlyForecast[];
    daily: DailyForecast[];
  };
  lastUpdated: number;
}
```

## API Integration

### OpenWeatherMap API
- Endpoint: `api.openweathermap.org/data/3.0/`
- Required Parameters:
  - `lat`: Latitude
  - `lon`: Longitude
  - `appid`: API Key
  - `units`: Metric/Imperial

### Supabase Configuration
```typescript
const supabaseConfig = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRole: process.env.SUPABASE_SERVICE_ROLE_KEY // for admin operations only
};
```

## Development Guidelines

### Code Style
- Follow ESLint configuration
- Use TypeScript for type safety
- Implement proper error handling
- Write unit tests for critical functions
- Follow Supabase best practices for database schema design

### Performance Considerations
- Minimize API calls
- Implement proper caching
- Optimize images and animations
- Use lazy loading where appropriate

### Security Measures
- Implement Row Level Security (RLS) policies
- Secure API key storage
- Input validation and sanitization
- Database backup and recovery procedures
- Regular security audits

## Deployment Strategy

### Production Environment
- App Store (iOS)
- Google Play Store (Android)
- Automated CI/CD pipeline
- Version control with Git

### Testing Environment
- Development builds via Expo
- TestFlight for iOS beta
- Internal testing track for Android
- Automated testing suite

## Future Enhancements
1. Home screen widgets
2. Apple Watch/WearOS support
3. Social sharing features
4. Weather history analytics
5. Multiple location tracking
6. Advanced weather metrics

## Support and Maintenance
- Regular dependency updates
- Performance monitoring
- User feedback collection
- Bug tracking and resolution

## Contributing
Refer to CONTRIBUTING.md for:
- Code submission guidelines
- Pull request process
- Code review requirements
- Testing requirements

## License
MIT License - See LICENSE.md for details

import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, RefreshControl, ScrollView } from 'react-native';
import { Button, Text, useTheme, ActivityIndicator, IconButton } from 'react-native-paper';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedBackground from './components/AnimatedBackground';
import { router } from 'expo-router';

// Initialize weather API key
const weatherApiKey = process.env.EXPO_PUBLIC_WEATHER_API_KEY ?? '';

if (!weatherApiKey) {
  throw new Error('Missing Weather API key. Please add EXPO_PUBLIC_WEATHER_API_KEY to your .env file.');
}

interface WeatherData {
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  rain?: {
    "1h"?: number;
    "3h"?: number;
  };
  name: string;
  dt: number;
  sys: {
    sunrise: number;
    sunset: number;
    country: string;
  };
}

interface ExtendedLocation extends Location.LocationObject {
  geocode?: Location.LocationGeocodedAddress;
}

const getWeatherIcon = (weatherMain: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  const icons: { [key: string]: keyof typeof MaterialCommunityIcons.glyphMap } = {
    'Clear': 'weather-sunny',
    'Clouds': 'weather-cloudy',
    'Rain': 'weather-rainy',
    'Drizzle': 'weather-partly-rainy',
    'Thunderstorm': 'weather-lightning-rainy',
    'Snow': 'weather-snowy',
    'Mist': 'weather-fog',
    'Fog': 'weather-fog',
  };
  return icons[weatherMain] || 'weather-cloudy';
};

const getWeatherColor = (weatherMain: string, isNight: boolean = false) => {
  if (isNight) return '#2c3e50';
  
  const colors: { [key: string]: string } = {
    'Clear': '#4299e1',
    'Clouds': '#718096',
    'Rain': '#2b6cb0',
    'Drizzle': '#4a5568',
    'Thunderstorm': '#2d3748',
    'Snow': '#e2e8f0',
    'Mist': '#a0aec0',
    'Fog': '#cbd5e0',
  };
  return colors[weatherMain] || '#4299e1';
};

const convertToFahrenheit = (celsius: number) => Math.round(celsius * 9/5 + 32);

export default function App() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCelsius, setIsCelsius] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherResult, setWeatherResult] = React.useState<{
    needsUmbrella: boolean;
    explanation: string;
    weatherMain: string;
    temperature: number;
    location: string;
    reason?: string;
  } | null>(null);

  // Load temperature unit preference
  React.useEffect(() => {
    AsyncStorage.getItem('temperatureUnit').then((unit: string | null) => {
      if (unit) {
        setIsCelsius(unit === 'C');
      }
    });
  }, []);

  // Automatically check weather on app load
  React.useEffect(() => {
    checkWeather();
  }, []);

  // Save temperature unit preference
  const toggleTemperatureUnit = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newUnit = !isCelsius;
    setIsCelsius(newUnit);
    await AsyncStorage.setItem('temperatureUnit', newUnit ? 'C' : 'F');
  };

  // Update time every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  async function getLocation(): Promise<ExtendedLocation> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access location was denied');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    }) as ExtendedLocation;
    
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      location.geocode = reverseGeocode[0];
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }

    return location;
  }

  function formatLocation(weatherData: WeatherData, geocode?: Location.LocationGeocodedAddress): string {
    if (geocode) {
      if (geocode.city === geocode.subregion) {
        return `${geocode.city}, ${geocode.region}`;
      } else if (geocode.city && geocode.subregion) {
        return `${geocode.city}, ${geocode.region}`;
      }
    }
    return weatherData.name;
  }

  async function fetchWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${weatherApiKey}&units=metric`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your EXPO_PUBLIC_WEATHER_API_KEY in .env');
        } else if (response.status === 429) {
          throw new Error('Too many requests to weather API. Please try again later.');
        } else {
          throw new Error(`Weather API error (${response.status}): ${errorText}`);
        }
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch weather data. Please try again.');
    }
  }

  function shouldBringUmbrella(weatherData: WeatherData): { 
    needsUmbrella: boolean; 
    explanation: string;
    weatherMain: string;
    temperature: number;
    location: string;
    reason?: string;
  } {
    const rainConditions = ['Rain', 'Drizzle', 'Thunderstorm'];
    const currentWeather = weatherData.weather[0].main;
    const rainAmount = weatherData.rain?.["1h"] || weatherData.rain?.["3h"] || 0;
    const temperature = Math.round(weatherData.main.temp);
    const location = weatherData.name;
    
    const isRainingNow = rainConditions.includes(currentWeather);
    const hasSignificantRain = rainAmount > 0.1;
    const hasHighHumidity = weatherData.main.humidity > 85;

    if (isRainingNow) {
      return {
        needsUmbrella: true,
        explanation: 'Yes, bring an umbrella',
        reason: `It's ${currentWeather.toLowerCase()} right now`,
        weatherMain: currentWeather,
        temperature,
        location
      };
    }

    if (hasSignificantRain) {
      return {
        needsUmbrella: true,
        explanation: 'Yes, bring an umbrella',
        reason: 'Rain expected',
        weatherMain: currentWeather,
        temperature,
        location
      };
    }

    if (hasHighHumidity) {
      return {
        needsUmbrella: true,
        explanation: 'Yes, bring an umbrella',
        reason: 'High chance of rain',
        weatherMain: currentWeather,
        temperature,
        location
      };
    }

    return {
      needsUmbrella: false,
      explanation: 'No umbrella needed today',
      reason: 'Clear conditions expected',
      weatherMain: currentWeather,
      temperature,
      location
    };
  }

  const checkWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      const location = await getLocation();
      const weatherData = await fetchWeatherData(
        location.coords.latitude,
        location.coords.longitude
      );

      const result = shouldBringUmbrella(weatherData);
      result.location = formatLocation(weatherData, location.geocode);
      setWeatherResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRefreshing(true);
    checkWeather().finally(() => {
      setRefreshing(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });
  }, []);

  const backgroundColor = weatherResult 
    ? getWeatherColor(weatherResult.weatherMain)
    : theme.colors.primary;

  const getDisplayTemperature = (temp: number) => {
    const temperature = isCelsius ? temp : convertToFahrenheit(temp);
    return `${Math.round(temperature)}°${isCelsius ? 'C' : 'F'}`;
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <AnimatedBackground weatherMain={weatherResult?.weatherMain} />
        
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="titleLarge" style={styles.locationText}>
              {weatherResult?.location || 'Loading location...'}
            </Text>
            <Text style={styles.timeText}>
              {formatTime(currentTime)}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <IconButton
              icon={isCelsius ? 'temperature-celsius' : 'temperature-fahrenheit'}
              iconColor="white"
              size={24}
              onPress={toggleTemperatureUnit}
            />
            <IconButton
              icon="cog"
              iconColor="white"
              size={24}
              onPress={() => router.push('/(app)/settings')}
              testID="settings-button"
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.mainContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
            />
          }
        >
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="white" />
          ) : weatherResult ? (
            <>
              <View style={styles.umbrellaContainer}>
                <MaterialCommunityIcons
                  name={weatherResult.needsUmbrella ? 'umbrella' : 'umbrella-outline'}
                  size={120}
                  color="white"
                  style={styles.umbrellaIcon}
                />
                <View style={styles.umbrellaTextContainer}>
                  <Text style={styles.umbrellaText}>
                    {weatherResult.explanation}
                  </Text>
                  {weatherResult.reason && (
                    <Text style={styles.reasonText}>
                      {weatherResult.reason}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.weatherInfoContainer}>
                <MaterialCommunityIcons
                  name={getWeatherIcon(weatherResult.weatherMain)}
                  size={64}
                  color="white"
                />
                <Text style={styles.temperature}>
                  {getDisplayTemperature(weatherResult.temperature)}
                </Text>
              </View>
            </>
          ) : null}

          {error && (
            <Text style={styles.error}>{error}</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 24,
    letterSpacing: 1,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginTop: 4,
  },
  mainContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  umbrellaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 32,
    borderRadius: 30,
    width: '90%',
    maxWidth: 400,
    marginBottom: 32,
  },
  umbrellaIcon: {
    marginBottom: 24,
  },
  umbrellaTextContainer: {
    alignItems: 'center',
  },
  umbrellaText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
  },
  reasonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  weatherInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 20,
    gap: 16,
  },
  temperature: {
    color: 'white',
    fontSize: 36,
    fontWeight: '300',
  },
  error: {
    color: '#ff8a80',
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 8,
  },
}); 
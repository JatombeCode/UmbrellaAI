import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;

// Log API key status (safely)
console.log('Weather API Key status:', WEATHER_API_KEY ? 'Set' : 'Not set');
if (WEATHER_API_KEY) {
  console.log('Weather API Key prefix:', WEATHER_API_KEY.substring(0, 4) + '...');
}

// Configure notifications to show when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Define trigger types
type TriggerType = 'timestamp' | 'timeInterval' | 'daily';

interface DailyTrigger {
  type: 'daily';
  hour: number;
  minute: number;
  repeats: boolean;
}

// Keys for AsyncStorage
const NOTIFICATION_TIME_KEY = '@notification_time';
const NOTIFICATION_ENABLED_KEY = '@notification_enabled';
const NOTIFICATION_ID_KEY = '@notification_id';

export interface NotificationPreferences {
  enabled: boolean;
  hour: number;
  minute: number;
}

let lastRequestTime = 0;
const REQUEST_THROTTLE = 10000; // 10 seconds instead of 2
let isCheckingWeather = false;

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4299E1',
    });
  }

  return true;
}

async function checkWeatherConditions(): Promise<{ needsUmbrella: boolean; description: string }> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { needsUmbrella: false, description: "Location access needed" };
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    
    if (!WEATHER_API_KEY) {
      return { needsUmbrella: false, description: "Weather service unavailable" };
    }
    
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      return { needsUmbrella: false, description: "Unable to check weather" };
    }

    const data = await response.json();
    const weatherMain = data.weather[0].main;
    const rainAmount = data.rain?.['1h'] || data.rain?.['3h'] || 0;
    const humidity = data.main.humidity;

    const needsUmbrella = ['Rain', 'Drizzle', 'Thunderstorm'].includes(weatherMain) 
      || rainAmount > 0.1 
      || humidity > 85;
    
    return { 
      needsUmbrella, 
      description: needsUmbrella ? "Don't forget your umbrella today! ☔️" : "No umbrella needed today 🌤"
    };
  } catch (error) {
    console.error('Weather check failed:', error);
    return { needsUmbrella: false, description: "Unable to check weather" };
  }
}

export async function scheduleWeatherNotification(hour: number, minute: number): Promise<string> {
  // Cancel any existing notification
  const existingId = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId);
  }

  // Calculate next notification time
  const now = new Date();
  const scheduledTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute
  );

  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  // Check weather first
  const { needsUmbrella } = await checkWeatherConditions();

  // Schedule the notification with the actual weather status
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: needsUmbrella ? "Take your umbrella! ☔️" : "No umbrella needed 🌤",
      body: needsUmbrella ? "It's going to rain today." : "Clear skies ahead!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute
    },
  });

  await AsyncStorage.setItem(NOTIFICATION_ID_KEY, id);
  return id;
}

export async function saveNotificationPreferences(prefs: NotificationPreferences): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, prefs.enabled.toString());
  await AsyncStorage.setItem(
    NOTIFICATION_TIME_KEY,
    JSON.stringify({ hour: prefs.hour, minute: prefs.minute })
  );

  if (prefs.enabled) {
    await scheduleWeatherNotification(prefs.hour, prefs.minute);
  } else {
    const existingId = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
      await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
    }
  }
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const enabled = (await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY)) === 'true';
  const timeStr = await AsyncStorage.getItem(NOTIFICATION_TIME_KEY);
  const time = timeStr ? JSON.parse(timeStr) : { hour: 8, minute: 0 }; // Default to 8:00 AM

  return {
    enabled,
    hour: time.hour,
    minute: time.minute,
  };
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
} 
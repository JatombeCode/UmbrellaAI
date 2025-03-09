import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleWeatherNotification, saveNotificationPreferences, requestNotificationPermissions, cancelAllNotifications } from '../lib/notifications';

// Mock the modules
jest.mock('expo-notifications');
jest.mock('expo-location');
jest.mock('@react-native-async-storage/async-storage');

describe('Notification System', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock Location permissions and data with real coordinates for San Francisco
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { 
        latitude: 37.7749, // San Francisco coordinates
        longitude: -122.4194
      }
    });

    // Mock notification scheduling
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('test-notification-id');
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    // Mock AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === '@notification_id') return Promise.resolve(null);
      return Promise.resolve(null);
    });
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Notification Scheduling', () => {
    it('should schedule a notification with weather information', async () => {
      const notificationId = await scheduleWeatherNotification(8, 0);
      expect(notificationId).toBe('test-notification-id');

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            sound: true,
            title: expect.any(String),
            body: expect.any(String)
          }),
          trigger: expect.objectContaining({
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 8,
            minute: 0
          })
        })
      );

      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      expect(call.content.title).toMatch(/^(Take your umbrella! ☔️|No umbrella needed 🌤)$/);
      expect(call.content.body).toMatch(/^(It's going to rain today\.|Clear skies ahead!)$/);
    });

    it('should cancel existing notification before scheduling a new one', async () => {
      // Mock existing notification ID
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('existing-notification-id');

      await scheduleWeatherNotification(8, 0);

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('existing-notification-id');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it('should handle scheduling for next day if time has passed', async () => {
      // Set current time to 9:00 AM
      const realDate = Date;
      const currentDate = new Date();
      currentDate.setHours(9, 0, 0, 0);
      global.Date = class extends Date {
        constructor() {
          super();
          return currentDate;
        }
      } as any;

      await scheduleWeatherNotification(8, 0);

      // Verify the notification is scheduled for the next day
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      expect(call.trigger.hour).toBe(8);
      expect(call.trigger.minute).toBe(0);

      // Restore Date
      global.Date = realDate;
    });
  });

  describe('Notification Permissions', () => {
    it('should request permissions if not already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'undetermined' });
      
      const granted = await requestNotificationPermissions();
      
      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(granted).toBe(true);
    });

    it('should handle permission denial', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
      
      const granted = await requestNotificationPermissions();
      
      expect(granted).toBe(false);
    });
  });

  describe('Notification Preferences', () => {
    it('should save notification preferences correctly', async () => {
      const prefs = {
        enabled: true,
        hour: 8,
        minute: 0
      };

      await saveNotificationPreferences(prefs);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@notification_enabled', 'true');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@notification_time',
        JSON.stringify({ hour: 8, minute: 0 })
      );
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it('should cancel notifications when preferences are disabled', async () => {
      // Mock existing notification
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('existing-notification-id');

      const prefs = {
        enabled: false,
        hour: 8,
        minute: 0
      };

      await saveNotificationPreferences(prefs);

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('existing-notification-id');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@notification_id');
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const originalKey = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
      delete process.env.EXPO_PUBLIC_WEATHER_API_KEY;

      const notificationId = await scheduleWeatherNotification(8, 0);
      expect(notificationId).toBe('test-notification-id');

      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      expect(call.content.title).toBe('No umbrella needed 🌤');
      expect(call.content.body).toBe('Clear skies ahead!');

      process.env.EXPO_PUBLIC_WEATHER_API_KEY = originalKey;
    });

    it('should handle location permission denial', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });

      const notificationId = await scheduleWeatherNotification(8, 0);
      expect(notificationId).toBe('test-notification-id');

      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      expect(call.content.title).toBe('No umbrella needed 🌤');
      expect(call.content.body).toBe('Clear skies ahead!');
    });

    it('should handle failed weather API requests', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      const notificationId = await scheduleWeatherNotification(8, 0);
      expect(notificationId).toBe('test-notification-id');

      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      expect(call.content.title).toBe('No umbrella needed 🌤');
      expect(call.content.body).toBe('Clear skies ahead!');
    });
  });

  describe('Cleanup', () => {
    it('should cancel all notifications', async () => {
      await cancelAllNotifications();

      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@notification_id');
    });
  });
}); 
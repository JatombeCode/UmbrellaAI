import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Switch, useTheme, Button } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  NotificationPreferences,
  requestNotificationPermissions,
  saveNotificationPreferences,
  getNotificationPreferences,
} from '../../lib/notifications';

export default function NotificationSettings() {
  const theme = useTheme();
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [selectedTime, setSelectedTime] = React.useState(new Date());
  const [loading, setLoading] = React.useState(true);

  // Load saved preferences
  React.useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences();
      setIsEnabled(prefs.enabled);
      const date = new Date();
      date.setHours(prefs.hour);
      date.setMinutes(prefs.minute);
      setSelectedTime(date);
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSwitch = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newState = !isEnabled;
    
    if (newState) {
      const permissionGranted = await requestNotificationPermissions();
      if (!permissionGranted) {
        // Handle permission denied
        return;
      }
    }

    setIsEnabled(newState);
    await saveNotificationPreferences({
      enabled: newState,
      hour: selectedTime.getHours(),
      minute: selectedTime.getMinutes(),
    });
  };

  const handleTimeChange = async (event: any, date?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (date) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedTime(date);
      await saveNotificationPreferences({
        enabled: isEnabled,
        hour: date.getHours(),
        minute: date.getMinutes(),
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return null;
  }

  return (
    <View>
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <MaterialCommunityIcons
            name="bell"
            size={24}
            color={theme.colors.onSurface}
            style={styles.settingIcon}
          />
          <View>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
              Daily Weather Alert
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {isEnabled ? `Notify at ${formatTime(selectedTime)}` : 'Disabled'}
            </Text>
          </View>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={handleToggleSwitch}
          color={theme.colors.primary}
        />
      </View>

      {isEnabled && (
        <View style={styles.timePickerContainer}>
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              is24Hour={false}
              onChange={handleTimeChange}
              style={styles.timePicker}
            />
          ) : (
            <Button
              mode="outlined"
              onPress={() => setShowTimePicker(true)}
              style={styles.timeButton}
            >
              {formatTime(selectedTime)}
            </Button>
          )}

          {Platform.OS === 'android' && showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              is24Hour={false}
              onChange={handleTimeChange}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 16,
  },
  timePickerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start',
  },
  timePicker: {
    width: 120,
  },
  timeButton: {
    marginLeft: 40,
  },
}); 
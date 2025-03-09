import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, IconButton, Surface, Switch } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationSettings from './components/NotificationSettings';

export default function Settings() {
  const theme = useTheme();

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.onBackground}
            size={24}
            onPress={() => router.back()}
            testID="back-button"
          />
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
            Settings
          </Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Surface style={styles.section} elevation={0}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              Notifications
            </Text>
            <NotificationSettings />
          </Surface>

          <Surface style={styles.section} elevation={0}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              Locations
            </Text>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialCommunityIcons
                  name="map-marker-multiple"
                  size={24}
                  color={theme.colors.onSurface}
                  style={styles.settingIcon}
                />
                <View>
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                    Manage Locations
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Coming soon
                  </Text>
                </View>
              </View>
              <IconButton
                icon="chevron-right"
                iconColor={theme.colors.onSurfaceVariant}
                size={24}
                disabled
              />
            </View>
          </Surface>

          <Surface style={styles.section} elevation={0}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              About
            </Text>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialCommunityIcons
                  name="information"
                  size={24}
                  color={theme.colors.onSurface}
                  style={styles.settingIcon}
                />
                <View>
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                    Version
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    1.0.0
                  </Text>
                </View>
              </View>
            </View>
          </Surface>
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
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  title: {
    marginLeft: 8,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    marginBottom: 8,
    marginHorizontal: 16,
    marginTop: 8,
  },
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
}); 
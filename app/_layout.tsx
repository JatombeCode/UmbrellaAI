import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4299e1',
    secondary: '#03A9F4',
    background: '#1a1b1e',
    surface: '#1a1b1e',
    onBackground: '#ffffff',
    onSurface: '#ffffff',
    onSurfaceVariant: 'rgba(255, 255, 255, 0.7)',
  },
};

export default function Layout() {
  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(app)/settings" />
      </Stack>
    </PaperProvider>
  );
} 
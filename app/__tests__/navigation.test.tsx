import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import App from '../index';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
}));

// Mock other dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 0, longitude: 0 },
  }),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([{
    city: 'Test City',
    region: 'Test Region',
  }]),
}));

describe('Navigation Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should navigate to settings when gear icon is pressed', () => {
    const { getByTestId } = render(<App />);
    
    // Find and press the settings button
    const settingsButton = getByTestId('settings-button');
    fireEvent.press(settingsButton);

    // Verify that router.push was called with the correct path
    expect(router.push).toHaveBeenCalledWith('/settings');
  });

  it('should navigate back from settings when back button is pressed', () => {
    const { getByTestId } = render(<Settings />);
    
    // Find and press the back button
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);

    // Verify that router.back was called
    expect(router.back).toHaveBeenCalled();
  });
}); 
import React from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';
import { useTheme } from 'react-native-paper';

interface AnimatedBackgroundProps {
  weatherMain?: string;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ weatherMain = 'Clear' }) => {
  const theme = useTheme();
  const translateY = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 50,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, []);

  const getBackgroundElements = () => {
    switch (weatherMain) {
      case 'Clear':
        return Array(5).fill(null).map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.floatingElement,
              {
                transform: [{
                  translateY: translateY.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 50 + i * 10],
                  })
                }],
                opacity: 0.1,
                left: `${20 + i * 15}%`,
              }
            ]}
          >
            <View style={[styles.sun, { backgroundColor: 'white' }]} />
          </Animated.View>
        ));
      case 'Clouds':
        return Array(3).fill(null).map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.floatingElement,
              {
                transform: [{
                  translateY: translateY.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 30 + i * 15],
                  })
                }],
                opacity: 0.15,
                left: `${15 + i * 30}%`,
              }
            ]}
          >
            <View style={[styles.cloud, { backgroundColor: 'white' }]} />
          </Animated.View>
        ));
      default:
        return null;
    }
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {getBackgroundElements()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  floatingElement: {
    position: 'absolute',
    top: '10%',
  },
  sun: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cloud: {
    width: 120,
    height: 60,
    borderRadius: 30,
  },
});

export default AnimatedBackground; 
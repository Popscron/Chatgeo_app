import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RectangularOverlay = ({ 
  width = 120, 
  height = 40, 
  borderRadius = 8, 
  opacity = 0.7, 
  backgroundColor = 'white',
  position = 'absolute',
  top = 0,
  left = 0,
  zIndex = 9999,
  text = '',
  textColor = '#000',
  isDarkMode = false,
  style = {}
}) => {
  return (
    <View 
      style={[
        styles.overlay,
        {
          width,
          height,
          borderRadius,
          opacity,
          backgroundColor: isDarkMode ? '#1a1a1a' : '#f0f0f0',
          position,
          top,
          left,
          zIndex,
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingHorizontal: 12,
          // CSS equivalent: box-shadow: 0 4px 17px 15px #000;
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 15,
          elevation: 17,
        },
        style
      ]} 
    >
      {text && (
        <Text style={[styles.overlayText, { color: textColor }]}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    // Base overlay styles
  },
  overlayText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RectangularOverlay;

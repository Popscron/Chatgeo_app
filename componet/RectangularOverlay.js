import React from 'react';
import { View, StyleSheet } from 'react-native';

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
          backgroundColor,
          position,
          top,
          left,
          zIndex,
        },
        style
      ]} 
    />
  );
};

const styles = StyleSheet.create({
  overlay: {
    // Base overlay styles
  },
});

export default RectangularOverlay;

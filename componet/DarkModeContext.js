import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DarkModeContext = createContext();

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

export const DarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [manualOverride, setManualOverride] = useState(false);
  const systemColorScheme = useColorScheme();

  // Load dark mode preference from storage
  useEffect(() => {
    loadDarkModePreference();
  }, []);

  // Update dark mode when system color scheme changes (if not manually overridden)
  useEffect(() => {
    if (!manualOverride) {
      const systemIsDark = systemColorScheme === 'dark';
      setIsDarkMode(systemIsDark);
    }
  }, [systemColorScheme, manualOverride]);

  const loadDarkModePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('darkMode');
      const savedOverride = await AsyncStorage.getItem('darkModeManualOverride');
      
      if (savedOverride !== null) {
        setManualOverride(JSON.parse(savedOverride));
      }
      
      if (savedMode !== null) {
        const savedDarkMode = JSON.parse(savedMode);
        setIsDarkMode(savedDarkMode);
        setManualOverride(true); // If user has a saved preference, it's a manual override
      } else {
        // No saved preference, follow system
        const systemIsDark = systemColorScheme === 'dark';
        setIsDarkMode(systemIsDark);
        setManualOverride(false);
      }
    } catch (error) {
      console.error('Error loading dark mode preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      setManualOverride(true); // User manually toggled, so override system
      await AsyncStorage.setItem('darkMode', JSON.stringify(newMode));
      await AsyncStorage.setItem('darkModeManualOverride', JSON.stringify(true));
      console.log('Manual dark mode toggle:', newMode);
    } catch (error) {
      console.error('Error saving dark mode preference:', error);
    }
  };

  const resetToSystemMode = async () => {
    try {
      const systemIsDark = systemColorScheme === 'dark';
      setIsDarkMode(systemIsDark);
      setManualOverride(false);
      await AsyncStorage.removeItem('darkMode');
      await AsyncStorage.removeItem('darkModeManualOverride');
    } catch (error) {
      console.error('Error resetting to system mode:', error);
    }
  };


  const value = {
    isDarkMode,
    setIsDarkMode,
    setManualOverride,
    toggleDarkMode,
    resetToSystemMode,
    manualOverride,
    systemColorScheme,
    isLoading,
  };

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
};

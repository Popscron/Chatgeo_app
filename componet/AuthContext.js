import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Dimensions } from 'react-native';
import * as Device from 'expo-device';
import { mobileSupabaseHelpers } from '../config/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);


  // Get device information
  const getDeviceInfo = async () => {
    try {
      const deviceId = await Device.getDeviceIdAsync();
      
      // Create a better device name
      let deviceName = 'Unknown Device';
      
      // Try to get device name from various sources
      if (Device.deviceName && Device.deviceName !== 'Unknown') {
        deviceName = Device.deviceName;
      } else if (Device.modelName && Device.modelName !== 'Unknown') {
        deviceName = Device.modelName;
      } else {
        // Generate device name based on available info
        const { width, height } = Dimensions.get('window');
        const brand = Device.brand || '';
        
        if (Platform.OS === 'ios') {
          // Try to identify iPhone model based on screen dimensions
          if (width === 375 && height === 812) {
            deviceName = 'iPhone X/XS/11 Pro';
          } else if (width === 414 && height === 896) {
            deviceName = 'iPhone XR/11';
          } else if (width === 390 && height === 844) {
            deviceName = 'iPhone 12/13/14';
          } else if (width === 393 && height === 852) {
            deviceName = 'iPhone 14 Pro';
          } else if (width === 430 && height === 932) {
            deviceName = 'iPhone 14 Pro Max';
          } else {
            deviceName = brand ? `${brand} iPhone` : 'iPhone';
          }
        } else if (Platform.OS === 'android') {
          deviceName = brand ? `${brand} Android` : 'Android Device';
        }
      }
      
      const deviceInfo = {
        deviceId: deviceId,
        deviceName: deviceName,
        deviceType: Device.deviceType === Device.DeviceType.PHONE ? 'mobile' : 
                   Device.deviceType === Device.DeviceType.TABLET ? 'tablet' : 'unknown',
        platform: Platform.OS,
        osVersion: Device.osVersion || 'Unknown',
        appVersion: '1.1.3',
        screenWidth: Dimensions.get('window').width,
        screenHeight: Dimensions.get('window').height,
        isDevice: Device.isDevice,
        brand: Device.brand || 'Unknown',
        modelName: Device.modelName || 'Unknown'
      };
      
      return deviceInfo;
    } catch (error) {
      console.error('Error getting device info:', error);
      return {
        deviceId: 'unknown',
        deviceName: 'Unknown Device',
        deviceType: 'mobile',
        platform: Platform.OS,
        osVersion: 'Unknown',
        appVersion: '1.1.3',
        screenWidth: 0,
        screenHeight: 0,
        isDevice: false,
        brand: 'Unknown',
        modelName: 'Unknown'
      };
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user_data');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setIsAuthenticated(true);
        setUser(userData);
        
        // Log login activity
        await mobileSupabaseHelpers.logActivity(userData.id, 'login');
        await mobileSupabaseHelpers.updateAnalytics(userData.id, 'login');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (number, password) => {
    try {
      // Try Supabase authentication
      const result = await mobileSupabaseHelpers.authenticateUser(number, password);
      
      if (result.success) {
        // Check subscription status
        const subscription = await mobileSupabaseHelpers.checkSubscription(result.user.id);
        
        if (!subscription.hasActiveSubscription) {
          return {
            success: false,
            error: 'Your subscription has expired. Please contact support.'
          };
        }

        // Store user data
        await AsyncStorage.setItem('user_data', JSON.stringify(result.user));
        setIsAuthenticated(true);
        setUser(result.user);
        
        // Get device information and track login
        const deviceInfo = await getDeviceInfo();
        
        // If device name is still unknown, use phone number as identifier
        if (deviceInfo.deviceName === 'Unknown Device') {
          deviceInfo.deviceName = `${result.user.phone} Device`;
        }
        
        await mobileSupabaseHelpers.trackDeviceLogin(result.user.id, deviceInfo);
        await mobileSupabaseHelpers.logActivity(result.user.id, 'login');
        await mobileSupabaseHelpers.updateAnalytics(result.user.id, 'login');
        
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Invalid credentials. Please check your number and password.'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Login failed. Please try again.' 
      };
    }
  };

  const logout = async () => {
    try {
      // Log logout activity if user exists
      if (user && user.id !== 'demo-user') {
        await mobileSupabaseHelpers.logActivity(user.id, 'logout');
      }
      
      await AsyncStorage.removeItem('user_data');
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

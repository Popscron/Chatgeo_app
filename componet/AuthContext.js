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
      // Use Device.getDeviceIdAsync() if available, otherwise generate a fallback
      let deviceId = 'unknown';
      try {
        deviceId = await Device.getDeviceIdAsync();
      } catch (error) {
        console.log('Device.getDeviceIdAsync not available, using fallback');
        // Generate a fallback device ID based on available info
        deviceId = `${Platform.OS}-${Date.now()}`;
      }
      
      // Create a better device name
      let deviceName = 'Unknown Device';
      
      // Debug: Log all device info
      console.log('=== DEVICE INFO DEBUG ===');
      console.log('Device.deviceName:', Device.deviceName);
      console.log('Device.modelName:', Device.modelName);
      console.log('Device.brand:', Device.brand);
      console.log('Device.deviceType:', Device.deviceType);
      console.log('Device.isDevice:', Device.isDevice);
      console.log('Platform.OS:', Platform.OS);
      console.log('Platform.Version:', Platform.Version);
      console.log('Screen dimensions:', Dimensions.get('window'));
      console.log('========================');
      
      // Try to get device name from various sources - prioritize modelName over deviceName
      if (Device.modelName && Device.modelName !== 'Unknown' && Device.modelName !== '') {
        deviceName = Device.modelName;
        console.log('Using Device.modelName:', deviceName);
      } else if (Device.deviceName && Device.deviceName !== 'Unknown' && Device.deviceName !== '') {
        deviceName = Device.deviceName;
        console.log('Using Device.deviceName:', deviceName);
      } else {
        console.log('Neither deviceName nor modelName available, generating...');
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
          } else if (width === 428 && height === 926) {
            deviceName = 'iPhone 12/13/14 Pro Max';
          } else if (width === 320 && height === 568) {
            deviceName = 'iPhone 5/5s/5c/SE';
          } else if (width === 375 && height === 667) {
            deviceName = 'iPhone 6/6s/7/8';
          } else if (width === 414 && height === 736) {
            deviceName = 'iPhone 6/6s/7/8 Plus';
          } else {
            deviceName = brand ? `${brand} iPhone` : 'iPhone';
          }
        } else if (Platform.OS === 'android') {
          // Try to identify Android device based on screen dimensions and brand
          if (brand && brand !== 'Unknown') {
            if (width >= 400 && height >= 800) {
              deviceName = `${brand} Galaxy S Series`;
            } else if (width >= 350 && height >= 700) {
              deviceName = `${brand} Galaxy A Series`;
            } else {
              deviceName = `${brand} Android`;
            }
          } else {
            deviceName = 'Android Device';
          }
        } else {
          deviceName = `${Platform.OS} Device`;
        }
        console.log('Generated device name:', deviceName);
      }
      
      console.log('FINAL DEVICE NAME:', deviceName);
      
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

        // Get device information and track login with multi-device detection
        const deviceInfo = await getDeviceInfo();
        
        // If device name is still unknown, use phone number as identifier
        if (deviceInfo.deviceName === 'Unknown Device' || deviceInfo.deviceName === 'Unknown') {
          deviceInfo.deviceName = `${result.user.phone} Device`;
          console.log('Using phone number as device name:', deviceInfo.deviceName);
        }
        
        // Track device login and check for conflicts
        console.log('🔍 Starting device tracking for user:', result.user.id, 'device:', deviceInfo.deviceId);
        const deviceResult = await mobileSupabaseHelpers.trackDeviceLogin(result.user.id, deviceInfo);
        
        console.log('🔍 Device tracking result:', deviceResult);
        
        // If there was a device conflict, block the login
        if (deviceResult.hasConflict) {
          console.log('❌ Device conflict detected - blocking login');
          return {
            success: false,
            error: deviceResult.error
          };
        }
        
        // Check if there's an approved login request after device tracking
        const loginRequestResult = await mobileSupabaseHelpers.checkLoginRequest(result.user.id, deviceInfo.deviceId);
        
        if (loginRequestResult.hasApprovedRequest) {
          console.log('✅ Approved login request found - proceeding with login');
          // Mark the request as used
          await mobileSupabaseHelpers.markLoginRequestUsed(loginRequestResult.request.id);
        }
        
        // Only set authentication state after all checks pass
        await AsyncStorage.setItem('user_data', JSON.stringify(result.user));
        setIsAuthenticated(true);
        setUser(result.user);
        
        // Log activity and analytics
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
        
        // Mark device session as inactive
        const deviceInfo = await getDeviceInfo();
        await mobileSupabaseHelpers.deactivateDeviceSession(user.id, deviceInfo.deviceId);
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

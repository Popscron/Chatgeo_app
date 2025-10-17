import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useDarkMode } from './DarkModeContext';
import { useAuth } from './AuthContext';
import { mobileSupabaseHelpers } from '../config/supabase';
import ImportExportModal from './importexport';

const UserDashboard = ({ onClose, messages, contactName, profileImageUri, onImport, onImportContact, onImportProfileImage, selectedBackground, onBackgroundSelect, customBackgroundUri: propCustomBackgroundUri, onCustomBackgroundChange }) => {
  const { isDarkMode, setIsDarkMode, setManualOverride, toggleDarkMode, resetToSystemMode, manualOverride, systemColorScheme } = useDarkMode();
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [customBackgroundUri, setCustomBackgroundUri] = useState(propCustomBackgroundUri);
  const [screenshotCount, setScreenshotCount] = useState(0);
  const dynamicStyles = getDynamicStyles(isDarkMode);

  useEffect(() => {
    loadUserData();
    loadNotificationPreference();
    loadMediaCounts();
  }, [user]);

  const loadUserData = async () => {
    if (!user || !user.id) return;

    try {
      setLoading(true);
      
      // Load user profile data
      const userResult = await mobileSupabaseHelpers.getUserProfile(user.id);
      if (userResult.success && userResult.data) {
        setUserData(userResult.data);
      } else {
        console.error('Error loading user data:', userResult.error);
        Alert.alert('Error', 'Failed to load user data');
      }

      // Load subscription data
      const subscriptionResult = await mobileSupabaseHelpers.getUserSubscription(user.id);
      if (subscriptionResult.success) {
        setSubscriptionData(subscriptionResult.data);
      } else {
        console.error('Error loading subscription data:', subscriptionResult.error);
        // Don't show alert for subscription errors as user might not have one
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };


  const loadNotificationPreference = async () => {
    try {
      const stored = await AsyncStorage.getItem('notificationsEnabled');
      if (stored !== null) {
        setNotificationsEnabled(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading notification preference:', error);
    }
  };

  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    
    try {
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(newValue));
      console.log('Notification preference saved:', newValue);
    } catch (error) {
      console.error('Error saving notification preference:', error);
    }
  };

  const loadMediaCounts = async () => {
    try {
      const storedScreenshots = await AsyncStorage.getItem('screenshotCount');
      
      if (storedScreenshots !== null) {
        setScreenshotCount(parseInt(storedScreenshots) || 0);
      }
    } catch (error) {
      console.error('Error loading screenshot count:', error);
    }
  };


  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    await loadNotificationPreference();
    await loadMediaCounts();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: logout }
      ]
    );
  };

  // Background options
  const backgroundOptions = [
    { id: "defualtbg", name: "Default", preview: require('../assets/defualtbg.jpg') },
    { id: "darkdefaultbg", name: "Dark Mode", preview: require('../assets/darkdefaultbg.png') },
    { id: "gradient1", name: "Gradient 1", preview: "https://images.unsplash.com/photo-1557683316-973673baf926?w=100&h=200&fit=crop" },
    { id: "gradient2", name: "Gradient 2", preview: "https://images.unsplash.com/photo-1557683311-eac922247aa9?w=100&h=200&fit=crop" },
    { id: "custom", name: "Custom Image", preview: customBackgroundUri, isCustom: true },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'disabled':
        return '#ef4444';
      case 'suspended':
        return '#f59e0b';
      case 'expired':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const pickCustomBackground = async () => {
    try {
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access camera roll is required!");
        return;
      }

      // Launch image picker without editing/cropping
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // No auto-cropping
        quality: 0.8,
        aspect: undefined, // No aspect ratio restrictions
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setCustomBackgroundUri(imageUri);
        
        // Notify parent component of custom background change
        if (onCustomBackgroundChange) {
          onCustomBackgroundChange(imageUri);
        }
        
        // Apply the custom background immediately
        if (onBackgroundSelect) {
          onBackgroundSelect("custom");
        }
        
        setShowBackgroundModal(false);
        Alert.alert("Success", "Custom background applied!");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
      console.error("Custom background picker error:", error);
    }
  };

  // Handle custom background changes from parent
  useEffect(() => {
    if (propCustomBackgroundUri !== customBackgroundUri) {
      setCustomBackgroundUri(propCustomBackgroundUri);
    }
  }, [propCustomBackgroundUri]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return 'checkmark-circle';
      case 'disabled':
        return 'close-circle';
      case 'suspended':
        return 'pause-circle';
      case 'expired':
        return 'time-outline';
      default:
        return 'help-circle';
    }
  };

  const getSubscriptionStatus = () => {
    if (!userData) return 'Unknown';
    
    const status = userData.status;
    switch (status) {
      case 'active':
        return 'Active';
      case 'disabled':
        return 'Disabled';
      case 'suspended':
        return 'Suspended';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const renderInfoCard = (title, value, icon, color = '#25D366') => (
    <View style={[styles.infoCard, dynamicStyles.infoCard]}>
      <View style={[styles.infoIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="white" />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoTitle, dynamicStyles.infoTitle]}>{title}</Text>
        <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{value}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={[styles.loadingText, dynamicStyles.loadingText]}>
            Loading dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onClose}
        >
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>
          My Dashboard
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadUserData}
        >
          <Ionicons name="refresh" size={24} color={isDarkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={[styles.section, dynamicStyles.section]}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            Profile Information
          </Text>
          
          {renderInfoCard(
            'Username',
            userData?.username || 'Not set',
            'person',
            '#3b82f6'
          )}
          
          {renderInfoCard(
            'Phone',
            userData?.phone || 'Not set',
            'call',
            '#06b6d4'
          )}
        </View>

        {/* Subscription Status Section */}
        <View style={[styles.section, dynamicStyles.section]}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            Subscription Status
          </Text>
          
          <View style={[styles.statusCard, dynamicStyles.statusCard]}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusIcon, { backgroundColor: getStatusColor(userData?.status) }]}>
                <Ionicons 
                  name={getStatusIcon(userData?.status)} 
                  size={32} 
                  color="white" 
                />
              </View>
              <View style={styles.statusInfo}>
                <Text style={[styles.statusTitle, dynamicStyles.statusTitle]}>
                  {getSubscriptionStatus()}
                </Text>
                <Text style={[styles.statusSubtitle, dynamicStyles.statusSubtitle]}>
                  Account Status
                </Text>
              </View>
            </View>
            
            <View style={[styles.statusDetails, dynamicStyles.statusDetails]}>
              <Text style={[styles.statusDescription, dynamicStyles.statusDescription]}>
                {userData?.status === 'active' 
                  ? 'Your account is active and you have full access to MiniChat features.'
                  : userData?.status === 'disabled'
                  ? 'Your account has been disabled. Please contact support for assistance.'
                  : userData?.status === 'suspended'
                  ? 'Your account is temporarily suspended. Please contact support for more information.'
                  : userData?.status === 'expired'
                  ? 'Your subscription has expired. Please renew to continue using MiniChat.'
                  : 'Unable to determine account status.'
                }
              </Text>
            </View>
          </View>

          {/* Subscription Details */}
          {subscriptionData && (
            <View style={[styles.subscriptionCard, dynamicStyles.subscriptionCard]}>
              <Text style={[styles.subscriptionTitle, dynamicStyles.subscriptionTitle]}>
                Subscription Details
              </Text>
              
              {renderInfoCard(
                'Subscription Status',
                subscriptionData.status || 'Unknown',
                'card',
                subscriptionData.status === 'active' ? '#10b981' : '#ef4444'
              )}
              
              {renderInfoCard(
                'Start Date',
                formatDate(subscriptionData.start_date),
                'calendar',
                '#3b82f6'
              )}
              
              {renderInfoCard(
                'End Date',
                formatDate(subscriptionData.end_date),
                'calendar',
                '#f59e0b'
              )}
              
              {renderInfoCard(
                'Days Remaining',
                subscriptionData.days_remaining?.toString() || '0',
                'time',
                '#8b5cf6'
              )}
            </View>
          )}
        </View>

        {/* Account Details Section */}
        <View style={[styles.section, dynamicStyles.section]}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            Account Details
          </Text>
          
          {renderInfoCard(
            'Member Since',
            formatDate(userData?.created_at),
            'calendar',
            '#f59e0b'
          )}
          
          {renderInfoCard(
            'Last Updated',
            formatDate(userData?.updated_at),
            'time',
            '#10b981'
          )}
          
          {renderInfoCard(
            'Last Active',
            formatDate(userData?.last_active),
            'pulse',
            '#f59e0b'
          )}
          
          
          {renderInfoCard(
            'Screenshots Taken',
            screenshotCount.toString(),
            'camera',
            '#8b5cf6'
          )}

          
        </View>

        {/* Notification Settings Section */}
        <View style={[styles.section, dynamicStyles.section]}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            Notification Settings
          </Text>
          
          <View style={[styles.toggleCard, dynamicStyles.toggleCard]}>
            <View style={styles.toggleContent}>
              <View style={styles.toggleIcon}>
                <Ionicons 
                  name={notificationsEnabled ? "notifications" : "notifications-off"} 
                  size={24} 
                  color={notificationsEnabled ? "#25D366" : "#ef4444"} 
                />
              </View>
              <View style={styles.toggleText}>
                <Text style={[styles.toggleTitle, dynamicStyles.toggleTitle]}>
                  App Notifications
                </Text>
                <Text style={[styles.toggleSubtitle, dynamicStyles.toggleSubtitle]}>
                  {notificationsEnabled 
                    ? "Receive update notifications and alerts" 
                    : "All notifications are disabled"
                  }
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleSwitch,
                  { backgroundColor: notificationsEnabled ? "#25D366" : "#ccc" }
                ]}
                onPress={toggleNotifications}
              >
                <View style={[
                  styles.toggleThumb,
                  { transform: [{ translateX: notificationsEnabled ? 20 : 2 }] }
                ]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Dark Mode Settings Section */}
        <View style={[styles.section, dynamicStyles.section]}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            Appearance
          </Text>
          
          <View style={[styles.toggleCard, dynamicStyles.toggleCard]}>
            <View style={styles.toggleContent}>
              <View style={styles.toggleIcon}>
                <Ionicons 
                  name={isDarkMode ? "moon" : "sunny"} 
                  size={24} 
                  color={isDarkMode ? "#6366f1" : "#f59e0b"} 
                />
              </View>
              <View style={styles.toggleText}>
                <Text style={[styles.toggleTitle, dynamicStyles.toggleTitle]}>
                  Dark Mode
                </Text>
                <Text style={[styles.toggleSubtitle, dynamicStyles.toggleSubtitle]}>
                  {manualOverride 
                    ? (isDarkMode ? "Manual: Dark theme" : "Manual: Light theme")
                    : `Following system: ${systemColorScheme === 'dark' ? 'Dark' : 'Light'}`
                  }
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleSwitch,
                  { backgroundColor: isDarkMode ? "#6366f1" : "#ccc" }
                ]}
                onPress={toggleDarkMode}
              >
                <View style={[
                  styles.toggleThumb,
                  { transform: [{ translateX: isDarkMode ? 20 : 2 }] }
                ]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Reset to System Mode Button */}
          {manualOverride && (
            <TouchableOpacity 
              style={[styles.resetSystemButton, dynamicStyles.resetSystemButton]}
              onPress={() => {
                Alert.alert(
                  "Reset to System Mode",
                  "This will make the app follow your phone's dark mode setting automatically.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { 
                      text: "Reset", 
                      onPress: resetToSystemMode
                    }
                  ]
                );
              }}
            >
              <Ionicons name="refresh-outline" size={16} color="#6366f1" />
              <Text style={[styles.resetSystemButtonText, dynamicStyles.resetSystemButtonText]}>
                Reset to System Mode
              </Text>
            </TouchableOpacity>
          )}

        </View>

        {/* Chat Background Section */}
        <View style={[styles.section, dynamicStyles.section]}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            Chat Background
          </Text>
          
          <TouchableOpacity 
            style={[styles.actionCard, dynamicStyles.actionCard]}
            onPress={() => setShowBackgroundModal(true)}
          >
            <View style={styles.actionContent}>
              <View style={styles.actionIcon}>
                <Ionicons name="image-outline" size={24} color="#8b5cf6" />
              </View>
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, dynamicStyles.actionTitle]}>
                  Change Background
                </Text>
                <Text style={[styles.actionSubtitle, dynamicStyles.actionSubtitle]}>
                  Customize your chat appearance
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Import/Export Section */}
        <View style={[styles.section, dynamicStyles.section]}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            Data Management
          </Text>
          
          <TouchableOpacity 
            style={[styles.actionCard, dynamicStyles.actionCard]}
            onPress={() => setShowImportExport(true)}
          >
            <View style={styles.actionContent}>
              <View style={styles.actionIcon}>
                <Ionicons name="download-outline" size={24} color="#10b981" />
              </View>
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, dynamicStyles.actionTitle]}>
                  Import/Export Chat
                </Text>
                <Text style={[styles.actionSubtitle, dynamicStyles.actionSubtitle]}>
                  Backup or restore your chat data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={[styles.section, dynamicStyles.section]}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            Support
          </Text>
          
          <TouchableOpacity style={[styles.supportCard, dynamicStyles.supportCard]}>
            <View style={styles.supportIcon}>
              <Ionicons name="help-circle" size={24} color="#25D366" />
            </View>
            <View style={styles.supportContent}>
              <Text style={[styles.supportTitle, dynamicStyles.supportTitle]}>
                Need Help?
              </Text>
              <Text style={[styles.supportSubtitle, dynamicStyles.supportSubtitle]}>
                Contact our support team for assistance
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#ccc" : "#666"} />
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={[styles.section, dynamicStyles.section]}>
          <TouchableOpacity 
            style={[styles.logoutButton, dynamicStyles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Import/Export Modal */}
      <ImportExportModal
        visible={showImportExport}
        onClose={() => setShowImportExport(false)}
        messages={messages}
        onImport={onImport}
        contactName={contactName}
        onImportContact={onImportContact}
        profileImageUri={profileImageUri}
        onImportProfileImage={onImportProfileImage}
      />

      {/* Background Selection Modal */}
      <Modal
        visible={showBackgroundModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBackgroundModal(false)}
      >
        <View style={styles.backgroundModalOverlay}>
          <View style={[styles.backgroundModal, dynamicStyles.backgroundModal]}>
            <View style={styles.backgroundModalHeader}>
              <Text style={[styles.backgroundModalTitle, dynamicStyles.backgroundModalTitle]}>
                Choose Background
              </Text>
              <TouchableOpacity 
                onPress={() => setShowBackgroundModal(false)}
                style={styles.backgroundModalClose}
              >
                <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.backgroundGrid}>
              {backgroundOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.backgroundOption,
                    dynamicStyles.backgroundOption,
                    selectedBackground === option.id && styles.selectedBackgroundOption
                  ]}
                  onPress={() => {
                    if (option.id === "custom") {
                      pickCustomBackground();
                    } else {
                      if (onBackgroundSelect) {
                        onBackgroundSelect(option.id);
                      }
                      setShowBackgroundModal(false);
                    }
                  }}
                >
                  <View style={styles.backgroundPreview}>
                    {option.isCustom ? (
                      option.preview ? (
                        <Image source={{ uri: option.preview }} style={styles.backgroundImage} />
                      ) : (
                        <View style={styles.customBackgroundPlaceholder}>
                          <Ionicons name="camera" size={30} color="#25D366" />
                          <Text style={styles.customBackgroundText}>Add Photo</Text>
                        </View>
                      )
                    ) : typeof option.preview === 'string' ? (
                      <Image source={{ uri: option.preview }} style={styles.backgroundImage} />
                    ) : (
                      <Image source={option.preview} style={styles.backgroundImage} />
                    )}
                  </View>
                  <Text style={[styles.backgroundName, dynamicStyles.backgroundName]}>
                    {option.name}
                  </Text>
                  {selectedBackground === option.id && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getDynamicStyles = (isDarkMode) => StyleSheet.create({
  container: {
    backgroundColor: isDarkMode ? '#000000' : '#ffffff',
  },
  header: {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
    borderBottomColor: isDarkMode ? '#333' : '#e0e0e0',
  },
  headerTitle: {
    color: isDarkMode ? '#fff' : '#000',
  },
  loadingText: {
    color: isDarkMode ? '#fff' : '#000',
  },
  section: {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
  },
  sectionTitle: {
    color: isDarkMode ? '#fff' : '#000',
  },
  infoCard: {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
    borderColor: isDarkMode ? '#333' : '#e0e0e0',
  },
  infoTitle: {
    color: isDarkMode ? '#ccc' : '#666',
  },
  infoValue: {
    color: isDarkMode ? '#fff' : '#000',
  },
  statusCard: {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
    borderColor: isDarkMode ? '#333' : '#e0e0e0',
  },
  statusTitle: {
    color: isDarkMode ? '#fff' : '#000',
  },
  statusSubtitle: {
    color: isDarkMode ? '#ccc' : '#666',
  },
  statusDetails: {
    backgroundColor: isDarkMode ? '#0a0a0a' : '#f8f9fa',
  },
  statusDescription: {
    color: isDarkMode ? '#ccc' : '#666',
  },
  supportCard: {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
    borderColor: isDarkMode ? '#333' : '#e0e0e0',
  },
  supportTitle: {
    color: isDarkMode ? '#fff' : '#000',
  },
  supportSubtitle: {
    color: isDarkMode ? '#ccc' : '#666',
  },
  subscriptionCard: {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
    borderColor: isDarkMode ? '#333' : '#e0e0e0',
  },
  subscriptionTitle: {
    color: isDarkMode ? '#fff' : '#000',
  },
  toggleCard: {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
    borderColor: isDarkMode ? '#333' : '#e0e0e0',
  },
  toggleTitle: {
    color: isDarkMode ? '#fff' : '#000',
  },
  toggleSubtitle: {
    color: isDarkMode ? '#ccc' : '#666',
  },
  actionCard: {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
    borderColor: isDarkMode ? '#333' : '#e0e0e0',
  },
  actionTitle: {
    color: isDarkMode ? '#fff' : '#000',
  },
  actionSubtitle: {
    color: isDarkMode ? '#ccc' : '#666',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
  },
  backgroundModal: {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
  },
  backgroundModalTitle: {
    color: isDarkMode ? '#fff' : '#000',
  },
  backgroundOption: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa',
    borderColor: isDarkMode ? '#333' : '#e0e0e0',
  },
  backgroundName: {
    color: isDarkMode ? '#fff' : '#000',
  },
  resetSystemButton: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa',
    borderColor: isDarkMode ? '#444' : '#e0e0e0',
  },
  resetSystemButtonText: {
    color: isDarkMode ? '#6366f1' : '#6366f1',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
  },
  statusDetails: {
    padding: 16,
    borderRadius: 8,
  },
  statusDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportIcon: {
    marginRight: 16,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  supportSubtitle: {
    fontSize: 14,
  },
  subscriptionCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  toggleCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleIcon: {
    marginRight: 16,
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 14,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  bottomSpacing: {
    height: 32,
  },
  actionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backgroundModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backgroundModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  backgroundModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backgroundModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backgroundModalClose: {
    padding: 4,
  },
  backgroundGrid: {
    flex: 1,
    padding: 20,
  },
  backgroundOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    position: 'relative',
  },
  backgroundPreview: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  customBackgroundPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#25D366',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  customBackgroundText: {
    fontSize: 10,
    color: '#25D366',
    fontWeight: '600',
    marginTop: 4,
  },
  backgroundName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedBackgroundOption: {
    borderColor: '#25D366',
    borderWidth: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#25D366',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetSystemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
    gap: 6,
  },
  resetSystemButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default UserDashboard;

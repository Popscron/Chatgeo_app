import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDarkMode } from './DarkModeContext';

const DisabledUserScreen = ({ navigation }) => {
  const { isDarkMode } = useDarkMode();
  const dynamicStyles = getDynamicStyles(isDarkMode);

  const handleContactSupport = () => {
    // You can implement contact support functionality here
    console.log('Contact support pressed');
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, dynamicStyles.iconContainer]}>
          <Ionicons 
            name="ban" 
            size={80} 
            color={isDarkMode ? "#ef4444" : "#dc2626"} 
          />
        </View>

        {/* Title */}
        <Text style={[styles.title, dynamicStyles.title]}>
          Account Disabled
        </Text>

        {/* Message */}
        <Text style={[styles.message, dynamicStyles.message]}>
          Your account has been disabled by the administrator. You are no longer able to access ChatGeo.
        </Text>

        {/* Details */}
        <View style={[styles.detailsContainer, dynamicStyles.detailsContainer]}>
          <Text style={[styles.detailsTitle, dynamicStyles.detailsTitle]}>
            What this means:
          </Text>
          <Text style={[styles.detailsText, dynamicStyles.detailsText]}>
            • You cannot send or receive messages{'\n'}
            • Your account data is preserved{'\n'}
            • You can contact support for assistance
          </Text>
        </View>

        {/* Contact Support Button */}
        <TouchableOpacity
          style={[styles.supportButton, dynamicStyles.supportButton]}
          onPress={handleContactSupport}
        >
          <Ionicons name="mail" size={20} color="white" />
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={[styles.footer, dynamicStyles.footer]}>
          If you believe this is an error, please contact our support team.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const getDynamicStyles = (isDarkMode) => StyleSheet.create({
  container: {
    backgroundColor: isDarkMode ? '#000000' : '#ffffff',
  },
  iconContainer: {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#fef2f2',
  },
  title: {
    color: isDarkMode ? '#fff' : '#000',
  },
  message: {
    color: isDarkMode ? '#ccc' : '#666',
  },
  detailsContainer: {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9',
    borderColor: isDarkMode ? '#333' : '#e0e0e0',
  },
  detailsTitle: {
    color: isDarkMode ? '#fff' : '#000',
  },
  detailsText: {
    color: isDarkMode ? '#ccc' : '#666',
  },
  supportButton: {
    backgroundColor: isDarkMode ? '#ef4444' : '#dc2626',
  },
  footer: {
    color: isDarkMode ? '#999' : '#999',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  detailsContainer: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 32,
    width: '100%',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  supportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default DisabledUserScreen;

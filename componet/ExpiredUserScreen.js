import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDarkMode } from './DarkModeContext';

const ExpiredUserScreen = ({ navigation }) => {
  const { isDarkMode } = useDarkMode();
  const dynamicStyles = getDynamicStyles(isDarkMode);

  const handleContactSupport = () => {
    // You can implement contact support functionality here
    console.log('Contact support pressed');
  };

  const handleRenewSubscription = () => {
    // You can implement subscription renewal functionality here
    console.log('Renew subscription pressed');
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, dynamicStyles.iconContainer]}>
          <Ionicons 
            name="time-outline" 
            size={80} 
            color={isDarkMode ? "#6b7280" : "#6b7280"} 
          />
        </View>

        {/* Title */}
        <Text style={[styles.title, dynamicStyles.title]}>
          Subscription Expired
        </Text>

        {/* Message */}
        <Text style={[styles.message, dynamicStyles.message]}>
          Your ChatGeo subscription has expired. Please renew to continue using the service.
        </Text>

        {/* Details */}
        <View style={[styles.detailsContainer, dynamicStyles.detailsContainer]}>
          <Text style={[styles.detailsTitle, dynamicStyles.detailsTitle]}>
            What this means:
          </Text>
          <Text style={[styles.detailsText, dynamicStyles.detailsText]}>
            • Your subscription period has ended{'\n'}
            • You need to renew to continue using ChatGeo{'\n'}
            • Your data is safe and will be restored upon renewal
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.renewButton, dynamicStyles.renewButton]}
            onPress={handleRenewSubscription}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.renewButtonText}>Renew Subscription</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.supportButton, dynamicStyles.supportButton]}
            onPress={handleContactSupport}
          >
            <Ionicons name="mail" size={20} color="white" />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={[styles.footer, dynamicStyles.footer]}>
          Need help? Contact our support team for assistance with your subscription.
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
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9',
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
  renewButton: {
    backgroundColor: isDarkMode ? '#25D366' : '#25D366',
  },
  supportButton: {
    backgroundColor: isDarkMode ? '#6b7280' : '#6b7280',
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
  buttonContainer: {
    width: '100%',
    marginBottom: 24,
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  renewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
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

export default ExpiredUserScreen;

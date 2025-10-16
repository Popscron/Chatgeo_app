import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import WhatsAppChat from '../chatscreen';
import LoginScreen from '../LoginScreen';
import { DarkModeProvider } from '../DarkModeContext';
import { AuthProvider, useAuth } from '../AuthContext';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
      </View>
    );
  }

  if (isAuthenticated) {
    return (
      <DarkModeProvider>
        <WhatsAppChat />
      </DarkModeProvider>
    );
  }

  return <LoginScreen />;
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

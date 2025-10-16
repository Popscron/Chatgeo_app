import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import WhatsAppChat from '../componet/chatscreen';
import LoginScreen from '../componet/LoginScreen';
import { DarkModeProvider } from '../componet/DarkModeContext';
import { AuthProvider, useAuth } from '../componet/AuthContext';

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

import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Image,
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const ChatBackground = ({ 
  visible, 
  onClose, 
  selectedBackground, 
  onBackgroundSelect,
  customBackgroundUri,
  onCustomBackgroundChange 
}) => {
  const backgroundOptions = [
    { id: "default", name: "Default", uri: null },
    { id: "gradient1", name: "Blue Gradient", uri: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=800&fit=crop" },
    { id: "gradient2", name: "Purple Gradient", uri: "https://images.unsplash.com/photo-1557683311-eac922247aa9?w=400&h=800&fit=crop" },
    { id: "gradient3", name: "Green Gradient", uri: "https://images.unsplash.com/photo-1557683304-673a23048d34?w=400&h=800&fit=crop" },
    { id: "pattern1", name: "Abstract Pattern", uri: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=800&fit=crop" },
    { id: "pattern2", name: "Geometric", uri: "https://images.unsplash.com/photo-1557683304-673a23048d34?w=400&h=800&fit=crop" },
    { id: "custom", name: "Custom Image", uri: customBackgroundUri },
  ];

  const selectBackground = (backgroundId) => {
    onBackgroundSelect(backgroundId);
    onClose();
  };

  const pickCustomBackground = async () => {
    try {
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access camera roll is required!")
        return
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16], // Portrait aspect ratio for chat background
        quality: 0.8,
      })

      if (!result.canceled) {
        onCustomBackgroundChange(result.assets[0].uri);
        onBackgroundSelect("custom");
        onClose();
        Alert.alert("Success", "Custom background applied!")
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.")
      console.error("Custom background picker error:", error)
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.backgroundModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Background</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.backgroundGrid}>
            {backgroundOptions.map((background) => (
              <TouchableOpacity
                key={background.id}
                style={[
                  styles.backgroundOption,
                  selectedBackground === background.id && styles.selectedBackgroundOption
                ]}
                onPress={() => {
                  if (background.id === "custom") {
                    pickCustomBackground()
                  } else {
                    selectBackground(background.id)
                  }
                }}
              >
                {background.id === "custom" ? (
                  <View style={styles.customBackgroundPreview}>
                    <Ionicons name="camera" size={30} color="#25D366" />
                    <Text style={styles.customBackgroundText}>Add Photo</Text>
                  </View>
                ) : background.uri ? (
                  <Image source={{ uri: background.uri }} style={styles.backgroundPreview} />
                ) : (
                  <View style={styles.defaultBackgroundPreview}>
                    <Text style={styles.defaultBackgroundText}>Default</Text>
                  </View>
                )}
                <Text style={styles.backgroundName}>{background.name}</Text>
                {selectedBackground === background.id && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark" size={20} color="#25D366" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '95%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  backgroundGrid: {
    padding: 20,
    maxHeight: 400,
  },
  backgroundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  selectedBackgroundOption: {
    borderColor: '#25D366',
    backgroundColor: '#F0F8F0',
  },
  backgroundPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  defaultBackgroundPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#E8D7C6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultBackgroundText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  customBackgroundPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F0F8F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#25D366',
    borderStyle: 'dashed',
  },
  customBackgroundText: {
    fontSize: 10,
    color: '#25D366',
    fontWeight: '600',
    marginTop: 2,
  },
  backgroundName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#25D366',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ChatBackground;

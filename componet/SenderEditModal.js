import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const SenderEditModal = ({ 
  visible, 
  onClose, 
  onSave, 
  onDelete,
  message, 
  editText, 
  setEditText, 
  editTime, 
  setEditTime 
}) => {
  const [showImageSizeModal, setShowImageSizeModal] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);

  
  // Image size options
  const imageSizes = [
    { label: 'Original (Best Quality)', value: 'original' },
    { label: 'Portrait (Best Quality)', value: 'portrait' },
  ];

  const getImageDimensions = (size) => {
    switch (size) {
      case 'portrait':
        return { width: 245, height: 340 };
      default:
        return null; // Original size
    }
  };

  const handleImageSizeSelection = async (size) => {
    try {
      console.log("=== IMAGE SIZE SELECTION START ===")
      console.log("Selected size:", size)
      console.log("Selected image URI:", selectedImageUri)
      
      let finalImageUri = selectedImageUri;
      const dimensions = getImageDimensions(size);
      
      console.log("Image dimensions:", dimensions)
      
      // Both original and portrait use the image as-is without any processing for maximum quality
      finalImageUri = selectedImageUri;
      
      console.log("Final image URI:", finalImageUri)
      
      // Close size selection modal
      console.log("Closing modal...")
      setShowImageSizeModal(false);
      console.log("Modal closed")
      
      // Update the message with new image
      console.log("Creating updated message...")
      const updatedMessage = {
        ...message,
        imageUri: finalImageUri,
        type: "image",
        imageSize: size,
        imageDimensions: dimensions
      }
      
      console.log("Updated message:", updatedMessage)
      
      console.log("Calling onSave...")
      
      // Add a small delay to prevent immediate state update
      setTimeout(() => {
        console.log("Executing onSave after timeout...")
        onSave(updatedMessage)
        console.log("onSave completed")
        
        console.log("Showing success alert...")
        Alert.alert("Success", "Image replaced successfully!")
        console.log("=== IMAGE SIZE SELECTION END ===")
      }, 100) // 100ms delay
    } catch (error) {
      console.error("Image processing error:", error)
      Alert.alert("Error", "Failed to process image. Please try again.")
      setShowImageSizeModal(false)
    }
  };

  const pickNewImage = async () => {
    try {
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access camera roll is required!")
        return
      }

      // Launch image picker with maximum quality settings
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1.0,
        allowsMultipleSelection: false,
        exif: true, // Preserve EXIF data for better quality
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Store the selected image and show size selection modal
        setSelectedImageUri(result.assets[0].uri)
        setShowImageSizeModal(true)
      }
    } catch (error) {
      console.error("Image picker error:", error)
      Alert.alert("Error", "Failed to pick image. Please try again.")
    }
  }
  const handleSave = () => {
    // Only validate text for non-image messages
    if (message?.type !== "image" && !editText.trim()) {
      Alert.alert("Error", "Message text cannot be empty");
      return;
    }

    onSave({
      ...message,
      text: editText.trim(),
      time: editTime.trim() || message.time
    });
  };

  const handleClose = () => {
    // Reset image selection state when closing
    setSelectedImageUri(null);
    setShowImageSizeModal(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Sender Message</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            {/* Show image editing options if it's an image message */}
            {message?.type === "image" ? (
              <>
                <View style={styles.imagePreviewContainer}>
                  <TouchableOpacity style={styles.replaceImageButton} onPress={pickNewImage}>
                    <Ionicons name="camera" size={20} color="#fff" />
                    <Text style={styles.replaceImageText}>Replace Image</Text>
                  </TouchableOpacity>
                </View>
                
                
                <Text style={styles.inputLabel}>Caption (optional):</Text>
                <TextInput
                  style={styles.editTextInput}
                  value={editText}
                  onChangeText={setEditText}
                  placeholder="Enter caption for image"
                  multiline
                  numberOfLines={2}
                />
                
                <Text style={styles.inputLabel}>Time (optional):</Text>
                <TextInput
                  style={styles.editTimeInput}
                  value={editTime}
                  onChangeText={setEditTime}
                  placeholder="e.g., 11:25 AM"
                />
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Message Text:</Text>
                <TextInput
                  style={styles.editTextInput}
                  value={editText}
                  onChangeText={setEditText}
                  placeholder="Enter message text"
                  multiline
                  numberOfLines={3}
                />
                
                <Text style={styles.inputLabel}>Time (optional):</Text>
                <TextInput
                  style={styles.editTimeInput}
                  value={editTime}
                  onChangeText={setEditTime}
                  placeholder="e.g., 11:25 AM"
                />
              </>
            )}
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(message.id)}>
              <Ionicons name="trash" size={16} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Image Size Selection Modal */}
      <Modal
        visible={showImageSizeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImageSizeModal(false)}
      >
        <View style={styles.imageSizeModalOverlay}>
          <View style={styles.imageSizeModalContent}>
            <View style={styles.imageSizeModalHeader}>
              <Text style={styles.imageSizeModalTitle}>Select Image Size</Text>
              <TouchableOpacity 
                onPress={() => setShowImageSizeModal(false)} 
                style={styles.imageSizeCloseButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.imageSizeModalBody}>
              <Text style={styles.imageSizeModalSubtitle}>
                Choose the size for your image:
              </Text>
              
              {imageSizes.map((size) => (
                <TouchableOpacity
                  key={size.value}
                  style={styles.imageSizeOption}
                  onPress={() => handleImageSizeSelection(size.value)}
                >
                  <View style={styles.imageSizeOptionContent}>
                    <Text style={styles.imageSizeOptionLabel}>{size.label}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
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
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  editTextInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  editTimeInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FF4444',
    gap: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#25D366',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePreview: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  replaceImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  replaceImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 16,
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  // Image Size Modal Styles
  imageSizeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSizeModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  imageSizeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  imageSizeModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  imageSizeCloseButton: {
    padding: 4,
  },
  imageSizeModalBody: {
    padding: 20,
  },
  imageSizeModalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageSizeOption: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  imageSizeOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  imageSizeOptionLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default SenderEditModal;

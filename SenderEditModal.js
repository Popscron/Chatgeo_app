import React from 'react';
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

const SenderEditModal = ({ 
  visible, 
  onClose, 
  onSave, 
  message, 
  editText, 
  setEditText, 
  editTime, 
  setEditTime 
}) => {
  const pickNewImage = async () => {
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
        allowsEditing: false,
        quality: 0.8,
      })

      if (!result.canceled) {
        // Update the message with new image
        const updatedMessage = {
          ...message,
          imageUri: result.assets[0].uri,
          type: "image"
        }
        onSave(updatedMessage)
        Alert.alert("Success", "Image replaced successfully!")
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.")
      console.error("Image picker error:", error)
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
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
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
});

export default SenderEditModal;

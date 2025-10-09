import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Image,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const ProfileEdit = ({ 
  visible, 
  onClose, 
  profileImageUri, 
  onProfileImageChange,
  contactName,
  onContactNameChange,
  unreadCount,
  onUnreadCountChange,
  onSwitchToBackground,
  readMode,
  onReadModeChange,
  useApiNames,
  onUseApiNamesChange,
  mondayText,
  onMondayTextChange
}) => {
  const [editContactName, setEditContactName] = useState(contactName);
  const [editUnreadCount, setEditUnreadCount] = useState(unreadCount.toString());
  const [isReadMode, setIsReadMode] = useState(readMode || false);
  const [useApiNamesToggle, setUseApiNamesToggle] = useState(useApiNames || false);
  const [editMondayText, setEditMondayText] = useState(mondayText || "Monday");

  // Sync state when modal opens
  useEffect(() => {
    if (visible) {
      setEditContactName(contactName);
      setEditUnreadCount(unreadCount.toString());
      setIsReadMode(readMode || false);
      setUseApiNamesToggle(useApiNames || false);
      setEditMondayText(mondayText || "Monday");
    }
  }, [visible, contactName, unreadCount, readMode, useApiNames, mondayText]);

  const pickProfileImage = async () => {
    try {
      console.log("pickProfileImage called")
      
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      console.log("Permission result:", permissionResult)
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access camera roll is required!")
        return
      }

      console.log("Launching image picker...")
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      })
      
      console.log("Image picker result:", result)

      if (!result.canceled) {
        console.log("Image selected:", result.assets[0].uri)
        onProfileImageChange(result.assets[0].uri)
        Alert.alert("Success", "Profile image updated!")
      } else {
        console.log("Image picker canceled")
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.")
      console.error("Image picker error:", error)
    }
  }

  const saveContactName = () => {
    if (!useApiNamesToggle && !editContactName.trim()) {
      Alert.alert("Error", "Contact name cannot be empty")
      return
    }
    
    // Validate unread count
    const unreadValue = parseInt(editUnreadCount);
    if (isNaN(unreadValue) || unreadValue < 0) {
      Alert.alert("Error", "Unread count must be a valid number (0 or greater)")
      return
    }
    
    // Validate Monday text
    if (!editMondayText.trim()) {
      Alert.alert("Error", "Date text cannot be empty")
      return
    }
    
    onContactNameChange(editContactName.trim())
    onUnreadCountChange(unreadValue)
    onReadModeChange(isReadMode)
    onUseApiNamesChange(useApiNamesToggle)
    onMondayTextChange(editMondayText.trim())
    onClose()
  }

  const toggleReadMode = () => {
    setIsReadMode(!isReadMode)
  }

  const toggleUseApiNames = () => {
    setUseApiNamesToggle(!useApiNamesToggle)
  }

  const cancelEdit = () => {
    setEditContactName(contactName)
    setEditUnreadCount(unreadCount.toString())
    setEditMondayText(mondayText || "Monday")
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={cancelEdit}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={onSwitchToBackground} style={styles.switchButton}>
                <Ionicons name="color-palette-outline" size={24} color="#25D366" />
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelEdit} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Profile Image Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile Picture</Text>
              <TouchableOpacity style={styles.profileImageContainer} onPress={pickProfileImage}>
                <Image source={{ uri: profileImageUri }} style={styles.profileImagePreview} />
                <View style={styles.editOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.helperText}>Tap to change profile picture</Text>
            </View>

            {/* Contact Name Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Name</Text>
              
              {/* API Names Toggle */}
              <TouchableOpacity style={styles.toggleContainer} onPress={toggleUseApiNames}>
                <View style={styles.toggleInfo}>
                  <Ionicons 
                    name={useApiNamesToggle ? "globe" : "person"} 
                    size={20} 
                    color={useApiNamesToggle ? "#25D366" : "#666"} 
                  />
                  <Text style={[styles.toggleLabel, useApiNamesToggle && styles.toggleLabelActive]}>
                    {useApiNamesToggle ? "Using Ghanaian Nicknames" : "Manual Name Entry"}
                  </Text>
                </View>
                <View style={[styles.toggleSwitch, useApiNamesToggle && styles.toggleSwitchActive]}>
                  <View style={[styles.toggleThumb, useApiNamesToggle && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>
              
              <Text style={styles.helperText}>
                {useApiNamesToggle 
                  ? "Contact name will be generated from Ghanaian nicknames API (5 sources)" 
                  : "Enter a custom contact name manually"
                }
              </Text>

              {/* Manual Name Input - Only show when API names is OFF */}
              {!useApiNamesToggle && (
                <TextInput
                  style={styles.contactNameInput}
                  value={editContactName}
                  onChangeText={setEditContactName}
                  placeholder="Enter contact name"
                  maxLength={50}
                />
              )}
            </View>

            {/* Unread Count Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Unread Messages</Text>
              <TextInput
                style={styles.unreadCountInput}
                value={editUnreadCount}
                onChangeText={setEditUnreadCount}
                placeholder="Enter unread count"
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.helperText}>Number of unread messages to display</Text>
            </View>

            {/* Date Text Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date Text</Text>
              <TextInput
                style={styles.dateTextInput}
                value={editMondayText}
                onChangeText={setEditMondayText}
                placeholder="Enter date text (e.g., Monday)"
                maxLength={20}
              />
              <Text style={styles.helperText}>Text displayed in the date separator when scrolling</Text>
            </View>

            {/* Read Mode Toggle Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Read Mode</Text>
              <TouchableOpacity style={styles.toggleContainer} onPress={toggleReadMode}>
                <View style={styles.toggleInfo}>
                  <Ionicons 
                    name={isReadMode ? "eye" : "eye-off"} 
                    size={20} 
                    color={isReadMode ? "#25D366" : "#666"} 
                  />
                  <Text style={[styles.toggleLabel, isReadMode && styles.toggleLabelActive]}>
                    {isReadMode ? "Read Mode ON" : "Read Mode OFF"}
                  </Text>
                </View>
                <View style={[styles.toggleSwitch, isReadMode && styles.toggleSwitchActive]}>
                  <View style={[styles.toggleThumb, isReadMode && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>
              <Text style={styles.helperText}>
                When ON, message editing will be disabled
              </Text>
            </View>

          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveContactName}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: screenWidth > 600 ? 500 : screenWidth * 0.95,
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.4,
    flex: screenHeight < 600 ? 1 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F8F0',
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
    padding: screenWidth < 400 ? 15 : 20,
    flex: 1,
  },
  section: {
    marginBottom: screenHeight < 600 ? 15 : 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  profileImageContainer: {
    alignSelf: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  profileImagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#25D366',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  contactNameInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  unreadCountInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 100,
  },
  dateTextInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
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
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  toggleLabelActive: {
    color: '#25D366',
    fontWeight: '600',
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#25D366',
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
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
});

export default ProfileEdit;

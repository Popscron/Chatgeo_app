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
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useDarkMode } from './DarkModeContext';
import { useAuth } from './AuthContext';

const getDynamicStyles = (isDarkMode) => ({
  modalOverlay: {
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
  },
  modalHeader: {
    borderBottomColor: isDarkMode ? '#333' : '#E0E0E0',
  },
  modalTitle: {
    color: isDarkMode ? '#fff' : '#000',
  },
  sectionTitle: {
    color: isDarkMode ? '#fff' : '#333',
  },
  helperText: {
    color: isDarkMode ? '#999' : '#666',
  },
  contactNameInput: {
    borderColor: isDarkMode ? '#444' : '#DDD',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    color: isDarkMode ? '#fff' : '#000',
  },
  unreadCountInput: {
    borderColor: isDarkMode ? '#444' : '#DDD',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    color: isDarkMode ? '#fff' : '#000',
  },
  dateTextInput: {
    borderColor: isDarkMode ? '#444' : '#DDD',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    color: isDarkMode ? '#fff' : '#000',
  },
  modalFooter: {
    borderTopColor: isDarkMode ? '#333' : '#E0E0E0',
  },
  logoutButton: {
    backgroundColor: isDarkMode ? '#dc3545' : '#dc3545',
  },
  cancelButton: {
    borderColor: isDarkMode ? '#444' : '#DDD',
  },
  cancelButtonText: {
    color: isDarkMode ? '#ccc' : '#666',
  },
  toggleContainer: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#F8F9FA',
    borderColor: isDarkMode ? '#444' : '#E0E0E0',
  },
  toggleLabel: {
    color: isDarkMode ? '#ccc' : '#666',
  },
  toggleLabelActive: {
    color: '#25D366',
  },
});

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
  dateText,
  onDateTextChange
}) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { logout } = useAuth();
  const [editContactName, setEditContactName] = useState(contactName);
  const [editUnreadCount, setEditUnreadCount] = useState(unreadCount.toString());
  const [isReadMode, setIsReadMode] = useState(readMode || false);
  const [useApiNamesToggle, setUseApiNamesToggle] = useState(useApiNames || false);
  const [editDateText, setEditDateText] = useState(dateText || "Monday");

  // Sync state when modal opens
  useEffect(() => {
    if (visible) {
      setEditContactName(contactName);
      setEditUnreadCount(unreadCount.toString());
      setIsReadMode(readMode || false);
      setUseApiNamesToggle(useApiNames || false);
      setEditDateText(dateText || "Monday");
    }
  }, [visible, contactName, unreadCount, readMode, useApiNames, dateText]);

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
    
    // Validate date text
    if (!editDateText.trim()) {
      Alert.alert("Error", "Date text cannot be empty")
      return
    }
    
    onContactNameChange(editContactName.trim())
    onUnreadCountChange(unreadValue)
    onReadModeChange(isReadMode)
    onUseApiNamesChange(useApiNamesToggle)
    onDateTextChange(editDateText.trim())
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
    setEditDateText(dateText || "Monday")
    onClose()
  }

  const dynamicStyles = getDynamicStyles(isDarkMode);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={cancelEdit}
    >
      <KeyboardAvoidingView 
        style={[styles.modalOverlay, dynamicStyles.modalOverlay]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.modalContent, dynamicStyles.modalContent]}>
          <View style={[styles.modalHeader, dynamicStyles.modalHeader]}>
            <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Edit Profile</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={onSwitchToBackground} style={styles.switchButton}>
                <Ionicons name="color-palette-outline" size={24} color="#25D366" />
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelEdit} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView 
            style={styles.modalBody} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Profile Image Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Profile Picture</Text>
              <TouchableOpacity style={styles.profileImageContainer} onPress={pickProfileImage}>
                <Image 
                  source={profileImageUri ? { uri: profileImageUri } : require('../assets/Profilepic.png')} 
                  style={styles.profileImagePreview} 
                />
                <View style={styles.editOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={[styles.helperText, dynamicStyles.helperText]}>Tap to change profile picture</Text>
            </View>

            {/* Contact Name Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Contact Name</Text>
              
              {/* API Names Toggle */}
              <TouchableOpacity style={[styles.toggleContainer, dynamicStyles.toggleContainer]} onPress={toggleUseApiNames}>
                <View style={styles.toggleInfo}>
                  <Ionicons 
                    name={useApiNamesToggle ? "globe" : "person"} 
                    size={20} 
                    color={useApiNamesToggle ? "#25D366" : "#666"} 
                  />
                  <Text style={[styles.toggleLabel, dynamicStyles.toggleLabel, useApiNamesToggle && styles.toggleLabelActive]}>
                    {useApiNamesToggle ? "Using Ghanaian Nicknames" : "Manual Name Entry"}
                  </Text>
                </View>
                <View style={[styles.toggleSwitch, useApiNamesToggle && styles.toggleSwitchActive]}>
                  <View style={[styles.toggleThumb, useApiNamesToggle && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>
              
              <Text style={[styles.helperText, dynamicStyles.helperText]}>
                {useApiNamesToggle 
                  ? "Contact name will be generated from Ghanaian nicknames API (5 sources)" 
                  : "Enter a custom contact name manually"
                }
              </Text>

              {/* Manual Name Input - Only show when API names is OFF */}
              {!useApiNamesToggle && (
                <TextInput
                  style={[styles.contactNameInput, dynamicStyles.contactNameInput]}
                  value={editContactName}
                  onChangeText={setEditContactName}
                  placeholder="Enter contact name"
                  placeholderTextColor={isDarkMode ? "#999" : "#999"}
                  maxLength={50}
                />
              )}
            </View>

            {/* Unread Count Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Unread Messages</Text>
              <TextInput
                style={[styles.unreadCountInput, dynamicStyles.unreadCountInput]}
                value={editUnreadCount}
                onChangeText={setEditUnreadCount}
                placeholder="Enter unread count"
                placeholderTextColor={isDarkMode ? "#999" : "#999"}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={[styles.helperText, dynamicStyles.helperText]}>Number of unread messages to display</Text>
            </View>

            {/* Date Text Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Date Text</Text>
              <TextInput
                style={[styles.dateTextInput, dynamicStyles.dateTextInput]}
                value={editDateText}
                onChangeText={setEditDateText}
                placeholder="Enter date text (e.g., Monday)"
                placeholderTextColor={isDarkMode ? "#999" : "#999"}
                maxLength={20}
              />
              <Text style={[styles.helperText, dynamicStyles.helperText]}>Text displayed in the date separator when scrolling</Text>
            </View>

            {/* Read Mode Toggle Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Read Mode</Text>
              <TouchableOpacity style={[styles.toggleContainer, dynamicStyles.toggleContainer]} onPress={toggleReadMode}>
                <View style={styles.toggleInfo}>
                  <Ionicons 
                    name={isReadMode ? "eye" : "eye-off"} 
                    size={20} 
                    color={isReadMode ? "#25D366" : "#666"} 
                  />
                  <Text style={[styles.toggleLabel, dynamicStyles.toggleLabel, isReadMode && styles.toggleLabelActive]}>
                    {isReadMode ? "Read Mode ON" : "Read Mode OFF"}
                  </Text>
                </View>
                <View style={[styles.toggleSwitch, isReadMode && styles.toggleSwitchActive]}>
                  <View style={[styles.toggleThumb, isReadMode && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>
              <Text style={[styles.helperText, dynamicStyles.helperText]}>
                When ON, message editing will be disabled
              </Text>
            </View>

            {/* Dark Mode Toggle Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Dark Mode</Text>
              <TouchableOpacity style={[styles.toggleContainer, dynamicStyles.toggleContainer]} onPress={toggleDarkMode}>
                <View style={styles.toggleInfo}>
                  <Ionicons 
                    name={isDarkMode ? "moon" : "sunny"} 
                    size={20} 
                    color={isDarkMode ? "#25D366" : "#666"} 
                  />
                  <Text style={[styles.toggleLabel, dynamicStyles.toggleLabel, isDarkMode && styles.toggleLabelActive]}>
                    {isDarkMode ? "Dark Mode ON" : "Dark Mode OFF"}
                  </Text>
                </View>
                <View style={[styles.toggleSwitch, isDarkMode && styles.toggleSwitchActive]}>
                  <View style={[styles.toggleThumb, isDarkMode && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>
              <Text style={[styles.helperText, dynamicStyles.helperText]}>
                Toggle between light and dark theme
              </Text>
            </View>

          </ScrollView>
          
          <View style={[styles.modalFooter, dynamicStyles.modalFooter]}>
            <TouchableOpacity 
              style={[styles.logoutButton, dynamicStyles.logoutButton]} 
              onPress={() => {
                Alert.alert(
                  "Logout",
                  "Are you sure you want to logout?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Logout", style: "destructive", onPress: logout }
                  ]
                );
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIcon} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelButton, dynamicStyles.cancelButton]} onPress={cancelEdit}>
              <Text style={[styles.cancelButtonText, dynamicStyles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveContactName}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '95%',
    maxWidth: screenWidth > 600 ? 500 : screenWidth * 0.95,
    maxHeight: screenHeight * 0.95,
    minHeight: screenHeight * 0.5,
    alignSelf: 'center',
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  logoutIcon: {
    marginRight: 4,
  },
  logoutButtonText: {
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

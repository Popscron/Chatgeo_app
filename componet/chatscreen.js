import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  ImageBackground,
  Platform,
  Keyboard,
  Animated,
  AppState,
  Linking,
} from "react-native"
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import { useState, useEffect, useRef } from "react"
import SenderEditModal from './SenderEditModal'
import ReceiverEditModal from './ReceiverEditModal'
import ProfileEdit from './ProfileEdit'
import { generateGhanaianNickname } from '../namesapi'
import * as ScreenCapture from 'expo-screen-capture'
import { mobileSupabaseHelpers } from '../config/supabase'
import { useDarkMode } from './DarkModeContext'
import { useAuth } from './AuthContext'
import * as Device from 'expo-device'
import DisabledUserScreen from './DisabledUserScreen'
import SuspendedUserScreen from './SuspendedUserScreen'
import ExpiredUserScreen from './ExpiredUserScreen'
import UserDashboard from './UserDashboard'
import RectangularOverlay from './RectangularOverlay'

const getDynamicStyles = (isDarkMode) => ({
  container: {
    backgroundColor: isDarkMode ? '#0a0a0a' : '#fff',
  },
  header: {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f0f0f0',
    borderBottomColor: isDarkMode ? '#333' : '#E0E0E0',
  },
  contactName: {
    color: isDarkMode ? '#fff' : '#000',
  },
  unreadCount: {
    color: isDarkMode ? '#fff' : '#000',
  },
  messageContainer: {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f0f0f0',
  },
  inputContainer: {
    borderTopColor: isDarkMode ? '#333' : '#E0E0E0',
  },
  input: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    color: isDarkMode ? '#fff' : '#000',
    borderColor: isDarkMode ? '#444' : '#DDD',
  },
  inputContainerBackground: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  sendButton: {
    backgroundColor: isDarkMode ? '#25D366' : '#25D366',
  },
  dateSeparator: {
    backgroundColor: isDarkMode ? '#000000' : '#f0f0f0',
  },
  updateModal: {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
    borderColor: isDarkMode ? '#333' : 'transparent',
    borderWidth: isDarkMode ? 1 : 0,
  },
  updateModalTitle: {
    color: isDarkMode ? '#fff' : '#000',
  },
  updateModalMessage: {
    color: isDarkMode ? '#ccc' : '#666',
  },
  dateText: {
    color: isDarkMode ? '#fff' : '#000',
  },
  // New dark mode colors
  sentTime: {
    fontSize: 11,
    color: isDarkMode ? '#a7a8a8' : '#53656f',
  },
  receivedTime: {
    fontSize: 11,
    color: isDarkMode ? '#a7a8a8' : '#53656f',
  },
  imageTime: {
    fontSize: 11,
    color: isDarkMode ? '#a7a8a8' : '#53656f',
  },
  dashboardModal: {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
  },
});

// Custom BlurView component with enhanced iOS compatibility
const CustomBlurView = ({ children, style, intensity = 100, tint = "light" }) => {
  const [blurError, setBlurError] = useState(false);
  
  if (Platform.OS === 'ios' && !blurError) {
    // Enhanced BlurView with better iPhone 16+ compatibility
    return (
      <BlurView 
        intensity={intensity} 
        tint={tint} 
        style={style}
        // Use more compatible blur settings
        reducedTransparencyFallbackColor={tint === "dark" ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.9)"}
        // Ensure proper blur rendering on all iOS devices
        blurType={tint === "dark" ? "dark" : "light"}
        blurAmount={Math.min(intensity, 80)} // Cap intensity for better compatibility
        onError={() => {
          console.log('BlurView error, falling back to solid background');
          setBlurError(true);
        }}
      >
        {children}
      </BlurView>
    );
  } else {
    // Enhanced fallback for Android or when BlurView fails
    return (
      <View style={[
        style, 
        { 
          backgroundColor: tint === "dark" ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          // Add shadow and border for better visual effect
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 4,
          // Add subtle border for better definition
          borderBottomWidth: 0.5,
          borderBottomColor: tint === "dark" ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
        }
      ]}>
        {children}
      </View>
    );
  }
};

export default function WhatsAppChat() {
  const { isDarkMode } = useDarkMode();
  const { user, logout } = useAuth();
  const dynamicStyles = getDynamicStyles(isDarkMode);

  // Get device information for session tracking
  const getDeviceInfo = async () => {
    try {
      let deviceId = 'unknown';
      
      // First try to get stored device ID
      try {
        const storedDeviceId = await AsyncStorage.getItem('device_id');
        if (storedDeviceId) {
          deviceId = storedDeviceId;
          console.log('✅ Using stored device ID:', deviceId);
        } else {
          // Try to get device ID from expo-device
          try {
            deviceId = await Device.getDeviceIdAsync();
            console.log('✅ Got device ID from Device.getDeviceIdAsync:', deviceId);
            // Store it for future use
            await AsyncStorage.setItem('device_id', deviceId);
          } catch (error) {
            console.log('Device.getDeviceIdAsync not available, using fallback');
            // Create a more stable fallback device ID
            const fallbackId = `${Platform.OS}-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
            deviceId = fallbackId;
            console.log('Using fallback device ID:', deviceId);
            // Store the fallback ID
            await AsyncStorage.setItem('device_id', deviceId);
          }
        }
      } catch (error) {
        console.error('Error with device ID storage:', error);
        // Fallback to simple ID
        deviceId = `${Platform.OS}-${Date.now()}`;
      }
      
      let deviceName = 'Unknown Device';
      if (Device.deviceName && Device.deviceName !== 'Unknown') {
        deviceName = Device.deviceName;
      } else if (Device.modelName) {
        deviceName = Device.modelName;
      } else {
        deviceName = `${Platform.OS} Device`;
      }
      
      const deviceInfo = {
        deviceId,
        deviceName,
        deviceType: Device.deviceType || 'unknown',
        platform: Platform.OS,
        osVersion: Platform.Version,
        appVersion: '1.1.5'
      };
      
      console.log('Device info generated:', deviceInfo);
      return deviceInfo;
    } catch (error) {
      console.error('Error getting device info:', error);
      return {
        deviceId: `${Platform.OS}-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
        deviceName: 'Unknown Device',
        deviceType: 'unknown',
        platform: Platform.OS,
        osVersion: Platform.Version,
        appVersion: '1.1.5'
      };
    }
  };
  const [messages, setMessages] = useState([])

  const [senderEditModalVisible, setSenderEditModalVisible] = useState(false)
  const [receiverEditModalVisible, setReceiverEditModalVisible] = useState(false)
  const [userDashboardVisible, setUserDashboardVisible] = useState(false)
  const [editingMessage, setEditingMessage] = useState(null)
  const [editText, setEditText] = useState("")
  const [editTime, setEditTime] = useState("")
  
  const [selectedBackground, setSelectedBackground] = useState(isDarkMode ? "darkdefaultbg" : "defualtbg")
  const [customBackgroundUri, setCustomBackgroundUri] = useState(null)
  const [profileImageUri, setProfileImageUri] = useState(null)
  const [contactName, setContactName] = useState("ChatGeo")
  const [unreadCount, setUnreadCount] = useState(34)
  const [profileEditModalVisible, setProfileEditModalVisible] = useState(false)
  const [overlayEnabled, setOverlayEnabled] = useState(false)
  const inputContainerAnimation = useState(new Animated.Value(0))[0]

  const handleOverlayToggle = (enabled) => {
    setOverlayEnabled(enabled);
  };
  const inputWidthAnimation = useState(new Animated.Value(1))[0]
  const [inputText, setInputText] = useState("")
  const [showSendButton, setShowSendButton] = useState(false)
  const [isTypingMode, setIsTypingMode] = useState(false)
  const [typingMode, setTypingMode] = useState("") // "receiver" or "sender"
  const [isScrolling, setIsScrolling] = useState(false)
  const [showDateSeparator, setShowDateSeparator] = useState(false)
  const dateSeparatorAnimation = useState(new Animated.Value(0))[0]
  const scrollTimeoutRef = useRef(null)
  const [readMode, setReadMode] = useState(false)
  const [useApiNames, setUseApiNames] = useState(false)
  const [dateText, setDateText] = useState("Today")
  
  // Notification state (only for update notifications)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [currentUpdateNotification, setCurrentUpdateNotification] = useState(null)
  const [dismissedUpdates, setDismissedUpdates] = useState(new Set())
  const [lastNotificationShown, setLastNotificationShown] = useState(null)
  
  // User status state
  const [userStatus, setUserStatus] = useState('active')
  const [showStatusScreen, setShowStatusScreen] = useState(false)
  
  // Image size selection state
  const [showImageSizeModal, setShowImageSizeModal] = useState(false)
  const [selectedImageUri, setSelectedImageUri] = useState(null)
  const [pendingCaption, setPendingCaption] = useState("")
  
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
  
  // Handle text input changes
  const handleTextChange = (text) => {
    setInputText(text)
    const hasText = text.trim().length > 0
    
    // Auto-enable typing mode when user starts typing
    if (hasText && !isTypingMode) {
      setIsTypingMode(true)
      setTypingMode("sender") // Default to sender when typing
    }
    
    setShowSendButton(hasText)
    
    // Animate width expansion only when user actually types text
    if (hasText) {
      Animated.timing(inputWidthAnimation, {
        toValue: 1.15, // Expand to 115% width when typing
        duration: 300,
        useNativeDriver: false, // Width animation needs layout
      }).start()
    } else {
      // Contract back to normal when text is cleared
      Animated.timing(inputWidthAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start()
    }
  }

  // Handle send message
  const handleSendMessage = () => {
    if (inputText.trim().length > 0) {
      // Add the message to the messages array
      const newMessage = {
        id: Date.now(),
        text: inputText.trim(),
        isReceived: typingMode === "receiver",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, newMessage])
      setInputText("")
      setShowSendButton(false)
      setIsTypingMode(false)
      setTypingMode("")
      
      // Reset width animation
      Animated.timing(inputWidthAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start()
    }
  }

  const addReceiverMessage = () => {
    // Show alert for receiver activation
    Alert.alert("Receiver Reply", "Receiver replies activated")
    
    // Enable typing mode for receiver
    setIsTypingMode(true)
    setTypingMode("receiver")
    setInputText("")
    setShowSendButton(false)
  }

  const addSenderMessage = () => {
    // Show alert for sender activation
    Alert.alert("Sender Reply", "Sender replies activated")
    
    // Enable typing mode for sender
    setIsTypingMode(true)
    setTypingMode("sender")
    setInputText("")
    setShowSendButton(false)
  }

  const handleMessagePress = (message) => {
    // Don't allow editing if read mode is enabled
    if (readMode) {
      return
    }
    
    setEditingMessage(message)
    setEditText(message.text)
    setEditTime(message.time)
    
    if (message.isReceived) {
      setReceiverEditModalVisible(true)
    } else {
      setSenderEditModalVisible(true)
    }
  }

  const saveMessageEdit = (updatedMessage) => {
    try {
      console.log("=== SAVE MESSAGE EDIT START ===")
      console.log("Updated message received:", updatedMessage)
      
      console.log("Updating messages array...")
      const updatedMessages = messages.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      )
      console.log("Messages array updated")
      
      console.log("Setting messages state...")
      setMessages(updatedMessages)
      console.log("Messages state set")
      
      // Add delay before closing modals to prevent freeze
      setTimeout(() => {
        console.log("Closing modals after delay...")
        setSenderEditModalVisible(false)
        setReceiverEditModalVisible(false)
        console.log("Modals closed")
        
        console.log("Resetting edit state...")
        setEditingMessage(null)
        setEditText("")
        setEditTime("")
        console.log("Edit state reset")
      }, 50) // 50ms delay
      
      console.log("=== SAVE MESSAGE EDIT END ===")
    } catch (error) {
      console.error("Error in saveMessageEdit:", error)
    }
  }

  // Handle import messages
  const handleImportMessages = (importedMessages) => {
    try {
      console.log("=== IMPORT MESSAGES START ===")
      console.log("Imported messages:", importedMessages)
      
      // Add unique IDs to imported messages if they don't have them
      const messagesWithIds = importedMessages.map((msg, index) => ({
        ...msg,
        id: msg.id || `imported_${Date.now()}_${index}`
      }))
      
      console.log("Setting imported messages...")
      setMessages(messagesWithIds)
      console.log("Messages imported successfully")
      
      console.log("=== IMPORT MESSAGES END ===")
    } catch (error) {
      console.error("Error importing messages:", error)
      Alert.alert("Error", "Failed to import messages. Please try again.")
    }
  }

  // Handle import contact name
  const handleImportContact = (importedContactName) => {
    try {
      console.log("=== IMPORT CONTACT START ===")
      console.log("Imported contact name:", importedContactName)
      
      setContactName(importedContactName)
      console.log("Contact name updated successfully")
      
      console.log("=== IMPORT CONTACT END ===")
    } catch (error) {
      console.error("Error importing contact name:", error)
    }
  }

  const handleClearMessages = () => {
    console.log("=== CLEAR MESSAGES START ===")
    console.log("Clearing all messages...")
    
    setMessages([])
    console.log("All messages cleared successfully")
    
    console.log("=== CLEAR MESSAGES END ===")
  }

  // Handle import profile image
  const handleImportProfileImage = (importedProfileImageUri) => {
    try {
      console.log("=== IMPORT PROFILE IMAGE START ===")
      console.log("Imported profile image URI:", importedProfileImageUri)
      setProfileImageUri(importedProfileImageUri)
      console.log("Profile image updated successfully")
      console.log("=== IMPORT PROFILE IMAGE END ===")
    } catch (error) {
      console.error("Error importing profile image:", error)
    }
  }


  const cancelSenderEdit = () => {
    setSenderEditModalVisible(false)
    setEditingMessage(null)
    setEditText("")
    setEditTime("")
  }

  const cancelReceiverEdit = () => {
    setReceiverEditModalVisible(false)
    setEditingMessage(null)
    setEditText("")
    setEditTime("")
  }

  const handleCameraPress = async () => {
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

      if (!result.canceled) {
        console.log('Image picker result:', result)
        console.log('Selected image URI:', result.assets[0].uri)
        
        // Store the selected image and show size selection modal
        setSelectedImageUri(result.assets[0].uri)
        setShowImageSizeModal(true)
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.")
      console.error("Image picker error:", error)
    }
  }

  const handleImageSizeSelection = async (size) => {
    try {
      let finalImageUri = selectedImageUri;
      const dimensions = getImageDimensions(size);
      
      // Both original and portrait use the image as-is without any processing for maximum quality
      finalImageUri = selectedImageUri;
      
      // Close size selection modal
      setShowImageSizeModal(false);
      
      // Ask user if they want to add caption or send as is
      Alert.alert(
        "Add Caption",
        "Do you want to add a caption to this image?",
        [
          {
            text: "Send as is",
            onPress: () => {
              // Add image message without caption
              const newMessage = {
                id: Date.now(),
                text: "",
                isReceived: typingMode === "receiver",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                imageUri: finalImageUri,
                type: "image",
                imageSize: size,
                imageDimensions: dimensions
              }
              console.log('Creating image message without caption:', newMessage)
              setMessages(prev => [...prev, newMessage])
            }
          },
          {
            text: "Add Caption",
            onPress: () => {
              // Show input dialog for caption
              Alert.prompt(
                "Add Caption",
                "Enter a caption for your image:",
                [
                  {
                    text: "Cancel",
                    style: "cancel"
                  },
                  {
                    text: "Send",
                    onPress: (caption) => {
                      // Add image message with caption
                      const newMessage = {
                        id: Date.now(),
                        text: caption || "",
                        isReceived: typingMode === "receiver",
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        imageUri: finalImageUri,
                        type: "image",
                        imageSize: size,
                        imageDimensions: dimensions
                      }
                      console.log('Creating image message with caption:', newMessage)
                      setMessages(prev => [...prev, newMessage])
                    }
                  }
                ],
                "plain-text",
                ""
              )
            }
          }
        ]
      )
    } catch (error) {
      Alert.alert("Error", "Failed to process image. Please try again.")
      console.error("Image processing error:", error)
      setShowImageSizeModal(false)
    }
  }

  // Handle share image functionality
  const handleShareImage = (message) => {
    Alert.alert(
      "Share Image",
      "Choose how you'd like to share this image:",
      [
        {
          text: "Copy Image Link",
          onPress: () => {
            // In a real app, you might copy the image URI or upload to a service
            Alert.alert("Copied", "Image link copied to clipboard!");
          }
        },
        {
          text: "Save to Gallery",
          onPress: () => {
            Alert.alert("Saved", "Image saved to gallery!");
          }
        },
        {
          text: "Share via...",
          onPress: () => {
            Alert.alert("Share", "Opening share options...");
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const handleBackgroundSelect = (backgroundId) => {
    setSelectedBackground(backgroundId)
  }

  const handleProfilePress = () => {
    setProfileEditModalVisible(true)
  }

  // Generate new Ghanaian nickname
  const generateNewApiName = async () => {
    try {
      console.log("=== GENERATING NEW NICKNAME ===")
      console.log("Current contact name:", contactName)
      
      // Test if the function is available
      if (typeof generateGhanaianNickname !== 'function') {
        console.error("generateGhanaianNickname is not a function!")
        throw new Error("generateGhanaianNickname function not available")
      }
      
      console.log("Calling generateGhanaianNickname...")
      const newName = await generateGhanaianNickname()
      console.log("Generated nickname from API:", newName)
      
      if (!newName) {
        console.error("API returned empty name!")
        throw new Error("API returned empty name")
      }
      
      console.log("Setting contact name to:", newName)
      setContactName(newName)
      console.log("Contact name updated!")
      
      // Force immediate update
      setTimeout(() => {
        console.log("Forcing immediate update with:", newName)
        setContactName(newName)
      }, 50)
      
    } catch (error) {
      console.error("Error generating Ghanaian nickname from API:", error)
      console.log("Using fallback names...")
      
      // Fallback to a simple nickname if API fails
      const fallbackNames = ["Kwame", "Akosua", "Kofi", "Adwoa", "Yaw", "Ama", "Kojo", "Efua", "Nana", "Osei", "Boateng", "Mensah", "Owusu", "Asante", "Darko"]
      const randomName = fallbackNames[Math.floor(Math.random() * fallbackNames.length)]
      
      console.log("Setting fallback name:", randomName)
      setContactName(randomName)
      console.log("Fallback name updated!")
      
      // Force immediate update
      setTimeout(() => {
        console.log("Forcing immediate fallback update with:", randomName)
        setContactName(randomName)
      }, 50)
    }
  }

  // Simple test function to verify the refresh works
  const testRefresh = () => {
    console.log("Test refresh called!")
    const testNames = ["Kwame", "Akosua", "Kofi", "Adwoa", "Yaw", "Ama", "Kojo", "Efua", "Nana", "Osei"]
    const randomName = testNames[Math.floor(Math.random() * testNames.length)]
    console.log("Setting test name to:", randomName)
    setContactName(randomName)
    console.log("Test name set to:", randomName)
  }

  // Force update test
  const forceUpdateTest = () => {
    console.log("Force update test called!")
    const timestamp = new Date().toLocaleTimeString()
    const newName = `Test-${timestamp}`
    console.log("Setting name to:", newName)
    setContactName(newName)
  }

  // Simple name cycling test
  const cycleNames = () => {
    const names = ["Kwame", "Akosua", "Kofi", "Adwoa", "Yaw", "Ama", "Kojo", "Efua"]
    const currentIndex = names.indexOf(contactName)
    const nextIndex = (currentIndex + 1) % names.length
    const nextName = names[nextIndex]
    
    console.log("Current name:", contactName)
    console.log("Next name:", nextName)
    setContactName(nextName)
    console.log("Name set to:", nextName)
  }

  // Handle API names toggle
  const handleUseApiNamesChange = (useApi) => {
    setUseApiNames(useApi)
    if (useApi) {
      generateNewApiName()
    }
  }

  // Test function to manually show date separator
  const testDateSeparator = () => {
    console.log("Testing date separator")
    setShowDateSeparator(true)
    Animated.timing(dateSeparatorAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }


  // Handle scroll events
  const handleScrollBegin = () => {
    console.log("Scroll begin triggered")
    setIsScrolling(true)
    setShowDateSeparator(true)
    // Dismiss keyboard when scrolling starts
    Keyboard.dismiss()
    // Instant appearance - no animation delay
    dateSeparatorAnimation.setValue(1)
  }

  const handleScrollEnd = () => {
    console.log("Scroll end triggered")
    setIsScrolling(false)
    // Fade out animation
    Animated.timing(dateSeparatorAnimation, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowDateSeparator(false)
    })
  }

  const handleScroll = (event) => {
    const { contentOffset } = event.nativeEvent
    console.log("Scroll event fired, contentOffset.y:", contentOffset.y)
    
    // Always show date when scrolling (any amount)
    if (contentOffset.y > 0) {
      console.log("Scroll detected - showing date")
      // Always trigger show date immediately
      handleScrollBegin()
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
      // Set new timeout to hide date after scrolling stops
      scrollTimeoutRef.current = setTimeout(() => {
        console.log("Scroll timeout - hiding date")
        handleScrollEnd()
      }, 60000) // 1 minute (60 seconds) timeout
    }
  }



  // Get current background URI based on selection
  const getCurrentBackgroundUri = () => {
    // If in dark mode and no specific background is selected, use dark default
    if (isDarkMode && selectedBackground === "default") {
      return require('../assets/darkdefaultbg.png')
    }
    
    if (selectedBackground === "default") return null
    if (selectedBackground === "defualtbg") return require('../assets/defualtbg.jpg')
    if (selectedBackground === "darkdefaultbg") return require('../assets/darkdefaultbg.png')
    if (selectedBackground === "custom") return customBackgroundUri
    
    // Predefined backgrounds
    const predefinedBackgrounds = {
      gradient1: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=800&fit=crop",
      gradient2: "https://images.unsplash.com/photo-1557683311-eac922247aa9?w=400&h=800&fit=crop",
      gradient3: "https://images.unsplash.com/photo-1557683304-673a23048d34?w=400&h=800&fit=crop",
      pattern1: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=800&fit=crop",
      pattern2: "https://images.unsplash.com/photo-1557683304-673a23048d34?w=400&h=800&fit=crop",
    }
    
    return predefinedBackgrounds[selectedBackground] || null
  }


  const currentBackgroundUri = getCurrentBackgroundUri()

  // Function to get message bubble styling for short messages
  const getMessageBubbleStyle = (message) => {
    const charCount = message.text.length
    
    // Consider messages with 30 or fewer characters as short
    if (charCount <= 25) {
      return {
        flexDirection: "row", // Horizontal layout
        alignItems: "flex-end", // Align items to bottom
        justifyContent: "space-between", // Space between message and time
        paddingHorizontal: 12,
        paddingVertical: 6, // Reduced from 8 to 3 (5 steps = 10px)
        gap: 12, // 3 steps gap (4px per step = 12px)
      }
    }
    
    return {} // Default styling for long messages
  }

  // Function to get message text styling for short messages
  const getMessageTextStyle = (message) => {
    const charCount = message.text.length
    
    // For short messages, remove marginBottom to work with flex layout
    if (charCount <= 25) {
      return {
        fontSize: 16,
        color: "#000",
        marginBottom: 0, // Remove default margin
        flex: 1, // Take available space
      }
    }
    
    // Default text styling for long messages
    return message.isReceived ? styles.receivedMessageText : styles.sentMessageText
  }

  // Function to get time styling for short messages
  const getTimeStyle = (message) => {
    const charCount = message.text.length
    
    // For short messages, add padding top but keep original colors
    if (charCount <= 25) {
      return {
        fontSize: 11, // Keep original font size
        color: isDarkMode ? "#a7a8a8" : "#53656f", // Use dark mode color
        paddingTop: 4, // Reduced from 4 to 0 (5 steps = 10px)
        marginLeft: 8, // Small gap from text
        marginRight: -3, // Right margin for spacing
        
      
        // Add marginBottom for both receiver and sender messages
        ...(message.isReceived ? { marginBottom: 0 } : { marginBottom: -4 ,})
      }
    }
    
    // Default time styling for long messages
    return message.isReceived ? dynamicStyles.receivedTime : dynamicStyles.sentTime
  }

  // Function to get image dimensions based on message image size
  const getImageDisplayDimensions = (message) => {
    console.log('Getting image dimensions for message:', message.id);
    console.log('Message imageSize:', message.imageSize);
    console.log('Message imageDimensions:', message.imageDimensions);
    
    if (message.imageDimensions) {
      console.log('Using stored dimensions:', message.imageDimensions);
      return {
        width: message.imageDimensions.width,
        height: message.imageDimensions.height
      }
    }
    
    // Default dimensions for original size or fallback
    console.log('Using default dimensions: 280x315');
    return {
      width: 250,
      height: 290
    }
  }

  // Keyboard event listeners with immediate smooth transitions
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', (e) => {
      // Immediate smooth transition when keyboard opens
      Animated.timing(inputContainerAnimation, {
        toValue: -e.endCoordinates.height,
        duration: 200, // Faster for immediate response
        useNativeDriver: true,
      }).start()
    })

    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', () => {
      // Smooth transition when keyboard closes
      Animated.timing(inputContainerAnimation, {
        toValue: 0,
        duration: 250, // Slightly slower for smooth close
        useNativeDriver: true,
      }).start()
    })

    // Fallback for Android with immediate smooth transitions
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      Animated.timing(inputContainerAnimation, {
        toValue: -e.endCoordinates.height,
        duration: 200, // Faster for immediate response
        useNativeDriver: true,
      }).start()
    })

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(inputContainerAnimation, {
        toValue: 0,
        duration: 250, // Slightly slower for smooth close
        useNativeDriver: true,
      }).start()
    })

    return () => {
      keyboardWillShowListener?.remove()
      keyboardWillHideListener?.remove()
      keyboardDidShowListener?.remove()
      keyboardDidHideListener?.remove()
    }
  }, [inputContainerAnimation])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Get current app version
  const getCurrentAppVersion = () => {
    return "1.1.1"; // This should match the version in app.json
  };

  // Check if 24 hours have passed since last notification
  const has24HoursPassed = (lastTime) => {
    if (!lastTime) {
      console.log('No last notification time found, this is first time - allowing notification');
      return true;
    }
    const now = new Date().getTime();
    const lastNotificationTime = new Date(lastTime).getTime();
    const hoursPassed = (now - lastNotificationTime) / (1000 * 60 * 60);
    console.log(`Hours passed since last notification: ${hoursPassed.toFixed(2)}`);
    return hoursPassed >= 24; // Back to 24 hours for production
  };

  // Debug function to test 24-hour cooldown (for testing only)
  const test24HourCooldown = async () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    setLastNotificationShown(oneHourAgo);
    await AsyncStorage.setItem('lastNotificationShown', oneHourAgo);
    console.log('Set last notification time to 1 hour ago for testing');
  };

  // Check user status
  const checkUserStatus = async () => {
    if (!user || !user.id) return;

    try {
      const result = await mobileSupabaseHelpers.getUserStatus(user.id);
      if (result.success && result.data) {
        const status = result.data.status;
        setUserStatus(status);
        
        // Show appropriate status screen if not active
        if (status !== 'active') {
          setShowStatusScreen(true);
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  // Load update notifications
  const loadUpdateNotifications = async () => {
    try {
      // Check if notifications are enabled
      let notificationsEnabled = true;
      try {
        const stored = await AsyncStorage.getItem('notificationsEnabled');
        if (stored !== null) {
          notificationsEnabled = JSON.parse(stored);
        }
      } catch (error) {
        console.error('Error loading notification preference:', error);
      }

      // If notifications are disabled, don't show any
      if (!notificationsEnabled) {
        console.log('Notifications disabled by user preference');
        return;
      }

      // Get the latest notification time from AsyncStorage to ensure we have the most recent value
      let currentLastNotificationTime = lastNotificationShown;
      try {
        const storedTime = await AsyncStorage.getItem('lastNotificationShown');
        if (storedTime) {
          currentLastNotificationTime = storedTime;
        }
      } catch (error) {
        console.error('Error loading last notification time:', error);
      }

      console.log('🔔 Loading notifications...');
      const notificationData = await mobileSupabaseHelpers.getNotifications();
      console.log('🔔 Raw notification data:', notificationData);
      
      const updateNotifications = notificationData.filter(notification => 
        notification.type === 'update' && notification.version
      );
      
      console.log('🔔 Filtered update notifications:', updateNotifications);
      
      if (updateNotifications.length > 0) {
        const latestUpdate = updateNotifications[0];
        const currentVersion = getCurrentAppVersion();
        const notificationVersion = latestUpdate.version;
        
        console.log('Notification check:', {
          currentVersion,
          notificationVersion,
          versionMatch: currentVersion === notificationVersion,
          isDismissed: dismissedUpdates.has(latestUpdate.id),
          lastNotificationShown: currentLastNotificationTime,
          hoursPassed: currentLastNotificationTime ? ((new Date().getTime() - new Date(currentLastNotificationTime).getTime()) / (1000 * 60 * 60)).toFixed(2) : 'N/A'
        });

        // Only show if version doesn't match, not already dismissed, and 24 hours have passed
        // Note: 24-hour cooldown applies regardless of notification ID
        if (currentVersion !== notificationVersion && 
            !dismissedUpdates.has(latestUpdate.id) && 
            has24HoursPassed(currentLastNotificationTime) &&
            !showUpdateModal) {
          
          console.log('Showing update notification - 24 hours have passed');
          setCurrentUpdateNotification(latestUpdate);
          setShowUpdateModal(true);
          
          // Mark as viewed when shown (user has seen it)
          if (user && user.id) {
            mobileSupabaseHelpers.markNotificationViewed(
              latestUpdate.id, 
              user.id, 
              'viewed'
            ).catch(error => {
              console.error('Error marking notification as viewed:', error);
            });
          }
        } else if (currentVersion !== notificationVersion && 
                   !dismissedUpdates.has(latestUpdate.id) && 
                   !has24HoursPassed(currentLastNotificationTime)) {
          console.log('Update notification skipped - 24 hour cooldown active');
        }
      }
    } catch (error) {
      console.error('Error loading update notifications:', error);
    }
  };

  // Handle update action
  const handleUpdateAction = async () => {
    if (currentUpdateNotification && user && user.id) {
      // Mark as viewed in database with 'accepted' action
      try {
        await mobileSupabaseHelpers.markNotificationViewed(
          currentUpdateNotification.id, 
          user.id, 
          'accepted'
        );
        console.log('Marked notification as accepted in database');
      } catch (error) {
        console.error('Error marking notification as accepted:', error);
      }
      
      // Mark as dismissed locally
      setDismissedUpdates(prev => new Set([...prev, currentUpdateNotification.id]));
      
      // Save notification time when dismissed
      const now = new Date().toISOString();
      setLastNotificationShown(now);
      try {
        await AsyncStorage.setItem('lastNotificationShown', now);
        console.log('Saved last notification time on accept');
      } catch (error) {
        console.error('Error saving last notification time:', error);
      }
      
      // Close modal
      setShowUpdateModal(false);
      
      // Open TestFlight using the URI from notification data
      const testflightUrl = currentUpdateNotification.testflight_uri;
      Linking.openURL(testflightUrl).catch(err => {
        console.error('Error opening TestFlight:', err);
        Alert.alert("Error", "Could not open TestFlight. Please try again later.");
      });
    }
  };

  // Handle cancel update
  const handleCancelUpdate = async () => {
    if (currentUpdateNotification && user && user.id) {
      // Mark as viewed in database with 'dismissed' action
      try {
        await mobileSupabaseHelpers.markNotificationViewed(
          currentUpdateNotification.id, 
          user.id, 
          'dismissed'
        );
        console.log('Marked notification as dismissed in database');
      } catch (error) {
        console.error('Error marking notification as dismissed:', error);
      }
      
      // Mark as dismissed locally
      setDismissedUpdates(prev => new Set([...prev, currentUpdateNotification.id]));
      
      // Save notification time when dismissed
      const now = new Date().toISOString();
      setLastNotificationShown(now);
      try {
        await AsyncStorage.setItem('lastNotificationShown', now);
        console.log('Saved last notification time on dismiss');
      } catch (error) {
        console.error('Error saving last notification time:', error);
      }
    }
    
    setShowUpdateModal(false);
  };

  // Load dismissed updates from storage
  useEffect(() => {
    const loadDismissedUpdates = async () => {
      try {
        const stored = await AsyncStorage.getItem('dismissedUpdates');
        if (stored) {
          const dismissedIds = new Set(JSON.parse(stored));
          setDismissedUpdates(dismissedIds);
        }
      } catch (error) {
        console.error('Error loading dismissed updates:', error);
      }
    };
    
    loadDismissedUpdates();
  }, []);

  // Load last notification time from storage
  useEffect(() => {
    const loadLastNotificationTime = async () => {
      try {
        const stored = await AsyncStorage.getItem('lastNotificationShown');
        if (stored) {
          setLastNotificationShown(stored);
        }
      } catch (error) {
        console.error('Error loading last notification time:', error);
      }
    };
    
    loadLastNotificationTime();
  }, []);

  useEffect(() => {
    const loadOverlayPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem('overlayEnabled');
        if (stored !== null) {
          setOverlayEnabled(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading overlay preference:', error);
      }
    };
    
    loadOverlayPreference();
  }, []);

  // Listen for app state changes to refresh overlay preference
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'active') {
        // App became active, check for overlay preference changes
        try {
          const stored = await AsyncStorage.getItem('overlayEnabled');
          if (stored !== null) {
            setOverlayEnabled(JSON.parse(stored));
          }
        } catch (error) {
          console.error('Error checking overlay preference:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => subscription?.remove();
  }, []);

  // Load update notifications on mount and periodically
  useEffect(() => {
    loadUpdateNotifications();
    
    const interval = setInterval(loadUpdateNotifications, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Check user status on mount and periodically
  useEffect(() => {
    checkUserStatus();
    
    const statusInterval = setInterval(checkUserStatus, 60000); // Check every minute
    
    return () => clearInterval(statusInterval);
  }, [user]);

  // Save dismissed updates to storage
  useEffect(() => {
    const saveDismissedUpdates = async () => {
      try {
        const dismissedArray = Array.from(dismissedUpdates);
        await AsyncStorage.setItem('dismissedUpdates', JSON.stringify(dismissedArray));
      } catch (error) {
        console.error('Error saving dismissed updates:', error);
      }
    };
    
    if (dismissedUpdates.size > 0) {
      saveDismissedUpdates();
    }
  }, [dismissedUpdates]);

  // Handle dark mode background switching
  useEffect(() => {
    // Automatically switch to dark background when dark mode is enabled
    if (isDarkMode && selectedBackground !== "darkdefaultbg") {
      setSelectedBackground("darkdefaultbg");
      console.log('Dark mode enabled, switching to dark background');
    } else if (!isDarkMode && selectedBackground === "darkdefaultbg") {
      // Switch to default background image when light mode is enabled
      setSelectedBackground("defualtbg");
      console.log('Light mode enabled, switching to default background image');
    }
  }, [isDarkMode]);

  // Screen capture detection for default contact name warning
  useEffect(() => {
    const handleScreenshot = async () => {
      console.log('📸 Screenshot detected!');
      console.log('Current contact name:', contactName);
      
      // Log screenshot activity
      if (user && user.id !== 'demo-user') {
        await mobileSupabaseHelpers.logActivity(user.id, 'screenshot', {
          contact_name: contactName,
          timestamp: new Date().toISOString()
        });
        await mobileSupabaseHelpers.updateAnalytics(user.id, 'screenshot');
      }

      // Increment screenshot count
      await incrementScreenshotCount();

      // Check if contact name is still the default "ChatGeo"
      if (contactName === "ChatGeo") {
        console.log('⚠️ Showing alert for unchanged contact name');
        Alert.alert(
          "⚠️ Warning",
          "Contact name still not changed! Please change the contact name before taking screenshots.",
          [
            {
              text: "OK",
              style: "default"
            }
          ]
        )
      } else {
        console.log('✅ Contact name has been changed, no alert needed');
      }
    }

    // Session status check for multi-device detection
    const checkSessionStatus = async () => {
      if (user && user.id !== 'demo-user') {
        try {
          const deviceInfo = await getDeviceInfo();
          const sessionStatus = await mobileSupabaseHelpers.checkSessionStatus(user.id, deviceInfo.deviceId);
          
          console.log('Session status check result:', sessionStatus);
          
          // Only logout if session is explicitly inactive (not just missing)
          // This happens when user tries to login on another device
          if (sessionStatus.isActive === false && !sessionStatus.message) {
            console.log('❌ Session is no longer active - user logged in on another device');
            Alert.alert(
              "⚠️ Account Active on Another Device",
              "Your account is now active on another device. You have been logged out from this device.",
              [
                {
                  text: "OK",
                  onPress: async () => {
                    // Logout the user
                    await logout();
                  }
                }
              ],
              { cancelable: false }
            );
          } else if (sessionStatus.isActive === true) {
            console.log('✅ Session is still active');
          } else if (sessionStatus.message === 'No session found') {
            console.log('ℹ️ No session found - this is normal for first login');
          }
        } catch (error) {
          console.error('Error checking session status:', error);
        }
      }
    }

    const incrementScreenshotCount = async () => {
      try {
        const currentCount = await AsyncStorage.getItem('screenshotCount');
        const newCount = (parseInt(currentCount) || 0) + 1;
        await AsyncStorage.setItem('screenshotCount', newCount.toString());
        console.log('Screenshot count updated:', newCount);
      } catch (error) {
        console.error('Error updating screenshot count:', error);
      }
    };


    // Add screenshot listener
    console.log('🔧 Setting up screenshot listener...');
    const subscription = ScreenCapture.addScreenshotListener(handleScreenshot)
    console.log('✅ Screenshot listener added');

    // Set up periodic session check (every 2 minutes to avoid too many DB calls)
    const sessionCheckInterval = setInterval(checkSessionStatus, 120000);

    // Cleanup listeners on unmount
    return () => {
      console.log('🧹 Cleaning up screenshot listener and session check');
      subscription?.remove()
      clearInterval(sessionCheckInterval);
    }
  }, [contactName, user])
  
  const renderMainContent = () => (
    <>
      {/* Fixed Date Separator - Only show when scrolling */}
      {showDateSeparator && (
        <Animated.View 
          style={[
            styles.fixedDateSeparator,
            { opacity: dateSeparatorAnimation }
          ]}
        >
          <CustomBlurView 
            intensity={100} 
            tint={isDarkMode ? "dark" : "light"} 
            style={[styles.dateBadge, dynamicStyles.dateSeparator]}
          >
            <Text style={[styles.dateText, dynamicStyles.dateText]}>{dateText}</Text>
          </CustomBlurView>
        </Animated.View>
      )}

      {/* Chat Messages */}
            <ScrollView 
              style={[
                styles.chatContainer, 
                selectedBackground !== "default" && { backgroundColor: "transparent" }
              ]} 
              contentContainerStyle={[styles.chatContent, { minHeight: 1000 }]}
              onScroll={handleScroll}
              onScrollBeginDrag={handleScrollBegin}
              onScrollEndDrag={handleScrollEnd}
              onMomentumScrollBegin={handleScrollBegin}
              onMomentumScrollEnd={handleScrollEnd}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={true}
            >

        {/* Encryption Message 
        <View style={styles.systemMessage}>
          <Ionicons name="lock-closed" size={14} color="#5E5E5E" style={styles.lockIcon} />
          <Text style={styles.systemMessageText}>
            Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them.{" "}
            <Text style={styles.learnMore}>Learn more</Text>
          </Text>
        </View>*/}

        {/* Dynamic Messages */}
        {messages.map((message, index) => {
          const charCount = message.text ? message.text.length : 0
          const isShortMessage = charCount <= 25 && message.type !== "image" // Don't apply short layout to images
          
          // Check if this is the last message in a consecutive sequence from the same sender
          const isLastInSequence = index === messages.length - 1 || 
            messages[index + 1].isReceived !== message.isReceived
          
          // Check if this is a sender text message following a sender image message
          const isSenderTextAfterImage = !message.isReceived && 
            message.type !== "image" && 
            index > 0 && 
            !messages[index - 1].isReceived && 
            messages[index - 1].type === "image"
          
          // Check if this is a receiver text message following a receiver image message
          const isReceiverTextAfterImage = message.isReceived && 
            message.type !== "image" && 
            index > 0 && 
            messages[index - 1].isReceived && 
            messages[index - 1].type === "image"
          
          console.log(`Message ${message.id}: "${message.text}" (${charCount} chars) - isShort: ${isShortMessage}`)
          console.log(`Message type: ${message.type}`)
          console.log(`Message object:`, message)
          console.log(`Is last in sequence: ${isLastInSequence}`)
          
          return (
            <TouchableOpacity 
              key={message.id} 
              style={[
                styles.messageRow, 
                message.isReceived ? styles.receivedRow : null,
                // Add extra spacing when transitioning between sender and receiver
                index > 0 && messages[index - 1].isReceived !== message.isReceived 
                  ? styles.messageTransitionSpacing 
                  : null,
                // Add extra spacing when sender sends text after image
                isSenderTextAfterImage 
                  ? styles.senderTextAfterImageSpacing 
                  : null,
                // Add extra spacing when receiver sends text after image
                isReceiverTextAfterImage 
                  ? styles.receiverTextAfterImageSpacing 
                  : null
              ]}
              onPress={() => handleMessagePress(message)}
              activeOpacity={readMode ? 1 : 0.7}
            >
              <View style={[
                styles.messageBubble, 
                message.isReceived ? styles.receivedBubble : styles.sentBubble,
                // Apply dark mode bubble colors
                {
                  backgroundColor: message.isReceived 
                    ? (isDarkMode ? '#242626' : '#FFFFFF')
                    : (isDarkMode ? '#144d37' : '#D9FDD3')
                },
                // Apply different maxWidth for text vs image messages
                message.type === "image" ? { maxWidth: "80%" } : { maxWidth: "68%" },
                isShortMessage ? {
                  flexDirection: "row",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  paddingVertical: 6, // Reduced from 8 to 3 (5 steps = 10px)
                  gap: 2,
                } : {},
                // Add border radius for consecutive messages
                !isLastInSequence && {
                  ...(message.isReceived 
                    ? { borderBottomLeftRadius: 10 } 
                    : { borderBottomRightRadius: 10 }
                  )
                }
              ]}>
                {message.type === "image" ? (
                  <View style={styles.imageMessageWithShareContainer}>
                    <View style={styles.imageMessageContainer}>
                      <Image 
                        source={{ uri: message.imageUri }} 
                        style={[
                          styles.messageImage,
                          getImageDisplayDimensions(message)
                        ]}
                        onError={(error) => console.log('Image load error:', error)}
                        onLoad={() => console.log('Image loaded successfully:', message.imageUri)}
                      />
                      
                      {/* Caption positioned below the image */}
                      {message.text && message.text.trim().length > 0 ? (
                        <View style={styles.imageCaptionContainer}>
                          <Text style={[
                            message.isReceived ? styles.receivedMessageText : styles.sentMessageText,
                            {
                              color: isDarkMode ? '#fff' : '#000'
                            }
                          ]}>
                            {message.text}
                          </Text>
                        </View>
                      ) : null}
                      
                      {/* Time and read ticks for images */}
                      <View style={styles.imageTimeContainer}>
                        <Text style={dynamicStyles.imageTime}>
                          {message.time}
                        </Text>
                        {!message.isReceived && (
                          <Image 
                            source={isDarkMode ? require('../assets/checkmark.png') : require('../assets/checkmark.png')} 
                            style={styles.checkmark} 
                            resizeMode="contain"
                          />
                        )}
                      </View>
                    </View>
                    
                    {/* Share Icon - Outside the image message container */}
                    <TouchableOpacity 
                      style={[
                        styles.shareIconContainer,
                        message.isReceived ? styles.receiverShareIcon : styles.senderShareIcon,
                        message.imageSize === 'portrait' ? styles.portraitShareIcon : styles.originalShareIcon
                      ]}
                      onPress={() => handleShareImage(message)}
                    >
                      <MaterialCommunityIcons 
                        name="share" 
                        size={24} 
                        color="#fff" 
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={[
                    message.isReceived ? styles.receivedMessageText : styles.sentMessageText,
                    {
                      color: isDarkMode ? '#fff' : '#000'
                    },
                    isShortMessage ? {
                      marginBottom: 0,
                      fontSize: 16,
                    } : {}
                  ]}>
                    {message.text || "Empty message"}
                  </Text>
                )}
                
                {/* Time and read ticks for text messages */}
                {message.type !== "image" && (
                  <View style={styles.messageFooter}>
                    <Text style={getTimeStyle(message)}>
                      {message.time}
                    </Text>
                    {!message.isReceived && (
                      <Image 
                        source={isDarkMode ? require('../assets/checkmark.png') : require('../assets/checkmark.png')} 
                        style={[
                          styles.checkmark,
                          isShortMessage ? styles.checkmarkShort : {}
                        ]} 
                        resizeMode="contain"
                      />
                    )}
                  </View>
                )}
                
                {/* Moon Icon Bubble Tail - Only show on last message in sequence, but not for images without caption */}
                {isLastInSequence && !(message.type === "image" && (!message.text || message.text.trim().length === 0)) && (
                  <View style={message.isReceived ? styles.receivedBubbleTail : styles.sentBubbleTail}>
                    <MaterialIcons 
                      name="brightness-3" 
                      size={16} 
                      color={message.isReceived ? (isDarkMode ? "#242626" : "#FFFFFF") : (isDarkMode ? "#144d37" : "#D9FDD3")}
                      style={{ transform: [{ rotate: message.isReceived ? '25deg' : '140deg' }] }}
                    />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Input Bar */}
            <Animated.View 
              style={[
                styles.inputContainer,
                dynamicStyles.inputContainer,
                { transform: [{ translateY: inputContainerAnimation }] }
              ]}
            >
        <CustomBlurView 
          intensity={100} 
          tint={isDarkMode ? "dark" : "light"} 
          style={[styles.inputBlurView, dynamicStyles.inputContainer]}
        >
          <View style={styles.inputContent}>
            <TouchableOpacity style={styles.inputIcon} onPress={addReceiverMessage}>
          <Ionicons name="add" size={35} color={isDarkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
            <Animated.View 
              style={[
                dynamicStyles.inputContainerBackground,
                { 
                  transform: [{ scaleX: inputWidthAnimation }],
                  transformOrigin: 'center'
                }
              ]}
            >
              <TextInput 
                style={[styles.textInput, dynamicStyles.input]} 
              //  placeholder="Message" 
                placeholderTextColor={isDarkMode ? "#999" : "#999"} 
                multiline={true}
                maxHeight={100}
                value={inputText}
                onChangeText={handleTextChange}
                editable={isTypingMode}
              />
          <TouchableOpacity 
            style={[styles.emojiButton, { marginRight: 6 }]}
            onPress={() => setUserDashboardVisible(true)}
          >
            <Image source={require('../assets/checkbook.png')} style={{ width: 22, height: 22, tintColor: isDarkMode ? '#fff' : '#000', }} />
          </TouchableOpacity>
            </Animated.View>
            {showSendButton ? (
              <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                <Ionicons name="send" size={24} color="#25D366" />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={[styles.inputIcon, styles.cameraIcon]} onPress={handleCameraPress}>
                  <Ionicons name="camera-outline" size={26} color={isDarkMode ? "#fff" : "#000"} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.inputIcon, styles.micIcon]} onPress={addSenderMessage}>
                  <Image 
                    source={isDarkMode ? require('../assets/Darkmicicon.png') : require('../assets/micicon.png')} 
                    style={{ 
                      width: isDarkMode ? 32 : 26, 
                      height: isDarkMode ? 38 : 24,
                      marginBottom: isDarkMode ? -8: 0
                    
                    }} 
                  />
                </TouchableOpacity>
              </>
            )}
      </View>
        </CustomBlurView>
      </Animated.View>
    </>
  )

  // Render status screen if user is not active
  if (showStatusScreen && userStatus !== 'active') {
    switch (userStatus) {
      case 'disabled':
        return <DisabledUserScreen />;
      case 'suspended':
        return <SuspendedUserScreen />;
      case 'expired':
        return <ExpiredUserScreen />;
      default:
        return <DisabledUserScreen />;
    }
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      
      {/* Update Notification Modal */}
      <Modal
        visible={showUpdateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelUpdate}
      >
        <View style={styles.updateModalOverlay}>
          <View style={[styles.updateModal, dynamicStyles.updateModal]}>
            <View style={styles.updateModalHeader}>
              <View style={styles.updateModalIcon}>
                <Ionicons 
                  name="download" 
                  size={24} 
                  color="#fff" 
                />
              </View>
              <TouchableOpacity 
                style={styles.updateModalClose}
                onPress={handleCancelUpdate}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.updateModalContent}>
              <Text style={[styles.updateModalTitle, dynamicStyles.updateModalTitle]}>
                {currentUpdateNotification?.title}
              </Text>
              <Text style={[styles.updateModalMessage, dynamicStyles.updateModalMessage]}>
                {currentUpdateNotification?.message}
              </Text>
              {currentUpdateNotification?.version && (
                <Text style={styles.updateModalVersion}>
                  Version {currentUpdateNotification.version} Available
                </Text>
              )}
            </View>
            
            <View style={styles.updateModalActions}>
                <TouchableOpacity 
                style={styles.updateModalCancelButton}
                onPress={handleCancelUpdate}
                >
                <Text style={styles.updateModalCancelText}>Later</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                style={styles.updateModalUpdateButton}
                  onPress={handleUpdateAction}
                >
                <Text style={styles.updateModalUpdateText}>Update Now</Text>
                </TouchableOpacity>
              </View>
          </View>
        </View>
      </Modal>
      
      {/* User Dashboard Modal */}
      <Modal
        visible={userDashboardVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUserDashboardVisible(false)}
      >
        <View style={styles.dashboardModalOverlay}>
          <View style={[styles.dashboardModal, dynamicStyles.dashboardModal]}>
                  <UserDashboard 
                    onClose={() => setUserDashboardVisible(false)}
                    messages={messages}
                    contactName={contactName}
                    profileImageUri={profileImageUri}
                    onImport={handleImportMessages}
                    onImportContact={handleImportContact}
                    onImportProfileImage={handleImportProfileImage}
                    selectedBackground={selectedBackground}
                    onBackgroundSelect={handleBackgroundSelect}
                    customBackgroundUri={customBackgroundUri}
                    onCustomBackgroundChange={setCustomBackgroundUri}
                    onClearMessages={handleClearMessages}
                    onOverlayToggle={handleOverlayToggle}
                  />
          </View>
        </View>
      </Modal>
      
      {/* Header - positioned above everything */}
      <CustomBlurView 
        intensity={100} 
        tint={isDarkMode ? "dark" : "light"} 
        style={[styles.header, dynamicStyles.header]}
      >
        <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={isDarkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.unreadCount, dynamicStyles.unreadCount]}>{unreadCount}</Text>
          <TouchableOpacity style={styles.profileContainer} onPress={handleProfilePress}>
            <Image 
              source={profileImageUri ? { uri: profileImageUri } : require('../assets/Profilepic.png')} 
              style={styles.profileImage} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleProfilePress}>
            <Text style={[styles.contactName, dynamicStyles.contactName]}>{contactName}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={useApiNames ? async () => {
            console.log("Video icon pressed - generating new nickname!")
            await generateNewApiName()
            console.log("generateNewApiName completed!")
          } : undefined}>
            <Ionicons name="videocam-outline" size={28} color={isDarkMode ? "#fff" : "#403f3f"} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => {
              Alert.alert('Call', 'Call feature coming soon!');
            }}
          >
            <Ionicons name="call-outline" size={24} color={isDarkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
         
        </View>
        </View>
      </CustomBlurView>

      {/* Rectangular Overlay for Screenshots */}
      {overlayEnabled && (
        <View style={{ position: 'absolute', top: 53, left: 10, zIndex: 9999 }}>
          <RectangularOverlay 
            width={250}           // Adjust width to cover profile picture + name
            height={45}           // Adjust height to cover the area
            top={0}               // Position relative to container
            left={0}              // Position relative to container
            opacity={0.7}         // Adjust transparency (0.6-0.8 range)
            borderRadius={8}      // iOS-style rounded corners
            backgroundColor="white" // White background
            zIndex={9999}         // High z-index to appear above other elements
          />
          <Text style={[styles.overlayText, dynamicStyles.contactName, {
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 10000,
          }]}>
            Chats
          </Text>
        </View>
      )}

      <ImageBackground 
        source={selectedBackground === "default" ? null : (typeof currentBackgroundUri === 'string' ? { uri: currentBackgroundUri } : currentBackgroundUri)} 
        style={styles.backgroundImage}
        resizeMode="cover"
        onError={(error) => console.log('ImageBackground error:', error)}
        onLoad={() => console.log('ImageBackground loaded successfully')}
      >
        <View style={styles.backgroundOverlay}>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            {renderMainContent()}
          </SafeAreaView>
        </View>
      </ImageBackground>

      {/* Sender Edit Modal */}
      <SenderEditModal
        visible={senderEditModalVisible}
        onClose={cancelSenderEdit}
        onSave={saveMessageEdit}
        message={editingMessage}
        editText={editText}
        setEditText={setEditText}
        editTime={editTime}
        setEditTime={setEditTime}
      />

      {/* Receiver Edit Modal */}
      <ReceiverEditModal
        visible={receiverEditModalVisible}
        onClose={cancelReceiverEdit}
        onSave={saveMessageEdit}
        message={editingMessage}
        editText={editText}
        setEditText={setEditText}
        editTime={editTime}
        setEditTime={setEditTime}
      />


            {/* Profile Edit Modal */}
            <ProfileEdit
              visible={profileEditModalVisible}
              onClose={() => setProfileEditModalVisible(false)}
              profileImageUri={profileImageUri}
              onProfileImageChange={setProfileImageUri}
              contactName={contactName}
              onContactNameChange={setContactName}
              unreadCount={unreadCount}
              onUnreadCountChange={setUnreadCount}
              readMode={readMode}
              onReadModeChange={setReadMode}
              useApiNames={useApiNames}
              onUseApiNamesChange={handleUseApiNamesChange}
              dateText={dateText}
              onDateTextChange={setDateText}
            />

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

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  overlayText: {
    fontSize: 16,
    fontWeight: '600',
  },
  updateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  updateModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  updateModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  updateModalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  updateModalClose: {
    marginLeft: 'auto',
    padding: 4,
  },
  updateModalContent: {
    marginBottom: 20,
  },
  updateModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  updateModalMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 8,
  },
  updateModalVersion: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  updateModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  updateModalCancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateModalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  updateModalUpdateButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateModalUpdateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: "transparent", // Ensure no background color interferes with blur
    // Remove web-specific CSS properties that don't work in React Native
    ...(Platform.OS === 'ios' && {
      // iOS-specific enhancements for better blur support
      overflow: 'hidden',
    }),
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingTop: 56, // Account for status bar + 3 steps increase
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: -8,
  },
  unreadCount: {
    fontSize: 18,
    fontWeight: "400",
    color: "#000",
    marginLeft: 4,
    marginRight: 12,
  },
  profileContainer: {
    position: "relative",
    marginRight: 8,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#25D366",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E8D7C6",
  },
  contactName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#fff", // Default background, will be overridden by dynamic style
    paddingTop: 112, // Account for fixed header (adjusted)
    paddingBottom: 100, // Account for fixed input bar
  },
  chatContent: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 20,
  },
  dateSeparator: {
    alignItems: "center",
    marginVertical:4,
  },
  fixedDateSeparator: {
    position: "absolute",
    top: 120, // Position below header
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: "center",
  },
  dateBadge: {
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 20,
    overflow: "hidden", // Ensure blur effect is contained within rounded corners
  },
  dateText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
  },
  systemMessage: {
    backgroundColor: "#F0E0C2",
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  lockIcon: {
    marginRight: 6,
    marginTop: 2,
    paddingHorizontal:10
  },
  systemMessageText: {
    fontSize: 14,
    color: "#000",
    lineHeight: 15,
    flex: 1,
    textAlign: "center",
  },
  learnMore: {
    color: "#027EB5",
    fontWeight: "500",
  },
  messageRow: {
    flexDirection: "row",
    marginVertical: 3, // Increased by 2 steps (8px) for gap between normal and short messages
    paddingHorizontal: 4,
    justifyContent: "center", // Center all messages
  },
  receivedRow: {
    justifyContent: "center", 
    marginVertical: 3, // Increased by 2 steps (8px) from -2 to 6 for receiver message spacing
    
    // Center received messages too
  },
  messageTransitionSpacing: {
    marginTop: 16,
    marginBottom: 8,
  },
  senderTextAfterImageSpacing: {
    marginTop: 0, // Reduced by another 2 steps (4px) from 4px to 0px for sender image-text gap
  },
  receiverTextAfterImageSpacing: {
    marginTop: 0, // Reduced by another 2 steps (4px) from 4px to 0px for receiver image-text gap
  },
  messageBubble: {
    borderRadius: 12,
   // padding: 1,
    paddingTop:5,
    paddingHorizontal: 13, // Reduced from 16 to 13 (3 steps = 6px)
    //minHeight: 90, // Added 4 steps (8px) height for text messages
  },
  sentBubble: {
    backgroundColor: "#D9FDD3",
    marginLeft: "auto",
   borderTopRightRadius: 10,
    borderBottomRightRadius: 8,
    position: "relative",
  },
  receivedBubble: {
    backgroundColor: "#FFFFFF",
    marginRight: "auto",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 8,
    position: "relative",
  },
  sentBubbleTail: {
    position: "absolute",
    right: -15,
    bottom: -7,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    
  },
  receivedBubbleTail: {
    position: "absolute",
    left: -15,
    bottom: -7,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  senderBubbleOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(217, 253, 211, 0.3)",
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    zIndex: 1,
  },
  receiverBubbleOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    zIndex: 1,
  },
  sentMessageText: {
    fontSize: 16,
    color: "#000",
    marginBottom: 0, // Reduced from 2 to 0 (3 steps = 6px)
    //paddingBottom:-8
  },
  receivedMessageText: {
    fontSize: 16,
    color: "#000",
    marginBottom: 0,
     // Reduced from 2 to 0 (3 steps = 6px)
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 0, // Reduced from 1 to 0 (3 steps = 6px)
   
  },
  sentTime: {
    fontSize: 11,
    color: "#53656f",
    marginRight: -4,
    marginBottom:2,
  marginHorizontal:8
  },
  receivedTime: {
    fontSize: 11,
    color: "#53656f",
    alignSelf: "flex-end",
    marginBottom:1
  },
  checkmark: {
    width: 14,
    height: 14,
    marginRight: -6,
    marginLeft: 1,
    marginBottom: 2
  },
  checkmarkShort: {
    marginRight: -10,
    marginLeft: 4,
    marginBottom: -6, // Different positioning for short messages
  },
  // Background Styles
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  blurOverlay: {
    flex: 1,
  },
  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Very light overlay to make text readable
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  inputBlurView: {
    //borderTopWidth: 0.5,
    borderTopColor: "rgba(208, 192, 176, 0.3)",
  },
  inputContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingBottom: 36, // Account for safe area
    minHeight: 60,
  },
  inputIcon: {
    padding: 4,
    marginVertical:-8
   // fontWeight:8000
  },
  cameraIcon: {
    marginVertical: -2, // -8 + 6 = -2 (3 steps added)
    paddingLeft:14
    
  },
  micIcon: {
    marginVertical: -2, // -8 + 6 = -2 (3 steps added)
  },
  textInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
    color: "#000",
    minHeight: 30,
    maxHeight: 100,
    textAlignVertical: "top",
    backgroundColor: 'transparent',
  },
  emojiButton: {
    padding: 4,
  },
  sendButton: {
    padding: 8,
    backgroundColor: "#25D366",
    borderRadius: 20,
    marginLeft: 4,
  },
  imageMessageContainer: {
    marginBottom: 1,
    marginHorizontal: -10,
    marginTop: 2,
    maxWidth: '93%', // Fixed maximum width for image messages
  },
  imageMessageWithShareContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    justifyContent: 'space-between',
  },
  messageImage: {
    borderRadius: 5,
    marginBottom: 2,
  },
  imageCaptionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
    maxWidth: '100%', // Prevent container from exceeding parent width
    flex: 1, // Allow container to take available space
    minHeight: 0, // Allow container to shrink if needed
  },
  imageCaptionText: {
    fontSize: 16,
    color: "#000",
    lineHeight: 20,
    flexWrap: 'wrap', // Allow text to wrap to next line
    flexShrink: 1, // Allow text to shrink if needed
    flexGrow: 0, // Don't grow beyond content size
    width: '120%', // Make text fill the container width
    textAlign: 'justify', // Align text to left within the container
  },
  imageTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4, // Add space between caption and time
    paddingHorizontal: 13, // Match caption padding
   marginRight: -40, // Move time further to the right
  },
  imageTimeWithCaption: {
    // No special positioning needed - uses relative positioning
  },
  imageTimeWithoutCaption: {
    // No special positioning needed - uses relative positioning
  },
  // Share Icon Styles
  shareIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 16,
  //   backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 8,
  },
  senderShareIcon: {
    backgroundColor: 'grey',
    opacity: 0.5,
    left: -40, // Position outside the message bubble on the left
  },
  receiverShareIcon: {
    backgroundColor: 'grey',
    opacity: 0.5,
    right: -40, // Position outside the message bubble on the right
  },
  // Portrait image share icon positioning
  portraitShareIcon: {
    marginVertical: 150, // Different vertical positioning for portrait
    marginHorizontal: -15, // Different horizontal positioning for portrait
  },
  // Original image share icon positioning
  originalShareIcon: {
    marginVertical: 120, // Current positioning for original
    marginHorizontal: -16, // Current positioning for original
  },
  imageTime: {
    fontSize: 11,
    color: "#53656f",
    marginRight: -2,
    
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
  dashboardModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dashboardModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  dashboardIcon: {
    width: 24,
    height: 24,
  },
})

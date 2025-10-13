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
} from "react-native"
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import { useState, useEffect, useRef } from "react"
import SenderEditModal from './SenderEditModal'
import ReceiverEditModal from './ReceiverEditModal'
import ProfileEdit from './ProfileEdit'
import { generateGhanaianNickname } from './namesapi'
import ChatBackground from './ChatBackground'

// Custom BlurView component with iOS compatibility
const CustomBlurView = ({ children, style, intensity = 100, tint = "light" }) => {
  if (Platform.OS === 'ios') {
    // Try the standard BlurView first
    try {
      return (
        <BlurView 
          intensity={intensity} 
          tint={tint} 
          style={style}
          experimentalBlurMethod="dimezisBlurView"
          reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.8)"
        >
          {children}
        </BlurView>
      );
    } catch (error) {
      // Fallback if BlurView fails
      console.log('BlurView failed, using fallback:', error);
      return (
        <View style={[style, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]}>
          {children}
        </View>
      );
    }
  } else {
    // Enhanced Android fallback with better blur simulation
    return (
      <View style={[
        style, 
        { 
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          // Add shadow and border for better visual effect
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }
      ]}>
        {children}
      </View>
    );
  }
};

export default function WhatsAppChat() {
  const [messages, setMessages] = useState([])

  const [senderEditModalVisible, setSenderEditModalVisible] = useState(false)
  const [receiverEditModalVisible, setReceiverEditModalVisible] = useState(false)
  const [editingMessage, setEditingMessage] = useState(null)
  const [editText, setEditText] = useState("")
  const [editTime, setEditTime] = useState("")
  
  const [backgroundModalVisible, setBackgroundModalVisible] = useState(false)
  const [selectedBackground, setSelectedBackground] = useState("default")
  const [customBackgroundUri, setCustomBackgroundUri] = useState(null)
  const [profileImageUri, setProfileImageUri] = useState("https://i.pravatar.cc/150?img=12")
  const [contactName, setContactName] = useState("MiniChat")
  const [unreadCount, setUnreadCount] = useState(34)
  const [profileEditModalVisible, setProfileEditModalVisible] = useState(false)
  const inputContainerAnimation = useState(new Animated.Value(0))[0]
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
    const updatedMessages = messages.map(msg => 
      msg.id === updatedMessage.id ? updatedMessage : msg
    )
    setMessages(updatedMessages)
    setSenderEditModalVisible(false)
    setReceiverEditModalVisible(false)
    setEditingMessage(null)
    setEditText("")
    setEditTime("")
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
    if (selectedBackground === "default") return null
    if (selectedBackground === "defualtbg") return require('./assets/defualtbg.jpg')
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
        color: "#667781", // Keep original color for both sent and received
        paddingTop: 4, // Reduced from 4 to 0 (5 steps = 10px)
        marginLeft: 8, // Small gap from text
        marginRight: -3, // Right margin for spacing
        
      
        // Add marginBottom for both receiver and sender messages
        ...(message.isReceived ? { marginBottom: 0 } : { marginBottom: -4 ,})
      }
    }
    
    // Default time styling for long messages
    return message.isReceived ? styles.receivedTime : styles.sentTime
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
      height: 260
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
            tint="light" 
            style={styles.dateBadge}
          >
            <Text style={styles.dateText}>{dateText}</Text>
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
                            styles.imageCaptionText
                          ]}>
                            {message.text}
                          </Text>
                        </View>
                      ) : null}
                      
                      {/* Time and read ticks for images */}
                      <View style={[
                        styles.imageTimeContainer,
                        message.text && message.text.trim().length > 0 
                          ? styles.imageTimeWithCaption 
                          : styles.imageTimeWithoutCaption
                      ]}>
                        <Text style={styles.imageTime}>
                          {message.time}
                        </Text>
                        {!message.isReceived && (
                          <Image 
                            source={require('./assets/checkmark.png')} 
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
                    isShortMessage ? {
                      marginBottom: 0,
                      fontSize: 16,
                      color: "#000",
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
                        source={require('./assets/checkmark.png')} 
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
                      color={message.isReceived ? "#FFFFFF" : "#D9FDD3"}
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
                { transform: [{ translateY: inputContainerAnimation }] }
              ]}
            >
        <CustomBlurView 
          intensity={100} 
          tint="light" 
          style={styles.inputBlurView}
        >
          <View style={styles.inputContent}>
            <TouchableOpacity style={styles.inputIcon} onPress={addReceiverMessage}>
          <Ionicons name="add" size={26} color="#5E5E5E" />
        </TouchableOpacity>
            <Animated.View 
              style={[
                styles.textInputContainer, 
                { 
                  transform: [{ scaleX: inputWidthAnimation }],
                  transformOrigin: 'left'
                }
              ]}
            >
              <TextInput 
                style={styles.textInput} 
                placeholder="Message" 
                placeholderTextColor="#999" 
                multiline={true}
                maxHeight={100}
                value={inputText}
                onChangeText={handleTextChange}
                editable={isTypingMode}
              />
          <TouchableOpacity style={styles.emojiButton}>
            <Ionicons name="happy-outline" size={24} color="#5E5E5E" />
          </TouchableOpacity>
            </Animated.View>
            {showSendButton ? (
              <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                <Ionicons name="send" size={24} color="#25D366" />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.inputIcon} onPress={handleCameraPress}>
                  <Ionicons name="camera-outline" size={24} color="#5E5E5E" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.inputIcon} onPress={addSenderMessage}>
                  <Ionicons name="mic-outline" size={24} color="#5E5E5E" />
                </TouchableOpacity>
              </>
            )}
      </View>
        </CustomBlurView>
      </Animated.View>
    </>
  )

  return (
    <View style={styles.container}>
      {/* Header - positioned above everything */}
      <CustomBlurView 
        intensity={100} 
        tint="light" 
        style={styles.header}
      >
        <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.unreadCount}>{unreadCount}</Text>
          <TouchableOpacity style={styles.profileContainer} onPress={handleProfilePress}>
            <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleProfilePress}>
            <Text style={styles.contactName}>{contactName}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={useApiNames ? async () => {
            console.log("Video icon pressed - generating new nickname!")
            await generateNewApiName()
            console.log("generateNewApiName completed!")
          } : undefined}>
            <Ionicons name="videocam-outline" size={26} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="call-outline" size={24} color="#000" />
          </TouchableOpacity>
         
        </View>
        </View>
      </CustomBlurView>

      <ImageBackground 
        source={selectedBackground === "default" ? null : (typeof currentBackgroundUri === 'string' ? { uri: currentBackgroundUri } : currentBackgroundUri)} 
        style={styles.backgroundImage}
        resizeMode="cover"
        onError={(error) => console.log('ImageBackground error:', error)}
        onLoad={() => console.log('ImageBackground loaded successfully')}
      >
        <View style={styles.backgroundOverlay}>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
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
              onSwitchToBackground={() => {
                setProfileEditModalVisible(false)
                setBackgroundModalVisible(true)
              }}
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

      {/* Chat Background Modal */}
      <ChatBackground
        visible={backgroundModalVisible}
        onClose={() => setBackgroundModalVisible(false)}
        selectedBackground={selectedBackground}
        onBackgroundSelect={handleBackgroundSelect}
        customBackgroundUri={customBackgroundUri}
        onCustomBackgroundChange={setCustomBackgroundUri}
        onSwitchToProfile={() => {
          setBackgroundModalVisible(false)
          setProfileEditModalVisible(true)
        }}
      />
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
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(208, 192, 176, 0.3)",
    backgroundColor: "transparent", // Ensure no background color interferes with blur
    ...(Platform.OS === 'ios' && {
      // iOS-specific blur enhancements
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      // Additional iOS blur properties
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
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
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 20,
    overflow: "hidden", // Ensure blur effect is contained within rounded corners
  },
  dateText: {
    fontSize: 13,
    color: "#000000",
    fontWeight: "600",
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
    padding: 1,
    paddingHorizontal: 13, // Reduced from 16 to 13 (3 steps = 6px)
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
  },
  receivedMessageText: {
    fontSize: 16,
    color: "#000",
    marginBottom: 0, // Reduced from 2 to 0 (3 steps = 6px)
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 0, // Reduced from 1 to 0 (3 steps = 6px)
  },
  sentTime: {
    fontSize: 11,
    color: "#667781",
    marginRight: -4,
    marginBottom:2,
  marginHorizontal:8
  },
  receivedTime: {
    fontSize: 11,
    color: "#667781",
    alignSelf: "flex-end",
    marginBottom:1
  },
  checkmark: {
    width: 15,
    height: 15,
    marginRight: -6,
    marginLeft: 5,
    marginBottom: 2
  },
  checkmarkShort: {
    marginRight: -6,
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
    borderTopWidth: 0.5,
    borderTopColor: "rgba(208, 192, 176, 0.3)",
  },
  inputContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingBottom: 34, // Account for safe area
    minHeight: 60,
  },
  inputIcon: {
    padding: 8,
  },
  textInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    color: "#000",
    minHeight: 40,
    maxHeight: 100,
    textAlignVertical: "top",
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
    paddingHorizontal: 13,
    paddingVertical: -1,
    marginTop: 4,
  },
  imageCaptionText: {
    fontSize: 16,
    color: "#000",
    lineHeight: 20,
  },
  imageTimeContainer: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
  },
  imageTimeWithCaption: {
    bottom: -2,
    right: 8,
  },
  imageTimeWithoutCaption: {
    bottom: 2,
    right: 12,
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
    color: "gray",
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
})

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
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import { useState, useEffect, useRef } from "react"
import SenderEditModal from './SenderEditModal'
import ReceiverEditModal from './ReceiverEditModal'
import ProfileEdit from './ProfileEdit'
import { generateGhanaianNickname } from './namesapi'
import ChatBackground from './ChatBackground'

export default function WhatsAppChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hey! How are you doing?",
      isReceived: true,
      time: "11:25 AM",
      status: "read"
    },
    {
      id: 2,
      text: "I'm doing great! Just working on some new projects. How about you?",
      isReceived: false,
      time: "11:26 AM",
      status: "read"
    },
    {
      id: 3,
      text: "That sounds awesome! I'm also working on something exciting. Want to grab coffee later?",
      isReceived: true,
      time: "11:28 AM",
      status: "read"
    },
    {
      id: 4,
      text: "Sure! I'd love to. What time works for you?",
      isReceived: false,
      time: "11:29 AM",
      status: "read"
    }
  ])

  const [senderEditModalVisible, setSenderEditModalVisible] = useState(false)
  const [receiverEditModalVisible, setReceiverEditModalVisible] = useState(false)
  const [editingMessage, setEditingMessage] = useState(null)
  const [editText, setEditText] = useState("")
  const [editTime, setEditTime] = useState("")
  
  const [backgroundModalVisible, setBackgroundModalVisible] = useState(false)
  const [selectedBackground, setSelectedBackground] = useState("default")
  const [customBackgroundUri, setCustomBackgroundUri] = useState(null)
  const [profileImageUri, setProfileImageUri] = useState("https://i.pravatar.cc/150?img=12")
  const [contactName, setContactName] = useState("Derrick Koftown")
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

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      })

      if (!result.canceled) {
        // Add image message to chat
        const newMessage = {
          id: Date.now(),
          text: "",
          isReceived: typingMode === "receiver", // Respect current typing mode
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          imageUri: result.assets[0].uri,
          type: "image"
        }
        setMessages(prev => [...prev, newMessage])
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.")
      console.error("Image picker error:", error)
    }
  }

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
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>Monday</Text>
          </View>
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
        {messages.map((message) => (
          <TouchableOpacity 
            key={message.id} 
            style={[styles.messageRow, message.isReceived ? styles.receivedRow : null]}
            onPress={() => handleMessagePress(message)}
            activeOpacity={0.7}
          >
            <View style={[styles.messageBubble, message.isReceived ? styles.receivedBubble : styles.sentBubble]}>
              {message.type === "image" ? (
                <View style={styles.imageMessageContainer}>
                  <Image source={{ uri: message.imageUri }} style={styles.messageImage} />
                  {message.text ? (
                    <Text style={message.isReceived ? styles.receivedMessageText : styles.sentMessageText}>
                      {message.text}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Text style={message.isReceived ? styles.receivedMessageText : styles.sentMessageText}>
                  {message.text}
                </Text>
              )}
              <View style={styles.messageFooter}>
                <Text style={message.isReceived ? styles.receivedTime : styles.sentTime}>
                  {message.time}
                </Text>
                {!message.isReceived && (
                  <Ionicons name="checkmark-done" size={16} color="#53BDEB" style={styles.checkmark} />
                )}
              </View>
              {/* Bubble Tail */}
              <View style={message.isReceived ? styles.receivedBubbleTail : styles.sentBubbleTail}>
                {/* Overlay only for sent bubble tail */}
                {!message.isReceived && <View style={styles.senderBubbleOverlay} />}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input Bar */}
            <Animated.View 
              style={[
                styles.inputContainer,
                { transform: [{ translateY: inputContainerAnimation }] }
              ]}
            >
        <BlurView intensity={80} tint="light" style={styles.inputBlurView}>
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
        </BlurView>
      </Animated.View>
    </>
  )

  return (
    <View style={styles.container}>
      {/* Header - positioned above everything */}
      <BlurView intensity={90} tint="light" style={styles.header}>
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
      </BlurView>

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
              onSwitchToBackground={() => {
                setProfileEditModalVisible(false)
                setBackgroundModalVisible(true)
              }}
            />

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
    backgroundColor: "#E8D7C6", // Default background, will be overridden by dynamic style
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
    marginVertical: 12,
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
    backgroundColor: "rgba(240, 235, 235, 0.86)",
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(213, 204, 204, 0.77)",
  },
  dateText: {
    fontSize: 13,
    color: "#000",
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
    marginVertical: 6,
    paddingHorizontal: 8,
  },
  receivedRow: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 10,
    padding: 1,
    paddingHorizontal: 16,
  },
  sentBubble: {
    backgroundColor: "#D9FDD3",
    marginLeft: "auto",
   // borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    position: "relative",
  },
  receivedBubble: {
    backgroundColor: "#FFFFFF",
    marginRight: "auto",
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    position: "relative",
  },
  sentBubbleTail: {
    position: "absolute",
    right: -20,
    bottom: 0,
    width: 20,
    height: 20,
    backgroundColor: "#D9FDD3",
 //   borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  //  borderTopRightRadius: 2,
 //   borderBottomRightRadius: 2,
  },
  receivedBubbleTail: {
    position: "absolute",
    left: -20,
    bottom: 0,
    width: 20,
    height: 16,
    backgroundColor: "#FFFFFF",
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
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
  senderBubbleOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(217, 253, 211, 0.3)",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    zIndex: 1,
  },
  sentMessageText: {
    fontSize: 16,
    color: "#000",
    marginBottom: 2,
  },
  receivedMessageText: {
    fontSize: 16,
    color: "#000",
    marginBottom: 2,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 1,
  },
  sentTime: {
    fontSize: 11,
    color: "#667781",
    marginRight: 4,
  },
  receivedTime: {
    fontSize: 11,
    color: "#667781",
    alignSelf: "flex-end",
  },
  checkmark: {
    marginLeft: 2,
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
    marginBottom: -1,
    marginHorizontal: -13,
    marginTop: 1,
  },
  messageImage: {
    width: 250,
    height: 300,
    borderRadius: 8,
    marginBottom: 2,
  },
})

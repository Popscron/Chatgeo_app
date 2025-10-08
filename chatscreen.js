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
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
} from "react-native"
import * as ImagePicker from 'expo-image-picker'
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import { useState, useEffect } from "react"
import SenderEditModal from './SenderEditModal'
import ReceiverEditModal from './ReceiverEditModal'
import ProfileEdit from './ProfileEdit'
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
  const [profileEditModalVisible, setProfileEditModalVisible] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const inputContainerAnimation = useState(new Animated.Value(0))[0]
  

  const addReceiverMessage = () => {
    const receiverMessages = [
      "That sounds great!",
      "I'm excited about this!",
      "Let me know when you're ready",
      "Perfect timing!",
      "I'll be there soon",
      "Thanks for letting me know",
      "Sounds like a plan!",
      "I'm looking forward to it",
      "That works for me",
      "Great idea!"
    ]
    
    const randomMessage = receiverMessages[Math.floor(Math.random() * receiverMessages.length)]
    const newMessage = {
      id: messages.length + 1,
      text: randomMessage,
      isReceived: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "read"
    }
    setMessages([...messages, newMessage])
  }

  const addSenderMessage = () => {
    const senderMessages = [
      "I'll be there in 10 minutes",
      "Let me check my schedule",
      "That works perfectly for me",
      "I'm on my way",
      "See you soon!",
      "I'll call you later",
      "Thanks for the update",
      "I'll get back to you",
      "Let me think about it",
      "I'll send you the details"
    ]
    
    const randomMessage = senderMessages[Math.floor(Math.random() * senderMessages.length)]
    const newMessage = {
      id: messages.length + 1,
      text: randomMessage,
      isReceived: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "read"
    }
    setMessages([...messages, newMessage])
  }

  const handleMessagePress = (message) => {
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

  const handleCameraPress = () => {
    setBackgroundModalVisible(true)
  }

  const handleBackgroundSelect = (backgroundId) => {
    setSelectedBackground(backgroundId)
  }

  const handleProfilePress = () => {
    setProfileEditModalVisible(true)
  }

  const handleSendMessage = () => {
    // Add logic to send message here
    console.log('Send message pressed')
  }


  // Get current background URI based on selection
  const getCurrentBackgroundUri = () => {
    if (selectedBackground === "default") return null
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

  // Keyboard event listeners with iOS 16+ optimizations
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height)
      // Immediate response for iOS 16+ keyboard
      Animated.spring(inputContainerAnimation, {
        toValue: -e.endCoordinates.height,
        useNativeDriver: true,
        tension: 500, // Higher tension for snappier response
        friction: 20, // Lower friction for faster animation
        overshootClamping: true, // Prevent overshoot
      }).start()
    })

    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0)
      Animated.spring(inputContainerAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 500,
        friction: 20,
        overshootClamping: true,
      }).start()
    })

    // Fallback for Android
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height)
      Animated.spring(inputContainerAnimation, {
        toValue: -e.endCoordinates.height,
        useNativeDriver: true,
        tension: 400,
        friction: 25,
      }).start()
    })

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0)
      Animated.spring(inputContainerAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 400,
        friction: 25,
      }).start()
    })

    return () => {
      keyboardWillShowListener?.remove()
      keyboardWillHideListener?.remove()
      keyboardDidShowListener?.remove()
      keyboardDidHideListener?.remove()
    }
  }, [inputContainerAnimation])
  
  const renderMainContent = () => (
    <>
      {/* Chat Header */}
      <BlurView intensity={80} tint="light" style={styles.header}>
        <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.unreadCount}>34</Text>
          <TouchableOpacity style={styles.profileContainer} onPress={handleProfilePress}>
            <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleProfilePress}>
            <Text style={styles.contactName}>{contactName}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="videocam-outline" size={26} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="call-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
      </BlurView>

      {/* Chat Messages */}
            <ScrollView 
              style={[
                styles.chatContainer, 
                selectedBackground !== "default" && { backgroundColor: "transparent" }
              ]} 
              contentContainerStyle={styles.chatContent}
            >
        {/* Date Separator */}
        <View style={styles.dateSeparator}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>Monday</Text>
          </View>
        </View>

        {/* Encryption Message */}
        <View style={styles.systemMessage}>
          <Ionicons name="lock-closed" size={14} color="#5E5E5E" style={styles.lockIcon} />
          <Text style={styles.systemMessageText}>
            Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them.{" "}
            <Text style={styles.learnMore}>Learn more</Text>
          </Text>
        </View>

        {/* Dynamic Messages */}
        {messages.map((message) => (
          <TouchableOpacity 
            key={message.id} 
            style={[styles.messageRow, message.isReceived ? styles.receivedRow : null]}
            onPress={() => handleMessagePress(message)}
            activeOpacity={0.7}
          >
            <View style={[styles.messageBubble, message.isReceived ? styles.receivedBubble : styles.sentBubble]}>
              <Text style={message.isReceived ? styles.receivedMessageText : styles.sentMessageText}>
                {message.text}
          </Text>
            <View style={styles.messageFooter}>
                <Text style={message.isReceived ? styles.receivedTime : styles.sentTime}>
                  {message.time}
                </Text>
                {!message.isReceived && (
              <Ionicons name="checkmark-done" size={16} color="#53BDEB" style={styles.checkmark} />
                )}
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
            <View style={styles.textInputContainer}>
              <TextInput 
                style={styles.textInput} 
                placeholder="Message" 
                placeholderTextColor="#999" 
                multiline={true}
                maxHeight={100}
                keyboardType="default"
                returnKeyType="send"
                enablesReturnKeyAutomatically={true}
                textContentType="none"
                autoCorrect={true}
                autoCapitalize="sentences"
                clearButtonMode="never"
                keyboardAppearance="default"
                onSubmitEditing={handleSendMessage}
                blurOnSubmit={false}
              />
              <TouchableOpacity style={styles.emojiButton}>
                <Ionicons name="happy-outline" size={24} color="#5E5E5E" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.inputIcon} onPress={handleCameraPress}>
              <Ionicons name="camera-outline" size={24} color="#5E5E5E" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.inputIcon} onPress={addSenderMessage}>
              <Ionicons name="mic-outline" size={24} color="#5E5E5E" />
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>
    </>
  )

  return (
    <View style={styles.container}>
      {selectedBackground === "default" ? (
        <BlurView intensity={20} tint="light" style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            {renderMainContent()}
          </SafeAreaView>
        </BlurView>
      ) : (
        <ImageBackground 
          source={{ uri: currentBackgroundUri }} 
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
      )}

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
      />

      {/* Chat Background Modal */}
      <ChatBackground
        visible={backgroundModalVisible}
        onClose={() => setBackgroundModalVisible(false)}
        selectedBackground={selectedBackground}
        onBackgroundSelect={handleBackgroundSelect}
        customBackgroundUri={customBackgroundUri}
        onCustomBackgroundChange={setCustomBackgroundUri}
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
    padding: 4,
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
  dateBadge: {
    backgroundColor: "#E8D7C6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 13,
    color: "#5E5E5E",
    fontWeight: "500",
  },
  systemMessage: {
    backgroundColor: "#F7EFE5",
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
  },
  systemMessageText: {
    fontSize: 14,
    color: "#5E5E5E",
    lineHeight: 20,
    flex: 1,
    textAlign: "center",
  },
  learnMore: {
    color: "#027EB5",
    fontWeight: "500",
  },
  messageRow: {
    flexDirection: "row",
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  receivedRow: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 8,
    padding: 8,
    paddingHorizontal: 12,
  },
  sentBubble: {
    backgroundColor: "#D9FDD3",
    marginLeft: "auto",
    borderTopRightRadius: 2,
  },
  receivedBubble: {
    backgroundColor: "#FFFFFF",
    marginRight: "auto",
    borderTopLeftRadius: 2,
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
    marginTop: 2,
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    color: "#000",
    minHeight: 40,
    maxHeight: 100,
    textAlignVertical: "top",
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  emojiButton: {
    padding: 4,
  },
})

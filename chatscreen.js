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
} from "react-native"
import * as ImagePicker from 'expo-image-picker'
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import { useState } from "react"
import SenderEditModal from './SenderEditModal'
import ReceiverEditModal from './ReceiverEditModal'

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
  const [profileImageUri, setProfileImageUri] = useState("https://i.pravatar.cc/150?img=12")
  
  const backgroundOptions = [
    { id: "default", name: "Default", uri: null },
    { id: "gradient1", name: "Blue Gradient", uri: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=800&fit=crop" },
    { id: "gradient2", name: "Purple Gradient", uri: "https://images.unsplash.com/photo-1557683311-eac922247aa9?w=400&h=800&fit=crop" },
    { id: "gradient3", name: "Green Gradient", uri: "https://images.unsplash.com/photo-1557683304-673a23048d34?w=400&h=800&fit=crop" },
    { id: "pattern1", name: "Abstract Pattern", uri: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=800&fit=crop" },
    { id: "pattern2", name: "Geometric", uri: "https://images.unsplash.com/photo-1557683304-673a23048d34?w=400&h=800&fit=crop" },
  ]

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

  const selectBackground = (backgroundId) => {
    setSelectedBackground(backgroundId)
    // Auto-apply the background when selected
    setBackgroundModalVisible(false)
  }

  const applyBackground = () => {
    setBackgroundModalVisible(false)
  }

  const cancelBackgroundSelection = () => {
    setBackgroundModalVisible(false)
  }

  const pickProfileImage = async () => {
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
        aspect: [1, 1],
        quality: 1,
      })

      if (!result.canceled) {
        setProfileImageUri(result.assets[0].uri)
        Alert.alert("Success", "Profile image updated!")
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.")
      console.error("Image picker error:", error)
    }
  }

  const currentBackground = backgroundOptions.find(bg => bg.id === selectedBackground)
  
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
          <TouchableOpacity style={styles.profileContainer} onPress={pickProfileImage}>
            <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.contactName}>Derrick Koftown</Text>
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
      <ScrollView style={styles.chatContainer} contentContainerStyle={styles.chatContent}>
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
      <BlurView intensity={80} tint="light" style={styles.inputContainer}>
        <View style={styles.inputContent}>
          <TouchableOpacity style={styles.inputIcon} onPress={addReceiverMessage}>
          <Ionicons name="add" size={26} color="#5E5E5E" />
        </TouchableOpacity>
        <View style={styles.textInputContainer}>
          <TextInput style={styles.textInput} placeholder="" placeholderTextColor="#999" />
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
          source={{ uri: currentBackground?.uri }} 
          style={styles.backgroundImage}
          resizeMode="cover"
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

      {/* Background Selection Modal */}
      <Modal
        visible={backgroundModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelBackgroundSelection}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.backgroundModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Background</Text>
              <TouchableOpacity onPress={cancelBackgroundSelection} style={styles.closeButton}>
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
                  onPress={() => selectBackground(background.id)}
                >
                  {background.uri ? (
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
              <TouchableOpacity style={styles.cancelButton} onPress={cancelBackgroundSelection}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={applyBackground}>
                <Text style={styles.saveButtonText}>Apply</Text>
              </TouchableOpacity>
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
    backgroundColor: "#E8D7C6",
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
  // Modal Styles (for background selection)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
  backgroundModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '95%',
    maxWidth: 500,
    maxHeight: '85%',
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
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(208, 192, 176, 0.3)",
  },
  inputContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingBottom: 34, // Account for safe area
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
  },
  emojiButton: {
    padding: 4,
  },
})

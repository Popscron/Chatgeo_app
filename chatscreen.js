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
} from "react-native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"

export default function WhatsAppChat() {
  return (
    <BlurView intensity={20} tint="light" style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />

        {/* Chat Header */}
        <BlurView intensity={80} tint="light" style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.unreadCount}>34</Text>
              <View style={styles.profileContainer}>
                <Image source={{ uri: "https://i.pravatar.cc/150?img=12" }} style={styles.profileImage} />
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              </View>
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

        {/* Disappearing Messages Info 
        <View style={styles.systemMessage}>
          <Ionicons name="timer-outline" size={14} color="#5E5E5E" style={styles.lockIcon} />
          <Text style={styles.systemMessageText}>
            You use a default timer for disappearing messages in new chats. New messages will disappear from this chat 7
            days after they're sent, except when kept. Tap to update your own default timer.
          </Text>
        </View>

        {/* Sent Message */}
        <View style={styles.messageRow}>
          <View style={[styles.messageBubble, styles.sentBubble]}>
            <Text style={styles.sentMessageText}>Hi</Text>
            <View style={styles.messageFooter}>
              <Text style={styles.sentTime}>9:42 AM</Text>
              <Ionicons name="checkmark-done" size={16} color="#53BDEB" style={styles.checkmark} />
            </View>
          </View>
        </View>

        {/* Received Message */}
        <View style={[styles.messageRow, styles.receivedRow]}>
          <View style={[styles.messageBubble, styles.receivedBubble]}>
            <Text style={styles.receivedMessageText}>Yh</Text>
            <Text style={styles.receivedTime}>11:29 AM</Text>
          </View>
        </View>
      </ScrollView>

        {/* Input Bar */}
        <BlurView intensity={80} tint="light" style={styles.inputContainer}>
          <View style={styles.inputContent}>
            <TouchableOpacity style={styles.inputIcon}>
              <Ionicons name="add" size={26} color="#5E5E5E" />
            </TouchableOpacity>
            <View style={styles.textInputContainer}>
              <TextInput style={styles.textInput} placeholder="" placeholderTextColor="#999" />
              <TouchableOpacity style={styles.emojiButton}>
                <Ionicons name="happy-outline" size={24} color="#5E5E5E" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.inputIcon}>
              <Ionicons name="camera-outline" size={24} color="#5E5E5E" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.inputIcon}>
              <Ionicons name="mic-outline" size={24} color="#5E5E5E" />
            </TouchableOpacity>
          </View>
        </BlurView>
      </SafeAreaView>
    </BlurView>
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

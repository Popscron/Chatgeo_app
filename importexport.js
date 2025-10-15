import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const ImportExportModal = ({ 
  visible, 
  onClose, 
  messages,
  onImport,
  contactName
}) => {
  const [activeTab, setActiveTab] = useState('export'); // 'export' or 'import'
  const [importText, setImportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Export messages to JSON
  const exportMessages = async () => {
    try {
      setIsProcessing(true);
      
      // Safety check for messages
      const messagesToExport = messages || [];
      
      console.log("Export Debug - contactName:", contactName);
      console.log("Export Debug - messages length:", messagesToExport.length);
      
      const exportData = {
        messages: messagesToExport,
        contactName: contactName || 'Unknown Contact',
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      console.log("Export Debug - exportData:", exportData);
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `chat_export_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      // Use the legacy FileSystem API
      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        Alert.alert("Success", "Chat exported successfully!");
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", "Failed to export chat. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Import messages from JSON
  const importMessages = () => {
    try {
      if (!importText.trim()) {
        Alert.alert("Error", "Please paste the chat data to import");
        return;
      }

      const importData = JSON.parse(importText);
      
      if (!importData.messages || !Array.isArray(importData.messages)) {
        Alert.alert("Error", "Invalid chat data format");
        return;
      }

      // Validate message structure
      const validMessages = importData.messages.filter(msg => 
        msg.id && msg.text !== undefined && msg.isReceived !== undefined && msg.time
      );

      if (validMessages.length === 0) {
        Alert.alert("Error", "No valid messages found in the import data");
        return;
      }

      Alert.alert(
        "Import Messages",
        `Found ${validMessages.length} messages to import. This will replace your current chat. Continue?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Import", 
            onPress: () => {
              if (onImport) {
                onImport(validMessages);
              }
              Alert.alert("Success", `Imported ${validMessages.length} messages successfully!`);
              setImportText('');
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      console.error("Import error:", error);
      Alert.alert("Error", "Invalid JSON format. Please check your import data.");
    }
  };

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Import / Export Chat</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'export' && styles.activeTab]}
              onPress={() => setActiveTab('export')}
            >
              <Text style={[styles.tabText, activeTab === 'export' && styles.activeTabText]}>
                Export
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'import' && styles.activeTab]}
              onPress={() => setActiveTab('import')}
            >
              <Text style={[styles.tabText, activeTab === 'import' && styles.activeTabText]}>
                Import
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {activeTab === 'export' ? (
              <View style={styles.exportContainer}>
                <Text style={styles.sectionTitle}>Export Chat</Text>
                <Text style={styles.description}>
                  Export your chat messages to a JSON file that you can save or share. Includes contact name and all message data.
                </Text>
                <Text style={styles.contactInfo}>
                  Contact: {contactName || 'Unknown Contact'}
                </Text>
                <Text style={styles.messageCount}>
                  Total Messages: {messages ? messages.length : 0}
                </Text>
                
                <TouchableOpacity 
                  style={[styles.actionButton, isProcessing && styles.disabledButton]}
                  onPress={exportMessages}
                  disabled={isProcessing}
                >
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {isProcessing ? 'Exporting...' : 'Export Chat'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.importContainer}>
                <Text style={styles.sectionTitle}>Import Chat</Text>
                <Text style={styles.description}>
                  Paste your exported chat data below to import messages.
                </Text>
                
                <TextInput
                  style={styles.importTextArea}
                  placeholder="Paste your chat export data here..."
                  placeholderTextColor="#999"
                  multiline={true}
                  numberOfLines={10}
                  value={importText}
                  onChangeText={setImportText}
                  textAlignVertical="top"
                />
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={importMessages}
                >
                  <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Import Chat</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
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
    maxWidth: 500,
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#25D366',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#25D366',
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  exportContainer: {
    alignItems: 'center',
  },
  importContainer: {
    // No specific styling needed
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  contactInfo: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 10,
  },
  messageCount: {
    fontSize: 14,
    color: '#25D366',
    fontWeight: '500',
    marginBottom: 30,
  },
  importTextArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#000',
    backgroundColor: '#F9F9F9',
    marginBottom: 20,
    minHeight: 150,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImportExportModal;

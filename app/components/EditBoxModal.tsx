// EditBoxModal.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Button,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { BoxInfo } from "../types";
import Colors from "../design/Colors";
import { useWebSocket } from "../provider/WebSocketProvider";
import Toast from "react-native-toast-message";
import { v4 as uuidv4 } from 'uuid'; // Ensure uuid is installed

interface EditBoxModalProps {
  isVisible: boolean;
  boxInfo: BoxInfo;
  onClose: () => void;
  onSave: (text: string, color: string, image: string) => void;
}

interface GenerateImageResponse {
  request_type: "GENERATE_IMAGE";
  data: {
    imageUrls: string[];
    error?: string;
  };
  requestId: string;
}

const TIMEOUT_DURATION = 30000; // 30 seconds

const EditBoxModal: React.FC<EditBoxModalProps> = ({
  isVisible,
  onClose,
  onSave,
  boxInfo
}) => {
  const [newBoxText, setNewBoxText] = useState<string>(boxInfo.text);
  const [selectedColor, setSelectedColor] = useState<string>(boxInfo.color);
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>(boxInfo.image);
  const [activeTab, setActiveTab] = useState<"upload" | "ai">("upload");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null); // New state

  const webSocketContext = useWebSocket();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedMessageRef = useRef<number>(0); // Track the last processed message index

  if (!webSocketContext) {
    // Optionally, render a loading indicator or disable functionalities
    return null;
  }

  const { messages, sendMessage, isConnected } = webSocketContext;

  // Effect to handle incoming WebSocket messages for image generation
  useEffect(() => {
    if (isGenerating && messages.length > lastProcessedMessageRef.current) {
      for (let i = lastProcessedMessageRef.current; i < messages.length; i++) {
        const message = messages[i];
        if (message.event === "GENERATE_IMAGE_response") {
          const response: GenerateImageResponse = message.data;

          // Validate requestId
          if (response.requestId !== currentRequestId) {
            console.warn(`Received response for requestId ${response.requestId}, but currentRequestId is ${currentRequestId}. Ignoring.`);
            continue; // Skip processing this message
          }

          if (response.data.imageUrls) {
            setImages(response.data.imageUrls);
            setSelectedImage(response.data.imageUrls[0] || "");
            setIsGenerating(false);
            Toast.show({
              type: "success",
              text1: "Images Generated",
              text2: "AI-generated images have been added.",
            });

            // Clear the timeout since the response was received
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }

            // Reset currentRequestId
            setCurrentRequestId(null);

            // Update the last processed message index
            lastProcessedMessageRef.current = i + 1;
            break; // Exit after processing the relevant message
          } else if (response.data.error) {
            setIsGenerating(false);
            Toast.show({
              type: "error",
              text1: "Image Generation Failed",
              text2: response.data.error,
            });

            // Clear the timeout since an error was received
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }

            // Reset currentRequestId
            setCurrentRequestId(null);

            // Update the last processed message index
            lastProcessedMessageRef.current = i + 1;
            break; // Exit after processing the relevant message
          }
        }
      }
    }
  }, [messages, isGenerating, currentRequestId]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const generateAIImage = () => {
    if (!newBoxText.trim()) {
      Toast.show({
        type: "error",
        text1: "No Text Provided",
        text2: "Please enter text to generate images.",
      });
      return;
    }

    // Generate a unique requestId
    const newRequestId = uuidv4();

    // Prepare the WebSocket message
    const message = {
      text: newBoxText.trim(),
      requestId: newRequestId,
    };

    // Send the message via WebSocket using custom event
    sendMessage("GENERATE_IMAGE", message);

    setIsGenerating(true);
    setCurrentRequestId(newRequestId); // Store the current requestId
    Toast.show({
      type: "info",
      text1: "Generating Images",
      text2: "Please wait while AI generates images...",
    });

    // Start the timeout
    timeoutRef.current = setTimeout(() => {
      if (currentRequestId === newRequestId) { // Ensure timeout corresponds to the current request
        setIsGenerating(false);
        setCurrentRequestId(null);
        Toast.show({
          type: "error",
          text1: "Timeout",
          text2: "Image generation is taking longer than expected. Please try again.",
        });
      }
    }, TIMEOUT_DURATION);
  };

  const handleSave = () => {
    if (!selectedImage) {
      Toast.show({
        type: "error",
        text1: "No Image Selected",
        text2: "Please select or generate an image for the box.",
      });
      return;
    }

    onSave(newBoxText.trim() || "New Box", selectedColor, selectedImage);
    onClose();

    // Reset the last processed message index if needed
    lastProcessedMessageRef.current = messages.length;

    // Clear any ongoing requestId and timeout
    if (currentRequestId) {
      setCurrentRequestId(null);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setCurrentRequestId(null);
    };
  }, []);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>

          <Text style={styles.modalTitle}>Edit Box</Text>

          {/* Add Box Section */}
          <View style={styles.addBoxContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter box text"
              value={newBoxText}
              onChangeText={setNewBoxText}
            />
            <Text style={styles.label}>Select Color:</Text>
            <View style={styles.colorSelector}>
              {Object.values(Colors).map((color: string) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColor,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "upload" && styles.activeTab]}
              onPress={() => setActiveTab("upload")}
            >
              <Text style={styles.tabText}>Upload Picture</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "ai" && styles.activeTab]}
              onPress={() => setActiveTab("ai")}
            >
              <Text style={styles.tabText}>Create Pictures</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === "upload" ? (
            <View style={styles.tabContent}>
              <Button title="Pick an image" onPress={pickImage} />
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              ) : (
                <Text style={styles.noImageText}>No image selected</Text>
              )}
            </View>
          ) : (
            <View style={styles.tabContent}>
              <Button title={`Create pictures for "${newBoxText.trim() || "..."}`} onPress={generateAIImage} disabled={!isConnected || isGenerating} />
              {isGenerating && (
                <Text style={styles.loadingText}>Generating images...</Text>
              )}
              {images.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.imageRow}
                >
                  {images.map((imgUri, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedImage(imgUri)}
                    >
                      <Image
                        source={{ uri: imgUri }}
                        style={[
                          styles.imagePreview,
                          selectedImage === imgUri && styles.selectedImage,
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                !isGenerating && (
                  <Text style={styles.noImageText}>No images generated</Text>
                )
              )}
            </View>
          )}

          {/* Buttons */}
          <View style={styles.modalButtons}>
            <Button title="Cancel" onPress={onClose} />
            <Button title="Save Changes" onPress={handleSave} />
          </View>
        </View>
      </View>
      <Toast />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  addBoxContainer: {
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
  },
  colorSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 10,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#fff",
  },
  selectedColor: {
    borderColor: "#000",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  tab: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    backgroundColor: "#ddd",
  },
  activeTab: {
    backgroundColor: "#bbb",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  tabContent: {
    marginVertical: 10,
    alignItems: "center",
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginTop: 10,
  },
  noImageText: {
    color: "#888",
    marginTop: 10,
  },
  selectedImage: {
    borderWidth: 2,
    borderColor: "#000",
  },
  loadingText: {
    marginTop: 10,
    color: "#555",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  imageRow: {
    flexDirection: "row",
    marginTop: 10,
  },
});

export default EditBoxModal;

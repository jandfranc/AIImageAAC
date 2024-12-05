// CreateBoxModal.tsx

import React, { useState, useEffect, useRef } from "react";
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

interface CreateBoxModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAdd: (text: string, color: string, image: string, isFolder: boolean) => void;
  deletedBoxes: BoxInfo[];
  onReAdd: (box: BoxInfo) => void;
  isFolderOpen: boolean;
}

interface GenerateImageResponse {
  request_type: "GENERATE_IMAGE";
  data: {
    imageUrls: string[];
  };
}

const TIMEOUT_DURATION = 10000; // 10 seconds

const CreateBoxModal: React.FC<CreateBoxModalProps> = ({
  isVisible,
  onClose,
  onAdd,
  deletedBoxes,
  onReAdd,
  isFolderOpen,
}) => {
  const [newBoxText, setNewBoxText] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>(Colors.Red);
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"upload" | "ai">("upload");
  const [isFolder, setIsFolder] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const webSocketContext = useWebSocket();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!webSocketContext) {
    // Optionally, render a loading indicator or disable functionalities
    return null;
  }

  const { messages, sendMessage, isConnected, connectionStatus } = webSocketContext;

  // Effect to handle incoming WebSocket messages for image generation
  useEffect(() => {
    if (isGenerating && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      console.log(lastMessage.data.data.imageUrls)
      if (
        lastMessage.event === "GENERATE_IMAGE_response" &&
        lastMessage.data.data.imageUrls
      ) {
        setSelectedImage(lastMessage.data.data.imageUrls[0] || "");
        setImages(lastMessage.data.data.imageUrls);
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
      } else if (lastMessage.event === "GENERATE_IMAGE_response" && lastMessage.data.error) {
        setIsGenerating(false);
        Toast.show({
          type: "error",
          text1: "Image Generation Failed",
          text2: lastMessage.data.error,
        });

        // Clear the timeout since an error was received
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    }
  }, [messages, isGenerating]);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
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

    // Prepare the WebSocket message
    const message = {
      text: newBoxText.trim(),
    };

    // Send the message via WebSocket using custom event
    sendMessage('GENERATE_IMAGE', message);

    setIsGenerating(true);
    Toast.show({
      type: "info",
      text1: "Generating Images",
      text2: "Please wait while AI generates images...",
    });

    // Start the timeout
    timeoutRef.current = setTimeout(() => {
      setIsGenerating(false);
      Toast.show({
        type: "error",
        text1: "Timeout",
        text2: "Image generation is taking longer than expected. Please try again.",
      });
    }, TIMEOUT_DURATION);
  };

  const handleAdd = () => {
    if (!selectedImage) {
      Toast.show({
        type: "error",
        text1: "No Image Selected",
        text2: "Please select or generate an image for the box.",
      });
      return;
    }

    onAdd(newBoxText.trim() || "New Box", selectedColor, selectedImage, isFolder);
    setNewBoxText("");
    setSelectedColor(Colors.Red);
    setImages([]);
    setSelectedImage("");
    setIsFolder(false);
    onClose();
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
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
          {deletedBoxes.length > 0 && (
            <View style={styles.deletedBoxesContainer}>
              <Text style={styles.sectionTitle}>
                Click to Re-add Deleted Boxes
              </Text>
              <ScrollView
                horizontal
                contentContainerStyle={styles.deletedBoxesRow}
                showsHorizontalScrollIndicator={false}
              >
                {deletedBoxes.map((box) => (
                  <TouchableOpacity
                    key={box.id}
                    style={[
                      styles.deletedBoxItem,
                      { backgroundColor: box.color },
                    ]}
                    onPress={() => onReAdd(box)}
                  >
                    <Text style={styles.deletedBoxText}>{box.text}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          <Text style={styles.modalTitle}>Create Box</Text>

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
            {!isFolderOpen && (
              <>
                <View style={styles.switchContainer}>
                  <Text style={styles.label}>Is this a folder?</Text>
                  <Switch value={isFolder} onValueChange={setIsFolder} />
                </View>
              </>
            )}
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "upload" && styles.activeTab,
              ]}
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
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.imagePreview}
                />
              ) : (
                <Text style={styles.noImageText}>No image selected</Text>
              )}
            </View>
          ) : (
            <View style={styles.tabContent}>
              <Button
                title={`Create pictures for "${newBoxText.trim() || "..."}`}
                onPress={generateAIImage}
                disabled={!isConnected || isGenerating}
              />
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
            <Button title="Add Box" onPress={handleAdd} />
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  deletedBoxesContainer: {
    marginBottom: 20,
  },
  deletedBoxesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  deletedBoxItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  deletedBoxText: {
    color: "#fff",
    fontSize: 14,
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
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
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
  selectedImage: {
    borderWidth: 2,
    borderColor: "#000",
  },
  loadingText: {
    marginTop: 10,
    color: "#555",
  },
  connectionStatus: {
    fontSize: 14,
    color: "green", // Adjust dynamically if needed
    textAlign: "center",
    marginBottom: 10,
  },
});

export default CreateBoxModal;

// src/screens/HomeScreen.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  Modal, // Imported Modal
  TouchableOpacity, // Imported TouchableOpacity for option buttons
  Text, // Imported Text for option labels
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WordBox from "../components/WordBox";
import AddBox from "../components/AddBox";
import GenericBox from "../components/GenericBox";
import EditBoxModal from "../components/EditBoxModal";
import SettingsModal from "../components/SettingsModal";
import { AppSettings, BoxInfo, BoxType, FolderInfo } from "../types";
import { defaultSettings } from "../data/defaultSettings";
import defaultBoxes from "../data/defaultBoxes";
import Toast from 'react-native-toast-message';
import ToggleBar from "../components/ToggleBar";
import BarSettingsModal from "../components/BarSettingsModal";
import { v4 as uuidv4 } from 'uuid';
import { Audio } from 'expo-av';
import FolderBox from "../components/FolderBox";
import axios from 'axios';
import { useWebSocket } from "../provider/WebSocketProvider";
import { Buffer } from "buffer";

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const webSocketContext = useWebSocket();

  const { isConnected, messages, sendMessage } = webSocketContext;

  // State for boxes
  const [boxes, setBoxes] = useState<BoxInfo[]>(defaultBoxes);
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [topText, setTopText] = useState<string>("");

  // State for modals
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);

  // State for editing a box
  const [editingBox, setEditingBox] = useState<BoxInfo | null>(null);

  // State for app settings
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultSettings);

  // State for toggle buttons
  const [toggleButtons, setToggleButtons] = useState<{ text: string; uri: string | null }[]>([
    { text: "Option 1", uri: null },
    { text: "Option 2", uri: null },
    { text: "Option 3", uri: null },
  ]);
  const [selectedButtonIndex, setSelectedButtonIndex] = useState<number>(0);
  const [isBarSettingsModalVisible, setBarSettingsModalVisible] = useState(false);
  
  const [currentOpenFolder, setCurrentOpenFolder] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderInfo[]>([]);

  // Ref to track the last processed message
  const lastProcessedMessageRef = useRef<any>(null);

  // New State for Predict Sentence functionality
  const [predictOptions, setPredictOptions] = useState<string[]>([]);
  const [isPredictModalVisible, setPredictModalVisible] = useState<boolean>(false);

  const loadFolderData = async () => {
    try {
      const savedFolders = await AsyncStorage.getItem("@folders_layout");
      if (savedFolders) setFolders(JSON.parse(savedFolders));
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }

  // Load folder data on startup
  useEffect(() => {
    loadFolderData();
  }, []);

  // Save folder data whenever it changes
  useEffect(() => {
    console.log("saving folders");
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("@folders_layout", JSON.stringify(folders));
      } catch (error) {
        console.error("Failed to save data:", error);
      }
    };
    saveData();
  }, [folders]);

  const handleOpenFolder = (folderUUID: string) => {
    setCurrentOpenFolder(folderUUID);
  }

  const handleCloseFolder = () => {
    setCurrentOpenFolder(null);
  }

  const handleToggle = (index: number) => {
    setSelectedButtonIndex(index);
    console.log(index)
  };

  const handleOpenBarSettingsModal = () => {
    setBarSettingsModalVisible(true);
  };

  const handleCloseBarSettingsModal = () => {
    setBarSettingsModalVisible(false);
  };

  // Handlers for editing boxes
  const handleEdit = (id: number) => {
    const boxToEdit = boxes.find((box) => box.id === id);
    if (boxToEdit) {
      setEditingBox(boxToEdit);
      setEditModalVisible(true);
    }
  };

  const handleEditSave = (text: string, color: string, image: string) => {
    if (editingBox) {
      const updatedBox = { ...editingBox, text, color, image };
      setBoxes((prevBoxes) =>
        prevBoxes.map((box) => (box.id === updatedBox.id ? updatedBox : box))
      );
      setEditModalVisible(false);
    }
  };

  // Handlers for settings
  const handleOpenSettingsModal = () => {
    setSettingsModalVisible(true);
  };

  const handleSettingsSave = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    setSettingsModalVisible(false);
  };

  const deletedBoxes = defaultBoxes.filter(
    (defaultBox) => !boxes.some((box) => box.id === defaultBox.id)
  );

  const handleResetBoxes = () => {
    setBoxes(defaultBoxes);
  };

  // Adjust available height for boxes
  const topTextHeight = 110; // Fixed height, could be made dynamic
  const buttonContainerHeight = 50; // Fixed height

  const adjustedHeight =
    height - topTextHeight - buttonContainerHeight - appSettings.boxMargin * 3;

  // Calculate box dimensions based on settings
  const boxSize = Math.min(
    (width - appSettings.boxMargin * (appSettings.numHorizontalBoxes + 1)) /
      appSettings.numHorizontalBoxes,
    adjustedHeight /
      Math.floor(adjustedHeight / (width / appSettings.numHorizontalBoxes)) -
      appSettings.boxMargin
  );

  const numVerticalBoxes = Math.floor(
    adjustedHeight / (boxSize + appSettings.boxMargin)
  );
  const boxesPerPage = appSettings.numHorizontalBoxes * numVerticalBoxes;

  const currentBoxes = currentOpenFolder
    ? folders.find((folder) => folder.uuid === currentOpenFolder)?.containedBoxes || []
    : boxes;

  const numPages = Math.ceil((currentBoxes.length + 1) / boxesPerPage);

  const pages = Array.from({ length: numPages }, (_, pageIndex) =>
    currentBoxes.slice(pageIndex * boxesPerPage, (pageIndex + 1) * boxesPerPage)
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedBoxes = await AsyncStorage.getItem("@boxes_layout");
        if (savedBoxes) setBoxes(JSON.parse(savedBoxes));

        const savedSettings = await AsyncStorage.getItem("@app_settings");
        if (savedSettings) {
          setAppSettings(JSON.parse(savedSettings));
        } else {
          setAppSettings(defaultSettings);
          await AsyncStorage.setItem("@app_settings", JSON.stringify(defaultSettings));
        }

        const savedToggleButtons = await AsyncStorage.getItem("@toggle_buttons");
        if (savedToggleButtons) {
          setToggleButtons(JSON.parse(savedToggleButtons));
        } else {
          // Optionally, save the default toggleButtons to AsyncStorage
          await AsyncStorage.setItem("@toggle_buttons", JSON.stringify(toggleButtons));
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    loadData();
  }, []);

  // Save boxes, settings, and toggleButtons to AsyncStorage whenever they change
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("@boxes_layout", JSON.stringify(boxes));
        await AsyncStorage.setItem("@app_settings", JSON.stringify(appSettings));
        await AsyncStorage.setItem("@toggle_buttons", JSON.stringify(toggleButtons));
        // You can also save predictOptions if needed
      } catch (error) {
        console.error("Failed to save data:", error);
      }
    };
    saveData();
  }, [boxes, appSettings, toggleButtons]);

  const handleAddNewBox = (text: string, color: string, image: string, isFolder: boolean) => {
    
    console.log(folders)
    
    var uuid = uuidv4();

    if (currentOpenFolder) {
      console.log(folders)
      const folderIndex = folders.findIndex((folder) => folder.uuid === currentOpenFolder);
      console.log(folderIndex)
      if (folderIndex !== -1) {
        // new id should be based on current boxes in current folder
        const newId = folders[folderIndex].containedBoxes.length > 0
          ? Math.max(...folders[folderIndex].containedBoxes.map((b) => b.id)) + 1
          : 1;
        const newBox: BoxInfo = {
          id: newId,
          // type based on isFolder
          type: BoxType.TalkBox,
          text,
          image,
          color,    
        };
        const updatedFolder = { ...folders[folderIndex] };
        updatedFolder.containedBoxes.push(newBox);
        const updatedFolders = [...folders];
        updatedFolders[folderIndex] = updatedFolder;
        setFolders(updatedFolders);
      }
    }
    else {
      const newId =
      boxes.length > 0
        ? Math.max(
            ...boxes.map((b) => b.id),
            ...defaultBoxes.map((b) => b.id)
          ) + 1
        : 1;
      if (isFolder) {
        const newFolder: FolderInfo = {
          uuid: uuid,
          text: text,
          containedBoxes: [],
        };
        setFolders((prevFolders) => [...prevFolders, newFolder]);
        console.log(newFolder)
      }
      const newBox: BoxInfo = {
        id: newId,
        // type based on isFolder
        type: isFolder ? BoxType.FolderBox : BoxType.TalkBox,
        text,
        image,
        color,
        folderId: isFolder ? uuid : undefined
  
      };
      setBoxes((prevBoxes) => [...prevBoxes, newBox]);
    }
  };

  const handleDelete = (id: number) => {
    if (currentOpenFolder) {
      const folderIndex = folders.findIndex((folder) => folder.uuid === currentOpenFolder);
      if (folderIndex !== -1) {
        const updatedFolder = { ...folders[folderIndex] };
        updatedFolder.containedBoxes = updatedFolder.containedBoxes.filter(
          (box) => box.id !== id
        );
        const updatedFolders = [...folders];
        updatedFolders[folderIndex] = updatedFolder;
        setFolders(updatedFolders);
      }
    }
    else {
      setBoxes((prevBoxes) => prevBoxes.filter((box) => box.id !== id));

    }
    
  };

  const handleReAdd = (box: BoxInfo) => {
    setBoxes((prevBoxes) => [...prevBoxes, box]);
  };

  const swapBoxes = (sourceId: number, targetId: number) => {
    const sourceIndex = boxes.findIndex((box) => box.id === sourceId);
    const targetIndex = boxes.findIndex((box) => box.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const updatedBoxes = [...boxes];
    [updatedBoxes[sourceIndex], updatedBoxes[targetIndex]] = [
      updatedBoxes[targetIndex],
      updatedBoxes[sourceIndex],
    ];
    setBoxes(updatedBoxes);
  };

  const handleSelect = (id: number | null, uuid: string = "") => {
    console.log(selectedBoxId, id);
    if (selectedBoxId !== null && id !== null) {
      if (currentOpenFolder) {
        // Swap boxes in the current folder
        const folderIndex = folders.findIndex((folder) => folder.uuid === currentOpenFolder);
        if (folderIndex !== -1) {
          const sourceBox = folders[folderIndex].containedBoxes.find((box) => box.id === selectedBoxId);
          const targetBox = folders[folderIndex].containedBoxes.find((box) => box.id === id);
          if (sourceBox && targetBox) {
            const updatedFolder = { ...folders[folderIndex] };
            const sourceIndex = updatedFolder.containedBoxes.findIndex((box) => box.id === selectedBoxId);
            const targetIndex = updatedFolder.containedBoxes.findIndex((box) => box.id === id);
            [updatedFolder.containedBoxes[sourceIndex], updatedFolder.containedBoxes[targetIndex]] = [
              updatedFolder.containedBoxes[targetIndex],
              updatedFolder.containedBoxes[sourceIndex],
            ];
            const updatedFolders = [...folders];
            updatedFolders[folderIndex] = updatedFolder;
            setFolders(updatedFolders);
          }
        }
      }
      else {
        swapBoxes(selectedBoxId, id);
      }
      setSelectedBoxId(null);
      return;
    }
    if (selectedBoxId === id) {
      setSelectedBoxId(null);
      return;
    }

    if (uuid) {
      handleOpenFolder(uuid);
    }
    else {
      if (currentOpenFolder) {
        // Get box from containedBoxes for the current folder
        const folderIndex = folders.findIndex((folder) => folder.uuid === currentOpenFolder);
        if (folderIndex !== -1) {
          const box = folders[folderIndex].containedBoxes.find((box) => box.id === id);
          if (box) {
            setTopText(
              topText + (topText ? " " : "") + box.text
            );
          }
        }
      }
      else {
        setTopText(
          topText + (topText ? " " : "") + (boxes.find((box) => box.id === id)?.text || "")
        );  
      }
    }
    
  };

  const handleLongSelect = (id: number) => {
    if (id === null) {
      setSelectedBoxId(null);
    } else if (selectedBoxId === null) {
      setSelectedBoxId(id);
    } else if (selectedBoxId !== id) {
      swapBoxes(selectedBoxId, id);
      setSelectedBoxId(null);
    } else {
      setSelectedBoxId(null);
    }
  };

  const handleDeleteWord = () => {
    const words = topText.trim().split(" ");
    words.pop();
    setTopText(words.join(" "));
  };

  const handleDeleteLetter = () => {
    setTopText(topText.slice(0, -1));
  };

  // Updated Handler for "Predict Sentence" to use PREDICT endpoint
  const handlePredictSentence = () => {
    if (!topText.trim()) {
      Toast.show({
        type: "error",
        text1: "No text to predict",
        text2: "Please enter text to predict sentence expansion.",
      });
      return;
    }

    Toast.show({
      type: "info",
      text1: "Predicting Sentence",
      text2: "Requesting sentence prediction...",
    });

    // Prepare the WebSocket message
    const message = {
      request_type: "PREDICT",
      data: {
        text: topText,
      },
    };

    // Send the message via WebSocket
    sendMessage("PREDICT", message);
  };

  const handleSelectPredictOption = (option: string) => {
    // Replace the entire topText with the selected option
    setTopText(option);
    setPredictOptions([]);
    setPredictModalVisible(false);
    Toast.show({
      type: "success",
      text1: "Sentence Predicted",
      text2: "The sentence has been updated successfully.",
    });
  };

  const handleSpeak = async () => {
    console.log(toggleButtons);
    const selectedUri = toggleButtons[selectedButtonIndex]?.uri;

    if (!selectedUri) {
        Toast.show({
            type: "error",
            text1: "No voice selected",
            text2: "Please select a voice using the toggle bar.",
        });
        return;
    }

    if (!topText.trim()) {
        Toast.show({
            type: "error",
            text1: "No text to speak",
            text2: "Please enter text to synthesize.",
        });
        return;
    }

    if (!isConnected) {
        Toast.show({
            type: "error",
            text1: "WebSocket Disconnected",
            text2: "Please wait while the connection is re-established.",
        });
        return;
    }

    try {
        Toast.show({
            type: "info",
            text1: "Generating audio",
            text2: "Please wait while the audio is being generated...",
        });

        
        // Prepare the WebSocket message
        const message = {
          data: {
                audio_file: selectedUri, // Base64-encoded audio file
                text: topText,
            },
        };

        // Send the message via WebSocket
        sendMessage("SYNTHESISE", message);

    } catch (error) {
        console.error("Error generating audio:", error);
        Toast.show({
            type: "error",
            text1: "Error generating audio",
        });
    }
};

// Listen for messages from WebSocket
useEffect(() => {
  if (messages.length > 0) {
    const lastMessage = messages[messages.length - 1];

    // Check if this message has already been processed
    if (lastProcessedMessageRef.current !== lastMessage) {
      // Handle SYNTHESISE response
      if (
        lastMessage.data.request_type === "SYNTHESISE" &&
        lastMessage.data.data.audio_url
      ) {
        console.log("Playing audio...");
        playAudio(lastMessage.data.data.audio_url);
        Toast.show({
          type: "success",
          text1: "Audio generated",
          text2: "Playing the generated audio.",
        });
      }
      // Handle PREDICT response
      else if (
        lastMessage.data.request_type === "PREDICT" &&
        lastMessage.data.data.options
      ) {
        console.log("Received predict sentence options:", lastMessage.data.data.options);
        setPredictOptions(lastMessage.data.data.options);
        setPredictModalVisible(true);
        Toast.show({
          type: "success",
          text1: "Sentence Prediction",
          text2: "Choose an option to update your sentence.",
        });
      }
      // Handle errors for PREDICT
      else if (
        lastMessage.data.request_type === "PREDICT" &&
        lastMessage.error
      ) {
        Toast.show({
          type: "error",
          text1: "Error Predicting Sentence",
          text2: lastMessage.error,
        });
      }
      // Handle other responses
      else if (lastMessage.error) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: lastMessage.error,
        });
      }

      // Update the ref to mark this message as processed
      lastProcessedMessageRef.current = lastMessage;
    }
  }
}, [messages]);

const playAudio = async (audioUrl: any) => {
  try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      await sound.playAsync();
  } catch (error) {
      console.error("Error playing audio:", error);
      Toast.show({
          type: "error",
          text1: "Error playing audio",
      });
  }
};

  return (
    <View style={[styles.container, { padding: appSettings.boxMargin / 2 }]}>
      <ToggleBar
        buttons={toggleButtons}
        selectedButtonIndex={selectedButtonIndex}
        onToggle={handleToggle}
        onOpenSettings={handleOpenBarSettingsModal}
      />
      <BarSettingsModal
        isVisible={isBarSettingsModalVisible}
        onClose={handleCloseBarSettingsModal}
        buttons={toggleButtons}
        onUpdateButtons={setToggleButtons}
      />
      <TextInput
        style={[
          styles.textBox,
          { marginBottom: 10, fontSize: 64 },
        ]}
        value={topText}
        onChangeText={setTopText}
        placeholder="Enter text here..."
        placeholderTextColor="#aaa"
        multiline
      />
      <View style={[styles.buttonContainer, { height: 50 }]}>
        <View style={styles.buttonWrapper}>
          <Button title="Delete Word" onPress={handleDeleteWord} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Delete Letter" onPress={handleDeleteLetter} />
        </View>
        
        {/* Conditionally Render the "Expand Sentence" Button */}
        {appSettings.allowExpansion && (
          <View style={styles.buttonWrapper}>
            <Button title="Expand Sentence" onPress={handlePredictSentence} />
          </View>
        )}
        
        <View style={styles.buttonWrapper}>
          <Button title="Speak" onPress={handleSpeak} />
        </View>
      </View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        style={{ flex: 1 }}
      >
        {pages.map((pageBoxes, pageIndex) => (
          <View key={pageIndex} style={[styles.grid, { width }]}>
            {pageBoxes.map((box) => (
              box.type !== BoxType.FolderBox ? (
                <WordBox
                  key={box.id}
                  id={box.id}
                  size={boxSize}
                  margin={appSettings.boxMargin / 2}
                  selected={box.id === selectedBoxId}
                  onSelect={handleSelect}
                  onLongSelect={handleLongSelect}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  boxInfo={box}
                />
              ) : (
                <FolderBox
                  key={box.id}
                  id={box.id}
                  size={boxSize}
                  margin={appSettings.boxMargin / 2}
                  selected={box.id === selectedBoxId}
                  onSelect={handleSelect}
                  onLongSelect={handleLongSelect}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  boxInfo={box}
                />
              )
            ))}
            {pageIndex === numPages - 1 && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AddBox
                  boxSize={boxSize}
                  margin={appSettings.boxMargin}
                  onAdd={handleAddNewBox}
                  deletedBoxes={deletedBoxes}
                  onReAdd={handleReAdd}
                  isFolderOpen={currentOpenFolder !== null}
                />
                {!currentOpenFolder && (
                  <>
                    <GenericBox
                      boxSize={boxSize}
                      margin={appSettings.boxMargin}
                      onPress={handleResetBoxes}
                      iconName="refresh"
                    />
                    <GenericBox
                      boxSize={boxSize}
                      margin={appSettings.boxMargin}
                      onPress={handleOpenSettingsModal}
                      iconName="settings"
                    />
                  </>
                )}
                {currentOpenFolder && (
                  <GenericBox
                    boxSize={boxSize}
                    margin={appSettings.boxMargin}
                    onPress={handleCloseFolder}
                    iconName="close"
                  />
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Edit Box Modal */}
      {isEditModalVisible && editingBox && (
        <EditBoxModal
          isVisible={isEditModalVisible}
          onClose={() => setEditModalVisible(false)}
          boxInfo={editingBox}
          onSave={handleEditSave}
        />
      )}

      {/* Settings Modal */}
      {isSettingsModalVisible && (
        <SettingsModal
          isVisible={isSettingsModalVisible}
          onClose={() => setSettingsModalVisible(false)}
          onSave={handleSettingsSave}
          currentSettings={appSettings}
        />
      )}

      {/* Predict Options Modal */}
      <Modal
        visible={isPredictModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPredictModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose a Prediction</Text>
            <ScrollView>
              {predictOptions.map((option, index) => (
                <View key={index} style={styles.optionContainer}>
                  <Text style={styles.optionText}>{option}</Text>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => handleSelectPredictOption(option)}
                  >
                    <Text style={styles.selectButtonText}>Select</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            {/* Large Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setPredictModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBox: {
    height: 110,
    width: "100%",
    borderColor: "#ccc",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#f9f9f9",
    // fontSize is dynamic based on settings
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  // Styles for Predict Options Modal
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  optionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionText: {
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  selectButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  selectButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  cancelButton: {
    marginTop: 20,
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

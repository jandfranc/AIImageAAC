import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WordBox from "../components/WordBox";
import AddBox from "../components/AddBox";
import GenericBox from "../components/GenericBox";
import EditBoxModal from "../components/EditBoxModal";
import SettingsModal from "../components/SettingsModal";
import { AppSettings, BoxInfo, BoxType } from "../types";
import { defaultSettings } from "../data/defaultSettings";
import defaultBoxes from "../data/defaultBoxes";
import Toast from 'react-native-toast-message';
import ToggleBar from "../components/ToggleBar";
import BarSettingsModal from "../components/BarSettingsModal";

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();

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
  const [toggleButtons, setToggleButtons] = useState<{ text: string; audio: string | null }[]>([
    { text: "Option 1", audio: null },
    { text: "Option 2", audio: null },
    { text: "Option 3", audio: null },
  ]);
  const [selectedButtonIndex, setSelectedButtonIndex] = useState<number>(0);
  const [isBarSettingsModalVisible, setBarSettingsModalVisible] = useState(false);

  const handleToggle = (index: number) => {
    setSelectedButtonIndex(index);
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
  const numPages = Math.ceil((boxes.length + 1) / boxesPerPage);

  const pages = Array.from({ length: numPages }, (_, pageIndex) =>
    boxes.slice(pageIndex * boxesPerPage, (pageIndex + 1) * boxesPerPage)
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
      } catch (error) {
        console.error("Failed to save data:", error);
      }
    };
    saveData();
  }, [boxes, appSettings, toggleButtons]);

  const handleAddNewBox = (text: string, color: string, image: string) => {
    const newId =
      boxes.length > 0
        ? Math.max(
            ...boxes.map((b) => b.id),
            ...defaultBoxes.map((b) => b.id)
          ) + 1
        : 1;
    const newBox: BoxInfo = {
      id: newId,
      type: BoxType.TalkBox,
      text,
      image,
      color,
    };
    setBoxes((prevBoxes) => [...prevBoxes, newBox]);
  };

  const handleDelete = (id: number) => {
    setBoxes((prevBoxes) => prevBoxes.filter((box) => box.id !== id));
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

  const handleSelect = (id: number | null) => {
    console.log(selectedBoxId, id);
    if (selectedBoxId !== null && id !== null) {
      swapBoxes(selectedBoxId, id);
      setSelectedBoxId(null);
      return;
    }
    if (selectedBoxId === id) {
      setSelectedBoxId(null);
      return;
    }
    
    setTopText(
      topText + (topText ? " " : "") + (boxes.find((box) => box.id === id)?.text || "")
    );
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

  const handleSpeak = () => {
    console.log("Speak: ", topText);
    // Implement text-to-speech functionality here
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
            ))}
            {pageIndex === numPages - 1 && (
              <>
                <AddBox
                  boxSize={boxSize}
                  margin={appSettings.boxMargin}
                  onAdd={handleAddNewBox}
                  deletedBoxes={deletedBoxes}
                  onReAdd={handleReAdd}
                />
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
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  },
});

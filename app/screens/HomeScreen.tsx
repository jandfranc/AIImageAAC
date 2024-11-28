import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, useWindowDimensions, ScrollView, TextInput, Button } from "react-native";
import WordBox from "../components/WordBox";
import AddBox from "../components/AddBox";
import defaultBoxes from "../data/defaultBoxes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BoxInfo, BoxType } from "../types";
import GenericBox from "../components/GenericBox";
import EditBoxModal from "../components/EditBoxModal";

const numHorizontalBoxes = 10; // Number of boxes per row
const boxMargin = 8; // Space between boxes
const topTextHeight = 110; // Height of the text box
const buttonContainerHeight = 50; // Height of the button container

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();

  const [boxes, setBoxes] = useState<BoxInfo[]>(defaultBoxes);
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [topText, setTopText] = useState<string>("");

  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingBox, setEditingBox] = useState<BoxInfo | null>(null);

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
  


  const deletedBoxes = defaultBoxes.filter(
    (defaultBox) => !boxes.some((box) => box.id === defaultBox.id)
  );

  const handleResetBoxes = () => {
    setBoxes(defaultBoxes);
  };

  // Adjust available height for boxes
  const adjustedHeight = height - topTextHeight - buttonContainerHeight - boxMargin * 3;

  // Calculate box dimensions
  const boxSize = Math.min(
    (width - boxMargin * (numHorizontalBoxes + 1)) / numHorizontalBoxes,
    adjustedHeight / Math.floor(adjustedHeight / (width / numHorizontalBoxes)) - boxMargin
  );

  const numVerticalBoxes = Math.floor(adjustedHeight / (boxSize + boxMargin));
  const boxesPerPage = numHorizontalBoxes * numVerticalBoxes;
  const numPages = Math.ceil((boxes.length + 1) / boxesPerPage); 

  const pages = Array.from({ length: numPages }, (_, pageIndex) =>
    boxes.slice(pageIndex * boxesPerPage, (pageIndex + 1) * boxesPerPage)
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedBoxes = await AsyncStorage.getItem("@boxes_layout");
        if (savedBoxes) setBoxes(JSON.parse(savedBoxes));
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("@boxes_layout", JSON.stringify(boxes));
      } catch (error) {
        console.error("Failed to save data:", error);
      }
    };
    saveData();
  }, [boxes]);

  const handleAddNewBox = (text: string, color: string, image: string) => {
    const newId =
      boxes.length > 0
        ? Math.max(...boxes.map((b) => b.id), ...defaultBoxes.map((b) => b.id)) + 1
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
      return
    } 
    setTopText(topText + " " + boxes.find((box) => box.id === id)?.text || "");
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
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textBox}
        value={topText}
        onChangeText={setTopText}
        placeholder="Enter text here..."
        placeholderTextColor="#aaa"
        multiline
      />
      <View style={styles.buttonContainer}>
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
                margin={boxMargin / 2}
                selected={box.id === selectedBoxId}
                onSelect={handleSelect}
                onLongSelect={handleLongSelect}
                onDelete={handleDelete}
                onEdit={handleEdit} // Pass the edit handler

                boxInfo={box}
              />
            ))}
            {pageIndex === numPages - 1 && (
              <><AddBox
                boxSize={boxSize}
                margin={boxMargin / 2}
                onAdd={handleAddNewBox}
                deletedBoxes={deletedBoxes}
                onReAdd={handleReAdd} />
              <GenericBox
                  boxSize={boxSize}
                  margin={boxMargin / 2}
                  onPress={handleResetBoxes}
                  iconName="refresh"
                />
                </>
            )}
          </View>
        ))}
      </ScrollView>
      {isEditModalVisible && editingBox && (
        <EditBoxModal
          isVisible={isEditModalVisible}
          onClose={() => setEditModalVisible(false)}
          boxInfo={editingBox}
          onSave={handleEditSave}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: boxMargin / 2,
    backgroundColor: "#fff",
  },
  textBox: {
    height: topTextHeight,
    width: "100%",
    borderColor: "#ccc",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
    fontSize: 64,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
    height: buttonContainerHeight,
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

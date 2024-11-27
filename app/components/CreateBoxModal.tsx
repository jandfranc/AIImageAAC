// CreateBoxModal.tsx
import React, { useState } from "react";
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
} from "react-native";
import { BoxInfo } from "./Box";
import * as ImagePicker from "expo-image-picker";

interface CreateBoxModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAdd: (text: string, color: string, image: string) => void;
  deletedBoxes: BoxInfo[];
  onReAdd: (box: BoxInfo) => void;
}

const predefinedColors = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#F1C40F",
  "#9B59B6",
  "#E67E22",
  "#1ABC9C",
  "#FFFFFF", // Added white
  "#000000", // Added black
  "#FFC300", // Added additional colors as needed
];

const CreateBoxModal: React.FC<CreateBoxModalProps> = ({
  isVisible,
  onClose,
  onAdd,
  deletedBoxes,
  onReAdd,
}) => {
  const [newBoxText, setNewBoxText] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(predefinedColors[0]);
  const [image, setImage] = useState<string>("");

  const pickImage = async () => {
    // Request permission to access media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
        console.log(result);
      setImage(result.assets[0].uri);
    }
  };

  const handleAdd = () => {
    onAdd(newBoxText.trim() || "New Box", selectedColor, image);
    setNewBoxText("");
    setSelectedColor(predefinedColors[0]);
    setImage("");
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create or Re-add Box</Text>

          {/* Deleted Boxes Section */}
          {deletedBoxes.length > 0 && (
            <View style={styles.deletedBoxesContainer}>
              <Text style={styles.sectionTitle}>Deleted Boxes</Text>
              <ScrollView
                horizontal
                contentContainerStyle={styles.deletedBoxesRow}
                showsHorizontalScrollIndicator={false}
              >
                {deletedBoxes.map((box) => (
                  <TouchableOpacity
                    key={box.id}
                    style={[styles.deletedBoxItem, { backgroundColor: box.color }]}
                    onPress={() => onReAdd(box)}
                  >
                    <Text style={styles.deletedBoxText}>{box.text}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Add New Box Section */}
          <View style={styles.addBoxContainer}>
            <Text style={styles.sectionTitle}>Add New Box</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter box text"
              value={newBoxText}
              onChangeText={setNewBoxText}
            />

            <Text style={styles.label}>Select Color:</Text>
            <View style={styles.colorSelector}>
              {predefinedColors.map((color) => (
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

            <View style={styles.imageContainer}>
              <Text style={styles.label}>Selected Image:</Text>
              {image ? (
                <Image source={{ uri: image }} style={styles.imagePreview} />
              ) : (
                <Text style={styles.noImageText}>No image selected</Text>
              )}
              <Button title="Pick an image" onPress={pickImage} />
            </View>

            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={onClose} />
              <Button title="Add Box" onPress={handleAdd} />
            </View>
          </View>
        </View>
      </View>
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
    fontSize: 16,
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
  addBoxContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    marginVertical: 5,
    borderRadius: 4,
  },
  label: {
    fontSize: 14,
    marginTop: 10,
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
  imageContainer: {
    marginVertical: 10,
    alignItems: "center",
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 10,
  },
  noImageText: {
    color: "#888",
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
});

export default CreateBoxModal;

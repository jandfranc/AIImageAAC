// EditAudioModal.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { MaterialIcons } from "@expo/vector-icons";

interface EditAudioModalProps {
  isVisible: boolean;
  onClose: () => void;
  button: { text: string; audio: string | null };
  onUpdate: (updatedButton: { text: string; audio: string | null }) => void;
}

const kidFriendlySentences = [
  "The sun is shining brightly today!",
  "My favorite animal is a bunny.",
  "Let's play with the colorful ball.",
  "The sky is blue and full of fluffy clouds.",
  "I love eating ice cream on a sunny day.",
];

const EditAudioModal: React.FC<EditAudioModalProps> = ({
  isVisible,
  onClose,
  button,
  onUpdate,
}) => {
  const [currentSentence, setCurrentSentence] = useState<string>(
    kidFriendlySentences[0]
  );
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [buttonText, setButtonText] = useState(button.text);

  useEffect(() => {
    loadNewSentence();
  }, []);

  const loadNewSentence = () => {
    const newSentence =
      kidFriendlySentences[
        Math.floor(Math.random() * kidFriendlySentences.length)
      ];
    setCurrentSentence(newSentence);
  };

  const handleStartRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Denied", "We need permission to record.");
        return;
      }
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch {
      Alert.alert("Oops!", "We couldn't start recording. Try again.");
    }
  };

  const handleStopRecording = async () => {
    try {
      await recording?.stopAndUnloadAsync();
      const uri = recording?.getURI();
      if (uri) {
        onUpdate({ text: buttonText, audio: uri });
      }
      setRecording(null);
      setIsRecording(false);
    } catch {
      Alert.alert("Oops!", "We couldn't stop recording. Try again.");
    }
  };

  const handleUploadAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
      if (result.uri) {
        onUpdate({ text: buttonText, audio: result.uri });
      }
    } catch {
      Alert.alert("Oops!", "We couldn't upload the audio. Try again.");
    }
  };

  const handleSave = () => {
    onUpdate({ text: buttonText, audio: button.audio });
    onClose();
  };

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Edit Button</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={30} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <TextInput
              style={styles.textInput}
              value={buttonText}
              onChangeText={setButtonText}
              placeholder="Button Title"
            />

            <Text style={styles.sentenceText}>{currentSentence}</Text>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={loadNewSentence}
            >
              <Text style={styles.buttonText}>Next Sentence</Text>
            </TouchableOpacity>

            <View style={styles.recordContainer}>
              {isRecording ? (
                <TouchableOpacity
                  style={styles.recordButton}
                  onPress={handleStopRecording}
                >
                  <MaterialIcons name="stop" size={40} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.recordButton}
                  onPress={handleStartRecording}
                >
                  <MaterialIcons name="mic" size={40} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUploadAudio}
            >
              <MaterialIcons name="upload" size={30} color="#fff" />
              <Text style={styles.buttonText}>Upload Audio</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <MaterialIcons name="save" size={30} color="#4caf50" />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    flexGrow: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginTop: 50, // Adjust as needed
    marginHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  content: {
    marginTop: 20,
    alignItems: "center",
  },
  textInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  sentenceText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  nextButton: {
    backgroundColor: "#2196f3",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  recordContainer: {
    marginBottom: 20,
  },
  recordButton: {
    backgroundColor: "#4caf50",
    padding: 20,
    borderRadius: 50,
  },
  uploadButton: {
    flexDirection: "row",
    backgroundColor: "#2196f3",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  footer: {
    alignItems: "flex-end",
    marginTop: 20,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  saveButtonText: {
    fontSize: 20,
    color: "#4caf50",
    marginLeft: 10,
    fontWeight: "bold",
  },
});

export default EditAudioModal;

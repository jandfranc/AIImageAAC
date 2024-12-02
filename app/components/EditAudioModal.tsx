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
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system';



const SERVER_URL = "http://localhost:3000"; // Replace with your server URL


interface EditAudioModalProps {
  isVisible: boolean;
  onClose: () => void;
  button: { text: string; uri: string | null };
  onUpdate: (updatedButton: { text: string; uri: string | null }) => void;
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
  const [serverUri, setServerUri] = useState<string | null>(null)
  const [sound, setSound] = React.useState<Audio.Sound | null>(null);

  const playAudio = async () => {
    if (button.uri) {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: button.uri });
        setSound(sound);
        await sound.playAsync();
      } catch {
        Alert.alert("Error", "Failed to play audio.");
      }
    } else {
      Alert.alert("No Audio", "This button has no audio.");
    }
  };

  React.useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);


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
        const serverUri = await uploadAudioToServer(uri);
        setServerUri(serverUri)

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
      if (result.type === "success" && result.uri) {
        const audioURI = uploadAudioToServer(result.uri);
        console.log("hi")
        console.log(audioURI)
      }
    } catch {
      console.error("Failed to upload audio.");
    }
  };

 
  const uploadAudioToServer = async (uri: string) => {
    try {
      const formData = new FormData();
  
      if (Platform.OS === "web") {
        // Fetch the file as a Blob for web
        const response = await fetch(uri);
        const blob = await response.blob();
  
        formData.append("audio", blob, `audio-${Date.now()}.webm`);
      } else {
        // Use URI directly for native platforms
        formData.append("audio", {
          uri,
          name: `audio-${Date.now()}.wav`,
          type: "audio/wav", // Ensure this matches your file's MIME type
        } as any);
      }
  
      console.log("FormData Content:");
      for (const pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
  
      const response = await fetch("http://localhost:3000/upload-audio", {
        method: "POST",
        headers: {
          token: "expected-token", // Add your token here
        },
        body: formData,
      });
  
      if (!response.ok) {
        const errorResponse = await response.text();
        throw new Error(`Upload failed: ${errorResponse}`);
      }
  
      const data = await response.json();
      console.log("Upload successful:", data);
      return data.audioUrl
    } catch (error) {
      console.error("Upload Error:", error);
      Alert.alert("Error", error.message || "Failed to upload audio.");
    }
  };
  

  const handleSave = () => {
    onUpdate({ text: buttonText, uri: serverUri });
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
            {button.uri && (
              <TouchableOpacity style={styles.playButton} onPress={playAudio}>
                <MaterialIcons name="play-arrow" size={60} color="#fff" />
              </TouchableOpacity>
            )}
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
  playButton: {
    backgroundColor: "#4caf50",
    borderRadius: 50,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default EditAudioModal;

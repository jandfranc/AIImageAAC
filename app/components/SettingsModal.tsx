// src/components/SettingsModal.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Button,
  ScrollView,
  Platform,
} from "react-native";
import Slider from "@react-native-community/slider";
import { AppSettings } from "../types";
import { defaultSettings } from "../data/defaultSettings";
import Toast from "react-native-toast-message"; // Import Toast

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (appSettings: AppSettings) => void;
  currentSettings: AppSettings;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isVisible,
  onClose,
  onSave,
  currentSettings,
}) => {
  const [boxMargin, setBoxMargin] = useState<number>(currentSettings.boxMargin);
  const [numHorizontalBoxes, setNumHorizontalBoxes] = useState<number>(
    currentSettings.numHorizontalBoxes
  );
  const [isValid, setIsValid] = useState<boolean>(true);

  // Update state when currentSettings change or modal is opened
  useEffect(() => {
    if (isVisible) {
      setBoxMargin(currentSettings.boxMargin);
      setNumHorizontalBoxes(currentSettings.numHorizontalBoxes);
    }
  }, [currentSettings, isVisible]);

  // Validate inputs
  useEffect(() => {
    const validBoxMargin = boxMargin >= 0 && boxMargin <= 50;
    const validNumBoxes = numHorizontalBoxes >= 1 && numHorizontalBoxes <= 20;
    setIsValid(validBoxMargin && validNumBoxes);
  }, [boxMargin, numHorizontalBoxes]);

  const handleSave = () => {
    if (!isValid) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'Please ensure all settings are within valid ranges.',
      });
      return;
    }

    const newSettings: AppSettings = {
      boxMargin: boxMargin,
      numHorizontalBoxes: numHorizontalBoxes,
    };
    onSave(newSettings);
    onClose();

    // Show success toast
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Settings have been saved successfully.',
    });
  };

  const handleReset = () => {
    // Confirmation Toas
    Toast.show({
      type: 'info',
      text1: 'Reset Settings',
      text2: 'Settings have been reset to default.',
    });

    // Reset settings
    setBoxMargin(defaultSettings.boxMargin);
    setNumHorizontalBoxes(defaultSettings.numHorizontalBoxes);

    // Optionally, save the reset settings immediately
    onSave(defaultSettings);
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
          <Text style={styles.modalTitle}>Settings</Text>

          <ScrollView>
            {/* Box Margin Setting */}
            <View style={styles.sliderContainer}>
              <Text style={styles.label}>Box Margin: {boxMargin}</Text>
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={0}
                maximumValue={50}
                step={1}
                value={boxMargin}
                onValueChange={(value) => setBoxMargin(value)}
              />
            </View>

            {/* Number of Horizontal Boxes Setting */}
            <View style={styles.sliderContainer}>
              <Text style={styles.label}>
                Number of Horizontal Boxes: {numHorizontalBoxes}
              </Text>
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={1}
                maximumValue={20}
                step={1}
                value={numHorizontalBoxes}
                onValueChange={(value) => setNumHorizontalBoxes(value)}
              />
            </View>


          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalButtons}>
            <Button title="Cancel" onPress={onClose} />
            <Button
              title="Save Settings"
              onPress={handleSave}
              disabled={!isValid}
            />
          </View>

          {/* Reset to Default Button */}
          <View style={styles.resetButtonContainer}>
            <Button
              title="Reset to Default"
              color="#FF3B30"
              onPress={handleReset}
            />
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
    maxHeight: "80%",
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
  sliderContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  resetButtonContainer: {
    marginTop: 20,
  },
});

export default SettingsModal;

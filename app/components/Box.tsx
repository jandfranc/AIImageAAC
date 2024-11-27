import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  View,
} from "react-native";

export enum BoxType {
    TalkBox,
    OptionBox
}

export interface BoxInfo {
    id: number;
    type: BoxType;
    text: string;
    image: string;
    color: string;
}

interface BoxProps {
  id: number;
  size: number;
  margin: number;
  selected: boolean;
  boxInfo: BoxInfo;
  onSelect: (id: number | null) => void;
}

const Box: React.FC<BoxProps> = ({ id, size, margin, selected, onSelect, boxInfo }) => {
  const animation = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (selected) {
      // Start rotational shaking animation
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: 200, // Duration for half rotation
            useNativeDriver: false, // Must be false for web
          }),
          Animated.timing(animation, {
            toValue: -1,
            duration: 400, // Duration for full rotation back
            useNativeDriver: false,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 200, // Return to initial position
            useNativeDriver: false,
          }),
        ])
      );
      animationRef.current.start();
    } else {
      // Stop the animation
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      animation.setValue(0);
    }
  }, [selected]);

  const rotateAnimation = {
    transform: [
      {
        rotate: animation.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: ["-5deg", "0deg", "5deg"],
        }),
      },
    ],
  };

  return (
    <TouchableOpacity
      style={[
        {
          width: size,
          height: size,
          margin,
        },
      ]}
      onLongPress={() => onSelect(id)}
      onPress={() => {
        if (selected) {
          // Deselect on press
          onSelect(null);
        } else {
          onSelect(id);
        }
      }}
      delayLongPress={1000} // Adjust as needed
    >
      <Animated.View
        style={[
          styles.box,
          { backgroundColor: boxInfo.color },
          selected && styles.selectedBox,
          selected ? rotateAnimation : undefined,
        ]}
      >
        <Text style={styles.boxText}>{boxInfo.text}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  box: {
    flex: 1, // Ensures the Animated.View fills the TouchableOpacity
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  selectedBox: {
    borderColor: "blue",
    borderWidth: 2,
  },
  boxText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Box;

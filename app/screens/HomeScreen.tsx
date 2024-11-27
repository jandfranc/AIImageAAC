import React, { useState } from "react";
import { View, Text, StyleSheet, useWindowDimensions, ScrollView } from "react-native";
import Box from "../components/Box";
import defaultBoxes from "../data/defaultBoxes"; // Import your defaultBoxes array

const numHorizontalBoxes = 8; // Number of horizontal boxes
const boxMargin = 8; // Margin between boxes

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();

  const [boxes, setBoxes] = useState(defaultBoxes); // Use defaultBoxes array here
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);

  const boxSize = (width - boxMargin * (numHorizontalBoxes + 1)) / numHorizontalBoxes;
  const numVerticalBoxes = Math.floor((height - boxMargin * 2 - 50) / (boxSize + boxMargin));
  const boxesPerPage = numHorizontalBoxes * numVerticalBoxes;
  const numPages = Math.ceil(boxes.length / boxesPerPage);

  const pages = Array.from({ length: numPages }, (_, pageIndex) =>
    boxes.slice(pageIndex * boxesPerPage, (pageIndex + 1) * boxesPerPage)
  );

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
    if (id === null || selectedBoxId === id) {
      setSelectedBoxId(null); // Deselect box
    } else if (selectedBoxId === null) {
      setSelectedBoxId(id); // Select box
    } else {
      swapBoxes(selectedBoxId, id); // Swap boxes
      setSelectedBoxId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tiled Boxes</Text>
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
              <Box
                key={box.id}
                id={box.id}
                size={boxSize}
                margin={boxMargin / 2}
                selected={box.id === selectedBoxId}
                onSelect={handleSelect}
                boxInfo={box} // Pass the full box info to the Box component
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: boxMargin / 2,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    textAlign: "center",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});

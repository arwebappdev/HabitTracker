import { DATABASE_ID, databases, HABITS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ID } from "react-native-appwrite";
import { Button, SegmentedButtons, TextInput } from "react-native-paper";

const FREQUENCIES = ["daily", "weekly", "monthly"];
type Frequency = (typeof FREQUENCIES)[number];
const addhabit = () => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { user } = useAuth();
  const router = useRouter();
  const handleSubmit = async () => {
    if (!user) return;
    try {
      await databases.createDocument(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        ID.unique(),
        {
          user_id: user.$id,
          title,
          description,
          frequency,
          streak_count: 0,
          last_completed: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }
      );
      router.back();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        return;
      }
      setError("there was an error creating habit.");
    }
  };
  return (
    <View style={styles.container}>
      <TextInput
        label="Title"
        mode="outlined"
        textColor="black"
        activeOutlineColor="purple"
        style={styles.input}
        onChangeText={setTitle}
      />
      <TextInput
        label="Description"
        mode="outlined"
        textColor="black"
        activeOutlineColor="purple"
        style={styles.input}
        onChangeText={setDescription}
      />
      <View style={styles.frequencyContainer}>
        <SegmentedButtons
          style={styles.segmentedButtons}
          onValueChange={(value) => setFrequency(value as Frequency)}
          buttons={FREQUENCIES.map((freq) => ({
            value: freq,
            label: freq.charAt(0).toUpperCase() + freq.slice(1),
          }))}
        />
      </View>
      <Button
        mode="contained"
        disabled={!title || !description}
        textColor="white"
        style={styles.button}
        onPress={handleSubmit}
      >
        Add Habit
      </Button>
      {error && <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>}
    </View>
  );
};

export default addhabit;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#f5f5f5",
  },
  frequencyContainer: {
    marginBottom: 24,
    color: "black",
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    backgroundColor: "purple",
  },
});

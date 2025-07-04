import { DATABASE_ID, databases, HABITS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ID } from "react-native-appwrite";
import {
  Button,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const FREQUENCIES = ["daily", "weekly", "monthly"];
type Frequency = (typeof FREQUENCIES)[number];
export default function AddHabit() {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("");
  const [error, setError] = useState<string>("");

  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  const handleSubmit = async () => {
    if (!user) {
      setError("User not logged in.");
      return;
    }

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

      // Reset form only after success
      setTitle("");
      setDescription("");
      setFrequency("");
      setError("");
      router.back();
    } catch (err) {
      console.error("Create Habit Error:", err);

      if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Add Habit
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Title"
          value={title}
          mode="outlined"
          onChangeText={setTitle}
          style={styles.input}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />
        <TextInput
          label="Description"
          value={description}
          mode="outlined"
          onChangeText={setDescription}
          style={styles.input}
          multiline
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />

        <Text style={styles.frequencyLabel}>Frequency</Text>
        <SegmentedButtons
          value={frequency}
          onValueChange={(val) => setFrequency(val as Frequency)}
          buttons={FREQUENCIES.map((freq) => ({
            value: freq,
            label: freq.charAt(0).toUpperCase() + freq.slice(1),
          }))}
          style={styles.segmented}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={!title || !description || !frequency}
          style={styles.submitBtn}
        >
          Add Habit
        </Button>

        {error !== "" && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  title: {
    fontWeight: "bold",
  },
  form: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  input: {
    backgroundColor: "transparent",
  },
  frequencyLabel: {
    fontWeight: "600",
    fontSize: 15,
    marginBottom: -4,
    marginLeft: 2,
    color: "#888",
  },
  segmented: {
    marginTop: 4,
    marginBottom: 12,
  },
  submitBtn: {
    borderRadius: 10,
    paddingVertical: 6,
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "500",
  },
});

import {
  client,
  COMPLETIONS_COLLECTION_ID,
  DATABASE_ID,
  databases,
  HABITS_COLLECTION_ID,
  RealTimeResponse,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit, HabitCompletion } from "@/types/database.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import "expo-router/entry";
import React, { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import { Button, Surface, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const { signOut, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<string[]>([]);
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  const theme = useTheme();

  const fetchHabits = async () => {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? "")]
      );
      setHabits(res.documents as Habit[]);
    } catch (err) {
      console.error("fetchHabits error:", err);
    }
  };

  const fetchTodayCompletions = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const res = await databases.listDocuments(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [
          Query.equal("user_id", user?.$id ?? ""),
          Query.greaterThanEqual("completed_at", today.toISOString()),
        ]
      );
      const comps = res.documents as HabitCompletion[];
      setCompletedHabits(comps.map((c) => c.habit_id));
    } catch (err) {
      console.error("fetchTodayCompletions error:", err);
    }
  };

  useEffect(() => {
    if (!user) return;

    const habitsChannel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;
    const completionsChannel = `databases.${DATABASE_ID}.collections.${COMPLETIONS_COLLECTION_ID}.documents`;

    const unsubHabits = client.subscribe(
      habitsChannel,
      (resp: RealTimeResponse) => {
        if (
          resp.events.some((e) =>
            /documents\..*\.(create|update|delete)$/.test(e)
          )
        ) {
          fetchHabits();
        }
      }
    );

    const unsubComps = client.subscribe(
      completionsChannel,
      (resp: RealTimeResponse) => {
        if (resp.events.some((e) => /documents\..*\.create$/.test(e))) {
          fetchTodayCompletions();
        }
      }
    );

    fetchHabits();
    fetchTodayCompletions();

    return () => {
      unsubHabits();
      unsubComps();
    };
  });

  const isHabitCompleted = (id: string) => completedHabits.includes(id);

  const handleDelete = async (id: string) => {
    try {
      await databases.deleteDocument(DATABASE_ID, HABITS_COLLECTION_ID, id);
    } catch (err) {
      console.error("delete error:", err);
    }
  };

  const handleComplete = async (id: string) => {
    if (!user || isHabitCompleted(id)) return;
    try {
      const now = new Date().toISOString();
      await databases.createDocument(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        ID.unique(),
        { habit_id: id, user_id: user.$id, completed_at: now }
      );

      const habit = habits.find((h) => h.$id === id);
      if (habit) {
        await databases.updateDocument(DATABASE_ID, HABITS_COLLECTION_ID, id, {
          streak_count: habit.streak_count + 1,
          last_completed: now,
        });
      }
    } catch (err) {
      console.error("complete error:", err);
    }
  };

  const renderRightActions = (id: string) => (
    <View style={styles.swipeRight}>
      {isHabitCompleted(id) ? (
        <MaterialCommunityIcons name="check-circle" size={28} color="#fff" />
      ) : (
        <MaterialCommunityIcons name="check" size={28} color="#fff" />
      )}
    </View>
  );

  const renderLeftActions = () => (
    <View style={styles.swipeLeft}>
      <MaterialCommunityIcons name="trash-can-outline" size={28} color="#fff" />
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Today&apos;s Habits
        </Text>
        <Button mode="text" icon="logout" onPress={signOut}>
          Sign Out
        </Button>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 24,
          overflow: "visible",
          margin: 0,
        }}
      >
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No habits yet. Add your first one!
            </Text>
          </View>
        ) : (
          habits.map((habit) => (
            <View key={habit.$id} style={{ overflow: "visible" }}>
              <Swipeable
                containerStyle={{ overflow: "visible" }}
                key={habit.$id}
                ref={(ref) => {
                  if (ref) swipeableRefs.current[habit.$id] = ref;
                }}
                renderLeftActions={renderLeftActions}
                renderRightActions={() => renderRightActions(habit.$id)}
                onSwipeableOpen={(dir) =>
                  dir === "left"
                    ? handleDelete(habit.$id)
                    : handleComplete(habit.$id)
                }
              >
                <Surface
                  elevation={3}
                  style={[
                    styles.card,
                    {
                      backgroundColor: isHabitCompleted(habit.$id)
                        ? theme.colors.surfaceDisabled
                        : theme.colors.elevation.level1,
                      opacity: isHabitCompleted(habit.$id) ? 0.6 : 1,
                    },
                  ]}
                >
                  <View style={styles.cardContent}>
                    <Text
                      style={[
                        styles.cardTitle,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {habit.title}
                    </Text>
                    <Text
                      style={[
                        styles.cardDescription,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {habit.description}
                    </Text>

                    <View style={styles.cardFooter}>
                      <View style={styles.streakBadge}>
                        <MaterialCommunityIcons
                          name="fire"
                          size={18}
                          color="#ff9800"
                        />
                        <Text style={styles.streakText}>
                          {habit.streak_count} day streak
                        </Text>
                      </View>

                      <View style={styles.freqBadge}>
                        <Text style={styles.freqText}>
                          {habit.frequency.charAt(0).toUpperCase() +
                            habit.frequency.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Surface>
              </Swipeable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    marginTop: 100,
  },
  emptyStateText: {
    color: "#888",
  },
  card: {
    borderRadius: 18,
    margin: 10,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakText: {
    marginLeft: 6,
    color: "#ff9800",
    fontWeight: "600",
    fontSize: 13,
  },
  freqBadge: {
    backgroundColor: "#ede76f",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  freqText: {
    color: "#5d3fd3",
    fontWeight: "bold",
    fontSize: 13,
  },
  swipeLeft: {
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    backgroundColor: "#e53935",
    paddingLeft: 20,
    borderRadius: 18,
    margin: 10,
  },
  swipeRight: {
    justifyContent: "center",
    alignItems: "flex-end",
    flex: 1,
    backgroundColor: "#4caf50",
    paddingRight: 20,
    borderRadius: 18,
    margin: 10,
  },
});

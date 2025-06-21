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
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import { Button, Surface, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const { signOut, user } = useAuth();

  // ✅ Initialize as empty arrays
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<string[]>([]);
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  // Fetch habits from database
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

  // Fetch today's completions (only sets completedHabits)
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
      // ❌ Do NOT call setHabits here
    } catch (err) {
      console.error("fetchTodayCompletions error:", err);
    }
  };

  // Subscribe to real-time changes
  useEffect(() => {
    if (!user) return;

    const habitsChannel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;
    const completionsChannel = `databases.${DATABASE_ID}.collections.${COMPLETIONS_COLLECTION_ID}.documents`;

    // Subscribe to both create/update/delete on habits
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

    // Subscribe to create on completions
    const unsubComps = client.subscribe(
      completionsChannel,
      (resp: RealTimeResponse) => {
        if (resp.events.some((e) => /documents\..*\.create$/.test(e))) {
          fetchTodayCompletions();
        }
      }
    );

    // Initial load
    fetchHabits();
    fetchTodayCompletions();

    return () => {
      unsubHabits();
      unsubComps();
    };
  }, [user]);

  const isHabitCompleted = (id: string) => completedHabits.includes(id);

  // Swipe actions
  const renderRightActions = (id: string) => (
    <View style={styles.swipeActionRight}>
      {isHabitCompleted(id) ? (
        <Text style={{ color: "#fff" }}>Completed!</Text>
      ) : (
        <MaterialCommunityIcons
          name="check-circle-outline"
          size={32}
          color="#fff"
        />
      )}
    </View>
  );
  const renderLeftActions = () => (
    <View style={styles.swipeActionLeft}>
      <MaterialCommunityIcons name="trash-can-outline" size={32} color="#fff" />
    </View>
  );

  // Handlers
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
      // Create completion
      await databases.createDocument(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        ID.unique(),
        { habit_id: id, user_id: user.$id, completed_at: now }
      );
      // Update streak on the habit document itself
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Today's Habits
        </Text>
        <Button mode="text" onPress={signOut} icon="logout">
          Sign Out
        </Button>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No habits yet. Add your first one!
            </Text>
          </View>
        ) : (
          habits.map((habit) => (
            <Swipeable
              key={habit.$id}
              ref={(ref) => (swipeableRefs.current[habit.$id] = ref)}
              overshootLeft={false}
              overshootRight={false}
              renderLeftActions={renderLeftActions}
              renderRightActions={() => renderRightActions(habit.$id)}
              onSwipeableOpen={(dir) =>
                dir === "left"
                  ? handleDelete(habit.$id)
                  : handleComplete(habit.$id)
              }
            >
              <Surface
                elevation={0}
                style={[
                  styles.card,
                  isHabitCompleted(habit.$id) && styles.cardCompleted,
                ]}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{habit.title}</Text>
                  <Text style={styles.cardDescription}>
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
                    <View style={styles.frequencyBadge}>
                      <Text style={styles.frequencyText}>
                        {/* frequency is guaranteed here */}
                        {habit.frequency.charAt(0).toUpperCase() +
                          habit.frequency.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Surface>
            </Swipeable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    color: "#666",
  },
  card: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: "#f7f2fa",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    elevation: 4,
  },
  cardCompleted: { opacity: 0.6 },
  cardContent: { padding: 20 },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#222",
  },
  cardDescription: {
    fontSize: 15,
    marginBottom: 16,
    color: "#6c6c80",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    borderRadius: 12,
    padding: 4,
  },
  streakText: {
    marginLeft: 6,
    color: "#ff9800",
    fontWeight: "bold",
    fontSize: 14,
  },
  frequencyBadge: {
    backgroundColor: "#ede76f",
    borderRadius: 12,
    padding: 4,
  },
  frequencyText: {
    color: "#7c4dff",
    fontWeight: "bold",
    fontSize: 14,
  },
  swipeActionLeft: {
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    backgroundColor: "#e53935",
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    paddingLeft: 16,
  },
  swipeActionRight: {
    justifyContent: "center",
    alignItems: "flex-end",
    flex: 1,
    backgroundColor: "#4caf50",
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    paddingRight: 16,
  },
});

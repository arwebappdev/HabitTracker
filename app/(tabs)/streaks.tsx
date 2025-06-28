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
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import { ScrollView } from "react-native-gesture-handler";
import { Surface, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
export default function Streaks() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<HabitCompletion[]>([]);
  const theme = useTheme();

  const fetchHabits = async () => {
    if (!user?.$id) return;
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_id", user.$id)]
      );
      setHabits(res.documents as Habit[]);
    } catch (err) {
      console.error("fetchHabits error:", err);
    }
  };

  const fetchCompletions = async () => {
    if (!user?.$id) return;
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [Query.equal("user_id", user.$id)]
      );
      setCompletedHabits(res.documents as HabitCompletion[]);
    } catch (err) {
      console.error("fetchCompletions error:", err);
    }
  };

  useEffect(() => {
    if (!user) return;

    const habitsChannel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;
    const completionsChannel = `databases.${DATABASE_ID}.collections.${COMPLETIONS_COLLECTION_ID}.documents`;

    let unsubHabits: () => void = () => {};
    let unsubComps: () => void = () => {};

    try {
      unsubHabits = client.subscribe(
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

      unsubComps = client.subscribe(
        completionsChannel,
        (resp: RealTimeResponse) => {
          if (resp.events.some((e) => /documents\..*\.create$/.test(e))) {
            fetchCompletions();
          }
        }
      );
    } catch (err) {
      console.error("Realtime subscription failed:", err);
    }

    fetchHabits();
    fetchCompletions();

    return () => {
      unsubHabits?.();
      unsubComps?.();
    };
  }, [user]);

  const getStreakData = (habitId: string) => {
    const habitCompletions = completedHabits
      .filter((c) => c.habit_id === habitId)
      .sort(
        (a, b) =>
          new Date(a.completed_at).getTime() -
          new Date(b.completed_at).getTime()
      );

    if (!habitCompletions.length) return { streak: 0, bestStreak: 0, total: 0 };

    let bestStreak = 0,
      currentStreak = 0,
      total = habitCompletions.length,
      lastDate: Date | null = null;

    habitCompletions.forEach((c) => {
      const date = new Date(c.completed_at);
      if (lastDate) {
        const diff =
          (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        currentStreak = diff <= 1.5 ? currentStreak + 1 : 1;
      } else {
        currentStreak = 1;
      }
      bestStreak = Math.max(bestStreak, currentStreak);
      lastDate = date;
    });

    return { streak: currentStreak, bestStreak, total };
  };

  const habitStreaks = habits.map((habit) => {
    const { streak, bestStreak, total } = getStreakData(habit.$id);
    return { habit, streak, bestStreak, total };
  });

  const rankedHabits = habitStreaks.sort((a, b) => b.bestStreak - a.bestStreak);

  const badgeStyles = [styles.badge1, styles.badge2, styles.badge3];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text style={styles.title} variant="headlineSmall">
          Habit Streaks
        </Text>
      </View>

      {rankedHabits.length > 0 && (
        <View
          style={[
            styles.rankingContainer,
            { backgroundColor: theme.colors.elevation.level1 },
          ]}
        >
          <Text style={styles.rankingTitle}>🏅 Top Streaks</Text>
          {rankedHabits.slice(0, 3).map((item, key) => (
            <View key={key} style={styles.rankingRow}>
              <View style={[styles.rankingBadge, badgeStyles[key]]}>
                <Text style={styles.rankingBadgeText}>{key + 1}</Text>
              </View>
              <Text style={styles.rankingHabit}>{item.habit.title}</Text>
              <Text style={styles.rankingStreak}>{item.bestStreak}</Text>
            </View>
          ))}
        </View>
      )}

      {habits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No habits yet. Add your first one!
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24, margin: 0 }}
        >
          {rankedHabits.map(({ habit, streak, bestStreak, total }) => (
            <View key={habit.$id} style={{ overflow: "visible" }}>
              <Surface
                elevation={3}
                style={[
                  styles.card,
                  { backgroundColor: theme.colors.elevation.level1 },
                ]}
              >
                <View style={styles.cardContent}>
                  <Text
                    style={[
                      styles.habitTitle,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {habit.title}
                  </Text>
                  <Text
                    style={[
                      styles.habitDescription,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {habit.description}
                  </Text>
                  <View style={styles.statsRow}>
                    <View style={styles.stateBadge}>
                      <Text style={styles.stateBadgeText}>🔥{streak}</Text>
                      <Text style={styles.stateBadgeLabel}>Current</Text>
                    </View>
                    <View style={styles.stateBadgeGold}>
                      <Text style={styles.stateBadgeText}>🏆{bestStreak}</Text>
                      <Text style={styles.stateBadgeLabel}>Best</Text>
                    </View>
                    <View style={styles.stateBadgeGreen}>
                      <Text style={styles.stateBadgeText}>📊{total}</Text>
                      <Text style={styles.stateBadgeLabel}>Total</Text>
                    </View>
                  </View>
                </View>
              </Surface>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  title: { fontWeight: "bold" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyStateText: { color: "#888" },
  card: {
    borderRadius: 18,
    margin: 10,
    overflow: "visible",
  },
  cardContent: {
    padding: 16,
    paddingBottom: 6,
  },
  habitTitle: {
    fontWeight: "bold",
    fontSize: 24,
    margin: 2,
    marginBottom: 4,
  },
  habitDescription: {
    margin: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 20,
  },
  stateBadge: {
    backgroundColor: "#fff3e0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 60,
  },
  stateBadgeGold: {
    backgroundColor: "#fffde7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 60,
  },
  stateBadgeGreen: {
    backgroundColor: "#e8f5e9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 60,
  },
  stateBadgeText: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#22223b",
  },
  stateBadgeLabel: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
    fontWeight: "500",
  },
  rankingContainer: {
    marginTop: 10,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: "visible",
  },
  rankingTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 12,
    color: "#7c4dff",
    letterSpacing: 0.5,
  },
  rankingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 8,
  },
  rankingBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "#e0e0e0",
  },
  badge1: { backgroundColor: "#ffd700" },
  badge2: { backgroundColor: "#c0c0c0" },
  badge3: { backgroundColor: "#cd7f32" },
  rankingBadgeText: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 15,
  },
  rankingHabit: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  rankingStreak: {
    fontSize: 14,
    color: "#7c4dff",
    fontWeight: "bold",
  },
});

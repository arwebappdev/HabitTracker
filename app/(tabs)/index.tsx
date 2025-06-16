import { useAuth } from "@/lib/auth-context";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";

export default function Index() {
  const { signOut } = useAuth();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Button mode="text" onPress={signOut} icon={"logout"}>
        Sign Out
      </Button>
    </View>
  );
}
const styles = StyleSheet.create({
  navButt: {
    height: "auto",
    width: "auto",
    backgroundColor: "blue",
    color: "white",
    textAlign: "center",
    fontSize: 20,
    padding: 5,
  },
});

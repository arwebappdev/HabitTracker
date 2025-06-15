import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Link href="/Login" style={styles.navButt}>
        Login Page
      </Link>
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

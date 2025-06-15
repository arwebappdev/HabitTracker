import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
const auth = () => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>("");
  const handleAuth = async () => {
    if (!email || !password) {
      setError("Please fill in all the fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password's length must be atleast 6 character long. ");
    }
    setError(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          {isSignUp ? "Create Account" : "Welcome Back"}
        </Text>
        <TextInput
          style={styles.input}
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="example@gmail.com"
          mode="outlined"
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          label="Password"
          autoCapitalize="none"
          mode="outlined"
          onChangeText={setPassword}
        />
        {error && (
          <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>
        )}
        <Button
          mode="contained"
          onPress={() => {
            handleAuth();
          }}
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>
        <Button
          style={styles.button}
          mode="text"
          onPress={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp
            ? "Already ave an account? Sign In"
            : "Don't have an account? Sign Up"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

export default auth;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  title: {
    fontSize: 40,
    fontStyle: "normal",
    fontFamily: "regular",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ToastAndroid,
  View,
} from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

// Main authentication screen component (login/signup)
export default function AuthScreen() {
  // State variables for form inputs and mode toggle
  const [isSignUp, setIsSignUp] = useState<boolean>(false); // true = SignUp mode, false = SignIn mode
  const [email, setEmail] = useState<string>(""); // Email input
  const [password, setPassword] = useState<string>(""); // Password input
  const [error, setError] = useState<string | null>(""); // Error message state

  const router = useRouter(); // Used for navigation
  const { signIn, signUp, signOut } = useAuth(); // Get auth functions from context

  // Handles both sign in and sign up logic
  const handleAuth = async () => {
    // Input validation
    if (!email || !password) {
      setError("Please fill in all the fields.");
      return;
    }

    // Password length check
    if (password.length < 6) {
      setError("Password's length must be at least 6 characters.");
      return;
    }

    // Clear any previous errors
    setError(null);

    // Handle Sign Up Flow
    if (isSignUp) {
      const error = await signUp(email, password); // Attempt to sign up user
      if (error) {
        setError(error); // Show any signup errors
        return;
      }

      // After signup, logout the user so they can sign in manually
      await signOut();

      // Reset form and switch to Sign In mode
      setEmail("");
      setPassword("");
      setIsSignUp(false);

      // Show toast notification (Android only)
      ToastAndroid.show("Account created. Please sign in.", ToastAndroid.SHORT);
      return;
    }

    // Handle Sign In Flow
    const error = await signIn(email, password); // Attempt to sign in
    if (error) {
      setError(error); // Show any login errors
      return;
    }

    // Reset form and navigate to home page
    setEmail("");
    setPassword("");
    router.replace("/");
  };

  return (
    // Ensures UI shifts properly when keyboard appears
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Page title based on mode */}
        <Text style={styles.title}>
          {isSignUp ? "Create Account" : "Welcome Back"}
        </Text>

        {/* Email Input */}
        <TextInput
          style={styles.input}
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="example@gmail.com"
          mode="outlined"
          onChangeText={setEmail}
        />

        {/* Password Input */}
        <TextInput
          style={styles.input}
          label="Password"
          autoCapitalize="none"
          mode="outlined"
          secureTextEntry
          onChangeText={setPassword}
        />

        {/* Error message (if any) */}
        {error && (
          <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>
        )}

        {/* Submit button */}
        <Button mode="contained" onPress={handleAuth}>
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>

        {/* Toggle between Sign In / Sign Up */}
        <Button
          style={styles.button}
          mode="text"
          onPress={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp
            ? "Already have an account? Sign In"
            : "Don't have an account? Sign Up"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

// Component styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5", // light gray background
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: "center", // vertically center form
  },
  title: {
    fontSize: 40,
    fontStyle: "normal",
    fontFamily: "regular",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    marginBottom: 16, // space between fields
  },
  button: {
    marginTop: 8, // space above toggle button
  },
});

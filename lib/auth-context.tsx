import { createContext } from "react";
import { Models } from "react-native-appwrite";

type authContextType = {
  user: Models.User<Models.Preferences> | null;
};

const authContext = createContext(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <></>;
}

export function useAuth() {}

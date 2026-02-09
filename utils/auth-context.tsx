import { use, createContext, type PropsWithChildren, useState, useEffect, useCallback } from "react";
import { getUser, removeUser, setUser as setStorageUser } from "./storage";
import { User } from "@/types/custom";

type SessionContextValue = {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  user: User | null;
  session: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<SessionContextValue>({
  signIn: async () => {},
  signOut: async () => {},
  updateUser: async () => {},
  user: null,
  session: false,
  isLoading: true,
});

// Hook para acceder al contexto de autenticación
export function useSession() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error("useSession must be wrapped in a <SessionProvider />");
  }

  return value;
}

// Provider que envuelve toda la app
export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const storedUser = await getUser();
      if (storedUser) {
        setUser(storedUser);
        setSession(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = useCallback(async () => {
    const storedUser = await getUser();
    setUser(storedUser);
    setSession(true);
  }, []);

  const signOut = useCallback(async () => {
    await removeUser();
    setUser(null);
    setSession(false);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      // Persist to storage (fire-and-forget, state is already updated)
      setStorageUser(updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        updateUser,
        user,
        session,
        isLoading,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

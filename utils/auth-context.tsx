import { use, createContext, type PropsWithChildren, useState, useEffect } from "react";
import { getUser, removeUser } from "./storage";

const AuthContext = createContext<{
  signIn: () => void;
  signOut: () => void;
  session: boolean;
  isLoading: boolean;
}>({
  signIn: () => null,
  signOut: () => null,
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar estado de autenticación al iniciar
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const user = await getUser();
      setSession(user !== null && user !== undefined);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signIn: () => {
          // Marcar como autenticado
          setSession(true);
        },
        signOut: async () => {
          // Cerrar sesión
          await removeUser();
          setSession(false);
        },
        session,
        isLoading,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

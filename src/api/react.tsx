import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { TraveallyClient, createTraveallyClient } from "./client";
import type { TraveallyApiConfig, CustomerUser } from "./types";

interface TraveallyContextValue {
  client: TraveallyClient;
  currentUser: CustomerUser | null;
  isAuthenticated: boolean;
  isLoadingUser: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const TraveallyContext = createContext<TraveallyContextValue | null>(null);

export interface TraveallyProviderProps extends TraveallyApiConfig {
  children: React.ReactNode;
}

/**
 * TraveallyProvider
 * Top-level React context provider wrapping your website for global access to Traveally API services and authentication state.
 */
export const TraveallyProvider: React.FC<TraveallyProviderProps> = ({
  children,
  baseUrl,
  domain,
  organizationId,
  authToken,
  onTokenExpired
}) => {
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const client = useMemo(() => {
    return createTraveallyClient({
      baseUrl,
      domain,
      organizationId,
      authToken,
      onTokenExpired: () => {
        setCurrentUser(null);
        if (onTokenExpired) onTokenExpired();
      }
    });
  }, [baseUrl, domain, organizationId, authToken]);

  const refreshProfile = async () => {
    if (!client.getAuthToken()) {
      setCurrentUser(null);
      setIsLoadingUser(false);
      return;
    }
    try {
      setIsLoadingUser(true);
      const user = await client.auth.getProfile();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, [client]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    const res = await client.auth.login({ email, password: pass });
    if (res.success && (res.token || res.accessToken)) {
      await refreshProfile();
      return true;
    }
    return false;
  };

  const logout = async (): Promise<void> => {
    await client.auth.logout();
    setCurrentUser(null);
  };

  const contextValue: TraveallyContextValue = {
    client,
    currentUser,
    isAuthenticated: !!currentUser,
    isLoadingUser,
    login,
    logout,
    refreshProfile
  };

  return (
    <TraveallyContext.Provider value={contextValue}>
      {children}
    </TraveallyContext.Provider>
  );
};

/**
 * Hook to access the active Traveally client and session state anywhere in your React app
 */
export function useTraveally(): TraveallyContextValue {
  const context = useContext(TraveallyContext);
  if (!context) {
    throw new Error("useTraveally must be used within a <TraveallyProvider>");
  }
  return context;
}

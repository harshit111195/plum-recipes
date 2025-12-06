
import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserPreferences } from '../types';
import { loadUserPreferences, dbSavePreferences } from '../services/storageService';
import toast from 'react-hot-toast';

interface UserContextType {
  preferences: UserPreferences;
  updatePreferences: (prefs: UserPreferences) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const prefs = await loadUserPreferences();
      setPreferences(prefs);
      setIsLoading(false);
    };
    init();
  }, []);

  const updatePreferences = async (newPrefs: UserPreferences) => {
    const oldPrefs = preferences;
    // Optimistic Update
    setPreferences(newPrefs);
    try {
        await dbSavePreferences(newPrefs);
    } catch (error) {
        console.error("Failed to save preferences", error);
        toast.error("Failed to save settings");
        // Rollback
        setPreferences(oldPrefs);
    }
  };

  // Safe fallback while loading
  const safePreferences = preferences || ({} as UserPreferences);

  return (
    <UserContext.Provider value={{ preferences: safePreferences, updatePreferences, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

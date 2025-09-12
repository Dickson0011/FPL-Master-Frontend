// src/contexts/UserContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';

const UserContext = createContext({});

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Granular states
  const [authLoading, setAuthLoading] = useState(true);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [fplLoading, setFplLoading] = useState(false);

  const [authError, setAuthError] = useState(null);
  const [prefsError, setPrefsError] = useState(null);
  const [fplError, setFplError] = useState(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((userData) => {
      setUser(userData);
      setAuthLoading(false);
      setAuthError(null);
    });
    return () => unsubscribe();
  }, []);

  /** Login */
  const login = async (email, password) => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const result = await authService.login(email, password);
      if (!result.success) {
        setAuthError(result.error);
        return result;
      }
      return { success: true };
    } catch (err) {
      const errorMessage = 'Login failed. Please try again.';
      setAuthError(errorMessage);
      Sentry.captureException(err); // log to monitoring tool
      return { success: false, error: errorMessage };
    } finally {
      setAuthLoading(false);
    }
  };

  /** Register */
  const register = async (email, password, displayName) => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const result = await authService.register(email, password, displayName);
      if (!result.success) {
        setAuthError(result.error);
        return result;
      }
      return { success: true };
    } catch (err) {
      const errorMessage = 'Registration failed. Please try again.';
      setAuthError(errorMessage);
      Sentry.captureException(err);
      return { success: false, error: errorMessage };
    } finally {
      setAuthLoading(false);
    }
  };

  /** Logout */
  const logout = async () => {
    setAuthLoading(true);

    try {
      await authService.logout();
      return { success: true };
    } catch (err) {
      setAuthError('Logout failed. Please try again.');
      Sentry.captureException(err);
      return { success: false, error: 'Logout failed. Please try again.' };
    } finally {
      setAuthLoading(false);
    }
  };

  /** Reset password */
  const resetPassword = async (email) => {
    setAuthError(null);
    try {
      return await authService.resetPassword(email);
    } catch (err) {
      const errorMessage = 'Failed to send password reset email.';
      setAuthError(errorMessage);
      Sentry.captureException(err);
      return { success: false, error: errorMessage };
    }
  };

  /** Update preferences */
  const updatePreferences = async (preferences) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    setPrefsLoading(true);
    setPrefsError(null);

    try {
      const result = await authService.updateUserPreferences(user.uid, preferences);
      if (result.success) {
        setUser((prev) => ({
          ...prev,
          preferences: { ...prev.preferences, ...preferences },
        }));
      }
      return result;
    } catch (err) {
      const errorMessage = 'Failed to update preferences.';
      setPrefsError(errorMessage);
      Sentry.captureException(err);
      return { success: false, error: errorMessage };
    } finally {
      setPrefsLoading(false);
    }
  };

  /** Update FPL data */
  const updateFplData = async (fplData) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    setFplLoading(true);
    setFplError(null);

    try {
      const result = await authService.updateFplData(user.uid, fplData);
      if (result.success) {
        setUser((prev) => ({
          ...prev,
          fplData: { ...prev.fplData, ...fplData },
        }));
      }
      return result;
    } catch (err) {
      const errorMessage = 'Failed to update FPL data.';
      setFplError(errorMessage);
      Sentry.captureException(err);
      return { success: false, error: errorMessage };
    } finally {
      setFplLoading(false);
    }
  };

  /** Utility methods */
  const clearAuthError = () => setAuthError(null);
  const isAuthenticated = () => !!user;
  const getFavoriteTeam = () => user?.preferences?.favoriteTeam || null;
  const getRiskTolerance = () => user?.preferences?.riskTolerance || 'medium';
  const getFplManagerId = () => user?.fplData?.managerId || null;

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      authLoading,
      prefsLoading,
      fplLoading,
      authError,
      prefsError,
      fplError,
      login,
      register,
      logout,
      resetPassword,
      updatePreferences,
      updateFplData,
      clearAuthError,
      isAuthenticated,
      getFavoriteTeam,
      getRiskTolerance,
      getFplManagerId,
    }),
    [
      user,
      authLoading,
      prefsLoading,
      fplLoading,
      authError,
      prefsError,
      fplError,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;
